<script lang="ts">
	import type { LayoutServerData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutServerData } = $props();

	const isAdmin = $derived(data.scope?.role === 'owner' || data.scope?.role === 'admin');
</script>

<wa-page>
	<div class="app-shell">
		<nav class="sidebar">
			<div class="sidebar-header">
				<wa-icon name="qrcode" library="fa" variant="solid" style="font-size: 1.25rem;"></wa-icon>
				<span class="app-name">{data.config.appName}</span>
			</div>

			<ul class="nav-links">
				<li>
					<a href="/app" class="nav-link">
						<wa-icon name="qrcode" library="fa" variant="solid"></wa-icon>
						Codes
					</a>
				</li>
				<li>
					<a href="/app/new" class="nav-link">
						<wa-icon name="plus" library="fa" variant="solid"></wa-icon>
						New code
					</a>
				</li>
				{#if isAdmin}
					<li>
						<a href="/app/team" class="nav-link">
							<wa-icon name="users" library="fa" variant="solid"></wa-icon>
							Team
						</a>
					</li>
				{/if}
				<li>
					<a href="/app/settings" class="nav-link">
						<wa-icon name="gear" library="fa" variant="solid"></wa-icon>
						Settings
					</a>
				</li>
			</ul>

			<div class="sidebar-footer">
				<div class="user-info">
					<wa-icon name="circle-user" library="fa" variant="solid"></wa-icon>
					<span class="user-email">{data.user.email}</span>
				</div>
				<form method="post" action="/app?/signOut">
					<wa-button type="submit" variant="default" size="small">
						<wa-icon slot="prefix" name="right-from-bracket" library="fa" variant="solid"></wa-icon>
						Sign out
					</wa-button>
				</form>
			</div>
		</nav>

		<main class="content">
			{@render children()}
		</main>
	</div>
</wa-page>

<style>
	.app-shell {
		display: flex;
		min-height: 100dvh;
	}

	.sidebar {
		width: 240px;
		flex-shrink: 0;
		background: var(--wa-color-neutral-0);
		border-right: 1px solid var(--wa-color-neutral-200);
		display: flex;
		flex-direction: column;
		padding: var(--wa-spacing-m);
		gap: var(--wa-spacing-l);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--wa-color-primary-600);
		padding: var(--wa-spacing-xs) 0;
	}

	.app-name {
		letter-spacing: -0.02em;
	}

	.nav-links {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-xs);
		flex: 1;
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
		transition:
			background 0.15s,
			color 0.15s;
	}

	.nav-link:hover {
		background: var(--wa-color-neutral-100);
		color: var(--wa-color-neutral-900);
	}

	.sidebar-footer {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-s);
		border-top: 1px solid var(--wa-color-neutral-200);
		padding-top: var(--wa-spacing-m);
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

	.content {
		flex: 1;
		padding: var(--wa-spacing-xl);
		background: var(--wa-color-neutral-50);
		overflow-y: auto;
	}
</style>
