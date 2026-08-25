<script lang="ts">
	import BreakdownList from '$lib/components/BreakdownList.svelte';
	import ScanChart from '$lib/components/ScanChart.svelte';
	import StatTile from '$lib/components/StatTile.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Wi-Fi codes never redirect, so counting them here would overstate what the
	// numbers on this page actually cover.
	const trackable = $derived(data.codes.filter((c) => c.kind !== 'wifi'));
	const activeCodes = $derived(trackable.filter((c) => c.active).length);
	const staticCount = $derived(data.codes.length - trackable.length);

	const peak = $derived(
		data.stats?.series.length ? Math.max(...data.stats.series.map((p) => p.count)) : 0
	);

	const perDay = $derived(
		data.stats && data.days ? Math.round((data.stats.total / data.days) * 10) / 10 : 0
	);
</script>

<svelte:head>
	<title>Analytics — {data.config.appName}</title>
</svelte:head>

<div class="page-head">
	<div>
		<h1>Analytics</h1>
		<p class="page-subtitle">Scan activity across every code in your organization.</p>
	</div>

	<div class="range-picker" role="group" aria-label="Date range">
		{#each data.ranges as range (range.days)}
			<a
				href={`/app/analytics?days=${range.days}`}
				class="range"
				class:active={range.days === data.days}
				aria-current={range.days === data.days ? 'true' : undefined}
			>
				{range.label}
			</a>
		{/each}
	</div>
</div>

{#if !data.configured}
	<wa-callout variant="neutral" open>
		<wa-icon slot="icon" name="circle-info" variant="solid"></wa-icon>
		<strong>Analytics reads are not configured.</strong><br />
		Scans are still being recorded. To view them here, set the
		<code>CF_ANALYTICS_TOKEN</code> secret (a Cloudflare API token with Account Analytics read
		permission) and <code>CLOUDFLARE_ACCOUNT_ID</code> on your deployment.
	</wa-callout>
{:else if data.error}
	<wa-callout variant="danger" open>
		<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
		Failed to load analytics: {data.error}
	</wa-callout>
{:else if data.stats}
	<div class="tiles">
		<StatTile icon="qrcode" label="Total scans" value={data.stats.total} />
		<StatTile icon="chart-simple" label="Average per day" value={perDay} />
		<StatTile icon="arrow-up-right-dots" label="Busiest day" value={peak} />
		<StatTile
			icon="link"
			label="Active codes"
			value={activeCodes}
			hint={staticCount > 0
				? `${trackable.length} tracked · ${staticCount} static`
				: `${trackable.length} total`}
		/>
	</div>

	<wa-card with-header>
		<h2 slot="header" class="card-title">Scans over time</h2>
		<ScanChart series={data.stats.series} />
	</wa-card>

	<div class="panels">
		<wa-card with-header>
			<h2 slot="header" class="card-title">Top codes</h2>
			<BreakdownList rows={data.stats.topCodes} empty="No scans recorded yet." />
		</wa-card>

		<wa-card with-header>
			<h2 slot="header" class="card-title">Countries</h2>
			<BreakdownList rows={data.stats.country} />
		</wa-card>

		<wa-card with-header>
			<h2 slot="header" class="card-title">Devices</h2>
			<BreakdownList rows={data.stats.device} />
		</wa-card>

		<wa-card with-header>
			<h2 slot="header" class="card-title">Referrers</h2>
			<BreakdownList rows={data.stats.referrer} />
		</wa-card>
	</div>
{/if}

<style>
	.range-picker {
		display: flex;
		gap: var(--wa-space-3xs);
		padding: var(--wa-space-3xs);
		border: 1px solid var(--wa-color-surface-border);
		border-radius: var(--wa-border-radius-pill);
		background-color: var(--wa-color-surface-raised);
	}

	.range {
		padding: var(--wa-space-2xs) var(--wa-space-m);
		border-radius: var(--wa-border-radius-pill);
		font-size: var(--wa-font-size-xs);
		font-weight: var(--wa-font-weight-semibold);
		color: var(--wa-color-text-quiet);
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color var(--wa-transition-fast),
			color var(--wa-transition-fast);
	}

	.range:hover {
		color: var(--wa-color-text-normal);
	}

	.range.active {
		background-color: var(--wa-color-brand-fill-quiet);
		color: var(--wa-color-brand-on-quiet);
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: var(--wa-space-s);
	}

	/* Four panels: an auto-fit grid lands on 3+1 at common widths and leaves a hole,
	   so the column count steps explicitly 1 → 2 → 4. */
	.panels {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--wa-space-s);
		align-items: start;
	}

	@media (min-width: 34rem) {
		.panels {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 76rem) {
		.panels {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.card-title {
		margin: 0;
		font-size: var(--wa-font-size-s);
		font-weight: var(--wa-font-weight-semibold);
	}
</style>
