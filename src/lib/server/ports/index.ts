/**
 * Ports — narrow interfaces for every platform capability (spec §4a).
 *
 * Rules:
 * - Interfaces only. Zero imports. Zero Cloudflare types.
 * - Application code depends only on these ports.
 * - `src/lib/server/context.ts` is the single composition root and the only
 *   file that knows Cloudflare exists.
 * - `Database` is deliberately NOT a port — Drizzle already is the abstraction.
 */

/** The value cached in the hot link store, keyed by `kvKey(hostname, slug)`. */
export interface LinkRecord {
	codeId: string;
	organizationId: string;
	destination: string;
	active: boolean;
}

/** A single scan of a code, as recorded on the redirect path. */
export interface ScanEvent {
	codeId: string;
	organizationId: string;
	country: string;
	city: string;
	userAgent: string;
	referrer: string;
}

export interface DateRange {
	/** Inclusive start, epoch millis. */
	from: number;
	/** Exclusive end, epoch millis. */
	to: number;
}

export interface TimeSeriesPoint {
	/** Bucket start, epoch millis. */
	t: number;
	count: number;
}

export type TimeSeries = TimeSeriesPoint[];

export interface BreakdownRow {
	key: string;
	count: number;
}

export type Breakdown = BreakdownRow[];

export type BreakdownDimension = 'country' | 'device' | 'referrer';

/**
 * Which scans a query covers: a single code, or every code in an organization.
 * Both are recorded on the same event, so this is only ever a change of filter.
 */
export type ScanScope = { codeId: string } | { organizationId: string };

/** Hot lookup for the redirect path. CF: KV. Docker: Redis, or Postgres + in-process LRU. */
export interface LinkStore {
	get(key: string): Promise<LinkRecord | null>;
	put(key: string, value: LinkRecord): Promise<void>;
	delete(key: string): Promise<void>;
}

/** High-volume append-only scan events. CF: Analytics Engine. Fire-and-forget. */
export interface EventSink {
	record(event: ScanEvent): void;
}

/** Analytics reads. Deliberately separate from EventSink — different backends, different shapes. */
export interface EventQuery {
	scansOverTime(scope: ScanScope, range: DateRange): Promise<TimeSeries>;
	breakdown(scope: ScanScope, dimension: BreakdownDimension, range: DateRange): Promise<Breakdown>;
	totalScans(scope: ScanScope, range: DateRange): Promise<number>;
	/** Busiest codes in an organization, most-scanned first. `key` is a code id. */
	topCodes(organizationId: string, range: DateRange, limit?: number): Promise<Breakdown>;
}

/** Transactional email. CF: send_email binding. Fallback: Resend. Docker: SMTP. */
export interface Mailer {
	send(msg: { to: string; subject: string; html: string; text: string }): Promise<void>;
}

/** Logo and asset uploads. CF: R2. Docker: S3-compatible or local volume. */
export interface BlobStore {
	put(key: string, body: ReadableStream | ArrayBuffer, contentType: string): Promise<void>;
	url(key: string): string;
}

/** Deferred work that must outlive the response. CF: ctx.waitUntil. Docker: a queue. */
export interface Deferred {
	run(promise: Promise<unknown>): void;
}

/** Request geolocation. CF: request.cf. Docker: MaxMind GeoLite2, or empty strings. */
export interface GeoResolver {
	resolve(request: Request): { country: string; city: string };
}
