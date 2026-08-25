<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import type { CodeKind } from '$lib/server/codes/payloads';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally -- seeded once from the failed submission
	let slug = $state(form?.slug ?? '');
	// svelte-ignore state_referenced_locally
	let kind = $state<CodeKind>((form?.kind as CodeKind) ?? 'link');
	// svelte-ignore state_referenced_locally
	let encryption = $state(String(form?.encryption ?? 'WPA'));
	let loading = $state(false);

	const KINDS = [
		{
			id: 'link' as const,
			label: 'Link',
			icon: 'link',
			blurb: 'Point at any URL. Repoint it any time — scans are tracked.'
		},
		{
			id: 'vcard' as const,
			label: 'Contact',
			icon: 'address-card',
			blurb: 'A shareable contact page. Editable after printing, scans are tracked.'
		},
		{
			id: 'wifi' as const,
			label: 'Wi-Fi',
			icon: 'wifi',
			blurb: 'Joins a network on scan. Fixed once printed and not tracked.'
		}
	];

	const shortUrlPreview = $derived(slug ? `${data.config.origin}/${slug}` : '');
	const isStatic = $derived(kind === 'wifi');

	function randomizeSlug() {
		const bytes = crypto.getRandomValues(new Uint8Array(7));
		slug = Array.from(bytes, (b) => (b % 36).toString(36)).join('');
	}

	function onSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
	}

	const val = (k: string) => String(form?.[k as keyof typeof form] ?? '');
</script>

<svelte:head>
	<title>New code — {data.config.appName}</title>
</svelte:head>

<div class="page-header">
	<h1>New code</h1>
</div>

