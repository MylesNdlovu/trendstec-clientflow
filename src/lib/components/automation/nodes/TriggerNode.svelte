<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { Plus, Mail, MousePointer, Activity, Clock } from 'lucide-svelte';

	export let data;
	export let selected = false;
	export let onDelete = () => {};

	function getTriggerIcon(type: string) {
		switch (type) {
			case 'form_submission': return Plus;
			case 'email_opened': return Mail;
			case 'link_clicked': return MousePointer;
			case 'mt5_activity': return Activity;
			case 'no_response': return Clock;
			default: return Plus;
		}
	}

	function getTriggerColor(type: string) {
		switch (type) {
			case 'form_submission': return 'from-green-500 to-green-600';
			case 'email_opened': return 'from-blue-500 to-blue-600';
			case 'link_clicked': return 'from-purple-500 to-purple-600';
			case 'mt5_activity': return 'from-orange-500 to-orange-600';
			case 'no_response': return 'from-red-500 to-red-600';
			default: return 'from-gray-500 to-gray-600';
		}
	}

	$: triggerIcon = getTriggerIcon(data.triggerType);
	$: triggerColor = getTriggerColor(data.triggerType);
</script>

<div
	class="trigger-node relative w-20 h-12 glass-card border border-green-400/30 transition-all duration-200 {selected
		? 'border-accent-primary shadow-md ring-2 ring-accent-primary/30'
		: 'hover:border-green-400 hover:shadow-sm'}"
>
	<div class="flex flex-col items-center justify-center h-full p-1.5 bg-gradient-to-br {triggerColor} text-white rounded-lg">
		<svelte:component this={triggerIcon} class="w-3 h-3 mb-0.5" />
		<div class="text-xs font-medium text-center leading-none">
			{data.triggerType === 'form_submission' ? 'Form' :
			 data.triggerType === 'email_opened' ? 'Email' :
			 data.triggerType === 'link_clicked' ? 'Click' : 'Start'}
		</div>
	</div>

	<!-- Output Handle -->
	<Handle
		type="source"
		position={Position.Right}
		style="background-color: #10b981; border: 1px solid white; width: 4px; height: 4px;"
	/>

	<!-- Action Buttons (show only on hover or selection) -->
	{#if selected}
		<div class="absolute -right-5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
			<button
				class="w-3 h-3 bg-green-500/90 hover:bg-green-400 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 shadow-sm hover:scale-110"
				on:click={() => console.log('Add connection from trigger', data.id)}
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

</div>

<style>
	.trigger-node {
		width: 80px;
		height: 48px;
	}

	:global(.trigger-node .svelte-flow__handle) {
		border-radius: 50%;
		border: 1px solid white;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	:global(.trigger-node .svelte-flow__handle:hover) {
		background-color: #059669 !important;
		transform: scale(1.2);
	}
</style>