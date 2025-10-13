<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { Mail, MessageSquare, MessageCircle, Activity, CheckCircle } from 'lucide-svelte';

	export let data;
	export let selected = false;
	export let onDelete = () => {};

	function getActionIcon(type: string) {
		switch (type) {
			case 'email': return Mail;
			case 'sms': return MessageSquare;
			case 'dm': return MessageCircle;
			case 'mt5_check': return Activity;
			default: return CheckCircle;
		}
	}

	function getActionColor(type: string) {
		switch (type) {
			case 'email': return 'from-indigo-500 to-indigo-600';
			case 'sms': return 'from-green-500 to-green-600';
			case 'dm': return 'from-blue-500 to-blue-600';
			case 'mt5_check': return 'from-purple-500 to-purple-600';
			default: return 'from-gray-500 to-gray-600';
		}
	}

	function getActionStatus(type: string, templateId: any) {
		if (['email', 'sms', 'dm'].includes(type)) {
			return templateId ? 'Ready' : 'No template';
		}
		return 'Configured';
	}

	$: actionIcon = getActionIcon(data.actionType);
	$: actionColor = getActionColor(data.actionType);
	$: actionStatus = getActionStatus(data.actionType, data.templateId);
	$: isReady = actionStatus === 'Ready' || actionStatus === 'Configured';
</script>

<div
	class="action-node relative w-20 h-12 glass-card border border-blue-400/30 transition-all duration-200 {selected
		? 'border-accent-primary shadow-md ring-2 ring-accent-primary/30'
		: 'hover:border-blue-400 hover:shadow-sm'}"
>
	<!-- Input Handle -->
	<Handle
		type="target"
		position={Position.Left}
		style="background-color: #3b82f6; border: 1px solid white; width: 4px; height: 4px;"
	/>

	<div class="flex flex-col items-center justify-center h-full p-1.5 bg-gradient-to-br {actionColor} text-white rounded-lg">
		<svelte:component this={actionIcon} class="w-3 h-3 mb-0.5" />
		<div class="text-xs font-medium text-center leading-none">
			{data.actionType === 'email' ? 'Email' :
			 data.actionType === 'sms' ? 'SMS' :
			 data.actionType === 'dm' ? 'DM' :
			 data.actionType === 'mt5_check' ? 'MT5' : 'Action'}
		</div>
		<div class="w-1 h-1 rounded-full mt-0.5 {isReady ? 'bg-green-300' : 'bg-yellow-300'}"></div>
	</div>

	<!-- Output Handle -->
	<Handle
		type="source"
		position={Position.Right}
		style="background-color: #3b82f6; border: 1px solid white; width: 4px; height: 4px;"
	/>

	<!-- Action Buttons (show only on selection) -->
	{#if selected}
		<div class="absolute -right-5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
			<button
				class="w-3 h-3 bg-blue-500/90 hover:bg-blue-400 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 shadow-sm hover:scale-110"
				on:click={() => console.log('Add connection from action', data.id)}
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


	<!-- Processing Animation -->
	{#if data.isProcessing}
		<div class="absolute inset-0 bg-blue-500/10 rounded-xl animate-pulse border border-blue-400/30"></div>
	{/if}
</div>

<style>
	.action-node {
		width: 80px;
		height: 48px;
	}

	:global(.action-node .svelte-flow__handle) {
		border-radius: 50%;
		border: 1px solid white;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	:global(.action-node .svelte-flow__handle:hover) {
		background-color: #2563eb !important;
		transform: scale(1.2);
	}
</style>