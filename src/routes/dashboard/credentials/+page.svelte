<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Shield,
		CheckCircle,
		XCircle,
		Clock,
		AlertTriangle,
		RefreshCw,
		Eye,
		EyeOff,
		TrendingUp,
		Activity,
		Server,
		Building
	} from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';

	let credentials = [];
	let loading = true;
	let error = '';
	let stats = {
		total: 0,
		verified: 0,
		pending: 0,
		failed: 0,
		successful: 0,
		blocked: 0,
		successRate: 0
	};

	// Filters
	let filterStatus = 'all'; // all, verified, pending, failed
	let searchQuery = '';

	// Reactive theme classes
	$: themeClasses = getThemeClasses($theme);

	// Filtered credentials
	$: filteredCredentials = credentials.filter(cred => {
		// Status filter
		if (filterStatus === 'verified' && !cred.isVerified) return false;
		if (filterStatus === 'pending' && cred.scrapingStatus !== 'pending') return false;
		if (filterStatus === 'failed' && cred.scrapingStatus !== 'failed') return false;

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			return (
				cred.login.toLowerCase().includes(query) ||
				cred.broker.toLowerCase().includes(query) ||
				cred.server.toLowerCase().includes(query)
			);
		}

		return true;
	});

	onMount(async () => {
		await loadCredentials();
		await loadStats();
	});

	async function loadCredentials() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/credentials');
			const result = await response.json();

			if (result.success) {
				credentials = result.credentials;
			} else {
				error = result.error || 'Failed to load credentials';
			}
		} catch (err) {
			error = 'Failed to load credentials: ' + (err instanceof Error ? err.message : 'Unknown error');
		} finally {
			loading = false;
		}
	}

	async function loadStats() {
		try {
			const response = await fetch('/api/stats');
			const result = await response.json();

			if (result.success && result.stats.credentials) {
				stats = result.stats.credentials;
			}
		} catch (err) {
			console.error('Failed to load stats:', err);
		}
	}

	async function retryValidation(credentialId: string) {
		try {
			const response = await fetch(`/api/credentials/${credentialId}/retry`, {
				method: 'POST'
			});

			const result = await response.json();

			if (result.success) {
				await loadCredentials();
				await loadStats();
			} else {
				alert('Failed to retry: ' + result.error);
			}
		} catch (err) {
			alert('Failed to retry validation');
		}
	}

	function getStatusBadge(credential: any) {
		if (credential.isVerified && credential.scrapingStatus === 'success') {
			return {
				color: 'bg-green-500/10 text-green-400 border-green-500/30',
				icon: CheckCircle,
				text: 'Verified'
			};
		}
		if (credential.scrapingStatus === 'failed') {
			return {
				color: 'bg-red-500/10 text-red-400 border-red-500/30',
				icon: XCircle,
				text: 'Failed'
			};
		}
		if (credential.scrapingStatus === 'pending') {
			return {
				color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
				icon: Clock,
				text: 'Pending'
			};
		}
		return {
			color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
			icon: Activity,
			text: 'Unknown'
		};
	}

	function formatDate(date: string | null) {
		if (!date) return 'Never';
		return new Date(date).toLocaleString();
	}
</script>

