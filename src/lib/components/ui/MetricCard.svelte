<script lang="ts">
	export let title: string;
	export let value: string;
	export let change: string;
	export let changeType: 'positive' | 'negative' | 'neutral' = 'neutral';
	export let icon: string = 'chart-bar';
</script>

<div class="bg-black overflow-hidden shadow rounded-lg border border-gray-700">
	<div class="p-5">
		<div class="flex items-center">
			<div class="flex-shrink-0">
				<div class="h-8 w-8 bg-gray-700 rounded-md flex items-center justify-center">
					<span class="text-gray-400 text-sm">📊</span>
				</div>
			</div>
			<div class="ml-5 w-0 flex-1">
				<dl>
					<dt class="text-sm font-medium text-gray-400 truncate">{title}</dt>
					<dd class="flex items-baseline">
						<div class="text-2xl font-semibold text-white">{value}</div>
						<div class="ml-2 flex items-baseline text-sm font-semibold text-gray-400">
							{change}
						</div>
					</dd>
				</dl>
			</div>
		</div>
	</div>
</div>