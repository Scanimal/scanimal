import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { magicLink } from 'better-auth/plugins/magic-link';
import { organization } from 'better-auth/plugins/organization';
import { passkey } from '@better-auth/passkey';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/server/db';
import { noopMailer } from '$lib/server/adapters/noop-mailer';
import type { ResolvedAppContext } from '$lib/server/context';

/**
 * Auth (spec §7): NO passwords. Passkeys primary, magic link fallback,
 * social optional and off by default (opt-in via env vars).
 *
 * Magic link must always stay enabled: it is the recovery path when a domain
 * change invalidates passkeys (the RP-ID trap).
 */

const magicLinkHtml = (url: string, appName: string) => `<!doctype html>
<html><body style="font-family: sans-serif; padding: 24px;">
<h2>Sign in to ${appName}</h2>
<p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">Sign in</a></p>
<p style="color:#666;font-size:13px;">Or copy this link: ${url}</p>
<p style="color:#666;font-size:13px;">If you didn't request this, you can ignore this email.</p>
</body></html>`;

/** Social providers are deliberately opt-in (spec §7) — enabled only when env vars are present. */
const socialProviders = () => ({
	...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
		? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
		: {}),
	...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
		? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
		: {})
});

export interface CreateAuthOptions {
	/**
	 * Intercepts magic-link delivery instead of emailing it. Used by /setup,
	 * which must work before (or without) email configuration.
	 */
	onMagicLink?: (url: string) => void | Promise<void>;
}

/**
 * Better Auth is instantiated per request — env is only available on the
 * request in Workers. Receives the resolved context, never raw bindings.
 */
export const createAuth = (ctx: ResolvedAppContext, opts: CreateAuthOptions = {}) =>
	betterAuth({
		baseURL: ctx.config.origin,
		secret: env.BETTER_AUTH_SECRET,
		emailAndPassword: { enabled: false },
		database: drizzleAdapter(ctx.db, { provider: 'sqlite' }),
		plugins: [
			passkey({
				rpID: ctx.config.rpId,
				rpName: ctx.config.appName,
				origin: ctx.config.origin
			}),
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					if (opts.onMagicLink) {
						await opts.onMagicLink(url);
						return;
					}
					await ctx.mailer.send({
						to: email,
						subject: `Your sign-in link — ${ctx.config.appName}`,
						html: magicLinkHtml(url, ctx.config.appName),
						text: `Sign in: ${url}`
					});
				}
			}),
			organization(),
			sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
		],
		socialProviders: socialProviders()
	});

/**
 * DO NOT USE!
 *
 * This instance is used by the `better-auth` CLI for schema generation ONLY.
 * To access `auth` at runtime, use `event.locals.auth`.
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
