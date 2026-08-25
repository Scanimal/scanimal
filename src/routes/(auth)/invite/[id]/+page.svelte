<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);

	const emailMatches = $derived(
		data.loggedIn && (data.userEmail ?? '').toLowerCase() === data.invitedEmail.toLowerCase()
	);
</script>

<svelte:head>
	<title>Invitation — {data.orgName}</title>
</svelte:head>

<wa-card with-header>
	<h1 slot="header" style="margin: 0; font-size: 1.25rem; font-weight: 600;">You're invited</h1>

	<div class="fields">
		<p class="intro">
			You've been invited to join <strong>{data.orgName}</strong>{#if data.role}&nbsp;as
				<strong>{data.role}</strong>{/if}. This invite was sent to
			<strong>{data.invitedEmail}</strong>.
		</p>

		{#if form?.message}
			<wa-callout variant="danger" open>
				<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
				{form.message}
			</wa-callout>
		{/if}

		{#if data.loggedIn && emailMatches}
			<form
				method="post"
				action="?/accept"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<wa-button pill type="submit" variant="brand" {loading} style="width: 100%;">
					Join {data.orgName}
				</wa-button>
			</form>
		{:else if data.loggedIn}
			<wa-callout variant="warning" open>
				<wa-icon slot="icon" name="triangle-exclamation" variant="solid"></wa-icon>
				This invite is for <strong>{data.invitedEmail}</strong>, but you're signed in as
				<strong>{data.userEmail}</strong>. Sign in with the invited address to accept it.
			</wa-callout>
		{:else if form?.sent}
			<wa-callout variant="success" open>
				<wa-icon slot="icon" name="envelope-circle-check" variant="solid"></wa-icon>
				Check your email — we sent a sign-in link to <strong>{data.invitedEmail}</strong>. It will
				bring you back here to accept the invite.
			</wa-callout>
		{:else if data.emailEnabled}
			<p class="note">Sign in to accept this invite.</p>
			<form
				method="post"
				action="?/sendLink"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<wa-button pill type="submit" variant="brand" {loading} style="width: 100%;">
					<wa-icon slot="start" name="envelope"></wa-icon>
					Email me a sign-in link
				</wa-button>
			</form>
		{:else}
			<wa-callout variant="neutral" open>
				<wa-icon slot="icon" name="circle-info" variant="solid"></wa-icon>
				Email isn't configured on this deployment, so we can't send you a sign-in link. Sign in another
				way first — for example with a passkey on the
				<a href="/login">login page</a> — then return to this invite.
			</wa-callout>
		{/if}
	</div>
</wa-card>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}

	.intro,
	.note {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--wa-color-text-normal);
	}

	.fields a {
		color: var(--wa-color-brand-on-quiet);
	}
</style>
