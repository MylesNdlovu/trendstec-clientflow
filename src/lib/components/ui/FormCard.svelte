<script lang="ts">
	export let form: any;

	// Mock form data if not provided
	if (!form) {
		form = {
			id: '1',
			name: 'Sample Form',
			type: 'popup',
			submissions: 245,
			views: 3420,
			conversionRate: 7.16
		};
	}
</script>

<div class="bg-black overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border border-gray-700">
	<div class="px-4 py-5 sm:p-6">
		<div class="flex items-center justify-between">
			<h3 class="text-lg leading-6 font-medium text-white">{form.name}</h3>
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-gray-300"
			>
				{form.type}
			</span>
		</div>
		<div class="mt-4 grid grid-cols-2 gap-4">
			<div>
				<div class="text-sm font-medium text-gray-400">Views</div>
				<div class="text-lg font-semibold text-white">{form.views?.toLocaleString() || 0}</div>
			</div>
			<div>
				<div class="text-sm font-medium text-gray-400">Submissions</div>
				<div class="text-lg font-semibold text-white">{form.submissions?.toLocaleString() || 0}</div>
			</div>
		</div>
		<div class="mt-4">
			<div class="text-sm font-medium text-gray-400">Conversion Rate</div>
			<div class="text-lg font-semibold text-gray-300">{form.conversionRate?.toFixed(1) || 0}%</div>
		</div>
		<div class="mt-6 flex space-x-2">
			<a
				href="/dashboard/forms/{form.id}"
				class="flex-1 bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded text-center hover:bg-gray-600"
			>
				Edit
			</a>
			<button
				class="flex-1 bg-black text-gray-300 text-sm font-medium py-2 px-3 rounded hover:bg-gray-700"
			>
				Embed Code
			</button>
		</div>
	</div>
</div>