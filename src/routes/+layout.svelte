<script lang="ts">
	import '@awesome.me/webawesome/dist/styles/webawesome.css';
	import '@awesome.me/webawesome/dist/styles/themes/default.css';
	import '@awesome.me/webawesome/dist/components/badge/badge.js';
	import '@awesome.me/webawesome/dist/components/button/button.js';
	import '@awesome.me/webawesome/dist/components/callout/callout.js';
	import '@awesome.me/webawesome/dist/components/card/card.js';
	import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
	import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
	import '@awesome.me/webawesome/dist/components/divider/divider.js';
	import '@awesome.me/webawesome/dist/components/icon/icon.js';
	import '@awesome.me/webawesome/dist/components/input/input.js';
	import '@awesome.me/webawesome/dist/components/option/option.js';
	import '@awesome.me/webawesome/dist/components/page/page.js';
	import '@awesome.me/webawesome/dist/components/qr-code/qr-code.js';
	import '@awesome.me/webawesome/dist/components/select/select.js';
	import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
	import '@awesome.me/webawesome/dist/components/switch/switch.js';
	import '@awesome.me/webawesome/dist/components/tag/tag.js';
	import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
	import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
	import '$lib/styles/app.css';

	let { children } = $props();
</script>

{@render children()}
