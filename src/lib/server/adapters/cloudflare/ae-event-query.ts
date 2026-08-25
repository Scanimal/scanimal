import type { Breakdown, DateRange, EventQuery, ScanScope, TimeSeries } from '$lib/server/ports';

/**
 * Analytics Engine reads go through the SQL API over HTTP — AE is not exposed
 * as a Worker binding for reads (spec §6). Requires a Cloudflare API token
 * with Account Analytics read permission, stored as a secret (CF_ANALYTICS_TOKEN).
 *
 * Blob layout must match ae-event-sink.ts:
 * index1: organizationId, blob1: codeId, blob2: country, blob3: userAgent,
 * blob4: referrer, blob5: city
 */

const DATASET = 'qr_scans';

interface AeConfig {
	accountId: string;
	apiToken: string;
}

// AE SQL has no bind parameters; values are interpolated. Escape single quotes.
const q = (value: string) => `'${value.replace(/'/g, "''")}'`;

const toDateTime = (epochMs: number) => `toDateTime(${Math.floor(epochMs / 1000)})`;

/**
 * Scope + time predicate shared by every query. A code lives in blob1 and its
 * organization in index1, so widening from one code to a whole org is just a
 * different column — never a fan-out over codes.
 */
const where = (scope: ScanScope, range: DateRange) => {
	const target =
		'codeId' in scope ? `blob1 = ${q(scope.codeId)}` : `index1 = ${q(scope.organizationId)}`;
	return `${target}
		   AND timestamp >= ${toDateTime(range.from)}
		   AND timestamp < ${toDateTime(range.to)}`;
};

const runSql = async (cfg: AeConfig, sql: string): Promise<Record<string, unknown>[]> => {
	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/analytics_engine/sql`,
		{
			method: 'POST',
			headers: { Authorization: `Bearer ${cfg.apiToken}` },
			body: sql
		}
	);
	if (!res.ok) {
		throw new Error(`Analytics Engine SQL query failed: ${res.status} ${await res.text()}`);
	}
	const payload = (await res.json()) as { data?: Record<string, unknown>[] };
	return payload.data ?? [];
};

const classifyDevice = (ua: string): string => {
	const s = ua.toLowerCase();
	if (/bot|crawler|spider|curl|wget/.test(s)) return 'Bot';
	if (/ipad|tablet/.test(s)) return 'Tablet';
	if (/mobi|iphone|android/.test(s)) return 'Mobile';
	if (s === '') return 'Unknown';
	return 'Desktop';
};

export const aeEventQuery = (cfg: AeConfig): EventQuery => ({
	async scansOverTime(scope, range: DateRange): Promise<TimeSeries> {
		const rows = await runSql(
			cfg,
			`SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS bucket,
			        sum(_sample_interval) AS count
			 FROM ${DATASET}
			 WHERE ${where(scope, range)}
			 GROUP BY bucket
			 ORDER BY bucket ASC`
		);
		return rows.map((r) => ({
			t: new Date(String(r.bucket)).getTime(),
			count: Number(r.count)
		}));
	},

	async breakdown(scope, dimension, range): Promise<Breakdown> {
		const column = { country: 'blob2', device: 'blob3', referrer: 'blob4' }[dimension];
		const rows = await runSql(
			cfg,
			`SELECT ${column} AS key, sum(_sample_interval) AS count
			 FROM ${DATASET}
			 WHERE ${where(scope, range)}
			 GROUP BY key
			 ORDER BY count DESC
			 LIMIT 100`
		);
		if (dimension !== 'device') {
			return rows.map((r) => ({ key: String(r.key) || '(none)', count: Number(r.count) }));
		}
		// Device class is derived from the raw user-agent in application code.
		const byDevice = new Map<string, number>();
		for (const r of rows) {
			const device = classifyDevice(String(r.key));
			byDevice.set(device, (byDevice.get(device) ?? 0) + Number(r.count));
		}
		return [...byDevice.entries()]
			.map(([key, count]) => ({ key, count }))
			.toSorted((a, b) => b.count - a.count);
	},

	async totalScans(scope, range): Promise<number> {
		const rows = await runSql(
			cfg,
			`SELECT sum(_sample_interval) AS count
			 FROM ${DATASET}
			 WHERE ${where(scope, range)}`
		);
		return Number(rows[0]?.count ?? 0);
	},

	async topCodes(organizationId, range, limit = 10): Promise<Breakdown> {
		const rows = await runSql(
			cfg,
			`SELECT blob1 AS key, sum(_sample_interval) AS count
			 FROM ${DATASET}
			 WHERE ${where({ organizationId }, range)}
			 GROUP BY key
			 ORDER BY count DESC
			 LIMIT ${Math.max(1, Math.floor(limit))}`
		);
		return rows.map((r) => ({ key: String(r.key), count: Number(r.count) }));
	}
});
