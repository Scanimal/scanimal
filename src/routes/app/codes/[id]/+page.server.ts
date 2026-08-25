import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteCode, getCode, getScope, listRevisions, updateCode } from '$lib/server/db/queries';
import {
	encodeWifi,
	isStaticKind,
	parseVCard,
	parseWifi,
	type CodeKind,
	type VCardPayload,
	type WifiEncryption
} from '$lib/server/codes/payloads';

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
	const kind = code.kind as CodeKind;

	return {
		code,
		revisions,
		origin: locals.ctx.config.origin,
		kind,
		isStatic: isStaticKind(kind),
		wifi: kind === 'wifi' ? parseWifi(code.payload) : null,
		contact: kind === 'vcard' ? parseVCard(code.payload) : null
	};
};

export const actions: Actions = {
	update: async ({ locals, params, request }) => {
		const scope = await getScope(locals.ctx, locals.user!.id);
		if (!scope) return fail(400, { message: 'Your account is not part of an organization.' });

		const existing = await getCode(locals.ctx, scope, params.id);
		if (!existing) return fail(400, { message: 'Code not found.' });

		const form = await request.formData();
		const get = (k: string) => String(form.get(k) ?? '').trim();
		const title = get('title');
		const active = form.get('active') === 'on';
		const styleJson = String(form.get('styleJson') ?? '');
		const kind = existing.kind as CodeKind;

		// The destination is derived from the payload for non-link kinds, so the
		// kind is read from the stored row and never taken from the form.
		let destination: string;
		let payload: string | null = null;

		if (kind === 'link') {
			destination = get('destination');
			if (!isHttpUrl(destination)) {
				return fail(400, { message: 'Destination must be a valid http(s) URL.' });
			}
		} else if (kind === 'wifi') {
			const ssid = get('ssid');
			if (!ssid) return fail(400, { message: 'Network name (SSID) is required.' });
			const rawEnc = get('encryption');
			const encryption: WifiEncryption = rawEnc === 'WEP' || rawEnc === 'nopass' ? rawEnc : 'WPA';
			const password = get('password');
			if (encryption !== 'nopass' && !password) {
				return fail(400, { message: 'Password is required for a secured network.' });
			}
			const wifi = { ssid, password, encryption, hidden: form.get('hidden') === 'on' };
			payload = JSON.stringify(wifi);
			destination = encodeWifi(wifi);
		} else {
			const contact: VCardPayload = {
				firstName: get('firstName'),
				lastName: get('lastName'),
				organization: get('organization'),
				jobTitle: get('jobTitle'),
				email: get('email'),
				phone: get('phone'),
				website: get('website'),
				note: get('note')
			};
			if (!contact.firstName && !contact.lastName && !contact.organization) {
				return fail(400, { message: 'Enter at least a name or an organization.' });
			}
			payload = JSON.stringify(contact);
			destination = `${locals.ctx.config.origin}/v/${existing.slug}`;
		}

		const updated = await updateCode(locals.ctx, scope, params.id, {
			destination,
			payload,
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
