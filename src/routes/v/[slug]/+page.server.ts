import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { codes } from '$lib/server/db/app.schema';
import { parseVCard, vcardDisplayName } from '$lib/server/codes/payloads';

/**
 * Public vCard landing page. Unauthenticated by design — this is what a phone
 * lands on after scanning, so it must work for anyone.
 *
 * Scans are already recorded by the redirect hook on the `/slug` hop that sent
 * the visitor here, so this route deliberately records nothing itself.
 */
export const load: PageServerLoad = async ({ locals, params }) => {
	const rows = await locals.ctx.db.select().from(codes).where(eq(codes.slug, params.slug)).limit(1);

	const code = rows[0];
	if (!code || code.kind !== 'vcard' || !code.active) error(404, 'Not found');

	const contact = parseVCard(code.payload);
	return {
		contact,
		displayName: vcardDisplayName(contact),
		slug: code.slug
	};
};
