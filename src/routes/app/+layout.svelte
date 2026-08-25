<script lang="ts">
	import { page } from '$app/state';
	import { theme } from '$lib/theme.svelte';
	import type { LayoutServerData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutServerData } = $props();

	const isAdmin = $derived(data.scope?.role === 'owner' || data.scope?.role === 'admin');

	type NavItem = { href: string; icon: string; label: string; exact?: boolean };

	const links = $derived(
		[
			{ href: '/app', icon: 'qrcode', label: 'Codes', exact: true },
			{ href: '/app/new', icon: 'plus', label: 'New code' },
			isAdmin ? { href: '/app/analytics', icon: 'chart-line', label: 'Analytics' } : null,
			isAdmin ? { href: '/app/team', icon: 'users', label: 'Team' } : null,
			{ href: '/app/settings', icon: 'gear', label: 'Settings' }
		].filter(Boolean) as NavItem[]
	);

	// `/app` would otherwise match every child route, so it opts into an exact test.
	const isActive = (link: NavItem) =>
		link.exact ? page.url.pathname === link.href : page.url.pathname.startsWith(link.href);

	// Form-shaped routes read better in a narrow column than stretched across the page.
	const NARROW_ROUTES = ['/app/new', '/app/settings', '/app/team'];
	const narrow = $derived(NARROW_ROUTES.some((r) => page.url.pathname.startsWith(r)));

	const initials = $derived(
		(data.user.name || data.user.email)
			.split(/[\s@._-]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part: string) => part[0]?.toUpperCase() ?? '')
			.join('')
	);
</script>

<div class="app-shell">
	<nav class="sidebar" aria-label="Main">
		<a href="/app" class="sidebar-header">
			<span class="mark wa-gradient-brand" aria-hidden="true">
				<wa-icon name="qrcode" variant="solid"></wa-icon>
			</span>
			<span class="app-name">{data.config.appName}</span>
		</a>

		<ul class="nav-links">
			{#each links as link (link.href)}
				{@const active = isActive(link)}
				<li>
					<a
						href={link.href}
						class="nav-link"
						class:active
						aria-current={active ? 'page' : undefined}
					>
						<wa-icon name={link.icon} variant="solid"></wa-icon>
						{link.label}
					</a>
				</li>
			{/each}
		</ul>

		<div class="sidebar-footer">
			<div class="user-info">
				<span class="avatar" aria-hidden="true">{initials}</span>
				<span class="user-meta">
					{#if data.user.name}<span class="user-name">{data.user.name}</span>{/if}
					<span class="user-email">{data.user.email}</span>
				</span>
			</div>

			<div class="footer-actions">
				<form method="post" action="/app?/signOut">
					<wa-button pill type="submit" appearance="outlined" size="small">
						<wa-icon slot="start" name="right-from-bracket" variant="solid"></wa-icon>
						Sign out
					</wa-button>
				</form>

				<button
					type="button"
					class="theme-toggle"
					onclick={() => theme.toggle()}
					aria-pressed={theme.isDark}
					aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					<wa-icon name={theme.isDark ? 'sun' : 'moon'} variant="solid"></wa-icon>
				</button>
			</div>
		</div>
	</nav>

	<main class="content">
		<div class="content-inner" class:narrow>
			{@render children()}
		</div>
	</main>
</div>

<style>
	/* The content pane scrolls, not the page, so the sidebar always spans the full
	   viewport instead of ending where the shell's flow content stops. */
	.app-shell {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}

	.sidebar {
		width: 232px;
		flex-shrink: 0;
		background-color: var(--wa-color-surface-raised);
		border-right: 1px solid var(--wa-color-surface-border);
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-l);
		padding: var(--wa-space-l) var(--wa-space-m);
		overflow-y: auto;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		font-weight: var(--wa-font-weight-bold);
		font-size: var(--wa-font-size-l);
		letter-spacing: -0.02em;
		color: var(--wa-color-text-normal);
		text-decoration: none;
		padding-inline: var(--wa-space-xs);
	}

	/* Brand chip — the one saturated element in the chrome, so the eye starts here. */
	.mark {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--wa-border-radius-m);
		background-color: var(--wa-color-brand-fill-loud);
		color: var(--wa-color-brand-on-loud);
		font-size: 1rem;
	}

	.nav-links {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-3xs);
		flex: 1;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		padding: var(--wa-space-xs) var(--wa-space-s);
		border-radius: var(--wa-border-radius-m);
		text-decoration: none;
		color: var(--wa-color-text-quiet);
		font-size: var(--wa-font-size-s);
		font-weight: var(--wa-font-weight-semibold);
		transition:
			background-color var(--wa-transition-fast),
			color var(--wa-transition-fast);
	}

	.nav-link wa-icon {
		font-size: 0.9em;
		width: 1.25em;
		color: var(--wa-color-text-quiet);
		transition: color var(--wa-transition-fast);
	}

	.nav-link:hover {
		background-color: var(--wa-color-neutral-fill-quiet);
		color: var(--wa-color-text-normal);
	}

	.nav-link.active {
		background-color: var(--wa-color-brand-fill-quiet);
		color: var(--wa-color-brand-on-quiet);
	}

	.nav-link.active wa-icon {
		color: var(--wa-color-brand-on-quiet);
	}

	.sidebar-footer {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-s);
		border-top: 1px solid var(--wa-color-surface-border);
		padding-top: var(--wa-space-m);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		min-width: 0;
		padding-inline: var(--wa-space-xs);
	}

	.avatar {
		flex-shrink: 0;
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: var(--wa-border-radius-pill);
		background-color: var(--wa-color-neutral-fill-normal);
		color: var(--wa-color-text-normal);
		font-size: var(--wa-font-size-2xs);
		font-weight: var(--wa-font-weight-bold);
	}

	.user-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.3;
	}

	.user-name {
		font-size: var(--wa-font-size-xs);
		font-weight: var(--wa-font-weight-semibold);
	}

	.user-email,
	.user-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.user-email {
		font-size: var(--wa-font-size-2xs);
		color: var(--wa-color-text-quiet);
	}

	.footer-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--wa-space-xs);
	}

	.theme-toggle {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: none;
		border-radius: var(--wa-border-radius-pill);
		background: none;
		color: var(--wa-color-text-quiet);
		cursor: pointer;
		transition:
			background-color var(--wa-transition-fast),
			color var(--wa-transition-fast);
	}

	.theme-toggle:hover {
		background-color: var(--wa-color-neutral-fill-quiet);
		color: var(--wa-color-text-normal);
	}

	.content {
		flex: 1;
		min-width: 0;
		background-color: var(--wa-color-surface-lowered);
		overflow-y: auto;
	}

	.content-inner {
		max-width: var(--app-measure);
		margin-inline: auto;
		padding: var(--app-gutter);
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}

	/* Centring the narrow column splits the leftover space instead of banking it
	   all on the right, which is what made these pages read as half-empty. */
	.content-inner.narrow {
		max-width: 46rem;
	}

	@media (max-width: 45rem) {
		.app-shell {
			flex-direction: column;
			height: auto;
			overflow: visible;
		}

		.sidebar {
			width: auto;
			overflow-y: visible;
			border-right: none;
			border-bottom: 1px solid var(--wa-color-surface-border);
			gap: var(--wa-space-m);
		}

		.content {
			overflow-y: visible;
		}

		.nav-links {
			flex-direction: row;
			flex-wrap: wrap;
			flex: none;
		}
	}
</style>
