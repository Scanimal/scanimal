import { redirect, type Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { createAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const PROTECTED_PREFIXES = ['/dashboard'];

const handleAuth: Handle = async ({ event, resolve }) => {
	if (!event.platform?.env?.DB) throw new Error('D1 binding "DB" not found - are you running with wrangler?');

	event.locals.auth = createAuth(event.platform.env.DB);

	const { auth } = event.locals;
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
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

export const handle: Handle = sequence(handleAuth, handleRouteGuard);
