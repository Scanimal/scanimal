<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let inviting = $state(false);

	const roleVariant = (role: string) =>
		role === 'owner' ? 'brand' : role === 'admin' ? 'success' : 'neutral';

	const inviteUrl = (id: string) => `${data.origin}/invite/${id}`;
</script>

<svelte:head>
	<title>Team — {data.config.appName}</title>
</svelte:head>

<div class="page-header">
	<h1>Team</h1>
</div>

{#if form?.message}
	<wa-callout variant="danger" open class="page-callout">
		<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
		{form.message}
	</wa-callout>
{/if}

<div class="sections">
	<wa-card with-header>
		<h2 slot="header" class="card-title">Members</h2>
		<ul class="member-list">
			{#each data.members as m (m.id)}
				<li class="member-row">
					<div class="member-info">
						<span class="member-name">{m.name}</span>
						<span class="member-email">{m.email}</span>
					</div>
					<div class="member-actions">
						<wa-tag variant={roleVariant(m.role)} size="small">{m.role}</wa-tag>
						{#if m.role !== 'owner' && m.userId !== data.user.id}
							<form
								method="post"
								action="?/removeMember"
								use:enhance={({ cancel }) => {
									if (!confirm(`Remove ${m.email} from the organization?`)) cancel();
								}}
							>
								<input type="hidden" name="memberId" value={m.id} />
								<wa-button pill type="submit" size="small" variant="danger" appearance="outlined">
									Remove
								</wa-button>
							</form>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</wa-card>

	<wa-card with-header>
		<h2 slot="header" class="card-title">Pending invitations</h2>
		{#if data.invitations.length === 0}
			<p class="muted">No pending invitations.</p>
		{:else}
			<ul class="member-list">
				{#each data.invitations as inv (inv.id)}
					<li class="member-row">
						<div class="member-info">
							<span class="member-name">{inv.email}</span>
							<span class="member-email">Expires {inv.expiresAt.toLocaleDateString()}</span>
						</div>
						<div class="member-actions">
							<wa-tag variant={roleVariant(inv.role ?? 'member')} size="small">
								{inv.role ?? 'member'}
							</wa-tag>
							<wa-copy-button value={inviteUrl(inv.id)}></wa-copy-button>
							<form method="post" action="?/cancelInvite" use:enhance>
								<input type="hidden" name="invitationId" value={inv.id} />
								<wa-button pill type="submit" size="small" appearance="outlined">Cancel</wa-button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</wa-card>

	<wa-card with-header>
		<h2 slot="header" class="card-title">Invite someone</h2>
		<form
			method="post"
			action="?/invite"
			use:enhance={() => {
				inviting = true;
				return async ({ update }) => {
					inviting = false;
					await update();
				};
			}}
		>
			<div class="invite-fields">
				<wa-input
					type="email"
					name="email"
					label="Email"
					placeholder="teammate@example.com"
					required
					style="flex: 1;"
				></wa-input>
				<wa-select name="role" label="Role" value="member" class="role-select">
					<wa-option value="member">Member</wa-option>
					<wa-option value="admin">Admin</wa-option>
				</wa-select>
				<wa-button pill type="submit" variant="brand" loading={inviting}>Invite</wa-button>
			</div>
		</form>

		{#if form?.inviteUrl}
			<wa-callout variant="success" open class="invite-result">
				<wa-icon slot="icon" name="circle-check" variant="solid"></wa-icon>
				<strong>Link-based invites: share this URL.</strong> Invites work even with no email
				configured.
				<div class="invite-link-row">
					<code>{form.inviteUrl}</code>
					<wa-copy-button value={form.inviteUrl}></wa-copy-button>
				</div>
			</wa-callout>
		{/if}
	</wa-card>
</div>

<style>
	.page-header {
		margin-bottom: var(--wa-space-l);
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-l);
	}

	.card-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.muted {
		margin: 0;
		font-size: 0.85rem;
		color: var(--wa-color-text-quiet);
	}

	.member-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}

	.member-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--wa-space-m);
	}

	.member-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.member-name {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.member-email {
		font-size: 0.8rem;
		color: var(--wa-color-text-quiet);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.member-actions {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		flex-shrink: 0;
	}

	.invite-fields {
		display: flex;
		align-items: flex-end;
		gap: var(--wa-space-s);
		flex-wrap: wrap;
	}

	.invite-result {
		margin-top: var(--wa-space-m);
	}

	.invite-link-row {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		margin-top: var(--wa-space-s);
	}

	.invite-link-row code {
		font-size: 0.8rem;
		overflow-wrap: anywhere;
	}
</style>
