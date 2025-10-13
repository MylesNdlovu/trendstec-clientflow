<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { Clock, Timer } from 'lucide-svelte';

	export let data;
	export let selected = false;
	export let onDelete = () => {};

	function formatDuration(duration: number, unit: string) {
		if (duration === 1) {
			return `${duration} ${unit.slice(0, -1)}`; // Remove 's' for singular
		}
		return `${duration} ${unit}`;
	}

	function getDurationInMinutes(duration: number, unit: string) {
		const multipliers = {
			minutes: 1,
			hours: 60,
			days: 24 * 60,
			weeks: 7 * 24 * 60
		};
		return duration * (multipliers[unit] || 1);
	}

	$: formattedDuration = formatDuration(data.duration || 1, data.unit || 'hours');
	$: totalMinutes = getDurationInMinutes(data.duration || 1, data.unit || 'hours');
	$: isLongDelay = totalMinutes > 60; // More than 1 hour
</script>

<div
	class="delay-node relative w-20 h-12 glass-card border border-orange-400/30 transition-all duration-200 {selected
		? 'border-accent-primary shadow-md ring-2 ring-accent-primary/30'
		: 'hover:border-orange-400 hover:shadow-sm'}"
>
	<!-- Input Handle -->
	<Handle
		type="target"
		position={Position.Left}
		style="background-color: #f97316; border: 1px solid white; width: 6px; height: 6px;"
	/>

	<div class="flex flex-col items-center justify-center h-full p-1.5 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg">
		{#if isLongDelay}
			<Timer class="w-3 h-3 mb-0.5" />
		{:else}
			<Clock class="w-3 h-3 mb-0.5" />
		{/if}
		<div class="text-xs font-medium text-center leading-none">
			{formattedDuration}
		</div>
	</div>

	<!-- Output Handle -->
	<Handle
		type="source"
		position={Position.Right}
		style="background-color: #f97316; border: 1px solid white; width: 6px; height: 6px;"
	/>

	<!-- Action Buttons (show only on selection) -->
	{#if selected}
		<div class="absolute -right-5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
			<button
				class="w-3 h-3 bg-orange-500/90 hover:bg-orange-400 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 shadow-sm hover:scale-110"
				on:click={() => console.log('Add connection from delay', data.id)}
				title="Add connection"
			>
				+
			</button>
			<button
				class="w-3 h-3 bg-red-500/90 hover:bg-red-400 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 shadow-sm hover:scale-110"
				on:click={() => onDelete(data.id)}
				title="Delete node"
			>
				×
			</button>
		</div>
	{/if}



	<!-- Waiting Animation -->
	{#if data.isWaiting}
		<div class="absolute inset-0 bg-orange-500/10 rounded-xl animate-pulse border border-orange-400/30"></div>
	{/if}
</div>

<style>
	.delay-node {
		width: 80px;
		height: 48px;
	}

	:global(.delay-node .svelte-flow__handle) {
		border-radius: 50%;
		border: 1px solid white;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	:global(.delay-node .svelte-flow__handle:hover) {
		background-color: #ea580c !important;
		transform: scale(1.2);
	}
</style>