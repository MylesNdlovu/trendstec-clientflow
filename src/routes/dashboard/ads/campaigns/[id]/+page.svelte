<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		ArrowLeft, Play, Pause, Trash2, SquarePen, TrendingUp,
		DollarSign, MousePointer, Eye, Target, Calendar, AlertCircle
	} from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	export let data;

	$: themeClasses = getThemeClasses($theme);
	$: campaign = data.campaign;

	let loadingInsights = false;
	let insights: any = null;
	let actionLoading = false;
	let error: string | null = null;

	// Load insights on mount
	async function loadInsights() {
		loadingInsights = true;
		try {
			const res = await fetch(`/api/facebook/campaigns/${campaign.id}/insights?date_preset=last_7d`);
			const result = await res.json();

			if (res.ok) {
				insights = result.insights;
			} else {
				console.error('Failed to load insights:', result.error);
			}
		} catch (err) {
			console.error('Error loading insights:', err);
		} finally {
			loadingInsights = false;
		}
	}

	// Auto-load insights when page loads
	$: if (campaign) {
		loadInsights();
	}

	async function pauseCampaign() {
		if (!confirm('Pause this campaign?')) return;

		actionLoading = true;
		error = null;

		try {
			const res = await fetch(`/api/facebook/campaigns/${campaign.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'pause' })
			});

			const result = await res.json();

			if (res.ok) {
				campaign = { ...campaign, status: 'PAUSED' };
			} else {
				error = result.error || 'Failed to pause campaign';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Network error. Please try again.';
		} finally {
			actionLoading = false;
		}
	}

	async function resumeCampaign() {
		if (!confirm('Resume this campaign?')) return;

		actionLoading = true;
		error = null;

		try {
			const res = await fetch(`/api/facebook/campaigns/${campaign.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'resume' })
			});

			const result = await res.json();

			if (res.ok) {
				campaign = { ...campaign, status: 'ACTIVE' };
			} else {
				error = result.error || 'Failed to resume campaign';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Network error. Please try again.';
		} finally {
			actionLoading = false;
		}
	}

	async function deleteCampaign() {
		if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) return;

		actionLoading = true;
		error = null;

		try {
			const res = await fetch(`/api/facebook/campaigns/${campaign.id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				goto('/dashboard/ads/campaigns');
			} else {
				const result = await res.json();
				error = result.error || 'Failed to delete campaign';
			}
		} catch (err) {
			console.error('Error:', err);
			error = 'Network error. Please try again.';
		} finally {
			actionLoading = false;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'ACTIVE': return 'text-green-400';
			case 'PAUSED': return 'text-yellow-400';
			case 'DRAFT': return 'text-gray-400';
			default: return 'text-gray-400';
		}
	}

	function getStatusBadgeColor(status: string) {
		switch (status) {
			case 'ACTIVE': return 'bg-green-500/20 border-green-500/50 text-green-400';
			case 'PAUSED': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
			case 'DRAFT': return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
			default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
		}
	}
</script>

<div class="p-6 max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-6">
		<button
			on:click={() => goto('/dashboard/ads/campaigns')}
			class="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
		>
			<ArrowLeft class="w-5 h-5 mr-2" />
			Back to Campaigns
		</button>

		<div class="flex items-start justify-between">
			<div>
				<h1 class="text-3xl font-bold text-white mb-2">{campaign.name}</h1>
				<div class="flex items-center gap-3">
					<span class="px-3 py-1 rounded-lg border text-sm font-medium {getStatusBadgeColor(campaign.status)}">
						{campaign.status}
					</span>
					<span class="text-gray-400 text-sm">
						Objective: <span class="text-white">{campaign.objective?.replace(/_/g, ' ')}</span>
					</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-2">
				{#if campaign.status === 'ACTIVE'}
					<button
						on:click={pauseCampaign}
						disabled={actionLoading}
						class="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
					>
						<Pause class="w-4 h-4" />
						Pause
					</button>
				{:else if campaign.status === 'PAUSED'}
					<button
						on:click={resumeCampaign}
						disabled={actionLoading}
						class="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
					>
						<Play class="w-4 h-4" />
						Resume
					</button>
				{/if}

				<button
					on:click={deleteCampaign}
					disabled={actionLoading}
					class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
				>
					<Trash2 class="w-4 h-4" />
					Delete
				</button>
			</div>
		</div>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="glass-card-ios rounded-xl p-4 mb-6 border-2 border-red-500/50 bg-red-500/10">
			<div class="flex items-center text-red-400">
				<AlertCircle class="w-5 h-5 mr-2" />
				<span>{error}</span>
			</div>
		</div>
	{/if}

	<!-- Performance Metrics -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		{#if loadingInsights}
			<div class="col-span-4 glass-card-ios rounded-xl p-8 flex items-center justify-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
				<span class="text-gray-400">Loading metrics...</span>
			</div>
		{:else if insights}
			<div class="glass-card-ios rounded-xl p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-gray-400 text-sm">Impressions</span>
					<Eye class="w-4 h-4 text-blue-400" />
				</div>
				<p class="text-2xl font-bold text-white">{parseInt(insights.impressions || 0).toLocaleString()}</p>
			</div>

			<div class="glass-card-ios rounded-xl p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-gray-400 text-sm">Clicks</span>
					<MousePointer class="w-4 h-4 text-green-400" />
				</div>
				<p class="text-2xl font-bold text-white">{parseInt(insights.clicks || 0).toLocaleString()}</p>
				<p class="text-xs text-gray-500 mt-1">CTR: {(parseFloat(insights.ctr || 0)).toFixed(2)}%</p>
			</div>

			<div class="glass-card-ios rounded-xl p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-gray-400 text-sm">Spend</span>
					<DollarSign class="w-4 h-4 text-orange-400" />
				</div>
				<p class="text-2xl font-bold text-white">${parseFloat(insights.spend || 0).toFixed(2)}</p>
				<p class="text-xs text-gray-500 mt-1">CPC: ${parseFloat(insights.cpc || 0).toFixed(2)}</p>
			</div>

			<div class="glass-card-ios rounded-xl p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-gray-400 text-sm">Reach</span>
					<Target class="w-4 h-4 text-purple-400" />
				</div>
				<p class="text-2xl font-bold text-white">{parseInt(insights.reach || 0).toLocaleString()}</p>
				<p class="text-xs text-gray-500 mt-1">CPM: ${parseFloat(insights.cpm || 0).toFixed(2)}</p>
			</div>
		{:else}
			<div class="col-span-4 glass-card-ios rounded-xl p-6 text-center text-gray-400">
				<p>No insights available yet. Campaign needs to run for at least 24 hours.</p>
			</div>
		{/if}
	</div>

	<!-- Campaign Details & Ad Preview -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column: Details -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Campaign Info -->
			<div class="glass-card-ios rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4">Campaign Details</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-400 mb-1">Objective</p>
						<p class="text-white font-medium">{campaign.objective?.replace(/_/g, ' ')}</p>
					</div>

					<div>
						<p class="text-sm text-gray-400 mb-1">Status</p>
						<p class="text-white font-medium">{campaign.status}</p>
					</div>

					<div>
						<p class="text-sm text-gray-400 mb-1">Daily Budget</p>
						<p class="text-white font-medium">
							{campaign.dailyBudget ? `$${campaign.dailyBudget}` : 'Not set'}
						</p>
					</div>

					<div>
						<p class="text-sm text-gray-400 mb-1">Lifetime Budget</p>
						<p class="text-white font-medium">
							{campaign.lifetimeBudget ? `$${campaign.lifetimeBudget}` : 'Not set'}
						</p>
					</div>

					<div>
						<p class="text-sm text-gray-400 mb-1">Created</p>
						<p class="text-white font-medium">
							{new Date(campaign.createdAt).toLocaleDateString()}
						</p>
					</div>

					<div>
						<p class="text-sm text-gray-400 mb-1">Last Synced</p>
						<p class="text-white font-medium">
							{campaign.lastSyncAt ? new Date(campaign.lastSyncAt).toLocaleDateString() : 'Never'}
						</p>
					</div>
				</div>

				{#if campaign.template}
					<div class="mt-4 pt-4 border-t border-white/10">
						<p class="text-sm text-gray-400 mb-1">Template</p>
						<p class="text-white font-medium">{campaign.template.name}</p>
					</div>
				{/if}
			</div>

			<!-- Targeting -->
			<div class="glass-card-ios rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4">Targeting</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-400 mb-1">Age Range</p>
						<p class="text-white font-medium">
							{campaign.targetingData?.age_min || 18} - {campaign.targetingData?.age_max || 65}
						</p>
					</div>

					<div>
						<p class="text-sm text-gray-400 mb-1">Gender</p>
						<p class="text-white font-medium">
							{#if !campaign.targetingData?.genders || campaign.targetingData.genders.length === 2}
								All
							{:else if campaign.targetingData.genders.includes(1)}
								Male
							{:else}
								Female
							{/if}
						</p>
					</div>

					<div class="col-span-2">
						<p class="text-sm text-gray-400 mb-1">Countries</p>
						<p class="text-white font-medium">
							{campaign.targetingData?.geo_locations?.countries?.join(', ') || 'Not set'}
						</p>
					</div>
				</div>
			</div>

			<!-- Facebook IDs -->
			<div class="glass-card-ios rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4">Facebook Details</h2>

				<div class="space-y-3 font-mono text-sm">
					<div>
						<p class="text-gray-400 mb-1">Campaign ID</p>
						<p class="text-white bg-black/30 rounded px-3 py-2">{campaign.fbCampaignId || 'N/A'}</p>
					</div>

					<div>
						<p class="text-gray-400 mb-1">Ad Set ID</p>
						<p class="text-white bg-black/30 rounded px-3 py-2">{campaign.fbAdSetId || 'N/A'}</p>
					</div>

					<div>
						<p class="text-gray-400 mb-1">Ad ID</p>
						<p class="text-white bg-black/30 rounded px-3 py-2">{campaign.fbAdId || 'N/A'}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column: Ad Preview -->
		<div class="lg:col-span-1">
			<div class="sticky top-6 glass-card-ios rounded-xl p-6">
				<h3 class="text-lg font-bold text-white mb-4 flex items-center">
					<Eye class="w-5 h-5 mr-2 {themeClasses.primary}" />
					Ad Preview
				</h3>

				<div class="bg-white rounded-lg p-4">
					<!-- Mock Facebook Ad -->
					<div class="space-y-3">
						<!-- Sponsored Badge -->
						<div class="flex items-center text-xs text-gray-500">
							<span class="font-semibold">Sponsored</span>
						</div>

						<!-- Ad Copy -->
						{#if campaign.adCopy}
							<p class="text-sm text-gray-900">{campaign.adCopy}</p>
						{/if}

						<!-- Image -->
						{#if campaign.imageUrl}
							<img src={campaign.imageUrl} alt="Ad" class="w-full rounded" />
						{:else}
							<div class="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
								<span class="text-gray-400 text-sm">No image</span>
							</div>
						{/if}

						<!-- Link Preview -->
						<div class="bg-gray-50 p-3 rounded">
							<p class="font-semibold text-sm text-gray-900 mb-1">
								{campaign.headline || campaign.name}
							</p>
							{#if campaign.description}
								<p class="text-xs text-gray-600">{campaign.description}</p>
							{/if}
							{#if campaign.callToAction}
								<button class="mt-2 px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-semibold rounded">
									{campaign.callToAction.replace(/_/g, ' ')}
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
