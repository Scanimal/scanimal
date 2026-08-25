<script lang="ts">
	let { children } = $props();
</script>

<div class="auth-shell">
	<div class="auth-card">
		<div class="auth-logo">
			<span class="mark wa-gradient-brand" aria-hidden="true">
				<wa-icon name="qrcode" variant="solid"></wa-icon>
			</span>
			<span class="auth-logo-name">Scanimal</span>
		</div>
		{@render children()}
	</div>
</div>

<style>
	.auth-shell {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--wa-space-xl) var(--wa-space-m);
		background-color: var(--wa-color-surface-lowered);
		/* Two soft brand washes keep the sign-in screen from reading as a blank slab. */
		background-image:
			radial-gradient(40rem 40rem at 15% -10%, var(--wa-color-brand-fill-quiet), transparent 60%),
			radial-gradient(32rem 32rem at 100% 110%, var(--wa-color-brand-fill-quiet), transparent 65%);
	}

	.auth-card {
		width: 100%;
		max-width: 26rem;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-l);
	}

	.auth-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--wa-space-s);
		font-size: var(--wa-font-size-xl);
		font-weight: var(--wa-font-weight-bold);
		letter-spacing: -0.02em;
		color: var(--wa-color-text-normal);
	}

	.mark {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--wa-border-radius-m);
		background-color: var(--wa-color-brand-fill-loud);
		color: var(--wa-color-brand-on-loud);
		font-size: 1.1rem;
	}
</style>
