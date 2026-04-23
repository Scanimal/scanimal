import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const { auth } = event.locals;
		const data = await event.request.formData();
		const email = data.get('email')?.toString() ?? '';

		// Always return a neutral response to prevent user enumeration.
		try {
			await auth.api.requestPasswordReset({ body: { email, redirectTo: '/reset-password' } });
		} catch {
			// Intentionally swallowed — we don't reveal whether the email exists.
		}

		return { sent: true };
	}
};
