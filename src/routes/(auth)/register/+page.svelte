<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Create account — Scanimal</title>
</svelte:head>

<wa-card>
	<h1 slot="header" style="margin: 0; font-size: 1.25rem; font-weight: 600;">Create account</h1>

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
			{#if form?.message}
				<wa-callout variant="danger" open>
					<wa-icon slot="icon" name="circle-exclamation" library="fa" variant="solid"></wa-icon>
					{form.message}
				</wa-callout>
			{/if}

			<wa-input
				type="text"
				name="name"
				label="Full name"
				autocomplete="name"
				required
			></wa-input>

			<wa-input
				type="email"
				name="email"
				label="Email"
				autocomplete="email"
				required
			></wa-input>

			<wa-input
				type="password"
				name="password"
				label="Password"
				autocomplete="new-password"
				minlength="8"
				required
			></wa-input>

			<wa-button type="submit" variant="brand" loading={loading} style="width: 100%;">
				Create account
			</wa-button>
		</div>
	</form>

	<div slot="footer" class="footer-links">
		Already have an account?
		<a href="/login">Sign in</a>
	</div>
</wa-card>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-m);
	}

	.footer-links {
		display: flex;
		gap: var(--wa-spacing-xs);
		justify-content: center;
		font-size: 0.875rem;
		color: var(--wa-color-neutral-600);
	}

	.footer-links a {
		color: var(--wa-color-primary-600);
		text-decoration: none;
	}

	.footer-links a:hover {
		text-decoration: underline;
	}
</style>
