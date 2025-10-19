<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Users,
		CheckCircle,
		Activity,
		Clock,
		AlertTriangle,
		DollarSign,
		Calendar,
		ExternalLink,
		Download,
		Filter,
		Search,
		RefreshCw,
		Eye,
		TrendingUp
	} from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';

	// Reactive theme classes
	$: themeClasses = getThemeClasses($theme);

	interface Lead {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		broker: string;
		status: 'captured' | 'deposited' | 'trading' | 'inactive';
		capturedAt: Date;
		depositedAt: Date | null;
		firstTradeAt: Date | null;
		mt5Login: string;
		cpaCommission: number;
		commissionPaid: boolean;
		lastVerified: Date;
		mt5Data: {
			hasDeposited: boolean;
			depositAmount: number;
			hasTraded: boolean;
			totalLots: number;
			tradesCount: number;
			lastTradeDate: Date | null;
			currentBalance: number;
			currentEquity: number;
		};
	}

	let leads: any[] = [];
	let loading = true;
	let error = '';
	let searchQuery = '';
	let filterStatus = 'all';
	let filterBroker = 'all';

	// Filtered leads
	$: filteredLeads = leads.filter((lead) => {
		const matchesSearch =
			searchQuery === '' ||
			lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			lead.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			lead.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
		const matchesBroker = filterBroker === 'all' || lead.broker === filterBroker;

		return matchesSearch && matchesStatus && matchesBroker;
	});

	// Get unique brokers for filter
	$: brokers = [...new Set(leads.map((l) => l.broker).filter(Boolean))];

	onMount(async () => {
		await loadLeads();
	});

	async function loadLeads() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/leads');
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to load leads');
			}

			leads = result.leads;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load leads';
			console.error('Error loading leads:', err);
		} finally {
			loading = false;
		}
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'captured':
				return 'bg-gray-500/20 text-gray-400';
			case 'deposited':
				return 'bg-blue-500/20 text-blue-400';
			case 'trading':
				return 'bg-yellow-500/20 text-yellow-400';
			case 'qualified':
				return 'bg-green-500/20 text-green-400';
			default:
				return 'bg-gray-500/20 text-gray-400';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'captured':
				return Clock;
			case 'deposited':
				return DollarSign;
			case 'trading':
				return Activity;
			case 'qualified':
				return CheckCircle;
			default:
				return Clock;
		}
	}

	let sortBy = 'newest';

	// Additional state for CPA management
	let selectedLeads: Set<string> = new Set();
	let showCommissionModal = false;
	let bulkCpaCommission = 0;



	function formatDate(dateString: string) {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function exportLeads() {
		// CSV export functionality
		const csv = [
			['Email', 'First Name', 'Last Name', 'Broker', 'Status', 'Captured At', 'Total Earned', 'FTD Earned', 'CPA Earned'],
			...leads.map(lead => [
				lead.email || '',
				lead.firstName || '',
				lead.lastName || '',
				lead.broker || '',
				lead.status,
				formatDate(lead.leadCapturedAt),
				(lead.totalEarned || 0).toString(),
				(lead.ftdEarned || 0).toString(),
				(lead.cpaEarned || 0).toString()
			])
		].map(row => row.join(',')).join('\n');

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function bulkUpdateCommission() {
		// Update commission for selected leads
		console.log('Updating commission for selected leads:', selectedLeads);
		showCommissionModal = false;
	}
</script>

<svelte:head>
	<title>Leads - TRENDSTEC Client Flow</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
<div class="max-w-7xl mx-auto space-y-8">
	<!-- Page header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white">Leads Management</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Track lead conversion status and MT5 trading activity
			</p>
		</div>
		<div class="mt-4 sm:mt-0 flex space-x-3">
			<button
				on:click={exportLeads}
				class="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
			>
				<Download class="w-4 h-4 mr-2" />
				Export CSV
			</button>
			<button
				on:click={loadLeads}
				class="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
			>
				Refresh Data
			</button>
		</div>
	</div>

	<!-- Summary Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center">
				<Users class="w-8 h-8 {themeClasses.primary}" />
				<div class="ml-4">
					<p class="text-sm text-gray-500 dark:text-gray-400">Total Leads</p>
					<p class="text-2xl font-bold text-white">{leads.length}</p>
				</div>
			</div>
		</div>
		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center">
				<CheckCircle class="w-8 h-8 {themeClasses.primary}" />
				<div class="ml-4">
					<p class="text-sm text-gray-500 dark:text-gray-400">Deposited</p>
					<p class="text-2xl font-bold text-white">
						{leads.filter(l => l.status === 'deposited' || l.status === 'trading').length}
					</p>
				</div>
			</div>
		</div>
		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center">
				<Activity class="w-8 h-8 {themeClasses.primary}" />
				<div class="ml-4">
					<p class="text-sm text-gray-500 dark:text-gray-400">Trading</p>
					<p class="text-2xl font-bold text-white">
						{leads.filter(l => l.status === 'trading').length}
					</p>
				</div>
			</div>
		</div>
		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center">
				<DollarSign class="w-8 h-8 {themeClasses.primary}" />
				<div class="ml-4">
					<p class="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
					<p class="text-2xl font-bold text-white">
						${leads.reduce((sum, lead) => sum + (lead.totalEarned || 0), 0).toLocaleString()}
					</p>
				</div>
			</div>
		</div>
	</div>


	<!-- Leads Table -->
	<div class="glass-card-ios rounded-xl overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-semibold text-white">
				Lead Details ({leads.length})
			</h3>
			<!-- Debug info -->
			<div class="text-sm text-gray-500 mt-2">
				Raw leads: {leads.length} | Filtered: {leads.length} | Loading: {loading}
			</div>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
				<span class="ml-3 text-gray-600 dark:text-gray-400">Loading leads...</span>
			</div>
		{:else if error}
			<div class="text-center py-12">
				<AlertTriangle class="w-12 h-12 text-red-500 mx-auto mb-4" />
				<p class="text-red-500 font-medium mb-2">Failed to load leads</p>
				<p class="text-gray-400 text-sm mb-4">{error}</p>
				<button
					on:click={loadLeads}
					class="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
				>
					<RefreshCw class="w-4 h-4 mr-2" />
					Try Again
				</button>
			</div>
		{:else if leads.length === 0}
			<div class="text-center py-12">
				<Users class="w-12 h-12 {themeClasses.primary} mx-auto mb-4" />
				<p class="text-gray-500 dark:text-gray-400">No leads found. When you receive leads from your Workflow Backend, they will appear here.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each leads as lead}
					<div class="flex items-center justify-between p-4 bg-black rounded-lg hover:bg-zinc-900 transition-colors">
						<div class="flex items-center space-x-4">
							<!-- Avatar -->
							<div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
								<span class="text-white text-sm font-medium">
									{lead.email.charAt(0).toUpperCase()}
								</span>
							</div>

							<!-- Main Info -->
							<div class="flex-1">
								<div class="flex items-center space-x-3 mb-1">
									<p class="font-medium text-white">{lead.email}</p>
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(lead.status)}">
										<svelte:component this={getStatusIcon(lead.status)} class="w-3 h-3 mr-1" />
										{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
									</span>
								</div>
								<div class="flex items-center space-x-4 text-sm text-gray-400">
									<span>{lead.broker}</span>
									<span class="font-mono bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">
										{lead.mt5Login}
									</span>
									{#if lead.mt5Data && lead.mt5Data.hasDeposited}
										<span>Deposit: ${lead.mt5Data.depositAmount.toLocaleString()}</span>
									{/if}
									{#if lead.mt5Data && lead.mt5Data.hasTraded}
										<span>Trades: {lead.mt5Data.tradesCount}</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Right side info -->
						<div class="text-right">
							<p class="text-sm font-medium text-white">
								${(lead.totalEarned || 0).toLocaleString()}
							</p>
							<div class="flex items-center justify-end space-x-1 mt-1">
								<Calendar class="w-3 h-3 {themeClasses.primary}" />
								<span class="text-xs text-gray-400">
									{formatDate(lead.capturedAt || lead.leadCapturedAt)}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Commission Modal -->
{#if showCommissionModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-black rounded-lg p-6 w-full max-w-md mx-4">
			<h3 class="text-lg font-semibold text-white mb-4">
				Set Commission for {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}
			</h3>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						CPA Commission (USD)
					</label>
					<input
						type="number"
						bind:value={bulkCpaCommission}
						class="w-full px-3 py-2 border border-gray-600 rounded-lg bg-black text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
						placeholder="Enter commission amount"
						min="0"
						step="0.01"
					/>
				</div>

				<div class="text-sm text-gray-600 dark:text-gray-400">
					This will set the CPA commission to ${bulkCpaCommission} for all selected leads.
				</div>
			</div>

			<div class="flex justify-end space-x-3 mt-6">
				<button
					on:click={() => showCommissionModal = false}
					class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
				>
					Cancel
				</button>
				<button
					on:click={bulkUpdateCommission}
					class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
				>
					Update Commission
				</button>
			</div>
		</div>
	</div>
{/if}
</div>