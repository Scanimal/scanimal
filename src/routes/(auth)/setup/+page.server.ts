import { error, fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { createAuth } from '$lib/server/auth';
import { saveConfig } from '$lib/server/context';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	if (event.locals.hasUsers) {
		error(404, 'Not found');
	}
	return { suggestedOrigin: event.url.origin };
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.hasUsers) {
			error(404, 'Not found');
		}

		const data = await event.request.formData();
		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const appName = data.get('appName')?.toString().trim() || 'Scanimal';
		const origin = data.get('origin')?.toString().trim() ?? '';

		if (!name || !email) {
			return fail(400, { message: 'Name and email are required.' });
		}

		let hostname: string;
		try {
			hostname = new URL(origin).hostname;
		} catch {
			return fail(400, {
				message: 'App URL must be a valid URL, e.g. https://go.example.com.'
			});
		}

		const config = { rpId: hostname, appName, origin };
		await saveConfig(event.locals.ctx, config);

		// Intercept the magic link instead of emailing it — setup must work
		// before (or without) email configuration.
		let magicUrl = '';
		const auth = createAuth(
			{ ...event.locals.ctx, config },
			{
				onMagicLink: (url) => {
					magicUrl = url;
				}
			}
		);

		try {
			await auth.api.signInMagicLink({
				body: { email, name, callbackURL: '/setup/complete' },
				headers: event.request.headers
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { message: err.message || 'Could not create the owner account.' });
			}
			throw err;
		}

		if (!magicUrl) {
			return fail(500, { message: 'Could not create the sign-in link. Please try again.' });
		}

		// Redirect to the relative verification path — the typed domain may not
		// be attached to this deployment yet, so never redirect to the full URL.
		const u = new URL(magicUrl);
		redirect(303, u.pathname + u.search);
	}
};
