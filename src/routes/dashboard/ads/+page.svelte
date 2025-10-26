<script lang="ts">
	import { onMount } from 'svelte';
	import { TrendingUp, Zap, DollarSign, Users, Target, AlertCircle, CheckCircle, Plus, Play, Pause, BarChart3, Rocket, Settings, FileText, ExternalLink, Sparkles, ArrowRight, HelpCircle } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	$: themeClasses = getThemeClasses($theme);

	// State
	let loading = true;
	let activeTab: 'overview' | 'setup' | 'campaigns' | 'templates' = 'overview';
	let adAccount: any = null;
	let campaigns: any[] = [];
	let templates: any[] = [];
	let spendStats = {
		today: 0,
		month: 0,
		totalLeads: 0,
		avgCpl: 0
	};

	// Setup mode: 'simple' for beginners, 'advanced' for manual token
	let setupMode: 'simple' | 'advanced' = 'simple';
	let accessToken = '';
	let connecting = false;
	let setupError = '';
	let setupSuccess = false;

	onMount(async () => {
		await loadData();

		// Check for OAuth callback success/error
		const urlParams = new URLSearchParams(window.location.search);
		const successParam = urlParams.get('success');
		const errorParam = urlParams.get('error');

		if (successParam === 'connected') {
			setupSuccess = true;
			// Clear URL params
			window.history.replaceState({}, '', '/dashboard/ads');
		} else if (errorParam) {
			setupError = getErrorMessage(errorParam);
			activeTab = 'setup';
		}
	});

	function getErrorMessage(error: string): string {
		const messages: Record<string, string> = {
			'oauth_failed': 'Failed to connect with Facebook. Please try again.',
			'access_denied': 'You denied access to Facebook. Please accept to continue.',
			'invalid_callback': 'Invalid OAuth callback. Please try connecting again.',
			'token_exchange_failed': 'Failed to get access token from Facebook.',
			'callback_failed': 'OAuth callback error. Please try again.'
		};
		return messages[error] || 'An error occurred during connection.';
	}

	async function loadData() {
		loading = true;
		try {
			const accountRes = await fetch('/api/facebook/account');
			if (accountRes.ok) {
				const data = await accountRes.json();
				adAccount = data.account;

				// Auto-route based on setup status
				if (!adAccount?.isConnected) {
					activeTab = 'setup';
				} else if (adAccount.setupTier < 3) {
					activeTab = 'setup';
				} else {
					activeTab = 'overview';
				}
			}

			if (adAccount?.isConnected) {
				const [campaignsRes, statsRes, templatesRes] = await Promise.all([
					fetch('/api/facebook/campaigns'),
					fetch('/api/facebook/stats'),
					fetch('/api/facebook/templates')
				]);

				if (campaignsRes.ok) {
					const data = await campaignsRes.json();
					campaigns = data.campaigns || [];
				}
				if (statsRes.ok) {
					const data = await statsRes.json();
					spendStats = data.stats || spendStats;
				}
				if (templatesRes.ok) {
					const data = await templatesRes.json();
					templates = data.templates || [];
				}
			}
		} catch (err) {
			console.error('Failed to load data:', err);
		} finally {
			loading = false;
		}
	}

	// Simple OAuth connection (one-click for beginners)
	function connectWithFacebook() {
		console.log('🔵 Connect with Facebook clicked');
		connecting = true;

		try {
			console.log('🔵 Redirecting to /api/facebook/auth');
			window.location.href = '/api/facebook/auth';
		} catch (error) {
			console.error('❌ Redirect error:', error);
			connecting = false;
			setupError = 'Failed to redirect. Please try again.';
		}
	}

	// Advanced manual token connection
	async function connectWithToken() {
		if (!accessToken || accessToken.length < 50) {
			setupError = 'Please enter a valid access token';
			return;
		}

		connecting = true;
		setupError = '';

		try {
			const res = await fetch('/api/facebook/connect-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accessToken })
			});

			const data = await res.json();

			if (data.success) {
				setupSuccess = true;
				await loadData();

				if (data.setupTier === 3) {
					activeTab = 'overview';
				}
			} else {
				setupError = data.error || 'Failed to connect';
			}
		} catch (err) {
			setupError = 'Connection failed. Please try again.';
		} finally {
			connecting = false;
		}
	}

	function getSetupStepStatus(tier: number) {
		if (!adAccount) return 'pending';
		if (adAccount.setupTier >= tier) return 'complete';
		if (adAccount.setupTier === tier - 1) return 'current';
		return 'pending';
	}

	// Check setup progress after completing manual steps
	async function checkSetupProgress() {
		connecting = true;
		setupError = '';

		try {
			// Re-fetch account info to get updated setup tier
			await loadData();

			if (adAccount?.setupTier === 3) {
				setupSuccess = true;
				activeTab = 'overview';
			} else {
				setupError = 'Setup not complete yet. Please finish all steps in Facebook.';
			}
		} catch (err) {
			setupError = 'Failed to check setup status.';
		} finally {
			connecting = false;
		}
	}