{#if !data.scope}
	<wa-callout variant="warning" open>
		<wa-icon slot="icon" name="triangle-exclamation" variant="solid"></wa-icon>
		Your account isn't part of an organization yet, so you can't create codes.
	</wa-callout>
{:else}
	<wa-card class="form-card">
		<form
			method="post"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="fields">
				{#if form?.message}
					<wa-callout variant="danger" open>
						<wa-icon slot="icon" name="circle-exclamation" variant="solid"></wa-icon>
						{form.message}
					</wa-callout>
				{/if}

				<input type="hidden" name="kind" value={kind} />

				<fieldset class="kinds">
					<legend>Code type</legend>
					<div class="kind-grid">
						{#each KINDS as option (option.id)}
							<button
								type="button"
								class="kind"
								class:selected={kind === option.id}
								aria-pressed={kind === option.id}
								onclick={() => (kind = option.id)}
							>
								<!-- The flex column lives on an inner span: a <button> host does not
								     reliably size to flex children, which overflowed the card. -->
								<span class="kind-inner">
									<wa-icon name={option.icon} variant="solid"></wa-icon>
									<span class="kind-label">{option.label}</span>
									<span class="kind-blurb">{option.blurb}</span>
								</span>
							</button>
						{/each}
					</div>
				</fieldset>

				{#if isStatic}
					<wa-callout variant="neutral" open>
						<wa-icon slot="icon" name="circle-info" variant="solid"></wa-icon>
						A Wi-Fi code stores the network details in the QR itself. That means it
						<strong>can't be changed after printing</strong> and
						<strong>won't record scans</strong> — there's no link for us to redirect or count.
					</wa-callout>
				{/if}

				<div class="slug-field">
					<div class="slug-row">
						<wa-input
							name="slug"
							label="Slug"
							value={slug}
							oninput={onSlugInput}
							required
							style="flex: 1;"
						></wa-input>
						<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
						<wa-button pill type="button" appearance="outlined" onclick={randomizeSlug}>
							<wa-icon slot="start" name="shuffle" variant="solid"></wa-icon>
							Randomize
						</wa-button>
					</div>
					<p class="field-hint">
						{#if isStatic}
							Letters, digits, - or _. Used to identify this code in your dashboard.
						{:else}
							Letters, digits, - or _.
						{/if}
					</p>
				</div>

				{#if shortUrlPreview && !isStatic}
					<p class="url-preview">
						{kind === 'vcard' ? 'Contact page' : 'Short URL'}: <code>{shortUrlPreview}</code>
					</p>
				{/if}

				{#if kind === 'link'}
					<wa-input
						type="url"
						name="destination"
						label="Destination URL"
						placeholder="https://example.com/landing-page"
						value={val('destination')}
						required
					></wa-input>
				{:else if kind === 'wifi'}
					<wa-input
						name="ssid"
						label="Network name (SSID)"
						placeholder="Cafe Guest"
						value={val('ssid')}
						required
					></wa-input>

					<wa-select
						name="encryption"
						label="Security"
						value={encryption}
						onchange={(e: Event) => (encryption = (e.target as HTMLSelectElement).value)}
					>
						<wa-option value="WPA">WPA / WPA2 / WPA3</wa-option>
						<wa-option value="WEP">WEP</wa-option>
						<wa-option value="nopass">Open (no password)</wa-option>
					</wa-select>

					{#if encryption !== 'nopass'}
						<wa-input
							name="password"
							label="Password"
							password-toggle
							type="password"
							value={val('password')}
						></wa-input>
					{/if}

					<label class="checkbox">
						<input type="checkbox" name="hidden" checked={!!form?.hidden} />
						Hidden network (does not broadcast its name)
					</label>
				{:else}
					<div class="pair">
						<wa-input name="firstName" label="First name" value={val('firstName')}></wa-input>
						<wa-input name="lastName" label="Last name" value={val('lastName')}></wa-input>
					</div>
					<div class="pair">
						<wa-input name="organization" label="Organization" value={val('organization')}
						></wa-input>
						<wa-input name="jobTitle" label="Job title" value={val('jobTitle')}></wa-input>
					</div>
					<div class="pair">
						<wa-input type="email" name="email" label="Email" value={val('email')}></wa-input>
						<wa-input type="tel" name="phone" label="Phone" value={val('phone')}></wa-input>
					</div>
					<wa-input name="website" label="Website" placeholder="example.com" value={val('website')}
					></wa-input>
					<wa-input name="note" label="Note (optional)" value={val('note')}></wa-input>
				{/if}

				<wa-input
					name="title"
					label="Label (optional)"
					placeholder="Spring campaign flyer"
					value={val('title')}
				></wa-input>

				<wa-button pill type="submit" variant="brand" {loading}>Create code</wa-button>
			</div>
		</form>
	</wa-card>
{/if}

<style>
	.page-header {
		margin-bottom: var(--wa-space-l);
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.form-card {
		display: block;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}

	.kinds {
		border: none;
		margin: 0;
		padding: 0;
	}

	.kinds legend {
		padding: 0 0 var(--wa-space-xs);
		font-size: var(--wa-font-size-s);
		font-weight: var(--wa-font-weight-semibold);
	}

	.kind-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--wa-space-xs);
	}

	.kind {
		display: block;
		width: 100%;
		/* WebAwesome's native.css gives bare <button> a fixed form-control height,
		   which clipped this multi-line card. */
		height: auto;
		padding: var(--wa-space-s) var(--wa-space-m);
		border: 1px solid var(--wa-color-surface-border);
		border-radius: var(--wa-border-radius-l);
		background-color: var(--wa-color-surface-default);
		/* native.css also sets a filled-control colour (white) on bare buttons. */
		color: var(--wa-color-text-normal);
		text-align: start;
		cursor: pointer;
		transition:
			border-color var(--wa-transition-fast),
			background-color var(--wa-transition-fast);
	}

	.kind-inner {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--wa-space-3xs);
	}

	.kind:hover {
		border-color: var(--wa-color-brand-border-normal);
	}

	.kind.selected {
		background-color: var(--wa-color-brand-fill-quiet);
		border-color: var(--wa-color-brand-border-normal);
		color: var(--wa-color-brand-on-quiet);
	}

	.kind wa-icon {
		color: var(--wa-color-brand-on-quiet);
	}

	.kind-label {
		font-weight: var(--wa-font-weight-semibold);
		font-size: var(--wa-font-size-s);
	}

	.kind-blurb {
		font-size: var(--wa-font-size-2xs);
		color: var(--wa-color-text-quiet);
		white-space: normal;
		line-height: 1.35;
	}

	.slug-field {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-2xs);
	}

	/* The hint lives outside the row so the button's baseline matches the input box,
	   not the input's full height including its hint text. */
	.slug-row {
		display: flex;
		align-items: flex-end;
		gap: var(--wa-space-s);
	}

	.field-hint {
		margin: 0;
		font-size: var(--wa-font-size-xs);
		color: var(--wa-color-text-quiet);
	}

	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: var(--wa-space-m);
	}

	.checkbox {
		display: flex;
		align-items: center;
		gap: var(--wa-space-xs);
		font-size: var(--wa-font-size-s);
	}

	.url-preview {
		margin: 0;
		font-size: 0.85rem;
		color: var(--wa-color-text-quiet);
	}

	.url-preview code {
		color: var(--wa-color-brand-on-quiet);
	}
</style>
