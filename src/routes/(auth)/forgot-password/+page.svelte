<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Forgot password — Scanimal</title>
</svelte:head>

<wa-card>
	<h1 slot="header" style="margin: 0; font-size: 1.25rem; font-weight: 600;">Reset your password</h1>

	{#if form?.sent}
		<wa-callout variant="success" open>
			<wa-icon slot="icon" name="circle-check" library="fa" variant="solid"></wa-icon>
			If an account exists for that email, we've sent a reset link. Check your inbox.
		</wa-callout>
	{:else}
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
				<p style="margin: 0; color: var(--wa-color-neutral-600); font-size: 0.9rem;">
					Enter your email and we'll send you a link to reset your password.
				</p>

				<wa-input
					type="email"
					name="email"
					label="Email"
					autocomplete="email"
					required
				></wa-input>

				<wa-button type="submit" variant="brand" loading={loading} style="width: 100%;">
					Send reset link
				</wa-button>
			</div>
		</form>
	{/if}

	<div slot="footer" class="footer-links">
		<a href="/login">Back to sign in</a>
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
		justify-content: center;
		font-size: 0.875rem;
	}

	.footer-links a {
		color: var(--wa-color-primary-600);
		text-decoration: none;
	}

	.footer-links a:hover {
		text-decoration: underline;
	}
</style>
