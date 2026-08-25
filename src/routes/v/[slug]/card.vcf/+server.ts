import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { codes } from '$lib/server/db/app.schema';
import { encodeVCard, parseVCard, vcardDisplayName } from '$lib/server/codes/payloads';

/** Serves the contact as a downloadable .vcf so phones offer "Add to Contacts". */
export const GET: RequestHandler = async ({ locals, params }) => {
	const rows = await locals.ctx.db.select().from(codes).where(eq(codes.slug, params.slug)).limit(1);

	const code = rows[0];
	if (!code || code.kind !== 'vcard' || !code.active) error(404, 'Not found');

	const contact = parseVCard(code.payload);
	const filename = vcardDisplayName(contact)
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.toLowerCase();

	return new Response(encodeVCard(contact), {
		headers: {
			'Content-Type': 'text/vcard; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename || 'contact'}.vcf"`,
			'Cache-Control': 'no-store'
		}
	});
};
