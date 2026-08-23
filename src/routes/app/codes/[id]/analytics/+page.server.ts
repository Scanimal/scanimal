import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCode, getScope } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ locals, params }) => {
	const scope = await getScope(locals.ctx, locals.user!.id);
	if (!scope) error(404, 'Code not found');

	const code = await getCode(locals.ctx, scope, params.id);
	if (!code) error(404, 'Code not found');

	const eventQuery = locals.ctx.eventQuery;
	if (!eventQuery) {
		return { code, configured: false, error: null, stats: null };
	}

	const range = { from: Date.now() - 30 * 864e5, to: Date.now() };
	try {
		const [total, series, country, device, referrer] = await Promise.all([
			eventQuery.totalScans(code.id, range),
			eventQuery.scansOverTime(code.id, range),
			eventQuery.breakdown(code.id, 'country', range),
			eventQuery.breakdown(code.id, 'device', range),
			eventQuery.breakdown(code.id, 'referrer', range)
		]);
		return {
			code,
			configured: true,
			error: null,
			stats: { total, series, country, device, referrer }
		};
	} catch (e) {
		return {
			code,
			configured: true,
			error: e instanceof Error ? e.message : 'Failed to load analytics.',
			stats: null
		};
	}
};
