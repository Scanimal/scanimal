import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		redirect(302, '/app');
	}

	const socialProviders: ('google' | 'github')[] = [];
	if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) socialProviders.push('google');
	if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) socialProviders.push('github');

	return {
		emailEnabled: event.locals.ctx.emailEnabled,
		socialProviders
	};
};

export const actions: Actions = {
	magicLink: async (event) => {
		const data = await event.request.formData();
		const email = data.get('email')?.toString().trim() ?? '';
		if (!email) {
			return fail(400, { message: 'Email is required.' });
		}

		const callbackURL = event.url.searchParams.get('next') ?? '/app';

		try {
			await event.locals.auth.api.signInMagicLink({
				body: { email, callbackURL },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Could not send the sign-in link.' });
			}
			return fail(500, { message: 'Something went wrong. Please try again.' });
		}

		return { sent: true, email };
	}
};
