import { user } from '$lib/server/db/auth.schema';
import type { AppContext } from '$lib/server/context';

// Once a user exists it can never un-exist mid-deployment; cache per isolate
// so the first-run check costs one D1 query per isolate, not per request.
let hasUsersCache = false;

export const hasUsers = async (ctx: AppContext): Promise<boolean> => {
	if (hasUsersCache) return true;
	const rows = await ctx.db.select({ id: user.id }).from(user).limit(1);
	hasUsersCache = rows.length > 0;
	return hasUsersCache;
};

/** Called by /setup after creating the first user so this isolate stops redirecting. */
export const markUsersExist = (): void => {
	hasUsersCache = true;
};
