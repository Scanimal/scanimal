<script lang="ts">
	import type { LayoutServerData } from '../$types';

	let { data }: { data: LayoutServerData } = $props();
</script>

<svelte:head>
	<title>Dashboard — Scanimal</title>
</svelte:head>

<div class="dashboard">
	<header class="page-header">
		<h1>Welcome back{data.user?.name ? `, ${data.user.name}` : ''}!</h1>
		<p>Manage your QR codes and track scan analytics.</p>
	</header>

	<div class="quick-actions">
		<wa-card class="action-card">
			<div class="action-content">
				<wa-icon name="plus" library="fa" variant="solid" style="font-size: 2rem; color: var(--wa-color-primary-500);"></wa-icon>
				<div>
					<strong>Create a QR code</strong>
					<p>Generate a new static or dynamic QR code with a custom target URL.</p>
				</div>
				<wa-button href="/dashboard/qr/new" variant="brand">
					New QR code
				</wa-button>
			</div>
		</wa-card>

		<wa-card class="action-card">
			<div class="action-content">
				<wa-icon name="chart-simple" library="fa" variant="solid" style="font-size: 2rem; color: var(--wa-color-success-500);"></wa-icon>
				<div>
					<strong>View your codes</strong>
					<p>See all your QR codes, edit targets, and check scan counts.</p>
				</div>
				<wa-button href="/dashboard/qr" variant="default">
					My QR codes
				</wa-button>
			</div>
		</wa-card>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-xl);
		max-width: 900px;
	}

	.page-header h1 {
		margin: 0 0 var(--wa-spacing-xs);
		font-size: 1.75rem;
		font-weight: 700;
	}

	.page-header p {
		margin: 0;
		color: var(--wa-color-neutral-600);
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--wa-spacing-m);
	}

	.action-content {
		display: flex;
		flex-direction: column;
		gap: var(--wa-spacing-m);
	}

	.action-content strong {
		font-size: 1.05rem;
	}

	.action-content p {
		margin: var(--wa-spacing-xs) 0 0;
		font-size: 0.875rem;
		color: var(--wa-color-neutral-600);
	}
</style>
