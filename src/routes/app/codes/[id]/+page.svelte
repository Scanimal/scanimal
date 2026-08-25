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
	// svelte-ignore state_referenced_locally -- seeded once from the loaded code
	let encryption = $state<string>(data.wifi?.encryption ?? 'WPA');

	const shortUrl = $derived(`${data.origin}/${data.code.slug}`);

	/**
	 * Static kinds encode their payload directly, so the QR carries the stored
	 * destination rather than the short link.
	 */
	const qrValue = $derived(data.isStatic ? data.code.destination : shortUrl);
</script>

<svelte:head>
	<title>{data.code.title || data.code.slug} — {data.config.appName}</title>
</svelte:head>

<div class="page-header">
	<h1>{data.code.title || data.code.slug}</h1>
	{#if data.kind === 'wifi'}
		<wa-tag variant="neutral" size="small" appearance="outlined">Wi-Fi · static</wa-tag>
	{:else}
		{#if data.kind === 'vcard'}
			<wa-tag variant="brand" size="small" appearance="outlined">Contact</wa-tag>
		{/if}
		<a class="short-url" href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
		<wa-copy-button value={shortUrl}></wa-copy-button>
	{/if}
</div>

{#if data.isStatic}
	<wa-callout variant="neutral" open>
		<wa-icon slot="icon" name="circle-info" variant="solid"></wa-icon>
		This code stores its data in the QR itself, so
		<strong>already-printed codes keep the old details</strong>
		and <strong>no scans are recorded</strong>. Editing here changes the image you download, not
		codes already in the wild.
	</wa-callout>
{/if}

<div class="columns">
	<div class="column">
		<wa-card with-header>
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

					{#if data.kind === 'link'}
						<wa-input
							type="url"
							name="destination"
							label="Destination URL"
							value={data.code.destination}
							required
						></wa-input>
					{:else if data.kind === 'wifi' && data.wifi}
						<wa-input name="ssid" label="Network name (SSID)" value={data.wifi.ssid} required
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
								type="password"
								password-toggle
								value={data.wifi.password}
							></wa-input>
						{/if}

						<label class="checkbox">
							<input type="checkbox" name="hidden" checked={data.wifi.hidden} />
							Hidden network (does not broadcast its name)
						</label>
					{:else if data.contact}
						<div class="pair">
							<wa-input name="firstName" label="First name" value={data.contact.firstName}
							></wa-input>
							<wa-input name="lastName" label="Last name" value={data.contact.lastName}></wa-input>
						</div>
						<div class="pair">
							<wa-input name="organization" label="Organization" value={data.contact.organization}
							></wa-input>
							<wa-input name="jobTitle" label="Job title" value={data.contact.jobTitle}></wa-input>
						</div>
						<div class="pair">
							<wa-input type="email" name="email" label="Email" value={data.contact.email}
							></wa-input>
							<wa-input type="tel" name="phone" label="Phone" value={data.contact.phone}></wa-input>
						</div>
						<wa-input name="website" label="Website" value={data.contact.website}></wa-input>
						<wa-input name="note" label="Note (optional)" value={data.contact.note}></wa-input>
					{/if}

					<wa-input name="title" label="Title" value={data.code.title ?? ''}></wa-input>

					<!-- svelte-ignore a11y_label_has_associated_control -- wa-switch is a form control -->
					<label class="switch-row">
						<wa-switch
							checked={active}
							onchange={(e: Event) => {
								active = (e.target as HTMLInputElement).checked;
							}}
						></wa-switch>
						<span>
							{data.isStatic
								? 'Active — inactive codes are hidden from your dashboard'
								: 'Active — inactive codes stop redirecting'}
						</span>
					</label>
					<input type="hidden" name="active" value={active ? 'on' : ''} />
					<input type="hidden" name="styleJson" value={styleJson} />

					<wa-button pill type="submit" variant="brand" loading={saving}>Save changes</wa-button>
				</div>
			</form>
		</wa-card>

		{#if !data.isStatic}
			<wa-card with-header>
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
		{/if}

		<wa-card class="danger-zone" with-header>
			<h2 slot="header" class="card-title danger">Danger zone</h2>
			<form
				method="post"
				action="?/delete"
				use:enhance={({ cancel }) => {
					const warning = data.isStatic
						? 'Delete this code? Codes already printed will keep working — this only removes it from your dashboard.'
						: 'Delete this code? The short link will stop working immediately.';
					if (!confirm(warning)) {
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
					<p class="muted">
						{#if data.isStatic}
							Removes this code from your dashboard. Codes already printed keep working — their data
							lives in the QR, not here.
						{:else}
							Deleting a code removes its short link and history permanently.
						{/if}
					</p>
					<wa-button pill type="submit" variant="danger" loading={deleting}>
						<wa-icon slot="start" name="trash" variant="solid"></wa-icon>
						Delete code
					</wa-button>
				</div>
			</form>
		</wa-card>
	</div>

	<div class="column">
		<wa-card with-header>
			<h2 slot="header" class="card-title">QR code</h2>
			<QrPreview
				url={qrValue}
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
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--wa-space-m);
	}

	.checkbox {
		display: flex;
		align-items: center;
		gap: var(--wa-space-xs);
		font-size: var(--wa-font-size-s);
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		margin-bottom: var(--wa-space-l);
		flex-wrap: wrap;
	}

	.page-header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.short-url {
		font-size: 0.9rem;
		color: var(--wa-color-brand-on-quiet);
		text-decoration: none;
	}

	.short-url:hover {
		text-decoration: underline;
	}

	.columns {
		display: flex;
		gap: var(--wa-space-l);
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-l);
		flex: 1;
		min-width: 340px;
	}

	.card-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.card-title.danger {
		color: var(--wa-color-danger-on-quiet);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-m);
	}

	.switch-row {
		display: flex;
		align-items: center;
		gap: var(--wa-space-s);
		font-size: 0.875rem;
		color: var(--wa-color-text-normal);
	}

	.muted {
		margin: 0;
		font-size: 0.85rem;
		color: var(--wa-color-text-quiet);
	}

	.revisions {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--wa-space-s);
	}

	.revisions li {
		display: flex;
		justify-content: space-between;
		gap: var(--wa-space-m);
		font-size: 0.85rem;
	}

	.rev-destination {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.rev-date {
		color: var(--wa-color-text-quiet);
		flex-shrink: 0;
	}

	.danger-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--wa-space-m);
	}
</style>
