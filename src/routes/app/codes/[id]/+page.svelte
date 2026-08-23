<script lang="ts">
	import { enhance } from '$app/forms';
	import QrPreview from '$lib/components/QrPreview.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally -- form state is seeded once from the loaded code
	let active = $state(data.code.active);
	// svelte-ignore state_referenced_locally -- form state is seeded once from the loaded code
	let styleJson = $state(data.code.styleJson ?? '');
	let saving = $state(false);
	let deleting = $state(false);

	const shortUrl = $derived(`${data.origin}/${data.code.slug}`);
</script>

<svelte:head>
	<title>{data.code.title || data.code.slug} — {data.config.appName}</title>
</svelte:head>

<div class="page-header">
	<h1>{data.code.title || data.code.slug}</h1>
	<a class="short-url" href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
	<wa-copy-button value={shortUrl}></wa-copy-button>
</div>

<div class="columns">
	<div class="column">
		<wa-card>
			<h2 slot="header" class="card-title">Details</h2>
			<form
				method="post"
				action="?/update"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						saving = false;
						await update({ reset: false });
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
					{#if form?.updated}
						<wa-callout variant="success" open>
							<wa-icon slot="icon" name="circle-check" variant="solid"></wa-icon>
							Saved.
						</wa-callout>
					{/if}

					<wa-input name="slug" label="Slug" value={data.code.slug} disabled></wa-input>

					<wa-input
						type="url"
						name="destination"
						label="Destination URL"
						value={data.code.destination}
						required
					></wa-input>

					<wa-input name="title" label="Title" value={data.code.title ?? ''}></wa-input>

					<!-- svelte-ignore a11y_label_has_associated_control -- wa-switch is a form control -->
					<label class="switch-row">
						<wa-switch
							checked={active}
							onchange={(e: Event) => {
								active = (e.target as HTMLInputElement).checked;
							}}
						></wa-switch>
						<span>Active — inactive codes stop redirecting</span>
					</label>
					<input type="hidden" name="active" value={active ? 'on' : ''} />
					<input type="hidden" name="styleJson" value={styleJson} />

					<wa-button type="submit" variant="brand" loading={saving}>Save changes</wa-button>
				</div>
			</form>
		</wa-card>

		<wa-card>
			<h2 slot="header" class="card-title">Destination history</h2>
			{#if data.revisions.length === 0}
				<p class="muted">No destination changes yet.</p>
			{:else}
				<ul class="revisions">
					{#each data.revisions as rev (rev.id)}
						<li>
							<span class="rev-destination" title={rev.destination}>{rev.destination}</span>
							<span class="rev-date">until {rev.changedAt.toLocaleDateString()}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</wa-card>

		<wa-card class="danger-zone">
			<h2 slot="header" class="card-title danger">Danger zone</h2>
			<form
				method="post"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm('Delete this code? The short link will stop working immediately.')) {
						cancel();
						return;
					}
					deleting = true;
					return async ({ update }) => {
						deleting = false;
						await update();
					};
				}}
			>
				<div class="danger-row">
					<p class="muted">Deleting a code removes its short link and history permanently.</p>
					<wa-button type="submit" variant="danger" loading={deleting}>
						<wa-icon slot="prefix" name="trash" library="fa" variant="solid"></wa-icon>
						Delete code
					</wa-button>
				</div>
			</form>
		</wa-card>
	</div>

	<div class="column">
		<wa-card>
			<h2 slot="header" class="card-title">QR code</h2>
			<QrPreview
				url={shortUrl}
				styleJson={data.code.styleJson}
				onStyleChange={(json) => (styleJson = json)}
			/>
			<p class="muted" style="margin-bottom: 0;">
				Style changes are saved with the form on the left.
			</p>
		</wa-card>
	</div>
</div>

<style>
	.page-header {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
		margin-bottom: var(--wa-spacing-l);
		flex-wrap: wrap;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.short-url {
		font-size: 0.9rem;
		color: var(--wa-color-primary-600);
		text-decoration: none;
	}

	.short-url:hover {
		text-decoration: underline;
	}

	.columns {
		display: flex;
		gap: var(--wa-spacing-l);
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-l);
		flex: 1;
		min-width: 340px;
	}

	.card-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.card-title.danger {
		color: var(--wa-color-danger-600);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-m);
	}

	.switch-row {
		display: flex;
		align-items: center;
		gap: var(--wa-spacing-s);
		font-size: 0.875rem;
		color: var(--wa-color-neutral-700);
	}

	.muted {
		margin: 0;
		font-size: 0.85rem;
		color: var(--wa-color-neutral-600);
	}

	.revisions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-s);
	}

	.revisions li {
		display: flex;
		justify-content: space-between;
		gap: var(--wa-spacing-m);
		font-size: 0.85rem;
	}

	.rev-destination {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.rev-date {
		color: var(--wa-color-neutral-500);
		flex-shrink: 0;
	}

	.danger-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--wa-spacing-m);
	}
</style>
