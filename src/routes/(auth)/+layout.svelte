<script lang="ts">
	let { children } = $props();
</script>

<div class="auth-shell">
	<div class="auth-card">
		<div class="auth-logo">
			<wa-icon name="qrcode" style="font-size: 2rem;"></wa-icon>
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
		background: var(--wa-color-neutral-50);
		padding: var(--wa-spacing-m);
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-l);
	}

	.auth-logo {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--wa-color-primary-600);
	}

	.auth-logo-name {
		letter-spacing: -0.02em;
	}
</style>
