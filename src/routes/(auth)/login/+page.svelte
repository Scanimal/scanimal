<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let sending = $state(false);
	let passkeyLoading = $state(false);
	let passkeyError = $state('');

	const next = $derived(page.url.searchParams.get('next') ?? '/app');

	async function signInWithPasskey() {
		passkeyError = '';
		passkeyLoading = true;
		try {
			const result = await authClient.signIn.passkey();
			if (result?.error) {
				passkeyError =
					result.error.message ?? 'Passkey sign-in failed. Try again or use a sign-in link.';
				return;
			}
			await goto(next);
		} catch {
			passkeyError = 'Passkey sign-in failed. Try again or use a sign-in link.';
		} finally {
			passkeyLoading = false;
		}
	}

	async function signInWithSocial(provider: 'google' | 'github') {
		await authClient.signIn.social({ provider, callbackURL: '/app' });
	}

	const providerLabel = (provider: 'google' | 'github') =>
		provider === 'google' ? 'Google' : 'GitHub';
</script>

<svelte:head>
	<title>Sign in — Scanimal</title>
</svelte:head>

<wa-card with-header>
	<h1 slot="header" style="margin: 0; font-size: 1.25rem; font-weight: 600;">Sign in</h1>

	<div class="fields">
		{#if passkeyError}
			<wa-callout variant="danger" open>
				<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
				{passkeyError}
			</wa-callout>
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<wa-button
			pill
			variant="brand"
			loading={passkeyLoading}
			style="width: 100%;"
			onclick={signInWithPasskey}
		>
			<wa-icon slot="start" name="fingerprint"></wa-icon>
			Sign in with a passkey
		</wa-button>

		<wa-divider></wa-divider>

		{#if data.emailEnabled}
			{#if form?.sent}
				<wa-callout variant="success" open>
					<wa-icon slot="icon" name="envelope-circle-check" variant="solid"></wa-icon>
					Check your email — we sent a sign-in link to <strong>{form.email}</strong>.
				</wa-callout>
			{:else}
				<form
					method="post"
					action="?/magicLink"
					use:enhance={() => {
						sending = true;
						return async ({ update }) => {
							sending = false;
							await update();
						};
					}}
				>
					<div class="fields">
						{#if form?.message}
							<wa-callout variant="danger" open>
								<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
								{form.message}
							</wa-callout>
						{/if}

						<wa-input type="email" name="email" label="Email" autocomplete="email" required
						></wa-input>

						<wa-button pill type="submit" loading={sending} style="width: 100%;">
							<wa-icon slot="start" name="envelope"></wa-icon>
							Email me a sign-in link
						</wa-button>
					</div>
				</form>
			{/if}
		{:else}
			<wa-callout variant="neutral" open>
				<wa-icon slot="icon" name="circle-info" variant="solid"></wa-icon>
				Email isn't configured on this deployment, so signing in with a passkey is the only option.
			</wa-callout>
		{/if}

		{#if data.socialProviders.length > 0}
			<wa-divider></wa-divider>
			{#each data.socialProviders as provider (provider)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<wa-button pill style="width: 100%;" onclick={() => signInWithSocial(provider)}>
					<wa-icon slot="start" name={provider} family="brands"></wa-icon>
					Continue with {providerLabel(provider)}
				</wa-button>
			{/each}
		{/if}
	</div>
</wa-card>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}
</style>
