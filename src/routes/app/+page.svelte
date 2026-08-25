<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const shortUrl = (slug: string) => `${data.config.origin}/${slug}`;

	const truncate = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max)}…` : s);

	const KIND_META: Record<string, { label: string; icon: string }> = {
		link: { label: 'Link', icon: 'link' },
		vcard: { label: 'Contact', icon: 'address-card' },
		wifi: { label: 'Wi-Fi', icon: 'wifi' }
	};
	const meta = (kind: string) => KIND_META[kind] ?? KIND_META.link;

	/** Wi-Fi codes carry their payload in the QR, so they have no short link to scan. */
	const isStatic = (kind: string) => kind === 'wifi';
</script>

<svelte:head>
	<title>Codes — {data.config.appName}</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Codes</h1>
		{#if data.scope && data.seesAll && data.codes.length > 0}
			<p class="page-subtitle">Showing all codes in your organization.</p>
		{/if}
	</div>
	{#if data.scope}
		<wa-button pill variant="brand" href="/app/new">
			<wa-icon slot="start" name="plus" variant="solid"></wa-icon>
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
			<span class="empty-mark wa-gradient-brand" aria-hidden="true">
				<wa-icon name="qrcode" variant="solid"></wa-icon>
			</span>
			<div>
				<h2>Nothing to scan yet</h2>
				<p>
					Create a dynamic QR code and you can repoint it at any time — the printed code never
					changes.
				</p>
			</div>
			<wa-button pill variant="brand" href="/app/new">
				<wa-icon slot="start" name="plus" variant="solid"></wa-icon>
				Create your first code
			</wa-button>
		</div>
	</wa-card>
{:else}
	<ul class="code-list">
		{#each data.codes as code (code.id)}
			<li>
				<wa-card>
					<div class="code-row">
						<a class="thumb" href={`/app/codes/${code.id}`} aria-hidden="true" tabindex="-1">
							<wa-qr-code
								value={isStatic(code.kind) ? code.destination : shortUrl(code.slug)}
								size="64"
							></wa-qr-code>
						</a>

						<div class="code-main">
							<div class="code-title-row">
								<a class="code-title" href={`/app/codes/${code.id}`}>{code.title || code.slug}</a>
								<wa-tag variant="neutral" size="small" appearance="outlined">
									{meta(code.kind).label}
								</wa-tag>
								{#if code.active}
									<wa-tag variant="success" size="small" appearance="outlined">Active</wa-tag>
								{:else}
									<wa-tag variant="neutral" size="small" appearance="outlined">Inactive</wa-tag>
								{/if}
								<span class="created">· {code.createdAt.toLocaleDateString()}</span>
							</div>

							<div class="links">
								{#if isStatic(code.kind)}
									<span class="static-note">
										<wa-icon name="lock" variant="solid"></wa-icon>
										Encoded in the QR — not tracked
									</span>
								{:else}
									<a class="short" href={shortUrl(code.slug)} target="_blank" rel="noreferrer">
										{shortUrl(code.slug)}
									</a>
									<wa-copy-button value={shortUrl(code.slug)}></wa-copy-button>
									<wa-icon class="arrow" name="arrow-right" variant="solid"></wa-icon>
									<span class="destination" title={code.destination}>
										{truncate(code.destination, 80)}
									</span>
								{/if}
							</div>
						</div>

						<div class="code-actions">
							<wa-button pill size="small" appearance="outlined" href={`/app/codes/${code.id}`}>
								<wa-icon slot="start" name="pen" variant="solid"></wa-icon>
								Edit
							</wa-button>
							{#if !isStatic(code.kind)}
								<wa-button
									pill
									size="small"
									appearance="outlined"
									href={`/app/codes/${code.id}/analytics`}
								>
									<wa-icon slot="start" name="chart-line" variant="solid"></wa-icon>
									Analytics
								</wa-button>
							{/if}
						</div>
					</div>
				</wa-card>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--wa-space-m);
		padding: var(--wa-space-2xl) var(--wa-space-l);
		text-align: center;
		max-width: 30rem;
		margin-inline: auto;
	}

	.empty-mark {
		display: grid;
		place-items: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: var(--wa-border-radius-l);
		background-color: var(--wa-color-brand-fill-quiet);
		color: var(--wa-color-brand-on-quiet);
		font-size: 1.5rem;
	}

	.empty-state h2 {
		font-size: var(--wa-font-size-l);
		margin-bottom: var(--wa-space-2xs);
	}

	.empty-state p {
		margin: 0;
		color: var(--wa-color-text-quiet);
		font-size: var(--wa-font-size-s);
	}

	.code-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-s);
	}

	/* Cards lift slightly on hover so the whole row reads as one target. */
	.code-list wa-card {
		transition:
			transform var(--wa-transition-fast),
			box-shadow var(--wa-transition-fast);
	}

	.code-list wa-card:hover {
		transform: translateY(-1px);
		box-shadow: var(--wa-shadow-m);
	}

	.code-row {
		display: flex;
		align-items: center;
		gap: var(--wa-space-m);
	}

	.thumb {
		flex-shrink: 0;
		display: block;
		padding: var(--wa-space-3xs);
		border-radius: var(--wa-border-radius-m);
		background-color: white;
		border: 1px solid var(--wa-color-surface-border);
		line-height: 0;
	}

	.code-main {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-3xs);
		min-width: 0;
		flex: 1;
	}

	.code-title-row {
		display: flex;
		align-items: baseline;
		gap: var(--wa-space-xs);
		flex-wrap: wrap;
	}

	.code-title {
		font-weight: var(--wa-font-weight-semibold);
		font-size: var(--wa-font-size-m);
		color: var(--wa-color-text-normal);
		text-decoration: none;
	}

	.code-title:hover {
		color: var(--wa-color-brand-on-quiet);
	}

	.created {
		font-size: var(--wa-font-size-2xs);
		color: var(--wa-color-text-quiet);
	}

	/* Short link and destination share one line — stacking them left a dead gap
	   between the text column and the actions. */
	.links {
		display: flex;
		align-items: center;
		gap: var(--wa-space-2xs);
		font-size: var(--wa-font-size-s);
		min-width: 0;
	}

	.short {
		color: var(--wa-color-text-link);
		text-decoration: none;
		flex-shrink: 0;
	}

	.short:hover {
		text-decoration: underline;
	}

	.arrow {
		color: var(--wa-color-text-quiet);
		font-size: 0.75em;
		flex-shrink: 0;
		margin-inline-start: var(--wa-space-2xs);
	}

	.static-note {
		display: flex;
		align-items: center;
		gap: var(--wa-space-2xs);
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-text-quiet);
	}

	.destination {
		color: var(--wa-color-text-quiet);
		font-size: var(--wa-font-size-xs);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.code-actions {
		display: flex;
		gap: var(--wa-space-xs);
		flex-shrink: 0;
	}

	@media (max-width: 45rem) {
		.code-row {
			flex-wrap: wrap;
		}

		.links {
			flex-wrap: wrap;
		}

		.code-actions {
			width: 100%;
		}
	}
</style>
