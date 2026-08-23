<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const shortUrl = (slug: string) => `${data.config.origin}/${slug}`;

	const truncate = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max)}…` : s);
</script>

<svelte:head>
	<title>Codes — {data.config.appName}</title>
</svelte:head>

<div class="page-header">
	<h1>Codes</h1>
	{#if data.scope}
		<wa-button variant="brand" href="/app/new">
			<wa-icon slot="prefix" name="plus" library="fa" variant="solid"></wa-icon>
			New code
		</wa-button>
	{/if}
</div>

{#if !data.scope}
	<wa-callout variant="warning" open>
		<wa-icon slot="icon" name="triangle-exclamation" variant="solid"></wa-icon>
		Your account isn't part of an organization yet, so there's nothing to show. Ask an admin to invite
		you, or contact your deployment administrator.
	</wa-callout>
{:else if data.codes.length === 0}
	<wa-card>
		<div class="empty-state">
			<wa-icon name="qrcode" library="fa" variant="solid" style="font-size: 2rem;"></wa-icon>
			<p>No codes yet. Create your first dynamic QR code to get started.</p>
			<wa-button variant="brand" href="/app/new">Create a code</wa-button>
		</div>
	</wa-card>
{:else}
	{#if data.seesAll}
		<p class="scope-note">Showing all codes in your organization.</p>
	{/if}
	<div class="code-list">
		{#each data.codes as code (code.id)}
			<wa-card>
				<div class="code-row">
					<div class="code-main">
						<div class="code-title-row">
							<span class="code-title">{code.title || code.slug}</span>
							{#if code.active}
								<wa-tag variant="success" size="small">Active</wa-tag>
							{:else}
								<wa-tag variant="neutral" size="small">Inactive</wa-tag>
							{/if}
						</div>
						<div class="short-url">
							<a href={shortUrl(code.slug)} target="_blank" rel="noreferrer">
								{shortUrl(code.slug)}
							</a>
							<wa-copy-button value={shortUrl(code.slug)}></wa-copy-button>
						</div>
						<div class="destination" title={code.destination}>
							<wa-icon name="arrow-right" library="fa" variant="solid"></wa-icon>
							{truncate(code.destination)}
						</div>
						<div class="created">Created {code.createdAt.toLocaleDateString()}</div>
					</div>
					<div class="code-actions">
						<wa-button size="small" href={`/app/codes/${code.id}`}>
							<wa-icon slot="prefix" name="pen" library="fa" variant="solid"></wa-icon>
							Edit
						</wa-button>
						<wa-button size="small" href={`/app/codes/${code.id}/analytics`}>
							<wa-icon slot="prefix" name="chart-line" library="fa" variant="solid"></wa-icon>
							Analytics
						</wa-button>
					</div>
				</div>
			</wa-card>
		{/each}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--wa-spacing-l);
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.scope-note {
		margin: 0 0 var(--wa-spacing-m);
		font-size: 0.8rem;
		color: var(--wa-color-neutral-600);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--wa-spacing-m);
		padding: var(--wa-spacing-xl);
		text-align: center;
		color: var(--wa-color-neutral-600);
	}

	.code-list {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-m);
	}

	.code-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--wa-spacing-m);
	}

	.code-main {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-xs);
		min-width: 0;
	}

	.code-title-row {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
	}

	.code-title {
		font-weight: 600;
		font-size: 1rem;
	}

	.short-url {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-xs);
		font-size: 0.875rem;
	}

	.short-url a {
		color: var(--wa-color-primary-600);
		text-decoration: none;
	}

	.short-url a:hover {
		text-decoration: underline;
	}

	.destination {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-xs);
		font-size: 0.8rem;
		color: var(--wa-color-neutral-600);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.created {
		font-size: 0.75rem;
		color: var(--wa-color-neutral-500);
	}

	.code-actions {
		display: flex;
		gap: var(--wa-spacing-s);
		flex-shrink: 0;
	}
</style>
