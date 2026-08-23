import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { invitation, organization } from '$lib/server/db/auth.schema';
import type { ResolvedAppContext } from '$lib/server/context';
import type { Actions, PageServerLoad } from './$types';

const findPendingInvite = async (ctx: ResolvedAppContext, id: string) => {
	const rows = await ctx.db
		.select({
			id: invitation.id,
			email: invitation.email,
			role: invitation.role,
			orgName: organization.name
		})
		.from(invitation)
		.innerJoin(organization, eq(invitation.organizationId, organization.id))
		.where(
			and(
				eq(invitation.id, id),
				eq(invitation.status, 'pending'),
				gt(invitation.expiresAt, new Date())
			)
		)
		.limit(1);
	return rows[0];
};

export const load: PageServerLoad = async (event) => {
	const inv = await findPendingInvite(event.locals.ctx, event.params.id);
	if (!inv) {
		error(404, 'Invite not found or expired');
	}

	return {
		invitedEmail: inv.email,
		orgName: inv.orgName,
		role: inv.role,
		loggedIn: !!event.locals.user,
		userEmail: event.locals.user?.email ?? null,
		emailEnabled: event.locals.ctx.emailEnabled
	};
};

export const actions: Actions = {
	accept: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: 'You must be signed in to accept an invite.' });
		}

		try {
			await event.locals.auth.api.acceptInvitation({
				body: { invitationId: event.params.id },
				headers: event.request.headers
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { message: err.message || 'Could not accept the invite.' });
			}
			throw err;
		}

		redirect(303, '/app');
	},

	sendLink: async (event) => {
		if (!event.locals.ctx.emailEnabled) {
			return fail(400, {
				message:
					"Email isn't configured on this deployment, so sign-in links can't be sent. Sign in another way first, then return to this invite."
			});
		}

		// Re-query the invited email — never trust form data for the recipient.
		const inv = await findPendingInvite(event.locals.ctx, event.params.id);
		if (!inv) {
			error(404, 'Invite not found or expired');
		}

		try {
			await event.locals.auth.api.signInMagicLink({
				body: { email: inv.email, callbackURL: `/invite/${event.params.id}` },
				headers: event.request.headers
			});
		} catch (err) {
			if (err instanceof APIError) {
				return fail(400, { message: err.message || 'Could not send the sign-in link.' });
			}
			throw err;
		}

		return { sent: true };
	}
};
