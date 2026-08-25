<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state(false);
	let errorMessage = $state('');

	async function addPasskey() {
		errorMessage = '';
		loading = true;
		try {
			const result = await authClient.passkey.addPasskey({ name: 'Primary device' });
			if (result?.error) {
				errorMessage =
					result.error.message ??
					'Could not add a passkey. You can still sign in with magic links.';
				return;
			}
			await goto('/app');
		} catch {
			errorMessage = 'Could not add a passkey. You can still sign in with magic links.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Setup complete — {data.appName}</title>
</svelte:head>

<wa-card with-header>
	<h1 slot="header" style="margin: 0; font-size: 1.25rem; font-weight: 600;">You're all set</h1>

	<div class="fields">
		<wa-callout variant="success" open>
			<wa-icon slot="icon" name="circle-check" variant="solid"></wa-icon>
			Your owner account for <strong>{data.appName}</strong> is ready and you're signed in.
		</wa-callout>

		<p class="note">
			Add a passkey now for fast, passwordless sign-in on this device. Passkeys are bound to
			<strong>{data.rpId}</strong> — if that domain ever changes, you can always fall back to a magic
			link.
		</p>

		{#if errorMessage}
			<wa-callout variant="danger" open>
				<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
				{errorMessage}
			</wa-callout>
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<wa-button pill variant="brand" {loading} style="width: 100%;" onclick={addPasskey}>
			<wa-icon slot="start" name="fingerprint"></wa-icon>
			Add a passkey
		</wa-button>

		<a class="skip-link" href="/app">Skip for now</a>
	</div>
</wa-card>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}

	.note {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--wa-color-text-normal);
	}

	.skip-link {
		align-self: center;
		font-size: 0.875rem;
		color: var(--wa-color-brand-on-quiet);
		text-decoration: none;
	}

	.skip-link:hover {
		text-decoration: underline;
	}
</style>
