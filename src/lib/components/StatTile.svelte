<script lang="ts">
	let {
		label,
		value,
		hint,
		icon
	}: { label: string; value: string | number; hint?: string; icon?: string } = $props();
</script>

<div class="tile">
	{#if icon}
		<span class="icon" aria-hidden="true"><wa-icon name={icon} variant="solid"></wa-icon></span>
	{/if}
	<span class="value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
	<span class="label">{label}</span>
	{#if hint}<span class="hint">{hint}</span>{/if}
</div>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-3xs);
		padding: var(--wa-space-m);
		border: 1px solid var(--wa-color-surface-border);
		border-radius: var(--wa-border-radius-l);
		background-color: var(--wa-color-surface-raised);
	}

	.icon {
		color: var(--wa-color-brand-on-quiet);
		font-size: var(--wa-font-size-s);
		margin-bottom: var(--wa-space-2xs);
	}

	.value {
		font-size: var(--wa-font-size-2xl);
		font-weight: var(--wa-font-weight-bold);
		line-height: 1;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}

	.label {
		font-size: var(--wa-font-size-s);
		color: var(--wa-color-text-quiet);
	}

	.hint {
		font-size: var(--wa-font-size-2xs);
		color: var(--wa-color-text-quiet);
	}
</style>
