<script lang="ts">
	import { theme } from '$lib/stores/theme';

	export let icon: any;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'primary' | 'secondary' = 'primary';

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6'
	};

	$: color = variant === 'primary' ? $theme.primary : $theme.secondary;
</script>

<svelte:component this={icon} class={sizeClasses[size]} style="color: {color}" />
