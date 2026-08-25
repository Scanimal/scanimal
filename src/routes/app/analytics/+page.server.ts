import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { canSeeAll, getScope, listCodes } from '$lib/server/db/queries';

/** Ranges the page offers, in days. Kept small — AE retention is finite. */
const RANGES = { 7: 'Last 7 days', 30: 'Last 30 days', 90: 'Last 90 days' } as const;
const DEFAULT_DAYS = 30;

export const load: PageServerLoad = async ({ locals, url }) => {
	const scope = await getScope(locals.ctx, locals.user!.id);

	// Org-wide totals span every member's codes, so this view is admin-only —
	// members would otherwise see scan counts for codes they can't access.
	if (!scope || !canSeeAll(scope)) redirect(302, '/app');

	const requested = Number(url.searchParams.get('days'));
	const days = requested in RANGES ? requested : DEFAULT_DAYS;

	const codes = await listCodes(locals.ctx, scope);
	const ranges = Object.entries(RANGES).map(([value, label]) => ({
		days: Number(value),
		label
	}));

	const eventQuery = locals.ctx.eventQuery;
	if (!eventQuery) {
		return { configured: false, error: null, stats: null, codes, days, ranges };
	}

	const range = { from: Date.now() - days * 864e5, to: Date.now() };
	const target = { organizationId: scope.organizationId };

	try {
		const [total, series, country, device, referrer, top] = await Promise.all([
			eventQuery.totalScans(target, range),
			eventQuery.scansOverTime(target, range),
			eventQuery.breakdown(target, 'country', range),
			eventQuery.breakdown(target, 'device', range),
			eventQuery.breakdown(target, 'referrer', range),
			eventQuery.topCodes(scope.organizationId, range)
		]);

		// topCodes returns raw code ids; resolve them to titles the user recognises.
		const byId = new Map(codes.map((c) => [c.id, c]));
		const topCodes = top.map((row) => {
			const code = byId.get(row.key);
			return {
				key: row.key,
				count: row.count,
				label: code ? code.title || code.slug : '(deleted code)',
				href: code ? `/app/codes/${code.id}/analytics` : undefined
			};
		});

		return {
			configured: true,
			error: null,
			stats: { total, series, country, device, referrer, topCodes },
			codes,
			days,
			ranges
		};
	} catch (e) {
		return {
			configured: true,
			error: e instanceof Error ? e.message : 'Failed to load analytics.',
			stats: null,
			codes,
			days,
			ranges
		};
	}
};
