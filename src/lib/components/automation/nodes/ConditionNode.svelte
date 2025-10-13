<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import { GitBranch, Check, X } from 'lucide-svelte';

	export let data;
	export let selected = false;
	export let onDelete = () => {};

	function getConditionDisplay(field: string, operator: string, value: any) {
		const fieldNames = {
			email_opened: 'Email Opened',
			link_clicked: 'Link Clicked',
			mt5_verified: 'MT5 Verified',
			form_submitted: 'Form Submitted',
			deposit_amount: 'Deposit Amount',
			trade_count: 'Trade Count'
		};

		const operatorSymbols = {
			equals: '=',
			not_equals: '≠',
			greater_than: '>',
			less_than: '<',
			contains: '⊃',
			not_contains: '⊅'
		};

		const fieldName = fieldNames[field] || field;
		const operatorSymbol = operatorSymbols[operator] || operator;

		return `${fieldName} ${operatorSymbol} ${value}`;
	}

	$: conditionDisplay = getConditionDisplay(data.field, data.operator, data.value);
	$: isConfigured = data.field && data.operator && data.value !== undefined;
</script>

<div
	class="condition-node relative w-24 h-16 glass-card border border-yellow-400/30 transition-all duration-200 {selected
		? 'border-accent-primary shadow-md ring-2 ring-accent-primary/30'
		: 'hover:border-yellow-400 hover:shadow-sm'}"
>
	<!-- Input Handle -->
	<Handle
		type="target"
		position={Position.Left}
		style="background-color: #f59e0b; border: 1px solid white; width: 6px; height: 6px;"
	/>

	<!-- Main Content -->
	<div class="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-lg relative">
		<GitBranch class="w-4 h-4 mb-0.5" />
		<div class="text-xs font-bold text-center leading-tight">
			IF
		</div>
		<div class="w-1 h-1 rounded-full mt-0.5 {isConfigured ? 'bg-green-300' : 'bg-yellow-300'}"></div>

		<!-- Integrated Branch Labels -->
		<div class="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-sm font-bold shadow-sm">
			Y
		</div>
		<div class="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-sm font-bold shadow-sm">
			N
		</div>
	</div>

	<!-- Output Handles for True/False - Better positioned -->
	<Handle
		type="source"
		position={Position.Right}
		id="condition-yes"
		style="background-color: #10b981; border: 1px solid white; width: 8px; height: 8px; top: 25%;"
	/>
	<Handle
		type="source"
		position={Position.Right}
		id="condition-no"
		style="background-color: #ef4444; border: 1px solid white; width: 8px; height: 8px; top: 75%;"
	/>

	<!-- Action Buttons (show only on selection) -->
	{#if selected}
		<div class="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
			<button
				class="w-4 h-4 bg-green-500/90 hover:bg-green-400 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 shadow-sm hover:scale-110"
				on:click={() => console.log('Add YES connection', data.id)}
				title="Add YES path"
			>
				✓
			</button>
			<button
				class="w-4 h-4 bg-red-500/90 hover:bg-red-400 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 shadow-sm hover:scale-110"
				on:click={() => onDelete(data.id)}
				title="Delete node"
			>
				×
			</button>
		</div>
	{/if}

	<!-- Branch Labels with Better Positioning -->
	<div class="absolute -top-5 right-0 text-xs text-green-500 font-bold bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
		YES
	</div>
	<div class="absolute -bottom-5 right-0 text-xs text-red-500 font-bold bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
		NO
	</div>

	<!-- Evaluation Animation -->
	{#if data.isEvaluating}
		<div class="absolute inset-0 bg-yellow-500/10 rounded-lg animate-pulse border border-yellow-400/30"></div>
	{/if}
</div>

<style>
	.condition-node {
		width: 96px;
		height: 64px;
	}

	:global(.condition-node .svelte-flow__handle) {
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
	}

	:global(.condition-node .svelte-flow__handle:hover) {
		transform: scale(1.3);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
	}

	/* Specific styling for YES handle */
	:global(.condition-node .svelte-flow__handle[data-handleid="condition-yes"]) {
		border-color: #10b981;
		box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
	}

	/* Specific styling for NO handle */
	:global(.condition-node .svelte-flow__handle[data-handleid="condition-no"]) {
		border-color: #ef4444;
		box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
	}
</style>