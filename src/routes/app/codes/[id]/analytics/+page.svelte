<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const seriesMax = $derived(
		data.stats ? Math.max(1, ...data.stats.series.map((p) => p.count)) : 1
	);

	const dayLabel = (t: number) =>
		new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

	const breakdownMax = (rows: { key: string; count: number }[]) =>
		Math.max(1, ...rows.map((r) => r.count));
</script>

<svelte:head>
	<title>Analytics — {data.code.title || data.code.slug} — {data.config.appName}</title>
</svelte:head>

<div class="page-header">
	<h1>Analytics</h1>
	<span class="subtitle">{data.code.title || data.code.slug} · last 30 days</span>
	<wa-button size="small" href={`/app/codes/${data.code.id}`}>
		<wa-icon slot="prefix" name="pen" library="fa" variant="solid"></wa-icon>
		Edit code
	</wa-button>
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
	<div class="stats-grid">
		<wa-card class="stat-card">
			<div class="stat">
				<span class="stat-value">{data.stats.total}</span>
				<span class="stat-label">Total scans</span>
			</div>
		</wa-card>

		<wa-card class="chart-card">
			<h2 slot="header" class="card-title">Scans over time</h2>
			{#if data.stats.series.length === 0}
				<p class="muted">No scans in this period.</p>
			{:else}
				<div class="bar-chart">
					{#each data.stats.series as point (point.t)}
						<div class="bar-col" title={`${dayLabel(point.t)}: ${point.count}`}>
							<span class="bar-count">{point.count}</span>
							<div class="bar" style={`height: ${(point.count / seriesMax) * 100}%;`}></div>
							<span class="bar-label">{dayLabel(point.t)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</wa-card>
	</div>

	<div class="breakdowns">
		{#each [{ title: 'Countries', rows: data.stats.country }, { title: 'Devices', rows: data.stats.device }, { title: 'Referrers', rows: data.stats.referrer }] as group (group.title)}
			<wa-card class="breakdown-card">
				<h2 slot="header" class="card-title">{group.title}</h2>
				{#if group.rows.length === 0}
					<p class="muted">No data.</p>
				{:else}
					<ul class="breakdown-rows">
						{#each group.rows as row (row.key)}
							<li>
								<div class="row-header">
									<span class="row-key" title={row.key}>{row.key || '(unknown)'}</span>
									<span class="row-count">{row.count}</span>
								</div>
								<div class="row-bar-track">
									<div
										class="row-bar"
										style={`width: ${(row.count / breakdownMax(group.rows)) * 100}%;`}
									></div>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</wa-card>
		{/each}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-m);
		margin-bottom: var(--wa-spacing-l);
		flex-wrap: wrap;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.subtitle {
		color: var(--wa-color-neutral-600);
		font-size: 0.9rem;
		flex: 1;
	}

	.card-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.muted {
		margin: 0;
		font-size: 0.85rem;
		color: var(--wa-color-neutral-600);
	}

	.stats-grid {
		display: flex;
		gap: var(--wa-spacing-l);
		margin-bottom: var(--wa-spacing-l);
		align-items: stretch;
		flex-wrap: wrap;
	}

	.stat-card {
		flex-shrink: 0;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-xs);
		padding: var(--wa-spacing-m);
		min-width: 140px;
	}

	.stat-value {
		font-size: 2.25rem;
		font-weight: 700;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--wa-color-neutral-600);
	}

	.chart-card {
		flex: 1;
		min-width: 320px;
	}

	.bar-chart {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 160px;
		overflow-x: auto;
	}

	.bar-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		flex: 1;
		min-width: 24px;
		height: 100%;
		gap: 2px;
	}

	.bar-count {
		font-size: 0.65rem;
		color: var(--wa-color-neutral-500);
	}

	.bar {
		width: 100%;
		min-height: 2px;
		background: var(--wa-color-primary-500, var(--wa-color-primary-600));
		border-radius: 2px 2px 0 0;
	}

	.bar-label {
		font-size: 0.6rem;
		color: var(--wa-color-neutral-500);
		white-space: nowrap;
	}

	.breakdowns {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--wa-spacing-l);
	}

	.breakdown-rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-s);
	}

	.row-header {
		display: flex;
		justify-content: space-between;
		gap: var(--wa-spacing-s);
		font-size: 0.85rem;
		margin-bottom: 2px;
	}

	.row-key {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.row-count {
		color: var(--wa-color-neutral-600);
		flex-shrink: 0;
	}

	.row-bar-track {
		height: 6px;
		background: var(--wa-color-neutral-100);
		border-radius: 3px;
		overflow: hidden;
	}

	.row-bar {
		height: 100%;
		background: var(--wa-color-primary-500, var(--wa-color-primary-600));
		border-radius: 3px;
	}
</style>
