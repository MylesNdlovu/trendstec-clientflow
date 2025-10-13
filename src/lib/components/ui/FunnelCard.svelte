<script lang="ts">
	export let funnel: any;

	// Mock funnel data if not provided
	if (!funnel) {
		funnel = {
			id: '1',
			name: 'Sample Funnel',
			status: 'active',
			views: 1250,
			conversions: 89,
			conversionRate: 7.12
		};
	}
</script>

<div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
	<div class="px-4 py-5 sm:p-6">
		<div class="flex items-center justify-between">
			<h3 class="text-lg leading-6 font-medium text-gray-900">{funnel.name}</h3>
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {funnel.status === 'active'
					? 'bg-green-100 text-green-800'
					: funnel.status === 'draft'
					? 'bg-yellow-100 text-yellow-800'
					: 'bg-gray-100 text-gray-800'}"
			>
				{funnel.status}
			</span>
		</div>
		<div class="mt-4 grid grid-cols-2 gap-4">
			<div>
				<div class="text-sm font-medium text-gray-500">Views</div>
				<div class="text-lg font-semibold text-gray-900">{funnel.views?.toLocaleString() || 0}</div>
			</div>
			<div>
				<div class="text-sm font-medium text-gray-500">Conversions</div>
				<div class="text-lg font-semibold text-gray-900">{funnel.conversions?.toLocaleString() || 0}</div>
			</div>
		</div>
		<div class="mt-4">
			<div class="text-sm font-medium text-gray-500">Conversion Rate</div>
			<div class="text-lg font-semibold text-green-600">{funnel.conversionRate?.toFixed(1) || 0}%</div>
		</div>
		<div class="mt-6 flex space-x-2">
			<a
				href="/dashboard/funnels/{funnel.id}"
				class="flex-1 bg-indigo-600 text-white text-sm font-medium py-2 px-3 rounded text-center hover:bg-indigo-700"
			>
				Edit
			</a>
			<button
				class="flex-1 bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded hover:bg-gray-300"
			>
				Analytics
			</button>
		</div>
	</div>
</div>