</script>

<div class="p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-white flex items-center">
				<TrendingUp class="w-8 h-8 mr-3 {themeClasses.primary}" />
				Facebook Ads Manager
			</h1>
			<p class="text-gray-400 mt-1">Launch campaigns in minutes - no experience needed</p>
		</div>
		{#if adAccount?.isConnected && adAccount?.setupTier === 3}
			<button
				class="flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
			>
				<Plus class="w-5 h-5 mr-2" />
				New Campaign
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="glass-card-ios rounded-2xl p-12 text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
			<p class="text-gray-400">Loading your ads dashboard...</p>
		</div>
	{:else}
		<!-- Tab Navigation -->
		<div class="glass-card-ios rounded-2xl overflow-hidden">
			<div class="flex border-b border-white/10">
				<button
					on:click={() => activeTab = 'overview'}
					class="flex-1 px-6 py-4 text-center transition-all {activeTab === 'overview' ? 'bg-gradient-to-r ' + themeClasses.primaryGradient + ' text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
				>
					<BarChart3 class="w-5 h-5 mx-auto mb-1" />
					Overview
				</button>
				<button
					on:click={() => activeTab = 'setup'}
					class="flex-1 px-6 py-4 text-center transition-all {activeTab === 'setup' ? 'bg-gradient-to-r ' + themeClasses.primaryGradient + ' text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
				>
					<Settings class="w-5 h-5 mx-auto mb-1" />
					{#if !adAccount?.isConnected}
						Get Started
					{:else if adAccount?.setupTier < 3}
						Setup ({adAccount.setupTier}/3)
					{:else}
						Setup ✓
					{/if}
				</button>
				<button
					on:click={() => activeTab = 'campaigns'}
					class="flex-1 px-6 py-4 text-center transition-all {activeTab === 'campaigns' ? 'bg-gradient-to-r ' + themeClasses.primaryGradient + ' text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
					disabled={!adAccount?.isConnected}
				>
					<Rocket class="w-5 h-5 mx-auto mb-1" />
					My Campaigns
				</button>
				<button
					on:click={() => activeTab = 'templates'}
					class="flex-1 px-6 py-4 text-center transition-all {activeTab === 'templates' ? 'bg-gradient-to-r ' + themeClasses.primaryGradient + ' text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'}"
				>
					<FileText class="w-5 h-5 mx-auto mb-1" />
					Templates
				</button>
			</div>

			<div class="p-6">
				<!-- OVERVIEW TAB -->
				{#if activeTab === 'overview'}
					{#if !adAccount?.isConnected}
						<div class="text-center py-16">
							<div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
								<Sparkles class="w-12 h-12 text-white" />
							</div>
							<h2 class="text-3xl font-bold text-white mb-4">Welcome to Ads Manager!</h2>
							<p class="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
								Never run Facebook ads before? No problem! We'll guide you through everything step-by-step.
							</p>
							<button
								on:click={() => activeTab = 'setup'}
								class="inline-flex items-center px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
							>
								Get Started
								<ArrowRight class="w-6 h-6 ml-2" />
							</button>
						</div>
					{:else}
						<!-- Stats Cards -->
						<div class="grid grid-cols-4 gap-4 mb-6">
							<div class="bg-black/30 rounded-xl p-6 hover:bg-black/40 transition-colors">
								<div class="flex items-center justify-between mb-2">
									<p class="text-gray-400 text-sm">Today's Spend</p>
									<DollarSign class="w-5 h-5 text-green-400" />
								</div>
								<p class="text-3xl font-bold text-white">${spendStats.today.toFixed(2)}</p>
								<p class="text-xs text-gray-500 mt-1">Active campaigns: {campaigns.filter(c => c.status === 'ACTIVE').length}</p>
							</div>

							<div class="bg-black/30 rounded-xl p-6 hover:bg-black/40 transition-colors">
								<div class="flex items-center justify-between mb-2">
									<p class="text-gray-400 text-sm">This Month</p>
									<BarChart3 class="w-5 h-5 {themeClasses.primary}" />
								</div>
								<p class="text-3xl font-bold text-white">${spendStats.month.toFixed(2)}</p>
								<p class="text-xs text-gray-500 mt-1">Total campaigns: {campaigns.length}</p>
							</div>

							<div class="bg-black/30 rounded-xl p-6 hover:bg-black/40 transition-colors">
								<div class="flex items-center justify-between mb-2">
									<p class="text-gray-400 text-sm">Total Leads</p>
									<Users class="w-5 h-5 text-blue-400" />
								</div>
								<p class="text-3xl font-bold text-white">{spendStats.totalLeads}</p>
								<p class="text-xs text-gray-500 mt-1">Conversion rate: {spendStats.totalLeads > 0 ? ((spendStats.totalLeads / campaigns.reduce((acc, c) => acc + c.clicks, 0)) * 100).toFixed(1) : 0}%</p>
							</div>

							<div class="bg-black/30 rounded-xl p-6 hover:bg-black/40 transition-colors">
								<div class="flex items-center justify-between mb-2">
									<p class="text-gray-400 text-sm">Cost Per Lead</p>
									<Target class="w-5 h-5 text-purple-400" />
								</div>
								<p class="text-3xl font-bold text-white">${spendStats.avgCpl.toFixed(2)}</p>
								<p class="text-xs text-gray-500 mt-1">Target: $15.00</p>
							</div>
						</div>

						<!-- Quick Actions -->
						<div class="grid grid-cols-3 gap-4 mb-6">
							<button
								on:click={() => activeTab = 'templates'}
								class="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/40 transition-all text-left"
							>
								<Sparkles class="w-8 h-8 text-orange-400 mb-3" />
								<h3 class="text-white font-semibold mb-1">Launch Campaign</h3>
								<p class="text-sm text-gray-400">Start from a template</p>
							</button>

							<button
								on:click={() => activeTab = 'campaigns'}
								class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-all text-left"
							>
								<BarChart3 class="w-8 h-8 text-blue-400 mb-3" />
								<h3 class="text-white font-semibold mb-1">View Reports</h3>
								<p class="text-sm text-gray-400">Track performance</p>
							</button>

							<button
								class="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition-all text-left"
							>
								<Target class="w-8 h-8 text-green-400 mb-3" />
								<h3 class="text-white font-semibold mb-1">Optimize Ads</h3>
								<p class="text-sm text-gray-400">AI recommendations</p>
							</button>
						</div>

						<!-- Recent Campaigns -->
						<div class="bg-black/30 rounded-xl p-6">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-lg font-bold text-white">Recent Campaigns</h3>
								<button
									on:click={() => activeTab = 'campaigns'}
									class="text-sm {themeClasses.primary} hover:underline"
								>
									View All
								</button>
							</div>

							{#if campaigns.length === 0}
								<div class="text-center py-8">
									<Rocket class="w-12 h-12 text-gray-500 mx-auto mb-4" />
									<p class="text-gray-400 mb-4">No campaigns yet</p>
									<button
										on:click={() => activeTab = 'templates'}
										class="px-6 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
									>
										Create Your First Campaign
									</button>
								</div>
							{:else}
								<div class="space-y-3">
									{#each campaigns.slice(0, 5) as campaign}
										<div class="flex items-center justify-between p-4 bg-black/40 rounded-lg hover:bg-black/50 transition-colors">
											<div class="flex-1">
												<h4 class="text-white font-medium mb-1">{campaign.name}</h4>
												<p class="text-sm text-gray-400">
													{campaign.status} •
													{campaign.impressions.toLocaleString()} impressions •
													{campaign.clicks.toLocaleString()} clicks
												</p>
											</div>
											<div class="text-right">
												<p class="text-white font-medium">${campaign.totalSpent.toFixed(2)}</p>
												<p class="text-sm text-gray-400">{campaign.leads} leads</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

				<!-- SETUP TAB -->
				{:else if activeTab === 'setup'}
					<div class="max-w-4xl mx-auto">
						{#if !adAccount?.isConnected}
							<!-- Beginner-Friendly Connection -->
							<div class="text-center mb-8">
								<div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
									<Sparkles class="w-10 h-10 text-white" />
								</div>
								<h2 class="text-3xl font-bold text-white mb-4">Let's Connect Your Facebook Account</h2>
								<p class="text-gray-400 text-lg mb-2">This takes about 2 minutes</p>
								<p class="text-sm text-gray-500">We'll handle all the technical stuff for you</p>
							</div>

							<!-- Mode Toggle -->
							<div class="bg-black/30 rounded-xl p-2 mb-8 flex items-center justify-center space-x-2">
								<button
									on:click={() => setupMode = 'simple'}
									class="flex-1 px-6 py-3 rounded-lg transition-all {setupMode === 'simple' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-white'}"
								>
									<Sparkles class="w-5 h-5 inline-block mr-2" />
									Beginner (Recommended)
								</button>
								<button
									on:click={() => setupMode = 'advanced'}
									class="flex-1 px-6 py-3 rounded-lg transition-all {setupMode === 'advanced' ? 'bg-gray-700 text-white font-semibold' : 'text-gray-400 hover:text-white'}"
								>
									<Settings class="w-5 h-5 inline-block mr-2" />
									Advanced (Manual Token)
								</button>
							</div>

							{#if setupMode === 'simple'}
								<!-- SIMPLE MODE: One-Click OAuth -->
								<div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl p-8 space-y-6">
									<div class="bg-white/5 rounded-xl p-6">
										<h3 class="text-xl font-bold text-white mb-4 flex items-center">
											<CheckCircle class="w-6 h-6 text-green-400 mr-2" />
											What You Get
										</h3>
										<ul class="space-y-3">
											<li class="flex items-start text-gray-300">
												<CheckCircle class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
												<span><strong class="text-white">Automatic Setup:</strong> We'll create everything you need (Page, Business Manager, Ad Account)</span>
											</li>
											<li class="flex items-start text-gray-300">
												<CheckCircle class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
												<span><strong class="text-white">Easy Management:</strong> Track all your ads from this dashboard</span>
											</li>
											<li class="flex items-start text-gray-300">
												<CheckCircle class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
												<span><strong class="text-white">Pre-Made Templates:</strong> Launch campaigns in minutes with proven templates</span>
											</li>
											<li class="flex items-start text-gray-300">
												<CheckCircle class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
												<span><strong class="text-white">AI Optimization:</strong> We'll automatically optimize your ads for better results</span>
											</li>
										</ul>
									</div>

									<div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
										<div class="flex items-start">
											<HelpCircle class="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
											<div>
												<p class="text-yellow-200 font-medium mb-1">First time running ads?</p>
												<p class="text-yellow-200/80 text-sm">
													Don't worry! After connecting, we'll walk you through creating your first Facebook Page and setting up billing.
													You won't be charged until you actually run an ad.
												</p>
											</div>
										</div>
									</div>

									<button
										on:click={connectWithFacebook}
										disabled={connecting}
										class="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{#if connecting}
											<div class="flex items-center justify-center">
												<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
												Connecting...
											</div>
										{:else}
											<div class="flex items-center justify-center">
												<svg class="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 24 24">
													<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
												</svg>
												Connect with Facebook
											</div>
										{/if}
									</button>

									<p class="text-center text-sm text-gray-500">
										Secure connection via Facebook • We'll never post without your permission
									</p>
								</div>

							{:else}
								<!-- ADVANCED MODE: Manual Token -->
								<div class="bg-black/30 rounded-xl p-6 space-y-6">
									<div class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
										<p class="text-orange-200 text-sm">
											<strong>Advanced Mode:</strong> This requires creating a System User Token in Facebook Business Manager.
											Only use this if you already have experience with Facebook Ads Manager.
										</p>
									</div>

									<div class="space-y-4">
										<div class="bg-black/40 rounded-lg p-4">
											<div class="flex items-center justify-between mb-2">
												<h4 class="text-white font-medium">Step 1: Create System User</h4>
												<a
													href="https://business.facebook.com/settings/system-users"
													target="_blank"
													class="text-sm text-blue-400 hover:text-blue-300 flex items-center"
												>
													Open Business Manager
													<ExternalLink class="w-4 h-4 ml-1" />
												</a>
											</div>
											<p class="text-sm text-gray-400">Create a new System User with Admin role</p>
										</div>

										<div class="bg-black/40 rounded-lg p-4">
											<h4 class="text-white font-medium mb-2">Step 2: Generate Token</h4>
											<p class="text-sm text-gray-400 mb-2">Required permissions:</p>
											<div class="grid grid-cols-2 gap-2 text-xs">
												<span class="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">ads_management</span>
												<span class="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">ads_read</span>
												<span class="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">business_management</span>
												<span class="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">pages_read_engagement</span>
											</div>
										</div>
									</div>

									<div>
										<label for="token-input" class="block text-white font-medium mb-2">Paste Your Access Token</label>
										<textarea
											id="token-input"
											bind:value={accessToken}
											placeholder="EAAG..."
											rows="4"
											class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
										></textarea>
									</div>

									{#if setupError}
										<div class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
											<AlertCircle class="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
											<p class="text-red-400 text-sm">{setupError}</p>
										</div>
									{/if}

									{#if setupSuccess}
										<div class="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center">
											<CheckCircle class="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
											<p class="text-green-400 text-sm">Connected! Checking your setup...</p>
										</div>
									{/if}

									<button
										on:click={connectWithToken}
										disabled={connecting || !accessToken}
										class="w-full px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{#if connecting}
											<div class="flex items-center justify-center">
												<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
												Connecting...
											</div>
										{:else}
											Connect Ad Account
										{/if}
									</button>
								</div>
							{/if}

						{:else}
							<!-- Connected - Show Setup Progress -->
							<div class="space-y-6">
								<div class="bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex items-center">
									<CheckCircle class="w-8 h-8 text-green-400 mr-4 flex-shrink-0" />
									<div>
										<h3 class="text-xl font-bold text-white">Facebook Connected!</h3>
										<p class="text-gray-400">Now let's finish setting up your ad account</p>
									</div>
								</div>

								<!-- Progress Steps with Simple Language -->
								<div class="space-y-4">
									<!-- Step 1: Facebook Page -->
									<div class="bg-black/30 rounded-xl p-6 {getSetupStepStatus(1) === 'complete' ? 'border-2 border-green-500/30' : getSetupStepStatus(1) === 'current' ? 'border-2 border-orange-500/50' : ''}">
										<div class="flex items-center justify-between">
											<div class="flex items-center flex-1">
												<div class="w-12 h-12 rounded-full {getSetupStepStatus(1) === 'complete' ? 'bg-green-500' : getSetupStepStatus(1) === 'current' ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'} text-white flex items-center justify-center mr-4 flex-shrink-0">
													{#if getSetupStepStatus(1) === 'complete'}
														<CheckCircle class="w-6 h-6" />
													{:else}
														<span class="text-lg font-bold">1</span>
													{/if}
												</div>
												<div class="flex-1">
													<h4 class="text-white font-medium text-lg mb-1">Create a Facebook Page</h4>
													<p class="text-sm text-gray-400">This is where your ads will come from (like "Joe's Pizza" or "Best Fitness Gym")</p>
												</div>
											</div>
											{#if getSetupStepStatus(1) !== 'complete'}
												<a
													href="https://www.facebook.com/pages/create"
													target="_blank"
													class="ml-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center flex-shrink-0"
												>
													Create Page
													<ExternalLink class="w-4 h-4 ml-2" />
												</a>
											{/if}
										</div>
									</div>

									<!-- Step 2: Business Manager -->
									<div class="bg-black/30 rounded-xl p-6 {getSetupStepStatus(2) === 'complete' ? 'border-2 border-green-500/30' : getSetupStepStatus(2) === 'current' ? 'border-2 border-orange-500/50' : ''}">
										<div class="flex items-center justify-between">
											<div class="flex items-center flex-1">
												<div class="w-12 h-12 rounded-full {getSetupStepStatus(2) === 'complete' ? 'bg-green-500' : getSetupStepStatus(2) === 'current' ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'} text-white flex items-center justify-center mr-4 flex-shrink-0">
													{#if getSetupStepStatus(2) === 'complete'}
														<CheckCircle class="w-6 h-6" />
													{:else}
														<span class="text-lg font-bold">2</span>
													{/if}
												</div>
												<div class="flex-1">
													<h4 class="text-white font-medium text-lg mb-1">Set Up Business Account</h4>
													<p class="text-sm text-gray-400">This is Facebook's tool for managing your ads professionally</p>
												</div>
											</div>
											{#if getSetupStepStatus(2) !== 'complete'}
												<a
													href="https://business.facebook.com/overview"
													target="_blank"
													class="ml-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center flex-shrink-0"
												>
													Set Up Business
													<ExternalLink class="w-4 h-4 ml-2" />
												</a>
											{/if}
										</div>
									</div>

									<!-- Step 3: Ad Account & Payment -->
									<div class="bg-black/30 rounded-xl p-6 {getSetupStepStatus(3) === 'complete' ? 'border-2 border-green-500/30' : getSetupStepStatus(3) === 'current' ? 'border-2 border-orange-500/50' : ''}">
										<div class="flex items-center justify-between">
											<div class="flex items-center flex-1">
												<div class="w-12 h-12 rounded-full {getSetupStepStatus(3) === 'complete' ? 'bg-green-500' : getSetupStepStatus(3) === 'current' ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'} text-white flex items-center justify-center mr-4 flex-shrink-0">
													{#if getSetupStepStatus(3) === 'complete'}
														<CheckCircle class="w-6 h-6" />
													{:else}
														<span class="text-lg font-bold">3</span>
													{/if}
												</div>
												<div class="flex-1">
													<h4 class="text-white font-medium text-lg mb-1">Add Payment Method</h4>
													<p class="text-sm text-gray-400">Connect your credit card (you only pay when people see your ads)</p>
												</div>
											</div>
											{#if getSetupStepStatus(3) !== 'complete'}
												<div class="ml-4 flex space-x-2 flex-shrink-0">
													<a
														href="https://business.facebook.com/settings/ad-accounts"
														target="_blank"
														class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
													>
														Create Ad Account
														<ExternalLink class="w-4 h-4 ml-2" />
													</a>
													<a
														href="https://business.facebook.com/billing_hub/payment_settings"
														target="_blank"
														class="px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
													>
														Add Card
														<ExternalLink class="w-4 h-4 ml-2" />
													</a>
												</div>
											{/if}
										</div>
									</div>
								</div>

								<button
									on:click={checkSetupProgress}
									disabled={connecting}
									class="w-full px-6 py-4 bg-black/40 hover:bg-black/50 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
								>
									{#if connecting}
										<div class="flex items-center justify-center">
											<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
											Checking...
										</div>
									{:else}
										I've Completed These Steps - Check My Setup
									{/if}
								</button>

								{#if adAccount?.setupTier === 3}
									<div class="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-2 border-green-500/30 rounded-2xl p-8 text-center">
										<div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
											<CheckCircle class="w-10 h-10 text-white" />
										</div>
										<h3 class="text-2xl font-bold text-white mb-2">You're All Set! 🎉</h3>
										<p class="text-gray-400 mb-6">Your ad account is ready. Time to launch your first campaign!</p>
										<button
											on:click={() => activeTab = 'templates'}
											class="px-10 py-4 bg-gradient-to-r {themeClasses.primaryGradient} text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-opacity"
										>
											Browse Campaign Templates
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</div>

				<!-- CAMPAIGNS TAB -->
				{:else if activeTab === 'campaigns'}
					{#if campaigns.length === 0}
						<div class="text-center py-16">
							<Rocket class="w-20 h-20 text-gray-500 mx-auto mb-4" />
							<h3 class="text-2xl font-bold text-white mb-2">No Campaigns Yet</h3>
							<p class="text-gray-400 mb-6">Launch your first campaign using one of our beginner-friendly templates</p>
							<button
								on:click={() => activeTab = 'templates'}
								class="px-10 py-4 bg-gradient-to-r {themeClasses.primaryGradient} text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-opacity"
							>
								Browse Templates
							</button>
						</div>
					{:else}
						<div class="space-y-4">
							{#each campaigns as campaign}
								<div class="bg-black/30 rounded-xl p-6 hover:bg-black/40 transition-colors border border-white/5">
									<div class="flex items-center justify-between mb-4">
										<div class="flex-1">
											<h3 class="text-xl font-bold text-white mb-1">{campaign.name}</h3>
											<p class="text-sm text-gray-400">{campaign.objective} • Started {new Date(campaign.createdAt).toLocaleDateString()}</p>
										</div>
										<div class="flex items-center space-x-3">
											<span class="px-3 py-1 text-sm font-semibold rounded-full {campaign.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}">
												{campaign.status}
											</span>
											<button class="p-2 hover:bg-white/10 rounded-lg transition-colors">
												{#if campaign.status === 'ACTIVE'}
													<Pause class="w-6 h-6 text-gray-400" />
												{:else}
													<Play class="w-6 h-6 text-green-400" />
												{/if}
											</button>
										</div>
									</div>

									<div class="grid grid-cols-5 gap-4">
										<div>
											<p class="text-xs text-gray-500 mb-1">Budget Spent</p>
											<p class="text-lg font-bold text-white">${campaign.totalSpent.toFixed(2)}</p>
										</div>
										<div>
											<p class="text-xs text-gray-500 mb-1">People Reached</p>
											<p class="text-lg font-bold text-white">{campaign.impressions.toLocaleString()}</p>
										</div>
										<div>
											<p class="text-xs text-gray-500 mb-1">Clicks</p>
											<p class="text-lg font-bold text-white">{campaign.clicks.toLocaleString()}</p>
										</div>
										<div>
											<p class="text-xs text-gray-500 mb-1">Leads</p>
											<p class="text-lg font-bold text-white">{campaign.leads}</p>
										</div>
										<div>
											<p class="text-xs text-gray-500 mb-1">Cost/Lead</p>
											<p class="text-lg font-bold text-white">${campaign.cpl > 0 ? campaign.cpl.toFixed(2) : '—'}</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}

				<!-- TEMPLATES TAB -->
				{:else if activeTab === 'templates'}
					<div>
						<div class="mb-6">
							<h3 class="text-xl font-bold text-white mb-2">Pre-Made Campaign Templates</h3>
							<p class="text-gray-400">Choose a template designed for beginners - we've done the hard work for you</p>
						</div>

						{#if templates.length === 0}
							<div class="text-center py-12 bg-black/20 rounded-xl">
								<FileText class="w-16 h-16 text-gray-500 mx-auto mb-4" />
								<p class="text-gray-400 mb-2">No templates available yet</p>
								<p class="text-sm text-gray-500">Check back soon for beginner-friendly templates</p>
							</div>
						{:else}
							<div class="grid grid-cols-3 gap-6">
								{#each templates as template}
									<div class="bg-black/30 rounded-xl p-6 hover:bg-black/40 hover:border-orange-500/30 border-2 border-transparent transition-all cursor-pointer group">
										<div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
											<Target class="w-8 h-8 text-white" />
										</div>
										<h3 class="text-lg font-bold text-white mb-2">{template.name}</h3>
										<p class="text-sm text-gray-400 mb-4 min-h-[40px]">{template.description}</p>
										<div class="flex items-center justify-between">
											<span class="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-medium uppercase">
												{template.category}
											</span>
											<span class="text-xs text-gray-500">{template.usageCount} users</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
