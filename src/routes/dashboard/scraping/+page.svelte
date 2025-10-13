<script lang="ts">
	import { onMount } from 'svelte';
	import ScrapingJobCard from '$lib/components/ui/ScrapingJobCard.svelte';
	import { Plus, Search, Filter, Play, Pause } from 'lucide-svelte';

	export let data;

	let scrapingJobs = [];
	let loading = true;
	let searchTerm = '';
	let filterStatus = 'all';

	onMount(async () => {
		await loadScrapingJobs();
	});

	async function loadScrapingJobs() {
		try {
			const response = await fetch('/api/scraping/jobs');
			scrapingJobs = await response.json();
		} catch (error) {
			console.error('Failed to load scraping jobs:', error);
		} finally {
			loading = false;
		}
	}

	async function toggleJob(jobId: string, currentStatus: string) {
		try {
			const newStatus = currentStatus === 'running' ? 'paused' : 'running';
			const response = await fetch(`/api/scraping/jobs/${jobId}/toggle`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				await loadScrapingJobs();
			}
		} catch (error) {
			console.error('Failed to toggle job:', error);
		}
	}

	$: filteredJobs = scrapingJobs.filter(job => {
		const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
		return matchesSearch && matchesFilter;
	});
</script>

<svelte:head>
	<title>Web Scraping - Marketing Automation Platform</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Web Scraping & Data Collection</h1>
			<p class="mt-1 text-sm text-gray-500">
				Automate data collection from websites and feed results into your marketing workflows.
			</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/dashboard/scraping/playwright-guide"
				class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
			>
				Setup Guide
			</a>
			<a
				href="/dashboard/scraping/new"
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
			>
				<Plus class="w-4 h-4 mr-2" />
				Create Scraping Job
			</a>
		</div>
	</div>

	<!-- Quick stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div class="bg-white p-4 rounded-lg shadow">
			<div class="text-sm font-medium text-gray-500">Running Jobs</div>
			<div class="text-2xl font-bold text-green-600">
				{scrapingJobs.filter(job => job.status === 'running').length}
			</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow">
			<div class="text-sm font-medium text-gray-500">Data Points Today</div>
			<div class="text-2xl font-bold text-blue-600">
				{scrapingJobs.reduce((sum, job) => sum + (job.todayCount || 0), 0).toLocaleString()}
			</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow">
			<div class="text-sm font-medium text-gray-500">Success Rate</div>
			<div class="text-2xl font-bold text-purple-600">98.5%</div>
		</div>
		<div class="bg-white p-4 rounded-lg shadow">
			<div class="text-sm font-medium text-gray-500">Workflows Triggered</div>
			<div class="text-2xl font-bold text-orange-600">1,247</div>
		</div>
	</div>

	<!-- Search and filters -->
	<div class="bg-white p-4 rounded-lg shadow">
		<div class="flex flex-col sm:flex-row gap-4">
			<div class="flex-1">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						placeholder="Search scraping jobs..."
						bind:value={searchTerm}
						class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Filter class="w-4 h-4 text-gray-400" />
				<select
					bind:value={filterStatus}
					class="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
				>
					<option value="all">All Status</option>
					<option value="running">Running</option>
					<option value="paused">Paused</option>
					<option value="completed">Completed</option>
					<option value="failed">Failed</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Scraping jobs grid -->
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
		</div>
	{:else if filteredJobs.length === 0}
		<div class="text-center py-12">
			<div class="mx-auto h-12 w-12 text-gray-400">
				<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
				</svg>
			</div>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No scraping jobs found</h3>
			<p class="mt-1 text-sm text-gray-500">Get started by creating your first web scraping job.</p>
			<div class="mt-6">
				<a
					href="/dashboard/scraping/new"
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
				>
					<Plus class="w-4 h-4 mr-2" />
					Create Scraping Job
				</a>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredJobs as job}
				<ScrapingJobCard {job} on:toggle={() => toggleJob(job.id, job.status)} />
			{/each}
		</div>
	{/if}
</div>