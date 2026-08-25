<script lang="ts">
	import { ACCENTS, theme, type Accent } from '$lib/theme.svelte';
</script>

<div class="appearance">
	<fieldset class="group">
		<legend>Accent colour</legend>
		<div class="swatches">
			{#each ACCENTS as option (option.id)}
				<button
					type="button"
					class="swatch"
					class:selected={theme.accent === option.id}
					data-accent={option.id}
					aria-pressed={theme.accent === option.id}
					title={option.label}
					onclick={() => theme.setAccent(option.id as Accent)}
				>
					<span class="visually-hidden">{option.label}</span>
				</button>
			{/each}
		</div>
		<p class="hint">Applies across buttons, links, charts and highlights.</p>
	</fieldset>

	<fieldset class="group">
		<legend>Theme</legend>
		<div class="modes">
			<button
				type="button"
				class="mode"
				class:selected={!theme.isDark}
				aria-pressed={!theme.isDark}
				onclick={() => theme.setScheme('light')}
			>
				<wa-icon name="sun" variant="solid"></wa-icon>
				Light
			</button>
			<button
				type="button"
				class="mode"
				class:selected={theme.isDark}
				aria-pressed={theme.isDark}
				onclick={() => theme.setScheme('dark')}
			>
				<wa-icon name="moon" variant="solid"></wa-icon>
				Dark
			</button>
		</div>
	</fieldset>
</div>

<style>
	.appearance {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-l);
	}

	.group {
		border: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-xs);
	}

	legend {
		padding: 0;
		font-size: var(--wa-font-size-s);
		font-weight: var(--wa-font-weight-semibold);
	}

	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: var(--wa-space-xs);
	}

	/*
	 * Each swatch previews its own hue, so it sets the brand class on itself and
	 * paints from --wa-color-brand-fill-loud — the same token the buttons use.
	 */
	.swatch {
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: 1px solid color-mix(in oklab, black 12%, transparent);
		border-radius: var(--wa-border-radius-pill);
		cursor: pointer;
		background-image: linear-gradient(
			to bottom right,
			color-mix(in oklab, white 18%, var(--swatch)),
			var(--swatch) 55%,
			color-mix(in oklab, black 14%, var(--swatch))
		);
		transition:
			transform var(--wa-transition-fast),
			box-shadow var(--wa-transition-fast);
	}

	.swatch:hover {
		transform: scale(1.08);
	}

	.swatch.selected {
		box-shadow:
			0 0 0 2px var(--wa-color-surface-raised),
			0 0 0 4px var(--swatch);
	}

	.swatch[data-accent='purple'] {
		--swatch: var(--wa-color-purple-50);
	}
	.swatch[data-accent='indigo'] {
		--swatch: var(--wa-color-indigo-50);
	}
	.swatch[data-accent='blue'] {
		--swatch: var(--wa-color-blue-50);
	}
	.swatch[data-accent='cyan'] {
		--swatch: var(--wa-color-cyan-50);
	}
	.swatch[data-accent='green'] {
		--swatch: var(--wa-color-green-50);
	}
	.swatch[data-accent='yellow'] {
		--swatch: var(--wa-color-yellow-50);
	}
	.swatch[data-accent='orange'] {
		--swatch: var(--wa-color-orange-50);
	}
	.swatch[data-accent='red'] {
		--swatch: var(--wa-color-red-50);
	}
	.swatch[data-accent='pink'] {
		--swatch: var(--wa-color-pink-50);
	}
	.swatch[data-accent='gray'] {
		--swatch: var(--wa-color-gray-50);
	}

	.hint {
		margin: 0;
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-text-quiet);
	}

	.modes {
		display: flex;
		gap: var(--wa-space-xs);
	}

	.mode {
		display: flex;
		align-items: center;
		gap: var(--wa-space-2xs);
		padding: var(--wa-space-2xs) var(--wa-space-m);
		border: 1px solid var(--wa-color-surface-border);
		border-radius: var(--wa-border-radius-pill);
		background-color: var(--wa-color-surface-default);
		color: var(--wa-color-text-quiet);
		font-size: var(--wa-font-size-s);
		font-weight: var(--wa-font-weight-semibold);
		cursor: pointer;
		transition:
			background-color var(--wa-transition-fast),
			color var(--wa-transition-fast),
			border-color var(--wa-transition-fast);
	}

	.mode:hover {
		color: var(--wa-color-text-normal);
	}

	.mode.selected {
		background-color: var(--wa-color-brand-fill-quiet);
		border-color: var(--wa-color-brand-border-normal);
		color: var(--wa-color-brand-on-quiet);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
