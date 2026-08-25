<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, untrack } from 'svelte';
	import type QRCodeStyling from 'qr-code-styling';
	import type { Options } from 'qr-code-styling';

	type DotShape = 'square' | 'dots' | 'rounded' | 'classy';
	type CornerShape = 'square' | 'extra-rounded' | 'dot';

	let {
		url,
		styleJson = null,
		onStyleChange
	}: {
		url: string;
		styleJson?: string | null;
		onStyleChange?: (json: string) => void;
	} = $props();

	const parseStyle = (json: string | null): Partial<Options> => {
		if (!json) return {};
		try {
			return JSON.parse(json) as Partial<Options>;
		} catch {
			return {};
		}
	};
	// svelte-ignore state_referenced_locally -- initial style only; live edits happen via controls
	const initial = parseStyle(styleJson);

	let dotColor = $state(initial.dotsOptions?.color ?? '#000000');
	let dotType = $state<DotShape>((initial.dotsOptions?.type as DotShape) ?? 'square');
	let bgColor = $state(initial.backgroundOptions?.color ?? '#ffffff');
	let cornerType = $state<CornerShape>(
		(initial.cornersSquareOptions?.type as CornerShape) ?? 'square'
	);
	let logoUrl = $state(initial.image ?? '');

	let container = $state<HTMLDivElement>();
	let qr: QRCodeStyling | undefined = $state();

	const styleOptions = $derived({
		dotsOptions: { color: dotColor, type: dotType },
		backgroundOptions: { color: bgColor },
		cornersSquareOptions: { type: cornerType },
		...(logoUrl
			? { image: logoUrl, imageOptions: { crossOrigin: 'anonymous' as const, margin: 4 } }
			: {})
	});

	const fullOptions = $derived({
		width: 300,
		height: 300,
		data: url,
		...styleOptions
	} as Partial<Options>);

	onMount(() => {
		if (!browser) return;
		let cancelled = false;
		(async () => {
			const { default: QRCodeStylingCtor } = await import('qr-code-styling');
			if (cancelled || !container) return;
			const instance = new QRCodeStylingCtor(untrack(() => fullOptions));
			instance.append(container);
			qr = instance;
		})();
		return () => {
			cancelled = true;
		};
	});

	// Re-render when the URL or any style knob changes.
	$effect(() => {
		const opts = fullOptions;
		qr?.update(opts);
	});

	function emitChange() {
		onStyleChange?.(JSON.stringify(styleOptions));
	}

	function selectValue(e: Event): string {
		return (e.target as HTMLSelectElement).value;
	}

	function download(extension: 'png' | 'svg') {
		qr?.download({ extension, name: 'qr-code' });
	}
</script>

<div class="qr-preview">
	<div class="canvas" bind:this={container}>
		{#if !qr}
			<wa-spinner style="font-size: 2rem;"></wa-spinner>
		{/if}
	</div>

	<div class="controls">
		<label class="color-field">
			<span>Dot color</span>
			<input
				type="color"
				value={dotColor}
				oninput={(e) => {
					dotColor = (e.target as HTMLInputElement).value;
					emitChange();
				}}
			/>
		</label>

		<label class="color-field">
			<span>Background</span>
			<input
				type="color"
				value={bgColor}
				oninput={(e) => {
					bgColor = (e.target as HTMLInputElement).value;
					emitChange();
				}}
			/>
		</label>

		<wa-select
			label="Dot shape"
			value={dotType}
			onchange={(e: Event) => {
				dotType = selectValue(e) as DotShape;
				emitChange();
			}}
		>
			<wa-option value="square">Square</wa-option>
			<wa-option value="dots">Dots</wa-option>
			<wa-option value="rounded">Rounded</wa-option>
			<wa-option value="classy">Classy</wa-option>
		</wa-select>

		<wa-select
			label="Corner shape"
			value={cornerType}
			onchange={(e: Event) => {
				cornerType = selectValue(e) as CornerShape;
				emitChange();
			}}
		>
			<wa-option value="square">Square</wa-option>
			<wa-option value="extra-rounded">Extra rounded</wa-option>
			<wa-option value="dot">Dot</wa-option>
		</wa-select>

		<wa-input
			label="Logo URL (optional)"
			placeholder="https://example.com/logo.png"
			value={logoUrl}
			oninput={(e: Event) => {
				logoUrl = (e.target as HTMLInputElement).value.trim();
				emitChange();
			}}
		></wa-input>

		<div class="downloads">
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<wa-button pill size="small" onclick={() => download('png')} disabled={!qr}>
				<wa-icon slot="start" name="download" variant="solid"></wa-icon>
				PNG
			</wa-button>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<wa-button pill size="small" onclick={() => download('svg')} disabled={!qr}>
				<wa-icon slot="start" name="download" variant="solid"></wa-icon>
				SVG
			</wa-button>
		</div>
	</div>
</div>

<style>
	.qr-preview {
		display: flex;
		gap: var(--wa-space-l);
		flex-wrap: wrap;
	}

	.canvas {
		width: min(260px, 100%);
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--wa-color-surface-border);
		border-radius: var(--wa-border-radius-m);
		background: var(--wa-color-surface-default);
		flex-shrink: 0;
		padding: var(--wa-space-s);
	}

	/* The QR library injects its own canvas/svg at a fixed size — let it scale down. */
	.canvas :global(canvas),
	.canvas :global(svg) {
		max-width: 100%;
		max-height: 100%;
		height: auto;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
		min-width: 220px;
		flex: 1;
	}

	.color-field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--wa-space-s);
		font-size: 0.875rem;
		color: var(--wa-color-text-normal);
	}

	.color-field input[type='color'] {
		width: 48px;
		height: 32px;
		padding: 0;
		border: 1px solid var(--wa-color-surface-border);
		border-radius: var(--wa-border-radius-s);
		background: none;
		cursor: pointer;
	}

	.downloads {
		display: flex;
		gap: var(--wa-space-s);
	}
</style>
