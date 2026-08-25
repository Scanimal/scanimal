import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createCode, getScope, SlugError, type Code } from '$lib/server/db/queries';
import {
	encodeWifi,
	isCodeKind,
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

export const load: PageServerLoad = ({ locals }) => ({
	origin: locals.ctx.config.origin
});

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const form = await request.formData();
		const get = (k: string) => String(form.get(k) ?? '').trim();

		const slug = get('slug');
		const title = get('title');
		const rawKind = get('kind') || 'link';
		const kind: CodeKind = isCodeKind(rawKind) ? rawKind : 'link';

		// Echoed back on failure so the form doesn't lose the user's input. Listed
		// explicitly rather than spread from FormData so ActionData keeps real types.
		const echo = {
			slug,
			title,
			kind,
			destination: get('destination'),
			ssid: get('ssid'),
			password: get('password'),
			encryption: get('encryption'),
			hidden: form.get('hidden') === 'on',
			firstName: get('firstName'),
			lastName: get('lastName'),
			organization: get('organization'),
			jobTitle: get('jobTitle'),
			email: get('email'),
			phone: get('phone'),
			website: get('website'),
			note: get('note')
		};

		const scope = await getScope(locals.ctx, locals.user!.id);
		if (!scope) {
			return fail(400, { ...echo, message: 'Your account is not part of an organization.' });
		}

		let destination: string;
		let payload: string | null = null;

		if (kind === 'link') {
			destination = get('destination');
			if (!isHttpUrl(destination)) {
				return fail(400, { ...echo, message: 'Destination must be a valid http(s) URL.' });
			}
		} else if (kind === 'wifi') {
			const ssid = get('ssid');
			if (!ssid) return fail(400, { ...echo, message: 'Network name (SSID) is required.' });

			const rawEnc = get('encryption');
			const encryption: WifiEncryption = rawEnc === 'WEP' || rawEnc === 'nopass' ? rawEnc : 'WPA';
			const password = get('password');
			if (encryption !== 'nopass' && !password) {
				return fail(400, { ...echo, message: 'Password is required for a secured network.' });
			}

			const wifi = { ssid, password, encryption, hidden: form.get('hidden') === 'on' };
			payload = JSON.stringify(wifi);
			// Static kind: the QR carries this string itself, so it is the destination.
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
				return fail(400, { ...echo, message: 'Enter at least a name or an organization.' });
			}
			payload = JSON.stringify(contact);
			// vCard stays dynamic: the slug redirects to a landing page we host.
			destination = `${locals.ctx.config.origin}/v/${slug}`;
		}

		let code: Code;
		try {
			code = await createCode(locals.ctx, scope, {
				slug,
				kind,
				destination,
				payload,
				title: title || undefined
			});
		} catch (e) {
			if (e instanceof SlugError) return fail(400, { ...echo, message: e.message });
			throw e;
		}

		redirect(303, `/app/codes/${code.id}`);
	}
};
