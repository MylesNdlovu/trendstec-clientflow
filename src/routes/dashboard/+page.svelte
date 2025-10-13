<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Users,
		TrendingUp,
		TrendingDown,
		DollarSign,
		Activity,
		AlertTriangle,
		CheckCircle,
		Clock,
		Target,
		PieChart,
		BarChart3,
		Zap
	} from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';
	import { settingsStore } from '$lib/stores/settingsStore';

	// Build timestamp for cache verification
	const buildTime = new Date().toISOString();
	console.log('🔄 Dashboard build time:', buildTime);

	// export let data;

	let affiliateStats = {
		leadsCaptured: 0,
		deposited: 0,
		tradesMade: 0,
		notDeposited: 0,
		notTraded: 0,
		conversionRate: 0,
		totalCommissions: 0,
		activeLeads: 0,
		ftdEarnings: 0,
		cpaEarnings: 0
	};

	let loading = false; // Changed to false to prevent infinite loading

	// Get settings from store
	$: ftdCpaSettings = $settingsStore.ftdCpaSettings || {
		ftdAmount: 250,
		cpaAmount: 300
	};
	let recentConversions = [];
	let error = '';

	// Reactive theme classes
	$: themeClasses = getThemeClasses($theme);

	// Enhanced stats for donut charts
	$: conversionInsights = {
		qualifiedConversions: affiliateStats.tradesMade, // Only those who deposited AND traded >= 0.2 lots
		depositedOnly: affiliateStats.deposited - affiliateStats.tradesMade, // Deposited but not trading enough
		pendingActivation: affiliateStats.leadsCaptured - affiliateStats.deposited, // Haven't deposited yet
		conversionEfficiency: affiliateStats.leadsCaptured > 0 ? (affiliateStats.tradesMade / affiliateStats.leadsCaptured * 100).toFixed(1) : 0,
		depositRate: affiliateStats.leadsCaptured > 0 ? (affiliateStats.deposited / affiliateStats.leadsCaptured * 100).toFixed(1) : 0,
		activationRate: affiliateStats.deposited > 0 ? (affiliateStats.tradesMade / affiliateStats.deposited * 100).toFixed(1) : 0,
		revenuePerLead: affiliateStats.leadsCaptured > 0 ? (affiliateStats.totalCommissions / affiliateStats.leadsCaptured).toFixed(0) : 0,
		avgTimeToDeposit: affiliateStats.avgTimeToDeposit || 'N/A',
		avgTimeToTrade: affiliateStats.avgTimeToTrade || 'N/A',
		topPerformingSource: affiliateStats.topPerformingSource || 'N/A'
	};

	onMount(async () => {
		console.log('🟣 Dashboard onMount called');

		// Safety timeout - force loading to false after 5 seconds
		const safetyTimeout = setTimeout(() => {
			if (loading) {
				console.warn('⚠️ SAFETY TIMEOUT: Forcing loading = false after 5 seconds');
				loading = false;
			}
		}, 5000);

		// Load settings in background (non-blocking)
		settingsStore.loadSettings().catch(err => {
			console.warn('Settings load failed:', err);
		});

		// Load dashboard data immediately
		console.log('🟣 About to call loadAffiliateData');
		try {
			await loadAffiliateData();
			console.log('🟣 loadAffiliateData completed, loading =', loading);
		} catch (err) {
			console.error('🔴 Exception in onMount:', err);
			loading = false;
		} finally {
			clearTimeout(safetyTimeout);
		}
	});

	async function loadAffiliateData() {
		console.log('🔵 loadAffiliateData called, setting loading = true');
		loading = true;
		error = '';

		try {
			console.log('🔵 Fetching stats from /api/stats...');
			// Fetch stats from API
			const response = await fetch('/api/stats');
			console.log('🔵 Stats response received:', response.status, response.ok);
			const result = await response.json();
			console.log('🔵 Stats result:', result);

			if (!result.success) {
				console.error('🔴 Stats API returned success=false:', result.error);
				throw new Error(result.error || 'Failed to load stats');
			}

			const { stats } = result;

			// Calculate qualified conversions (those who are in 'qualified' status)
			const qualifiedConversions = stats.leads.qualified || 0;

			// Calculate earnings based on FTD/CPA settings
			const ftdEarnings = stats.leads.deposited * ftdCpaSettings.ftdAmount;
			const cpaEarnings = qualifiedConversions * ftdCpaSettings.cpaAmount;
			const totalCommissions = ftdEarnings + cpaEarnings;

			// Update affiliate stats
			affiliateStats = {
				leadsCaptured: stats.leads.total,
				deposited: stats.leads.deposited,
				tradesMade: stats.leads.trading,
				qualifiedConversions,
				notDeposited: stats.leads.captured,
				notTraded: stats.leads.deposited - stats.leads.trading,
				notQualified: stats.leads.trading - qualifiedConversions,
				conversionRate: stats.leads.total > 0 ? Math.round((qualifiedConversions / stats.leads.total) * 100) : 0,
				totalCommissions,
				activeLeads: stats.leads.deposited + stats.leads.trading + qualifiedConversions,
				ftdEarnings,
				cpaEarnings,
				// Performance metrics from API (no longer hardcoded)
				avgTimeToDeposit: stats.performance?.avgTimeToDeposit || 'N/A',
				avgTimeToTrade: stats.performance?.avgTimeToTrade || 'N/A',
				topPerformingSource: stats.performance?.topPerformingSource || 'N/A'
			};

			// Map recent activities to conversions format
			recentConversions = stats.recentActivities.map(activity => ({
				email: activity.lead?.email || 'Unknown',
				broker: 'Unknown',
				status: activity.type.includes('deposit') ? 'deposited' :
						activity.type.includes('trade') ? 'trading' : 'captured',
				timestamp: new Date(activity.createdAt)
			}));

		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
			console.error('🔴 Error loading affiliate data:', err);
		} finally {
			console.log('🟢 Finally block reached, setting loading = false');
			loading = false;
			console.log('🟢 Loading state after finally:', loading);
		}
	}
