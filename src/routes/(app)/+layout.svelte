<script lang="ts">
	import type { LayoutServerData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutServerData } = $props();
</script>

<wa-page>
	<div slot="navigation-header" class="nav-header">
		<wa-icon name="qrcode" style="font-size: 1.25rem;"></wa-icon>
		<span class="app-name">Scanimal</span>
	</div>

	<nav slot="navigation" class="nav-links">
		<a href="/dashboard" class="nav-link">
			<wa-icon name="house"></wa-icon>
			Dashboard
		</a>
		<a href="/dashboard/qr" class="nav-link">
			<wa-icon name="qrcode"></wa-icon>
			My QR Codes
		</a>
		<a href="/dashboard/settings" class="nav-link">
			<wa-icon name="gear"></wa-icon>
			Settings
		</a>
	</nav>

	<div slot="navigation-footer" class="nav-footer">
		<div class="user-info">
			<wa-icon name="circle-user"></wa-icon>
			<span class="user-email">{data.user?.email}</span>
		</div>
		<form method="post" action="/dashboard?/signOut">
			<wa-button type="submit" variant="default" size="small">
				<wa-icon slot="prefix" name="right-from-bracket"></wa-icon>
				Sign out
			</wa-button>
		</form>
	</div>

	<div class="page-content">
		{@render children()}
	</div>
</wa-page>

<style>
	.nav-header {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--wa-color-primary-600);
	}

	.app-name {
		letter-spacing: -0.02em;
	}

	.nav-links {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-xs);
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
		padding: var(--wa-spacing-s) var(--wa-spacing-m);
		border-radius: var(--wa-border-radius-m);
		text-decoration: none;
		color: var(--wa-color-neutral-700);
		font-size: 0.9rem;
		transition: background 0.15s, color 0.15s;
	}

	.nav-link:hover {
		background: var(--wa-color-neutral-100);
		color: var(--wa-color-neutral-900);
	}

	.nav-footer {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-s);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
		font-size: 0.8rem;
		color: var(--wa-color-neutral-600);
		overflow: hidden;
	}

	.user-email {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.page-content {
		padding: var(--wa-spacing-xl);
	}
</style>
