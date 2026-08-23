<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally -- slug is seeded once from the failed submission
	let slug = $state(form?.slug ?? '');
	let loading = $state(false);

	const shortUrlPreview = $derived(slug ? `${data.config.origin}/${slug}` : '');

	function randomizeSlug() {
		const bytes = crypto.getRandomValues(new Uint8Array(7));
		slug = Array.from(bytes, (b) => (b % 36).toString(36)).join('');
	}

	function onSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
	}
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

				<div class="slug-row">
					<wa-input
						name="slug"
						label="Slug"
						hint="Letters, digits, - or _"
						value={slug}
						oninput={onSlugInput}
						required
						style="flex: 1;"
					></wa-input>
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<wa-button type="button" size="small" onclick={randomizeSlug} class="randomize">
						<wa-icon slot="prefix" name="shuffle" library="fa" variant="solid"></wa-icon>
						Randomize
					</wa-button>
				</div>

				{#if shortUrlPreview}
					<p class="url-preview">
						Short URL: <code>{shortUrlPreview}</code>
					</p>
				{/if}

				<wa-input
					type="url"
					name="destination"
					label="Destination URL"
					placeholder="https://example.com/landing-page"
					value={form?.destination ?? ''}
					required
				></wa-input>

				<wa-input
					name="title"
					label="Title (optional)"
					placeholder="Spring campaign flyer"
					value={form?.title ?? ''}
				></wa-input>

				<wa-button type="submit" variant="brand" {loading}>Create code</wa-button>
			</div>
		</form>
	</wa-card>
{/if}

<style>
	.page-header {
		margin-bottom: var(--wa-spacing-l);
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.form-card {
		max-width: 560px;
		display: block;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-m);
	}

	.slug-row {
		display: flex;
		align-items: flex-end;
		gap: var(--wa-spacing-s);
	}

	.url-preview {
		margin: 0;
		font-size: 0.85rem;
		color: var(--wa-color-neutral-600);
	}

	.url-preview code {
		color: var(--wa-color-primary-600);
	}
</style>
