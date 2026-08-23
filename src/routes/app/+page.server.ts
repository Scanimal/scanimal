import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { canSeeAll, getScope, listCodes, type Code } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ locals }) => {
	const scope = await getScope(locals.ctx, locals.user!.id);
	if (!scope) return { codes: [] as Code[], seesAll: false };
	return { codes: await listCodes(locals.ctx, scope), seesAll: canSeeAll(scope) };
};

export const actions: Actions = {
	signOut: async ({ locals, request }) => {
		await locals.auth.api.signOut({ headers: request.headers });
		redirect(303, '/login');
	}
};
