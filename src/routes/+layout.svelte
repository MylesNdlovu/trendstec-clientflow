<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { theme } from '$lib/stores/theme';
	import { APP_VERSION } from '$lib/version';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		theme.init();
		console.log(`App version: ${APP_VERSION}`);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
