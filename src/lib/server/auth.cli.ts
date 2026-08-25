import { createAuth } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { noopMailer } from '$lib/server/adapters/noop-mailer';

/**
 * Schema-generation entrypoint for the `better-auth` CLI (`pnpm auth:schema`).
 *
 * This deliberately lives outside auth.ts. Constructing betterAuth at module
 * scope reads BETTER_AUTH_SECRET eagerly, so while this lived in auth.ts — a
 * module hooks.server.ts imports — every production build required the runtime
 * secret to be present just to bundle, which broke CI. Nothing in the app
 * imports this file, so the build never evaluates it.
 *
 * At runtime, use `event.locals.auth`.
 */
export const auth = createAuth({
	db: getDb(null!),
	links: null!,
	events: null!,
	eventQuery: null,
	mailer: noopMailer(),
	emailEnabled: false,
	blobs: null!,
	deferred: null!,
	geo: null!,
	config: { rpId: 'localhost', appName: 'Scanimal', origin: 'http://localhost:5173' }
});
