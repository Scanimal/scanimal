<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Setup — Scanimal</title>
</svelte:head>

<wa-card>
	<h1 slot="header" style="margin: 0; font-size: 1.25rem; font-weight: 600;">
		Welcome to Scanimal
	</h1>

	<div class="fields">
		<p class="intro">
			This is the first-run setup. It configures your deployment and creates the owner account —
			you'll be signed in immediately, no email required.
		</p>

		{#if form?.message}
			<wa-callout variant="danger" open>
				<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
				{form.message}
			</wa-callout>
		{/if}

		<form
			method="post"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="fields">
				<wa-input name="name" label="Your name" autocomplete="name" required></wa-input>

				<wa-input type="email" name="email" label="Email" autocomplete="email" required></wa-input>

				<wa-input name="appName" label="App name" value="Scanimal" required></wa-input>

				<wa-input
					type="url"
					name="origin"
					label="App URL"
					value={data.suggestedOrigin}
					hint="The final domain this app will live at, e.g. https://go.example.com"
					required
				></wa-input>

				<wa-callout variant="warning" open>
					<wa-icon slot="icon" name="triangle-exclamation" variant="solid"></wa-icon>
					<strong>Choose the domain carefully.</strong> Passkeys are bound to this domain (the RP-ID).
					Changing it later invalidates existing passkeys — magic-link sign-in remains available as recovery.
				</wa-callout>

				<wa-button type="submit" variant="brand" {loading} style="width: 100%;">
					Create owner account
				</wa-button>
			</div>
		</form>
	</div>
</wa-card>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-m);
	}

	.intro {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--wa-color-neutral-700);
	}
</style>
