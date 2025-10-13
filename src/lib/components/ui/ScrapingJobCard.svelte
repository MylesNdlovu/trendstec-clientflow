<script lang="ts">
	import { Play, Pause, Globe } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	export let job: any;

	const dispatch = createEventDispatcher();

	// Mock job data if not provided
	if (!job) {
		job = {
			id: '1',
			name: 'Sample Scraping Job',
			status: 'running',
			targetUrl: 'https://example.com',
			lastRunAt: '2 hours ago',
			todayCount: 156,
			successRate: 98.5
		};
	}

	function handleToggle() {
		dispatch('toggle');
	}
</script>

<div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
	<div class="px-4 py-5 sm:p-6">
		<div class="flex items-center justify-between">
			<h3 class="text-lg leading-6 font-medium text-gray-900">{job.name}</h3>
			<span
				class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {job.status === 'running'
					? 'bg-green-100 text-green-800'
					: job.status === 'paused'
					? 'bg-yellow-100 text-yellow-800'
					: 'bg-red-100 text-red-800'}"
			>
				{job.status}
			</span>
		</div>

		<div class="mt-2 flex items-center text-sm text-gray-500">
			<Globe class="w-4 h-4 mr-1" />
			<span class="truncate">{job.targetUrl}</span>
		</div>

		<div class="mt-4 grid grid-cols-2 gap-4">
			<div>
				<div class="text-sm font-medium text-gray-500">Today's Data</div>
				<div class="text-lg font-semibold text-gray-900">{job.todayCount?.toLocaleString() || 0}</div>
			</div>
			<div>
				<div class="text-sm font-medium text-gray-500">Success Rate</div>
				<div class="text-lg font-semibold text-green-600">{job.successRate?.toFixed(1) || 0}%</div>
			</div>
		</div>

		<div class="mt-4">
			<div class="text-sm font-medium text-gray-500">Last Run</div>
			<div class="text-sm text-gray-900">{job.lastRunAt || 'Never'}</div>
		</div>

		<div class="mt-6 flex space-x-2">
			<button
				on:click={handleToggle}
				class="flex-1 {job.status === 'running' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white text-sm font-medium py-2 px-3 rounded flex items-center justify-center"
			>
				{#if job.status === 'running'}
					<Pause class="w-4 h-4 mr-1" />
					Pause
				{:else}
					<Play class="w-4 h-4 mr-1" />
					Start
				{/if}
			</button>
			<a
				href="/dashboard/scraping/{job.id}"
				class="flex-1 bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded text-center hover:bg-gray-300"
			>
				Edit
			</a>
		</div>
	</div>
</div>