<svelte:head>
	<title>MT5 Credentials - Validation Status</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
	<div class="max-w-7xl mx-auto space-y-6">
		<!-- Header -->
		<div>
			<h1 class="text-3xl font-bold text-white flex items-center">
				<Shield class="w-8 h-8 mr-3 {themeClasses.primary}" />
				Lead Credentials Tracking
			</h1>
			<p class="mt-2 text-gray-400">Monitor your leads' MT5 accounts and validation status</p>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Total Leads -->
			<div class="glass-card-ios rounded-xl p-4 border border-gray-700/50">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-gray-400 text-sm">Total Leads</p>
						<p class="text-2xl font-bold text-white mt-1">{stats.total}</p>
					</div>
					<Activity class="w-8 h-8 {themeClasses.primary}" />
				</div>
			</div>

			<!-- Verified -->
			<div class="glass-card-ios rounded-xl p-4 border border-green-500/30 bg-green-500/5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-gray-400 text-sm">Verified</p>
						<p class="text-2xl font-bold text-green-400 mt-1">{stats.verified}</p>
					</div>
					<CheckCircle class="w-8 h-8 text-green-400" />
				</div>
			</div>

			<!-- Failed -->
			<div class="glass-card-ios rounded-xl p-4 border border-red-500/30 bg-red-500/5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-gray-400 text-sm">Failed</p>
						<p class="text-2xl font-bold text-red-400 mt-1">{stats.failed}</p>
					</div>
					<XCircle class="w-8 h-8 text-red-400" />
				</div>
			</div>

			<!-- Success Rate -->
			<div class="glass-card-ios rounded-xl p-4 border border-blue-500/30 bg-blue-500/5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-gray-400 text-sm">Success Rate</p>
						<p class="text-2xl font-bold text-blue-400 mt-1">{stats.successRate}%</p>
					</div>
					<TrendingUp class="w-8 h-8 text-blue-400" />
				</div>
			</div>
		</div>

		<!-- Filters -->
		<div class="glass-card-ios rounded-xl p-4 border border-gray-700/50">
			<div class="flex flex-col md:flex-row gap-4">
				<!-- Search -->
				<div class="flex-1">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search by login, broker, or server..."
						class="w-full px-4 py-2 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
					/>
				</div>

				<!-- Status Filter -->
				<div>
					<select
						bind:value={filterStatus}
						class="px-4 py-2 bg-black border border-gray-600 rounded-lg text-white focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
					>
						<option value="all">All Status</option>
						<option value="verified">Verified Only</option>
						<option value="pending">Pending Only</option>
						<option value="failed">Failed Only</option>
					</select>
				</div>

				<!-- Refresh Button -->
				<button
					on:click={() => { loadCredentials(); loadStats(); }}
					class="px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg flex items-center hover:scale-105 transition-transform"
				>
					<RefreshCw class="w-4 h-4 mr-2" />
					Refresh
				</button>
			</div>
		</div>

		<!-- Credentials List -->
		<div class="glass-card-ios rounded-xl border border-gray-700/50 overflow-hidden">
			{#if loading}
				<div class="p-12 text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-2 {themeClasses.primaryBorder} border-t-transparent mx-auto mb-4"></div>
					<p class="text-gray-400">Loading credentials...</p>
				</div>
			{:else if error}
				<div class="p-12 text-center">
					<AlertTriangle class="w-12 h-12 text-red-400 mx-auto mb-4" />
					<p class="text-red-400">{error}</p>
				</div>
			{:else if filteredCredentials.length === 0}
				<div class="p-12 text-center">
					<Shield class="w-12 h-12 text-gray-500 mx-auto mb-4" />
					<p class="text-gray-400 mb-2">No leads have submitted their credentials yet</p>
					<p class="text-gray-500 text-sm">Share your MT5 form link with your leads to start tracking</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-900/50 border-b border-gray-700">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Login</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Broker</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Server</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Scraped</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Failed Attempts</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-800">
							{#each filteredCredentials as credential}
								{@const badge = getStatusBadge(credential)}
								<tr class="hover:bg-gray-900/30 transition-colors">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm font-medium text-white">{credential.login}</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center text-sm text-gray-300">
											<Building class="w-4 h-4 mr-2 {themeClasses.primary}" />
											{credential.broker}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center text-sm text-gray-300">
											<Server class="w-4 h-4 mr-2 text-gray-400" />
											{credential.server}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {badge.color}">
											<svelte:component this={badge.icon} class="w-3 h-3 mr-1" />
											{badge.text}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="text-sm text-white">
											{credential.balance != null ? `$${credential.balance.toFixed(2)}` : 'N/A'}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
										{formatDate(credential.lastScrapedAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<span class="text-sm {credential.failedAttempts >= credential.maxFailedAttempts ? 'text-red-400 font-bold' : 'text-gray-400'}">
												{credential.failedAttempts}/{credential.maxFailedAttempts}
											</span>
											{#if credential.failedAttempts >= credential.maxFailedAttempts}
												<AlertTriangle class="w-4 h-4 ml-2 text-red-400" />
											{/if}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										{#if credential.scrapingStatus === 'pending'}
											<span class="text-yellow-400 flex items-center">
												<Clock class="w-4 h-4 mr-1" />
												Validating...
											</span>
										{:else if credential.scrapingStatus === 'success'}
											<span class="text-green-400 flex items-center">
												<CheckCircle class="w-4 h-4 mr-1" />
												Tracking
											</span>
										{:else}
											<span class="text-red-400 flex items-center">
												<XCircle class="w-4 h-4 mr-1" />
												Invalid
											</span>
										{/if}
									</td>
								</tr>
								{#if credential.scrapingError}
									<tr class="bg-red-500/5">
										<td colspan="8" class="px-6 py-2">
											<div class="text-xs text-red-400">
												<strong>Error:</strong> {credential.scrapingError}
											</div>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
