<script lang="ts">
	import type { TimeSeries } from '$lib/server/ports';

	let { series, height = 180 }: { series: TimeSeries; height?: number } = $props();

	const max = $derived(Math.max(1, ...series.map((p) => p.count)));

	const dayLabel = (t: number) =>
		new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

	// Only label every nth column so a 30-day range doesn't turn into a smear.
	const labelEvery = $derived(Math.max(1, Math.ceil(series.length / 10)));
</script>

{#if series.length === 0}
	<p class="muted">No scans in this period.</p>
{:else}
	<div class="chart" style={`--chart-height: ${height}px;`}>
		{#each series as point, i (point.t)}
			<div class="col" title={`${dayLabel(point.t)}: ${point.count}`}>
				<div class="track">
					<div class="bar" style={`height: ${(point.count / max) * 100}%;`}></div>
				</div>
				{#if i % labelEvery === 0}
					<span class="label">{dayLabel(point.t)}</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.chart {
		display: flex;
		align-items: flex-end;
		gap: 3px;
		height: var(--chart-height);
	}

	.col {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		flex: 1;
		min-width: 0;
		height: 100%;
		gap: var(--wa-space-2xs);
		/* Labels are wider than their column — let them spill instead of clipping. */
		position: relative;
		padding-bottom: 1.25em;
	}

	.track {
		flex: 1;
		display: flex;
		align-items: flex-end;
	}

	.bar {
		width: 100%;
		min-height: 2px;
		background-color: var(--wa-color-brand-fill-loud);
		border-radius: var(--wa-border-radius-s) var(--wa-border-radius-s) 0 0;
		transition: background-color var(--wa-transition-fast);
	}

	.col:hover .bar {
		background-color: var(--wa-color-brand-on-quiet);
	}

	.label {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		font-size: var(--wa-font-size-2xs);
		color: var(--wa-color-text-quiet);
		white-space: nowrap;
	}

	.muted {
		margin: 0;
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-text-quiet);
	}
</style>
