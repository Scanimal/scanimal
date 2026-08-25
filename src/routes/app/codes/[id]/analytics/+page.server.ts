import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCode, getScope } from '$lib/server/db/queries';
import { isStaticKind, type CodeKind } from '$lib/server/codes/payloads';

export const load: PageServerLoad = async ({ locals, params }) => {
	const scope = await getScope(locals.ctx, locals.user!.id);
	if (!scope) error(404, 'Code not found');

	const code = await getCode(locals.ctx, scope, params.id);
	if (!code) error(404, 'Code not found');

	// Static kinds never reach the redirect hook, so there is nothing to report.
	if (isStaticKind(code.kind as CodeKind)) {
		return { code, configured: false, static: true, error: null, stats: null };
	}

	const eventQuery = locals.ctx.eventQuery;
	if (!eventQuery) {
		return { code, configured: false, static: false, error: null, stats: null };
	}

	const range = { from: Date.now() - 30 * 864e5, to: Date.now() };
	try {
		const target = { codeId: code.id };
		const [total, series, country, device, referrer] = await Promise.all([
			eventQuery.totalScans(target, range),
			eventQuery.scansOverTime(target, range),
			eventQuery.breakdown(target, 'country', range),
			eventQuery.breakdown(target, 'device', range),
			eventQuery.breakdown(target, 'referrer', range)
		]);
		return {
			code,
			configured: true,
			static: false,
			error: null,
			stats: { total, series, country, device, referrer }
		};
	} catch (e) {
		return {
			code,
			configured: true,
			static: false,
			error: e instanceof Error ? e.message : 'Failed to load analytics.',
			stats: null
		};
	}
};
