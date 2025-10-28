<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { RefreshCw, Play, Pause, Trash2, TrendingUp, DollarSign, Eye, MousePointer, Plus } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	export let data;

	$: themeClasses = getThemeClasses($theme);

	let campaigns: any[] = data.campaigns || [];
	let syncing = false;
	let loading = false;
	let selectedCampaign: any = null;
	let insights: any = null;
	let loadingInsights = false;

	async function syncCampaigns() {
		syncing = true;
		try {
			const res = await fetch('/api/facebook/campaigns/sync', {
				method: 'POST'
			});

			const result = await res.json();

			if (res.ok) {
				// Reload campaigns
				window.location.reload();
			} else {
				alert(result.error || 'Failed to sync campaigns');
			}
		} catch (err) {
			console.error('Sync error:', err);
			alert('Failed to sync campaigns');
		} finally {
			syncing = false;
		}
	}

	async function pauseCampaign(id: string) {
		if (!confirm('Pause this campaign?')) return;

		try {
			const res = await fetch(`/api/facebook/campaigns/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'pause' })
			});

			if (res.ok) {
				// Update local state
				campaigns = campaigns.map(c =>
					c.id === id ? { ...c, status: 'PAUSED' } : c
				);
			} else {
				const error = await res.json();
				alert(error.error || 'Failed to pause campaign');
			}
		} catch (err) {
			console.error('Pause error:', err);
			alert('Failed to pause campaign');
		}
	}

	async function resumeCampaign(id: string) {
		if (!confirm('Resume this campaign?')) return;

		try {
			const res = await fetch(`/api/facebook/campaigns/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'resume' })
			});

			if (res.ok) {
				// Update local state
				campaigns = campaigns.map(c =>
					c.id === id ? { ...c, status: 'ACTIVE' } : c
				);
			} else {
				const error = await res.json();
				alert(error.error || 'Failed to resume campaign');
			}
		} catch (err) {
			console.error('Resume error:', err);
			alert('Failed to resume campaign');
		}
	}

	async function deleteCampaign(id: string) {
		if (!confirm('Delete this campaign? This will delete it from Facebook and cannot be undone.')) return;

		try {
			const res = await fetch(`/api/facebook/campaigns/${id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				// Remove from local state
				campaigns = campaigns.filter(c => c.id !== id);
			} else {
				const error = await res.json();
				alert(error.error || 'Failed to delete campaign');
			}
		} catch (err) {
			console.error('Delete error:', err);
			alert('Failed to delete campaign');
		}
	}

	async function viewInsights(campaign: any) {
		selectedCampaign = campaign;
		loadingInsights = true;
		insights = null;

		try {
			const res = await fetch(`/api/facebook/campaigns/${campaign.id}/insights?date_preset=last_7d`);
			const result = await res.json();

			if (res.ok) {
				insights = result.insights;
			} else {
				alert(result.error || 'Failed to load insights');
			}
		} catch (err) {
			console.error('Insights error:', err);
			alert('Failed to load insights');
		} finally {
			loadingInsights = false;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'ACTIVE': return 'text-green-400 bg-green-500/20';
			case 'PAUSED': return 'text-yellow-400 bg-yellow-500/20';
			case 'ARCHIVED': return 'text-gray-400 bg-gray-500/20';
			default: return 'text-gray-400 bg-gray-500/20';
		}
	}

	function formatCurrency(amount: number | null) {
		if (!amount) return '$0.00';
		return `$${amount.toFixed(2)}`;
	}

	function formatNumber(num: string | number) {
		if (!num) return '0';
		return Number(num).toLocaleString();
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold text-white flex items-center">
				<TrendingUp class="w-8 h-8 mr-3 {themeClasses.primary}" />
				Campaign Management
			</h1>
			<p class="text-gray-400 mt-1">Manage your Facebook ad campaigns</p>
		</div>
		<div class="flex items-center space-x-3">
			<button
				on:click={syncCampaigns}
				disabled={syncing}
				class="flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
			>
				{#if syncing}
					<RefreshCw class="w-5 h-5 mr-2 animate-spin" />
					Syncing...
				{:else}
					<RefreshCw class="w-5 h-5 mr-2" />
					Sync from Meta
				{/if}
			</button>
			<button
				on:click={() => goto('/dashboard/ads/campaigns/new')}
				class="flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
			>
				<Plus class="w-5 h-5 mr-2" />
				New Campaign
			</button>
		</div>
	</div>

	<!-- No Facebook Connection Warning -->
	{#if !data.adAccount}
		<div class="glass-card-ios rounded-xl p-6 mb-6 border-2 border-orange-500/50 bg-orange-500/10">
			<h3 class="text-lg font-semibold text-white mb-2">Facebook Not Connected</h3>
			<p class="text-gray-300 mb-4">
				Connect your Facebook account to manage campaigns.
			</p>
			<a
				href="/dashboard/ads"
				class="inline-flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
			>
				Connect Facebook
			</a>
		</div>
	{:else if campaigns.length === 0}
		<!-- No Campaigns -->
		<div class="glass-card-ios rounded-2xl p-12 text-center">
			<TrendingUp class="w-16 h-16 text-gray-500 mx-auto mb-4" />
			<h3 class="text-xl font-bold text-white mb-2">No Campaigns Yet</h3>
			<p class="text-gray-400 mb-6">
				Create your first campaign or sync existing campaigns from Meta.
			</p>
			<div class="flex items-center justify-center space-x-4">
				<button
					on:click={syncCampaigns}
					disabled={syncing}
					class="px-6 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
				>
					<RefreshCw class="w-5 h-5 inline mr-2" />
					Sync from Meta
				</button>
				<button
					on:click={() => goto('/dashboard/ads/campaigns/new')}
					class="px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
				>
					Create First Campaign
				</button>
			</div>
		</div>
	{:else}
		<!-- Campaigns Table -->
		<div class="glass-card-ios rounded-xl overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-black/30">
						<tr>
							<th class="text-left px-6 py-4 text-sm font-semibold text-gray-400">Campaign Name</th>
							<th class="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
							<th class="text-left px-6 py-4 text-sm font-semibold text-gray-400">Objective</th>
							<th class="text-left px-6 py-4 text-sm font-semibold text-gray-400">Daily Budget</th>
							<th class="text-left px-6 py-4 text-sm font-semibold text-gray-400">Last Synced</th>
							<th class="text-right px-6 py-4 text-sm font-semibold text-gray-400">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5">
						{#each campaigns as campaign}
							<tr class="hover:bg-white/5 transition-colors">
								<td class="px-6 py-4">
									<div class="flex items-center">
										<div>
											<p class="text-white font-medium">{campaign.name}</p>
											{#if campaign.facebookCampaignId}
												<p class="text-xs text-gray-500">ID: {campaign.facebookCampaignId}</p>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-6 py-4">
									<span class="px-3 py-1 rounded-full text-xs font-semibold {getStatusColor(campaign.status)}">
										{campaign.status}
									</span>
								</td>
								<td class="px-6 py-4 text-gray-300">{campaign.objective || 'N/A'}</td>
								<td class="px-6 py-4 text-gray-300">{formatCurrency(campaign.dailyBudget)}</td>
								<td class="px-6 py-4 text-gray-400 text-sm">
									{campaign.lastSyncedAt ? new Date(campaign.lastSyncedAt).toLocaleDateString() : 'Never'}
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end space-x-2">
										<button
											on:click={() => viewInsights(campaign)}
											class="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
											title="View Insights"
										>
											<Eye class="w-5 h-5" />
										</button>
										{#if campaign.status === 'ACTIVE'}
											<button
												on:click={() => pauseCampaign(campaign.id)}
												class="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
												title="Pause"
											>
												<Pause class="w-5 h-5" />
											</button>
										{:else if campaign.status === 'PAUSED'}
											<button
												on:click={() => resumeCampaign(campaign.id)}
												class="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
												title="Resume"
											>
												<Play class="w-5 h-5" />
											</button>
										{/if}
										<button
											on:click={() => deleteCampaign(campaign.id)}
											class="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
											title="Delete"
										>
											<Trash2 class="w-5 h-5" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<!-- Insights Modal -->
{#if selectedCampaign}
	<div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" on:click={() => selectedCampaign = null}>
		<div class="glass-card-ios rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
			<!-- Modal Header -->
			<div class="p-6 border-b border-white/10">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-2xl font-bold text-white">{selectedCampaign.name}</h2>
						<p class="text-gray-400 mt-1">Campaign Performance (Last 7 Days)</p>
					</div>
					<button
						on:click={() => selectedCampaign = null}
						class="text-gray-400 hover:text-white text-2xl"
					>
						×
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="p-6">
				{#if loadingInsights}
					<div class="text-center py-12">
						<RefreshCw class="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
						<p class="text-gray-400">Loading insights...</p>
					</div>
				{:else if insights}
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<!-- Impressions -->
						<div class="bg-black/30 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<Eye class="w-5 h-5 text-blue-400" />
							</div>
							<p class="text-2xl font-bold text-white">{formatNumber(insights.impressions)}</p>
							<p class="text-sm text-gray-400">Impressions</p>
						</div>

						<!-- Clicks -->
						<div class="bg-black/30 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<MousePointer class="w-5 h-5 text-green-400" />
							</div>
							<p class="text-2xl font-bold text-white">{formatNumber(insights.clicks)}</p>
							<p class="text-sm text-gray-400">Clicks</p>
						</div>

						<!-- Spend -->
						<div class="bg-black/30 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<DollarSign class="w-5 h-5 text-orange-400" />
							</div>
							<p class="text-2xl font-bold text-white">${insights.spend || '0.00'}</p>
							<p class="text-sm text-gray-400">Spend</p>
						</div>

						<!-- CTR -->
						<div class="bg-black/30 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<TrendingUp class="w-5 h-5 text-purple-400" />
							</div>
							<p class="text-2xl font-bold text-white">{insights.ctr || '0'}%</p>
							<p class="text-sm text-gray-400">CTR</p>
						</div>

						<!-- Reach -->
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-2xl font-bold text-white">{formatNumber(insights.reach)}</p>
							<p class="text-sm text-gray-400">Reach</p>
						</div>

						<!-- CPC -->
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-2xl font-bold text-white">${insights.cpc || '0.00'}</p>
							<p class="text-sm text-gray-400">CPC</p>
						</div>

						<!-- CPM -->
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-2xl font-bold text-white">${insights.cpm || '0.00'}</p>
							<p class="text-sm text-gray-400">CPM</p>
						</div>

						<!-- Frequency -->
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-2xl font-bold text-white">{insights.frequency || '0'}</p>
							<p class="text-sm text-gray-400">Frequency</p>
						</div>
					</div>

					{#if insights.noData}
						<p class="text-center text-gray-400 mt-6">
							No data available yet. Campaign might be new or not running.
						</p>
					{/if}
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="p-6 border-t border-white/10 flex items-center justify-end">
				<button
					on:click={() => selectedCampaign = null}
					class="px-6 py-2 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
