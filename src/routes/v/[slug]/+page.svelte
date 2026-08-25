<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const c = $derived(data.contact);

	const initials = $derived(
		[c.firstName, c.lastName]
			.filter(Boolean)
			.map((p: string) => p[0]?.toUpperCase() ?? '')
			.join('') ||
			(c.organization?.[0]?.toUpperCase() ?? '?')
	);

	// Phones don't reliably linkify a bare domain, so normalise before rendering.
	const websiteHref = $derived(
		c.website && !/^https?:\/\//i.test(c.website) ? `https://${c.website}` : c.website
	);
</script>

<svelte:head>
	<title>{data.displayName}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="wrap">
	<article class="card">
		<span class="avatar wa-gradient-brand" aria-hidden="true">{initials}</span>

		<header>
			<h1>{data.displayName}</h1>
			{#if c.jobTitle || c.organization}
				<p class="role">
					{[c.jobTitle, c.organization].filter(Boolean).join(' · ')}
				</p>
			{/if}
		</header>

		<wa-button pill variant="brand" href={`/v/${data.slug}/card.vcf`} download>
			<wa-icon slot="start" name="address-card" variant="solid"></wa-icon>
			Save to contacts
		</wa-button>

		<ul class="details">
			{#if c.phone}
				<li>
					<wa-icon name="phone" variant="solid"></wa-icon>
					<a href={`tel:${c.phone}`}>{c.phone}</a>
				</li>
			{/if}
			{#if c.email}
				<li>
					<wa-icon name="envelope" variant="solid"></wa-icon>
					<a href={`mailto:${c.email}`}>{c.email}</a>
				</li>
			{/if}
			{#if c.website}
				<li>
					<wa-icon name="globe" variant="solid"></wa-icon>
					<a href={websiteHref} target="_blank" rel="noreferrer noopener">{c.website}</a>
				</li>
			{/if}
		</ul>

		{#if c.note}
			<p class="note">{c.note}</p>
		{/if}
	</article>
</main>

<style>
	.wrap {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--wa-space-l) var(--wa-space-m);
		background-color: var(--wa-color-surface-lowered);
		background-image: radial-gradient(
			36rem 36rem at 50% -10%,
			var(--wa-color-brand-fill-quiet),
			transparent 65%
		);
	}

	.card {
		width: 100%;
		max-width: 22rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--wa-space-m);
		padding: var(--wa-space-xl) var(--wa-space-l);
		text-align: center;
		background-color: var(--wa-color-surface-raised);
		border: 1px solid var(--wa-color-surface-border);
		border-radius: var(--wa-border-radius-l);
		box-shadow: var(--wa-shadow-m);
	}

	.avatar {
		display: grid;
		place-items: center;
		width: 4rem;
		height: 4rem;
		border-radius: var(--wa-border-radius-pill);
		color: var(--wa-color-brand-on-loud);
		font-size: var(--wa-font-size-l);
		font-weight: var(--wa-font-weight-bold);
	}

	h1 {
		font-size: var(--wa-font-size-xl);
		margin: 0;
	}

	.role {
		margin: var(--wa-space-2xs) 0 0;
		color: var(--wa-color-text-quiet);
		font-size: var(--wa-font-size-s);
	}

	.details {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-xs);
	}

	.details li {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		padding: var(--wa-space-xs) var(--wa-space-s);
		border-radius: var(--wa-border-radius-m);
		background-color: var(--wa-color-surface-lowered);
		font-size: var(--wa-font-size-s);
		text-align: start;
		min-width: 0;
	}

	.details wa-icon {
		color: var(--wa-color-brand-on-quiet);
		flex-shrink: 0;
	}

	.details a {
		color: var(--wa-color-text-normal);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.details a:hover {
		text-decoration: underline;
	}

	.note {
		margin: 0;
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-text-quiet);
	}
</style>
