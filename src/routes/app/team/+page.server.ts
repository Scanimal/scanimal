import { and, eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { canSeeAll, getScope, type OrgScope } from '$lib/server/db/queries';
import { invitation, member, user } from '$lib/server/db/auth.schema';

const requireAdminScope = async (locals: App.Locals): Promise<OrgScope | null> => {
	const scope = await getScope(locals.ctx, locals.user!.id);
	if (!scope || !canSeeAll(scope)) return null;
	return scope;
};

export const load: PageServerLoad = async ({ locals }) => {
	const scope = await requireAdminScope(locals);
	if (!scope) redirect(302, '/app');

	const members = await locals.ctx.db
		.select({
			id: member.id,
			userId: member.userId,
			role: member.role,
			name: user.name,
			email: user.email
		})
		.from(member)
		.innerJoin(user, eq(member.userId, user.id))
		.where(eq(member.organizationId, scope.organizationId));

	const invitations = await locals.ctx.db
		.select()
		.from(invitation)
		.where(
			and(eq(invitation.organizationId, scope.organizationId), eq(invitation.status, 'pending'))
		);

	return { members, invitations, origin: locals.ctx.config.origin };
};

export const actions: Actions = {
	invite: async ({ locals, request }) => {
		const scope = await requireAdminScope(locals);
		if (!scope) return fail(403, { message: 'You are not allowed to manage the team.' });

		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const roleInput = String(form.get('role') ?? 'member');
		const role: 'member' | 'admin' = roleInput === 'admin' ? 'admin' : 'member';

		if (!email) return fail(400, { message: 'Email is required.' });

		try {
			const inv = await locals.auth.api.createInvitation({
				body: { email, role, organizationId: scope.organizationId },
				headers: request.headers
			});
			return { inviteUrl: `${locals.ctx.config.origin}/invite/${inv.id}` };
		} catch (e) {
			if (e instanceof APIError) return fail(400, { message: e.message });
			throw e;
		}
	},

	cancelInvite: async ({ locals, request }) => {
		const scope = await requireAdminScope(locals);
		if (!scope) return fail(403, { message: 'You are not allowed to manage the team.' });

		const form = await request.formData();
		const invitationId = String(form.get('invitationId') ?? '');
		if (!invitationId) return fail(400, { message: 'Missing invitation ID.' });

		try {
			await locals.auth.api.cancelInvitation({
				body: { invitationId },
				headers: request.headers
			});
			return { cancelled: true };
		} catch (e) {
			if (e instanceof APIError) return fail(400, { message: e.message });
			throw e;
		}
	},

	removeMember: async ({ locals, request }) => {
		const scope = await requireAdminScope(locals);
		if (!scope) return fail(403, { message: 'You are not allowed to manage the team.' });

		const form = await request.formData();
		const memberId = String(form.get('memberId') ?? '');
		if (!memberId) return fail(400, { message: 'Missing member ID.' });

		// Look up the target row ourselves — never trust role/user hints from the form.
		const rows = await locals.ctx.db
			.select()
			.from(member)
			.where(and(eq(member.id, memberId), eq(member.organizationId, scope.organizationId)))
			.limit(1);
		const target = rows[0];
		if (!target) return fail(400, { message: 'Member not found.' });
		if (target.userId === scope.userId) {
			return fail(400, { message: 'You cannot remove yourself.' });
		}
		if (target.role === 'owner') {
			return fail(400, { message: 'The organization owner cannot be removed.' });
		}

		try {
			await locals.auth.api.removeMember({
				body: { memberIdOrEmail: memberId, organizationId: scope.organizationId },
				headers: request.headers
			});
			return { removed: true };
		} catch (e) {
			if (e instanceof APIError) return fail(400, { message: e.message });
			throw e;
		}
	}
};
