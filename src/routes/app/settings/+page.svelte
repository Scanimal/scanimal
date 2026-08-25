<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import AppearancePicker from '$lib/components/AppearancePicker.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let savingProfile = $state(false);
	let deviceName = $state('');
	let addingPasskey = $state(false);
	let passkeyError = $state('');

	async function addPasskey() {
		addingPasskey = true;
		passkeyError = '';
		try {
			const result = await authClient.passkey.addPasskey({ name: deviceName || 'Passkey' });
			if (result?.error) {
				passkeyError = result.error.message ?? 'Failed to add passkey.';
			} else {
				deviceName = '';
				await invalidateAll();
			}
		} catch (e) {
			passkeyError = e instanceof Error ? e.message : 'Failed to add passkey.';
		} finally {
			addingPasskey = false;
		}
	}
</script>

<svelte:head>
	<title>Settings — {data.config.appName}</title>
</svelte:head>

<div class="page-header">
	<h1>Settings</h1>
</div>

<div class="sections">
	<wa-card with-header>
		<h2 slot="header" class="card-title">Appearance</h2>
		<AppearancePicker />
	</wa-card>

	<wa-card with-header>
		<h2 slot="header" class="card-title">Profile</h2>
		<form
			method="post"
			action="?/profile"
			use:enhance={() => {
				savingProfile = true;
				return async ({ update }) => {
					savingProfile = false;
					await update({ reset: false });
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
				{#if form?.profileSaved}
					<wa-callout variant="success" open>
						<wa-icon slot="icon" name="circle-check" variant="solid"></wa-icon>
						Profile saved.
					</wa-callout>
				{/if}

				<wa-input name="name" label="Name" value={data.user.name} required></wa-input>
				<wa-input label="Email" value={data.user.email} disabled hint="Email cannot be changed.">
				</wa-input>

				<wa-button pill type="submit" variant="brand" loading={savingProfile}
					>Save profile</wa-button
				>
			</div>
		</form>
	</wa-card>

	<wa-card with-header>
		<h2 slot="header" class="card-title">Passkeys</h2>
		<div class="fields">
			<wa-callout variant="neutral" open>
				<wa-icon slot="icon" name="circle-info" variant="solid"></wa-icon>
				Passkeys are bound to the domain <code>{data.rpId}</code>. Changing the deployment domain
				invalidates them — magic link sign-in remains available as recovery.
			</wa-callout>

			{#if data.passkeys.length === 0}
				<p class="muted">No passkeys registered yet.</p>
			{:else}
				<ul class="passkey-list">
					{#each data.passkeys as pk (pk.id)}
						<li class="passkey-row">
							<div class="passkey-info">
								<wa-icon name="key" variant="solid"></wa-icon>
								<span class="passkey-name">{pk.name || 'Passkey'}</span>
								{#if pk.createdAt}
									<span class="passkey-date">added {pk.createdAt.toLocaleDateString()}</span>
								{/if}
							</div>
							<form
								method="post"
								action="?/revokePasskey"
								use:enhance={({ cancel }) => {
									if (
										!confirm('Revoke this passkey? You will no longer be able to sign in with it.')
									)
										cancel();
								}}
							>
								<input type="hidden" name="id" value={pk.id} />
								<wa-button pill type="submit" size="small" variant="danger" appearance="outlined">
									Revoke
								</wa-button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			<wa-divider></wa-divider>

			{#if passkeyError}
				<wa-callout variant="danger" open>
					<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
					{passkeyError}
				</wa-callout>
			{/if}

			<div class="add-passkey">
				<wa-input
					label="Device name (optional)"
					placeholder="e.g. Work laptop"
					value={deviceName}
					oninput={(e: Event) => (deviceName = (e.target as HTMLInputElement).value)}
					style="flex: 1;"
				></wa-input>
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<wa-button pill type="button" variant="brand" loading={addingPasskey} onclick={addPasskey}>
					<wa-icon slot="start" name="key" variant="solid"></wa-icon>
					Add a passkey
				</wa-button>
			</div>
		</div>
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

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}

	.muted {
		margin: 0;
		font-size: 0.85rem;
		color: var(--wa-color-text-quiet);
	}

	.passkey-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-s);
	}

	.passkey-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--wa-space-m);
	}

	.passkey-info {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		font-size: 0.9rem;
		min-width: 0;
	}

	.passkey-name {
		font-weight: 600;
	}

	.passkey-date {
		font-size: 0.8rem;
		color: var(--wa-color-text-quiet);
	}

	.add-passkey {
		display: flex;
		align-items: flex-end;
		gap: var(--wa-space-s);
	}
</style>
