import { redirect, type Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { createAuth } from '$lib/server/auth';
import { buildContext, resolveContext } from '$lib/server/context';
import { isReservedPath, isValidSlug, kvKey } from '$lib/server/links';
import { hasUsers } from '$lib/server/first-run';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const PROTECTED_PREFIXES = ['/app'];

/**
 * Redirect path (spec §6). Runs before SvelteKit routing so slugs
 * short-circuit without loading the app. KV read + Analytics Engine write +
 * 302. Nothing else — never D1.
 */
const handleRedirect: Handle = async ({ event, resolve }) => {
	if (building || !event.platform) return resolve(event);

	const { pathname } = event.url;
	if (isReservedPath(pathname)) return resolve(event);

	const slug = decodeURIComponent(pathname.slice(1));
	if (!isValidSlug(slug)) return resolve(event);

	const ctx = buildContext(event.platform);
	const record = await ctx.links.get(kvKey(event.url.hostname, slug));
	if (!record || !record.active) return resolve(event); // fall through to 404 page

	const { country, city } = ctx.geo.resolve(event.request);
	ctx.events.record({
		codeId: record.codeId,
		organizationId: record.organizationId,
		country,
		city,
		userAgent: event.request.headers.get('user-agent') ?? '',
		referrer: event.request.headers.get('referer') ?? ''
	});

	return new Response(null, {
		status: 302,
		headers: { Location: record.destination, 'Cache-Control': 'no-store' }
	});
};

const handleAuth: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);
	if (!event.platform?.env?.DB) {
		throw new Error('D1 binding "DB" not found - are you running with wrangler?');
	}

	const ctx = await resolveContext(buildContext(event.platform), event.url.origin);
	event.locals.ctx = ctx;
	event.locals.auth = createAuth(ctx);

	event.locals.hasUsers = await hasUsers(ctx);

	const { auth } = event.locals;
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

/** First-run flow (spec §7): until a user exists, everything redirects to /setup. */
const handleFirstRun: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);

	const { pathname } = event.url;
	if (
		!event.locals.hasUsers &&
		!pathname.startsWith('/setup') &&
		!pathname.startsWith('/auth') &&
		!pathname.startsWith('/api/auth')
	) {
		return redirect(302, '/setup');
	}
	return resolve(event);
};

const handleRouteGuard: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

	if (isProtected && !event.locals.user) {
		const next = encodeURIComponent(pathname + event.url.search);
		return redirect(302, `/login?next=${next}`);
	}

	return resolve(event);
};

export const handle: Handle = sequence(
	handleRedirect,
	handleAuth,
	handleFirstRun,
	handleRouteGuard
);
