import type { LayoutServerLoad } from './$types';
import { getScope } from '$lib/server/db/queries';

export const load: LayoutServerLoad = async ({ locals }) => {
	// The route guard in hooks.server.ts guarantees a user under /app.
	const user = locals.user!;
	// Scope can legitimately be null (user exists but org missing) — pages
	// render an explanatory message rather than redirecting.
	const scope = await getScope(locals.ctx, user.id);
	return { user, scope, config: locals.ctx.config };
};