</script>

<svelte:head>
	<title>TRENDSTEC Client Flow - Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
<div class="max-w-7xl mx-auto space-y-8">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-white">Client Flow Dashboard</h1>
		<p class="mt-2 text-gray-400">
			Track MT5 leads, deposits, trades and conversions in real-time
		</p>
	</div>

	<!-- Key Metrics Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<!-- Leads Captured -->
		<a href="/dashboard/leads" class="glass-card-ios rounded-xl p-6 shadow-sm cursor-pointer group">
			<div class="flex items-center justify-between mb-4">
				<div class="p-2 bg-gray-700 rounded-lg group-hover:scale-105 transition-transform">
					<Users class="w-6 h-6" style="color: {$theme.primary}" />
				</div>
				<span class="text-sm text-gray-400">Total</span>
			</div>
			<div class="space-y-1">
				<h3 class="text-2xl font-bold text-white">
					{affiliateStats.leadsCaptured.toLocaleString()}
				</h3>
				<p class="text-sm font-medium text-gray-300">Leads Captured</p>
			</div>
		</a>

		<!-- Deposited -->
		<a href="/dashboard/leads?filter=deposited" class="glass-card-ios rounded-xl p-6 shadow-sm cursor-pointer group">
			<div class="flex items-center justify-between mb-4">
				<div class="p-2 bg-gray-700 rounded-lg group-hover:scale-105 transition-transform">
					<CheckCircle class="w-6 h-6" style="color: {$theme.primary}" />
				</div>
				<span class="text-sm text-gray-400 font-medium">
					{affiliateStats.leadsCaptured > 0 ? Math.round((affiliateStats.deposited / affiliateStats.leadsCaptured) * 100) : 0}%
				</span>
			</div>
			<div class="space-y-1">
				<h3 class="text-2xl font-bold text-white">
					{affiliateStats.deposited.toLocaleString()}
				</h3>
				<p class="text-sm font-medium text-gray-300">Deposits Made</p>
			</div>
		</a>

		<!-- Trades Made -->
		<a href="/dashboard/leads?filter=trading" class="glass-card-ios rounded-xl p-6 shadow-sm cursor-pointer group">
			<div class="flex items-center justify-between mb-4">
				<div class="p-2 bg-gray-700 rounded-lg group-hover:scale-105 transition-transform">
					<Activity class="w-6 h-6" style="color: {$theme.primary}" />
				</div>
				<span class="text-sm text-gray-400 font-medium">
					{affiliateStats.deposited > 0 ? Math.round((affiliateStats.tradesMade / affiliateStats.deposited) * 100) : 0}%
				</span>
			</div>
			<div class="space-y-1">
				<h3 class="text-2xl font-bold text-white">
					{affiliateStats.tradesMade.toLocaleString()}
				</h3>
				<p class="text-sm font-medium text-gray-300">Trades Made</p>
			</div>
		</a>

		<!-- Total Commissions -->
		<a href="/dashboard/leads" class="glass-card-ios rounded-xl p-6 shadow-sm cursor-pointer group">
			<div class="flex items-center justify-between mb-4">
				<div class="p-2 bg-gray-700 rounded-lg group-hover:scale-105 transition-transform">
					<DollarSign class="w-6 h-6" style="color: {$theme.primary}" />
				</div>
				<TrendingUp class="w-4 h-4" style="color: {$theme.primary}" />
			</div>
			<div class="space-y-1">
				<h3 class="text-2xl font-bold text-white">
					${affiliateStats.totalCommissions.toLocaleString()}
				</h3>
				<p class="text-sm font-medium text-gray-300">Total Commissions</p>
			</div>
		</a>
	</div>

	<!-- Advanced Analytics Dashboard -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Conversion Flow Donut Chart -->
		<div class="glass-card-ios rounded-2xl p-6">
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-semibold text-white flex items-center">
					<PieChart class="w-5 h-5 mr-2" style="color: {$theme.primary}" />
					Conversion Flow
				</h3>
				<span class="text-sm text-gray-400">{conversionInsights.conversionEfficiency}% efficiency</span>
			</div>

			<!-- SVG Donut Chart -->
			<div class="flex items-center justify-center mb-6">
				<div class="relative">
					<svg width="120" height="120" class="transform -rotate-90">
						<!-- Background circle -->
						<circle cx="60" cy="60" r="50" fill="none" stroke="#333" stroke-width="8"/>

						<!-- Qualified conversions (green segment) -->
						<circle
							cx="60"
							cy="60"
							r="50"
							fill="none"
							stroke="{$theme.primary}"
							stroke-width="8"
							stroke-dasharray="{(conversionInsights.qualifiedConversions / affiliateStats.leadsCaptured) * 314} 314"
							stroke-dashoffset="0"
							class="transition-all duration-1000"
						/>

						<!-- Deposited only (orange segment) -->
						<circle
							cx="60"
							cy="60"
							r="50"
							fill="none"
							stroke="#fb923c"
							stroke-width="8"
							stroke-dasharray="{(conversionInsights.depositedOnly / affiliateStats.leadsCaptured) * 314} 314"
							stroke-dashoffset="-{(conversionInsights.qualifiedConversions / affiliateStats.leadsCaptured) * 314}"
							class="transition-all duration-1000"
						/>
					</svg>

					<!-- Center text -->
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="text-center">
							<div class="text-2xl font-bold text-white">{affiliateStats.leadsCaptured}</div>
							<div class="text-xs text-gray-400">Total Leads</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Legend -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 rounded-full" style="background-color: {$theme.primary}"></div>
						<span class="text-sm text-gray-300">Qualified Conversions</span>
					</div>
					<span class="text-sm font-semibold text-white">{conversionInsights.qualifiedConversions}</span>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 rounded-full bg-orange-400"></div>
						<span class="text-sm text-gray-300">Deposited Only</span>
					</div>
					<span class="text-sm font-semibold text-white">{conversionInsights.depositedOnly}</span>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 rounded-full bg-gray-600"></div>
						<span class="text-sm text-gray-300">Pending Activation</span>
					</div>
					<span class="text-sm font-semibold text-white">{conversionInsights.pendingActivation}</span>
				</div>
			</div>
		</div>

		<!-- Performance Metrics -->
		<div class="glass-card-ios rounded-2xl p-6">
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-semibold text-white flex items-center">
					<BarChart3 class="w-5 h-5 mr-2" style="color: {$theme.primary}" />
					Key Metrics
				</h3>
				<Zap class="w-4 h-4" style="color: {$theme.primary}" />
			</div>

			<div class="space-y-5">
				<!-- Deposit Rate -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-gray-300">Deposit Rate</span>
						<span class="text-sm font-bold text-white">{conversionInsights.depositRate}%</span>
					</div>
					<div class="w-full bg-gray-700 rounded-full h-2">
						<div
							class="h-2 rounded-full bg-gradient-to-r {themeClasses.primaryGradient} transition-all duration-1000"
							style="width: {conversionInsights.depositRate}%"
						></div>
					</div>
				</div>

				<!-- Activation Rate -->
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-gray-300">Activation Rate</span>
						<span class="text-sm font-bold text-white">{conversionInsights.activationRate}%</span>
					</div>
					<div class="w-full bg-gray-700 rounded-full h-2">
						<div
							class="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-1000"
							style="width: {conversionInsights.activationRate}%"
						></div>
					</div>
				</div>

				<!-- Revenue per Lead -->
				<div class="pt-3 border-t border-gray-700">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-300">Revenue/Lead</span>
						<span class="text-lg font-bold" style="color: {$theme.primary}">${conversionInsights.revenuePerLead}</span>
					</div>
				</div>

				<!-- Time to Deposit -->
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-300">Avg. Time to Deposit</span>
					<span class="text-sm font-semibold text-white">{conversionInsights.avgTimeToDeposit}</span>
				</div>

				<!-- Time to Trade -->
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-300">Avg. Time to Trade</span>
					<span class="text-sm font-semibold text-white">{conversionInsights.avgTimeToTrade}</span>
				</div>
			</div>
		</div>

		<!-- Quick Actions & Insights -->
		<div class="glass-card-ios rounded-2xl p-6">
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-semibold text-white flex items-center">
					<Target class="w-5 h-5 mr-2" style="color: {$theme.primary}" />
					Action Items
				</h3>
			</div>

			<div class="space-y-4">
				<!-- Follow-up needed -->
				<div class="glass-card-ios p-4 rounded-xl">
					<div class="flex items-start justify-between">
						<div>
							<div class="text-white font-medium">Follow-up Needed</div>
							<div class="text-sm text-gray-400 mt-1">{conversionInsights.pendingActivation} leads haven't deposited</div>
						</div>
						<div class="text-2xl font-bold" style="color: {$theme.primary}">{conversionInsights.pendingActivation}</div>
					</div>
				</div>

				<!-- Activation help -->
				<div class="glass-card-ios p-4 rounded-xl">
					<div class="flex items-start justify-between">
						<div>
							<div class="text-white font-medium">Activation Help</div>
							<div class="text-sm text-gray-400 mt-1">{conversionInsights.depositedOnly} deposited but not trading</div>
						</div>
						<div class="text-2xl font-bold text-yellow-400">{conversionInsights.depositedOnly}</div>
					</div>
				</div>

				<!-- Top performing source -->
				<div class="glass-card-ios p-4 rounded-xl">
					<div class="flex items-start justify-between">
						<div>
							<div class="text-white font-medium">Top Source</div>
							<div class="text-sm text-gray-400 mt-1">{conversionInsights.topPerformingSource}</div>
						</div>
						<div class="text-lg font-bold" style="color: {$theme.primary}">#{1}</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- FTD & CPA Earnings Breakdown -->
	<div class="glass-card-ios rounded-xl p-6 shadow-sm">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold text-white">Earnings Breakdown</h3>
			<a href="/dashboard/settings" class="text-gray-400 hover:text-gray-300 text-sm font-medium">
				Configure Rates →
			</a>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- FTD Earnings -->
			<div class="glass-card-ios p-4 rounded-lg">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center space-x-2">
						<CheckCircle class="w-5 h-5" style="color: {$theme.primary}" />
						<span class="font-medium text-white">FTD Earnings</span>
					</div>
					<span class="text-xs text-gray-400">${ftdCpaSettings.ftdAmount} each</span>
				</div>
				<div class="space-y-2">
					<div class="text-2xl font-bold text-white">${affiliateStats.ftdEarnings.toLocaleString()}</div>
					<div class="text-sm text-gray-400">
						{affiliateStats.deposited} deposits × ${ftdCpaSettings.ftdAmount}
					</div>
				</div>
			</div>

			<!-- CPA Earnings -->
			<div class="glass-card-ios p-4 rounded-lg">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center space-x-2">
						<Users class="w-5 h-5" style="color: {$theme.primary}" />
						<span class="font-medium text-white">CPA Earnings</span>
					</div>
					<span class="text-xs text-gray-400">${ftdCpaSettings.cpaAmount} each</span>
				</div>
				<div class="space-y-2">
					<div class="text-2xl font-bold text-white">${affiliateStats.cpaEarnings.toLocaleString()}</div>
					<div class="text-sm text-gray-400">
						{affiliateStats.leadsCaptured} leads × ${ftdCpaSettings.cpaAmount}
					</div>
				</div>
			</div>

			<!-- Total Earnings -->
			<div class="glass-card-ios p-4 rounded-lg">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center space-x-2">
						<DollarSign class="w-5 h-5 text-gray-400" />
						<span class="font-medium text-white">Total Earned</span>
					</div>
					<TrendingUp class="w-4 h-4" style="color: {$theme.primary}" />
				</div>
				<div class="space-y-2">
					<div class="text-2xl font-bold text-white">${affiliateStats.totalCommissions.toLocaleString()}</div>
					<div class="text-sm text-gray-400">
						FTD + CPA combined
					</div>
				</div>
			</div>
		</div>

		<!-- Conversion Rates -->
		<div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="glass-card-ios p-3 rounded-lg">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-gray-300">Lead to Deposit Rate</span>
					<span class="text-lg font-bold text-white">
						{affiliateStats.leadsCaptured > 0 ? Math.round((affiliateStats.deposited / affiliateStats.leadsCaptured) * 100) : 0}%
					</span>
				</div>
			</div>
			<div class="glass-card-ios p-3 rounded-lg">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-gray-300">Avg Earnings per Lead</span>
					<span class="text-lg font-bold text-white">
						${affiliateStats.leadsCaptured > 0 ? Math.round(affiliateStats.totalCommissions / affiliateStats.leadsCaptured) : 0}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Conversions -->
	<div class="glass-card-ios rounded-xl p-6 shadow-sm">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-lg font-semibold text-white">Recent Conversions</h3>
			<a href="/dashboard/leads" class="text-gray-400 hover:text-gray-300 text-sm font-medium">
				View All Leads →
			</a>
		</div>

		{#if recentConversions.length > 0}
			<div class="space-y-3">
				{#each recentConversions.slice(0, 5) as conversion}
					<div class="flex items-center justify-between p-3 bg-black rounded-lg">
						<div class="flex items-center space-x-3">
							<div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
								<span class="text-white text-sm font-medium">
									{conversion.email.charAt(0).toUpperCase()}
								</span>
							</div>
							<div>
								<p class="font-medium text-white">{conversion.email}</p>
								<p class="text-sm text-gray-400">
									{conversion.broker} • {conversion.status}
								</p>
							</div>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium text-white">
								{new Date(conversion.timestamp).toLocaleDateString()}
							</p>
							<div class="flex items-center space-x-1">
								{#if conversion.status === 'deposited'}
									<CheckCircle class="w-4 h-4 text-gray-400" />
									<span class="text-xs text-gray-400">Deposited</span>
								{:else if conversion.status === 'trading'}
									<Activity class="w-4 h-4 text-gray-400" />
									<span class="text-xs text-gray-400">Trading</span>
								{:else}
									<Clock class="w-4 h-4" style="color: {$theme.primary}" />
									<span class="text-xs" style="color: {$theme.primary}">Pending</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-8">
				<Users class="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p class="text-gray-400">No recent conversions to display</p>
			</div>
		{/if}
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="glass-card-ios rounded-xl p-4 border border-red-500/20">
			<div class="flex items-center space-x-3">
				<AlertTriangle class="w-5 h-5 text-red-500" />
				<div>
					<h4 class="font-medium text-white">Error Loading Dashboard</h4>
					<p class="text-sm text-gray-400 mt-1">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Quick Actions -->
	<div class="bg-black rounded-xl p-6 shadow-sm border border-gray-700">
		<h3 class="text-lg font-semibold text-white mb-4">Quick Actions</h3>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<a
				href="/dashboard/forms"
				class="inline-flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
			>
				<Users class="w-4 h-4 mr-2" />
				Capture New Leads
			</a>
			<a
				href="/dashboard/leads"
				class="inline-flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
			>
				<Activity class="w-4 h-4 mr-2" />
				Track Conversions
			</a>
			<button
				on:click={async () => {
					const res = await fetch('/api/scraper/run', { method: 'POST', body: JSON.stringify({}) });
					const result = await res.json();
					if (result.success) {
						await loadAffiliateData();
					}
				}}
				class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
			>
				<Target class="w-4 h-4 mr-2" />
				Scrape MT5 Data
			</button>
			<button
				on:click={loadAffiliateData}
				class="inline-flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
			>
				<TrendingUp class="w-4 h-4 mr-2" />
				Refresh Data
			</button>
		</div>
	</div>
</div>
</div>

<!-- Cache verification timestamp (hidden in production) -->
<div class="text-center py-4">
	<span class="text-xs text-gray-600">Build: {buildTime}</span>
</div>

<!-- Loading overlay removed - data loads in background -->