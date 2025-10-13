<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { Sun, Moon } from 'lucide-svelte';

	$: isDark = $theme === 'dark';
</script>

<button
	on:click={theme.toggle}
	class="theme-toggle {isDark ? 'dark' : ''}"
	aria-label="Toggle theme"
>
	<span
		class="theme-toggle-button {isDark ? 'translate-x-5' : 'translate-x-1'}"
	>
		{#if isDark}
			<Moon class="w-3 h-3 text-indigo-400" />
		{:else}
			<Sun class="w-3 h-3 text-amber-500" />
		{/if}
	</span>
</button>

<style>
	button {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.theme-toggle-button {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
</style>