import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { member } from '$lib/server/db/auth.schema';
import { markUsersExist } from '$lib/server/first-run';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		redirect(302, '/setup');
	}

	// The first user now exists — stop redirecting everything to /setup.
	markUsersExist();

	// Create the default organization for the owner if they have none yet.
	const memberships = await event.locals.ctx.db
		.select({ id: member.id })
		.from(member)
		.where(eq(member.userId, event.locals.user.id))
		.limit(1);

	if (memberships.length === 0) {
		await event.locals.auth.api.createOrganization({
			body: { name: event.locals.ctx.config.appName, slug: 'default' },
			headers: event.request.headers
		});
	}

	return {
		appName: event.locals.ctx.config.appName,
		rpId: event.locals.ctx.config.rpId
	};
};
