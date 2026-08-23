import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createCode, getScope, SlugError, type Code } from '$lib/server/db/queries';

const isHttpUrl = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const slug = String(form.get('slug') ?? '').trim();
		const destination = String(form.get('destination') ?? '').trim();
		const title = String(form.get('title') ?? '').trim();

		const scope = await getScope(locals.ctx, locals.user!.id);
		if (!scope) {
			return fail(400, {
				message: 'Your account is not part of an organization.',
				slug,
				destination,
				title
			});
		}

		if (!isHttpUrl(destination)) {
			return fail(400, {
				message: 'Destination must be a valid http(s) URL.',
				slug,
				destination,
				title
			});
		}

		let code: Code;
		try {
			code = await createCode(locals.ctx, scope, {
				slug,
				destination,
				title: title || undefined
			});
		} catch (e) {
			if (e instanceof SlugError) {
				return fail(400, { message: e.message, slug, destination, title });
			}
			throw e;
		}

		redirect(303, `/app/codes/${code.id}`);
	}
};
