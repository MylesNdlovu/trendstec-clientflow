<script lang="ts">
	export let data: any[] = [];
	export let type: 'line' | 'bar' | 'pie' = 'line';

	// Mock chart component - in production you'd use a real charting library
	let chartElement: HTMLDivElement;
</script>

<div bind:this={chartElement} class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
	<div class="text-center">
		<div class="text-gray-400 text-lg mb-2">📈</div>
		<p class="text-gray-500 text-sm">Chart placeholder</p>
		<p class="text-gray-400 text-xs">
			{type} chart with {data.length} data points
		</p>
	</div>
</div>