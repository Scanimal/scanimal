import type { Deferred } from '$lib/server/ports';

export const waitUntilDeferred = (ctx: ExecutionContext): Deferred => ({
	run(promise) {
		ctx.waitUntil(promise);
	}
});
