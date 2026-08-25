<script lang="ts">
	import type { Breakdown } from '$lib/server/ports';

	type Row = { key: string; count: number; label?: string; href?: string };

	let { rows, empty = 'No data yet.' }: { rows: Breakdown | Row[]; empty?: string } = $props();

	const max = $derived(Math.max(1, ...rows.map((r) => r.count)));
	const total = $derived(rows.reduce((sum, r) => sum + r.count, 0));

	const share = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 100));
</script>

{#if rows.length === 0}
	<p class="muted">{empty}</p>
{:else}
	<ul class="rows">
		{#each rows as row (row.key)}
			{@const label = (row as Row).label ?? row.key ?? ''}
			{@const href = (row as Row).href}
			<li>
				<div class="head">
					{#if href}
						<a class="key" {href} title={label}>{label || '(unknown)'}</a>
					{:else}
						<span class="key" title={label}>{label || '(unknown)'}</span>
					{/if}
					<span class="count">
						{row.count.toLocaleString()}
						<span class="share">{share(row.count)}%</span>
					</span>
				</div>
				<div class="track">
					<div class="fill" style={`width: ${(row.count / max) * 100}%;`}></div>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-s);
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--wa-space-s);
		font-size: var(--wa-font-size-s);
		margin-bottom: var(--wa-space-3xs);
	}

	.key {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	a.key {
		color: var(--wa-color-text-normal);
		text-decoration: none;
	}

	a.key:hover {
		color: var(--wa-color-brand-on-quiet);
		text-decoration: underline;
	}

	.count {
		flex-shrink: 0;
		font-variant-numeric: tabular-nums;
		font-weight: var(--wa-font-weight-semibold);
	}

	.share {
		color: var(--wa-color-text-quiet);
		font-weight: var(--wa-font-weight-normal);
		font-size: var(--wa-font-size-xs);
		margin-inline-start: var(--wa-space-2xs);
	}

	.track {
		height: 5px;
		background-color: var(--wa-color-neutral-fill-quiet);
		border-radius: var(--wa-border-radius-pill);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background-color: var(--wa-color-brand-fill-loud);
		border-radius: var(--wa-border-radius-pill);
	}

	.muted {
		margin: 0;
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-text-quiet);
	}
</style>
