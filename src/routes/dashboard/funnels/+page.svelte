<script lang="ts">
	import { onMount } from 'svelte';
	import FunnelCard from '$lib/components/ui/FunnelCard.svelte';
	import { Plus, Search, Filter } from 'lucide-svelte';

	export let data;

	let funnels = [];
	let loading = true;
	let searchTerm = '';
	let filterStatus = 'all';

	onMount(async () => {
		await loadFunnels();
	});

	async function loadFunnels() {
		try {
			const response = await fetch('/api/funnels');
			funnels = await response.json();
		} catch (error) {
			console.error('Failed to load funnels:', error);
		} finally {
			loading = false;
		}
	}

	$: filteredFunnels = funnels.filter(funnel => {
		const matchesSearch = funnel.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter = filterStatus === 'all' || funnel.status === filterStatus;
		return matchesSearch && matchesFilter;
	});
</script>

<svelte:head>
	<title>Funnels - Marketing Automation Platform</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Sales Funnels</h1>
			<p class="mt-1 text-sm text-gray-500">
				Create and manage your sales funnels to convert visitors into customers.
			</p>
		</div>
		<a
			href="/dashboard/funnels/new"
			class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
		>
			<Plus class="w-4 h-4 mr-2" />
			Create Funnel
		</a>
	</div>

	<!-- Search and filters -->
	<div class="glass-card-ios rounded-lg p-4 shadow">
		<div class="flex flex-col sm:flex-row gap-4">
			<div class="flex-1">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						placeholder="Search funnels..."
						bind:value={searchTerm}
						class="w-full pl-10 pr-4 py-2 bg-black border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-cyan-400/50 focus:border-cyan-400"
					/>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Filter class="w-4 h-4 text-gray-400" />
				<select
					bind:value={filterStatus}
					class="bg-black border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-cyan-400/50 focus:border-cyan-400"
				>
					<option value="all" class="bg-black">All Status</option>
					<option value="active" class="bg-black">Active</option>
					<option value="draft" class="bg-black">Draft</option>
					<option value="paused" class="bg-black">Paused</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Funnels grid -->
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
		</div>
	{:else if filteredFunnels.length === 0}
		<div class="text-center py-12">
			<div class="mx-auto h-12 w-12 text-gray-400">
				<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
				</svg>
			</div>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No funnels found</h3>
			<p class="mt-1 text-sm text-gray-500">Get started by creating your first sales funnel.</p>
			<div class="mt-6">
				<a
					href="/dashboard/funnels/new"
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
				>
					<Plus class="w-4 h-4 mr-2" />
					Create Funnel
				</a>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredFunnels as funnel}
				<FunnelCard {funnel} />
			{/each}
		</div>
	{/if}
</div>