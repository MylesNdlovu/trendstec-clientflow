<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { ArrowLeft, Mail, Phone, Building, Calendar, DollarSign, TrendingUp, Activity, Clock, CheckCircle } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: lead = data.lead;
	$: stats = lead.stats;

	function formatDate(date: Date | string) {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount || 0);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'captured': return 'bg-gray-500/20 text-gray-400';
			case 'deposited': return 'bg-blue-500/20 text-blue-400';
			case 'trading': return 'bg-yellow-500/20 text-yellow-400';
			case 'qualified': return 'bg-green-500/20 text-green-400';
			default: return 'bg-gray-500/20 text-gray-400';
		}
	}
</script>

<svelte:head>
	<title>{lead.firstName} {lead.lastName} - Lead Details - TRENDSTEC Client Flow</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
<div class="max-w-7xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<a
				href="/dashboard/leads"
				class="p-2 rounded-lg hover:bg-white/5 transition-colors"
			>
				<ArrowLeft class="w-5 h-5 text-gray-400" />
			</a>
			<div>
				<h1 class="text-3xl font-bold text-white">
					{lead.firstName} {lead.lastName}
				</h1>
				<p class="text-gray-400 mt-1">{lead.email}</p>
			</div>
		</div>
		<span class="px-4 py-2 rounded-lg text-sm font-medium {getStatusColor(lead.status)}">
			{lead.status.toUpperCase()}
		</span>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-400">Balance</p>
					<p class="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalBalance)}</p>
				</div>
				<DollarSign class="w-8 h-8" style="color: {$theme.primary}" />
			</div>
		</div>

		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-400">Equity</p>
					<p class="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalEquity)}</p>
				</div>
				<TrendingUp class="w-8 h-8" style="color: {$theme.primary}" />
			</div>
		</div>

		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-400">Profit/Loss</p>
					<p class="text-2xl font-bold {stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} mt-1">
						{formatCurrency(stats.totalProfit)}
					</p>
				</div>
				<Activity class="w-8 h-8" style="color: {$theme.primary}" />
			</div>
		</div>

		<div class="glass-card-ios rounded-xl p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-400">Total Volume</p>
					<p class="text-2xl font-bold text-white mt-1">{stats.totalVolume.toFixed(2)} lots</p>
				</div>
				<TrendingUp class="w-8 h-8" style="color: {$theme.primary}" />
			</div>
		</div>
	</div>

	<!-- Info Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Contact Info -->
		<div class="glass-card-ios rounded-xl p-6">
			<h2 class="text-xl font-bold text-white mb-4">Contact Information</h2>
			<div class="space-y-3">
				<div class="flex items-center space-x-3">
					<Mail class="w-5 h-5 text-gray-400" />
					<span class="text-gray-300">{lead.email}</span>
				</div>
				{#if lead.phone}
				<div class="flex items-center space-x-3">
					<Phone class="w-5 h-5 text-gray-400" />
					<span class="text-gray-300">{lead.phone}</span>
				</div>
				{/if}
				<div class="flex items-center space-x-3">
					<Building class="w-5 h-5 text-gray-400" />
					<span class="text-gray-300">{lead.broker}</span>
				</div>
				<div class="flex items-center space-x-3">
					<Calendar class="w-5 h-5 text-gray-400" />
					<span class="text-gray-300">Captured: {formatDate(lead.capturedAt)}</span>
				</div>
			</div>
		</div>

		<!-- Conversion Timeline -->
		<div class="glass-card-ios rounded-xl p-6">
			<h2 class="text-xl font-bold text-white mb-4">Conversion Timeline</h2>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<Clock class="w-5 h-5 text-gray-400" />
						<span class="text-gray-300">Captured</span>
					</div>
					<span class="text-sm text-gray-400">{formatDate(lead.capturedAt)}</span>
				</div>
				{#if lead.depositedAt}
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<DollarSign class="w-5 h-5 text-blue-400" />
						<span class="text-gray-300">Deposited</span>
					</div>
					<span class="text-sm text-gray-400">{formatDate(lead.depositedAt)}</span>
				</div>
				{/if}
				{#if lead.tradingStartAt}
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<Activity class="w-5 h-5 text-yellow-400" />
						<span class="text-gray-300">Started Trading</span>
					</div>
					<span class="text-sm text-gray-400">{formatDate(lead.tradingStartAt)}</span>
				</div>
				{/if}
				{#if lead.qualifiedAt}
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<CheckCircle class="w-5 h-5 text-green-400" />
						<span class="text-gray-300">Qualified</span>
					</div>
					<span class="text-sm text-gray-400">{formatDate(lead.qualifiedAt)}</span>
				</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- MT5 Accounts -->
	{#if lead.investorCredentials.length > 0}
	<div class="glass-card-ios rounded-xl p-6">
		<h2 class="text-xl font-bold text-white mb-4">MT5 Accounts ({stats.credentialsCount})</h2>
		<div class="space-y-4">
			{#each lead.investorCredentials as credential}
			<div class="bg-white/5 rounded-lg p-4">
				<div class="flex items-center justify-between mb-3">
					<div>
						<p class="text-white font-medium">Login: {credential.login}</p>
						<p class="text-sm text-gray-400">{credential.server} • {credential.broker}</p>
					</div>
					<span class="px-3 py-1 rounded-lg text-xs {credential.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
						{credential.isVerified ? 'Verified' : 'Unverified'}
					</span>
				</div>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<p class="text-xs text-gray-400">Balance</p>
						<p class="text-white font-medium">{formatCurrency(credential.balance || 0)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-400">Equity</p>
						<p class="text-white font-medium">{formatCurrency(credential.equity || 0)}</p>
					</div>
					<div>
						<p class="text-xs text-gray-400">Profit</p>
						<p class="font-medium {(credential.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}">
							{formatCurrency(credential.profit || 0)}
						</p>
					</div>
				</div>
				{#if credential.positions.length > 0}
				<div class="mt-3 pt-3 border-t border-white/10">
					<p class="text-sm text-gray-400 mb-2">Open Positions ({credential.positions.length})</p>
					<div class="space-y-2">
						{#each credential.positions as position}
						<div class="flex items-center justify-between text-sm">
							<div>
								<span class="text-white font-medium">{position.symbol}</span>
								<span class="text-gray-400 ml-2">{position.type} • {position.volume} lots</span>
							</div>
							<span class="font-medium {(position.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}">
								{formatCurrency(position.profit || 0)}
							</span>
						</div>
						{/each}
					</div>
				</div>
				{/if}
			</div>
			{/each}
		</div>
	</div>
	{/if}

	<!-- Activity Log -->
	{#if lead.activities.length > 0}
	<div class="glass-card-ios rounded-xl p-6">
		<h2 class="text-xl font-bold text-white mb-4">Activity History</h2>
		<div class="space-y-3">
			{#each lead.activities as activity}
			<div class="flex items-start space-x-3 pb-3 border-b border-white/10 last:border-0">
				<div class="p-2 rounded-lg bg-white/5 mt-1">
					<Activity class="w-4 h-4" style="color: {$theme.primary}" />
				</div>
				<div class="flex-1">
					<p class="text-white">{activity.description}</p>
					<p class="text-sm text-gray-400 mt-1">{formatDate(activity.createdAt)}</p>
				</div>
			</div>
			{/each}
		</div>
	</div>
	{/if}
</div>
</div>
