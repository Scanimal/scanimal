import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteCode, getCode, getScope, listRevisions, updateCode } from '$lib/server/db/queries';

const isHttpUrl = (value: string): boolean => {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
};

export const load: PageServerLoad = async ({ locals, params }) => {
	const scope = await getScope(locals.ctx, locals.user!.id);
	if (!scope) error(404, 'Code not found');

	const code = await getCode(locals.ctx, scope, params.id);
	if (!code) error(404, 'Code not found');

	const revisions = await listRevisions(locals.ctx, scope, params.id);
	return { code, revisions, origin: locals.ctx.config.origin };
};

export const actions: Actions = {
	update: async ({ locals, params, request }) => {
		const scope = await getScope(locals.ctx, locals.user!.id);
		if (!scope) return fail(400, { message: 'Your account is not part of an organization.' });

		const form = await request.formData();
		const destination = String(form.get('destination') ?? '').trim();
		const title = String(form.get('title') ?? '').trim();
		const active = form.get('active') === 'on';
		const styleJson = String(form.get('styleJson') ?? '');

		if (!isHttpUrl(destination)) {
			return fail(400, { message: 'Destination must be a valid http(s) URL.' });
		}

		const updated = await updateCode(locals.ctx, scope, params.id, {
			destination,
			title,
			styleJson,
			active
		});
		if (!updated) return fail(400, { message: 'Code not found.' });

		return { updated: true };
	},

	delete: async ({ locals, params }) => {
		const scope = await getScope(locals.ctx, locals.user!.id);
		if (!scope) return fail(400, { message: 'Your account is not part of an organization.' });

		await deleteCode(locals.ctx, scope, params.id);
		redirect(303, '/app');
	}
};
