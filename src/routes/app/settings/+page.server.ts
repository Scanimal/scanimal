import { and, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { passkey } from '$lib/server/db/auth.schema';

export const load: PageServerLoad = async ({ locals }) => {
	const passkeys = await locals.ctx.db
		.select({ id: passkey.id, name: passkey.name, createdAt: passkey.createdAt })
		.from(passkey)
		.where(eq(passkey.userId, locals.user!.id));

	return { user: locals.user!, rpId: locals.ctx.config.rpId, passkeys };
};

export const actions: Actions = {
	profile: async ({ locals, request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name is required.' });

		try {
			await locals.auth.api.updateUser({ body: { name }, headers: request.headers });
			return { profileSaved: true };
		} catch (e) {
			if (e instanceof APIError) return fail(400, { message: e.message });
			throw e;
		}
	},

	revokePasskey: async ({ locals, request }) => {
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		if (!id) return fail(400, { message: 'Missing passkey ID.' });

		// Scope the delete to the current user — never trust the id alone.
		await locals.ctx.db
			.delete(passkey)
			.where(and(eq(passkey.id, id), eq(passkey.userId, locals.user!.id)));

		return { revoked: true };
	}
};
