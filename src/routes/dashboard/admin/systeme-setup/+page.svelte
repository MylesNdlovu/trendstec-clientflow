<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle, AlertCircle, Loader, Zap, Tag, Database, Webhook, Play, RefreshCw } from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';

	$: themeClasses = getThemeClasses($theme);

	let loading = false;
	let checking = false;
	let setupResult: any = null;
	let currentStatus: any = null;
	let error = '';

	onMount(async () => {
		await checkCurrentStatus();
	});

	async function checkCurrentStatus() {
		checking = true;
		error = '';

		try {
			const response = await fetch('/api/systeme/auto-setup');
			const data = await response.json();

			if (data.success) {
				currentStatus = data;
			} else {
				error = data.error || 'Failed to check status';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to check status';
		} finally {
			checking = false;
		}
	}

	async function runAutoSetup() {
		if (!confirm('This will create tags, custom fields, and webhooks in your Systeme.io account. Continue?')) {
			return;
		}

		loading = true;
		error = '';
		setupResult = null;

		try {
			const response = await fetch('/api/systeme/auto-setup', {
				method: 'POST'
			});

			const data = await response.json();
			setupResult = data;

			if (!data.success) {
				error = data.message || data.error || 'Setup failed';
			}

			// Refresh status
			await checkCurrentStatus();

		} catch (err) {
			error = err instanceof Error ? err.message : 'Setup failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-white mb-2">Systeme.io Auto-Setup</h1>
			<p class="text-gray-400">Automatically configure Systeme.io with all required tags, custom fields, and webhooks</p>
		</div>

		<!-- Error Alert -->
		{#if error}
			<div class="mb-6 bg-red-500/10 border border-red-500 rounded-xl p-4 flex items-start gap-3">
				<AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
				<div>
					<h3 class="text-red-500 font-semibold">Error</h3>
					<p class="text-red-400 text-sm">{error}</p>
				</div>
			</div>
		{/if}

		<!-- Current Status Card -->
		{#if currentStatus}
			<div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-bold text-white flex items-center gap-2">
						<Database class="w-5 h-5" />
						Current Setup Status
					</h2>
					<button
						on:click={checkCurrentStatus}
						disabled={checking}
						class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
					>
						<RefreshCw class="w-4 h-4 {checking ? 'animate-spin' : ''}" />
						Refresh
					</button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<!-- Tags -->
					<div class="bg-slate-900/50 rounded-lg p-4">
						<div class="flex items-center gap-2 mb-2">
							<Tag class="w-4 h-4 text-blue-400" />
							<h3 class="text-sm font-semibold text-gray-400">Tags</h3>
						</div>
						<p class="text-3xl font-bold text-white">{currentStatus.counts?.tags || 0}</p>
						<p class="text-xs text-gray-500 mt-1">Existing tags in Systeme.io</p>
					</div>

					<!-- Custom Fields -->
					<div class="bg-slate-900/50 rounded-lg p-4">
						<div class="flex items-center gap-2 mb-2">
							<Database class="w-4 h-4 text-green-400" />
							<h3 class="text-sm font-semibold text-gray-400">Custom Fields</h3>
						</div>
						<p class="text-3xl font-bold text-white">{currentStatus.counts?.customFields || 0}</p>
						<p class="text-xs text-gray-500 mt-1">Existing custom fields</p>
					</div>

					<!-- Webhooks -->
					<div class="bg-slate-900/50 rounded-lg p-4">
						<div class="flex items-center gap-2 mb-2">
							<Webhook class="w-4 h-4 text-orange-400" />
							<h3 class="text-sm font-semibold text-gray-400">Webhooks</h3>
						</div>
						<p class="text-3xl font-bold text-white">{currentStatus.counts?.webhooks || 0}</p>
						<p class="text-xs text-gray-500 mt-1">Configured webhooks</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Setup Actions Card -->
		<div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
			<h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
				<Zap class="w-5 h-5 text-orange-500" />
				Auto-Setup Actions
			</h2>

			<div class="space-y-4">
				<!-- What will be created -->
				<div class="bg-slate-900/50 rounded-lg p-4">
					<h3 class="font-semibold text-white mb-3">This will create:</h3>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2 text-gray-300">
							<CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
							<span><strong>20 Tags:</strong> Deposited, Trading, Qualified, Not_Deposited, volume tiers, etc.</span>
						</li>
						<li class="flex items-start gap-2 text-gray-300">
							<CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
							<span><strong>10 Custom Fields:</strong> mt5_login, mt5_balance, mt5_total_volume, etc.</span>
						</li>
						<li class="flex items-start gap-2 text-gray-300">
							<CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
							<span><strong>1 Webhook:</strong> Configured to send contact events to ClientFlow</span>
						</li>
					</ul>
				</div>

				<!-- Run Button -->
				<button
					on:click={runAutoSetup}
					disabled={loading}
					class="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<Loader class="w-5 h-5 animate-spin" />
						<span>Setting up Systeme.io...</span>
					{:else}
						<Play class="w-5 h-5" />
						<span>Run Auto-Setup</span>
					{/if}
				</button>

				<p class="text-xs text-gray-500 text-center">
					Existing resources will be skipped. This is safe to run multiple times.
				</p>
			</div>
		</div>

		<!-- Setup Result -->
		{#if setupResult && setupResult.success}
			<div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
				<div class="flex items-start gap-3 mb-4">
					<CheckCircle class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
					<div>
						<h3 class="text-green-500 font-bold text-lg">Setup Complete!</h3>
						<p class="text-green-400 text-sm">{setupResult.message}</p>
					</div>
				</div>

				<!-- Summary Stats -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
					<div class="bg-slate-900/30 rounded-lg p-4">
						<h4 class="text-sm text-gray-400 mb-1">Tags</h4>
						<p class="text-2xl font-bold text-white">{setupResult.summary?.tags?.created || 0} created</p>
						<p class="text-xs text-gray-500">{setupResult.summary?.tags?.skipped || 0} skipped</p>
					</div>
					<div class="bg-slate-900/30 rounded-lg p-4">
						<h4 class="text-sm text-gray-400 mb-1">Custom Fields</h4>
						<p class="text-2xl font-bold text-white">{setupResult.summary?.customFields?.created || 0} created</p>
						<p class="text-xs text-gray-500">{setupResult.summary?.customFields?.skipped || 0} skipped</p>
					</div>
					<div class="bg-slate-900/30 rounded-lg p-4">
						<h4 class="text-sm text-gray-400 mb-1">Webhooks</h4>
						<p class="text-2xl font-bold text-white">{setupResult.summary?.webhooks?.created || 0} created</p>
						<p class="text-xs text-gray-500">{setupResult.summary?.webhooks?.skipped || 0} skipped</p>
					</div>
				</div>

				<!-- Next Steps -->
				{#if setupResult.nextSteps}
					<div class="bg-slate-900/30 rounded-lg p-4">
						<h4 class="font-semibold text-white mb-3">Next Steps:</h4>
						<div class="space-y-3">
							{#each setupResult.nextSteps as step}
								<div class="flex items-start gap-3">
									<div class="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
										{step.step}
									</div>
									<div class="flex-1">
										<h5 class="font-semibold text-white text-sm">{step.title}</h5>
										<p class="text-xs text-gray-400">{step.description}</p>
										{#if step.url}
											<a href={step.url} target="_blank" rel="noopener" class="text-xs text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 mt-1">
												Open in Systeme.io →
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Info Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Required Tags -->
			<div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
				<h3 class="font-bold text-white mb-4 flex items-center gap-2">
					<Tag class="w-5 h-5 text-blue-400" />
					Required Tags (20)
				</h3>
				<div class="space-y-2 text-sm text-gray-300">
					<div>
						<strong class="text-gray-200">Lead Capture:</strong>
						<p class="text-gray-400">Lead_Captured, Source_Facebook, Source_Google, Optin_Complete</p>
					</div>
					<div>
						<strong class="text-gray-200">MT5 Submission:</strong>
						<p class="text-gray-400">MT5_Credentials_Submitted, Ready_For_Verification</p>
					</div>
					<div>
						<strong class="text-gray-200">Status Tags:</strong>
						<p class="text-gray-400">Deposited, Not_Deposited, Trading, Not_Trading, Qualified, Not_Qualified</p>
					</div>
					<div>
						<strong class="text-gray-200">Volume Tiers:</strong>
						<p class="text-gray-400">Low_Volume_Trader, Medium_Volume_Trader, High_Volume_Trader</p>
					</div>
				</div>
			</div>

			<!-- Required Custom Fields -->
			<div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
				<h3 class="font-bold text-white mb-4 flex items-center gap-2">
					<Database class="w-5 h-5 text-green-400" />
					Custom Fields (10)
				</h3>
				<ul class="space-y-1 text-sm text-gray-300">
					<li>• mt5_login (MT5 account number)</li>
					<li>• mt5_server (Trading server)</li>
					<li>• mt5_broker (Broker name)</li>
					<li>• mt5_balance (Current balance)</li>
					<li>• mt5_equity (Current equity)</li>
					<li>• mt5_total_volume (Trading volume)</li>
					<li>• mt5_total_trades (Number of trades)</li>
					<li>• mt5_status (Overall status)</li>
					<li>• last_scraped_at (Last scrape time)</li>
				</ul>
			</div>
		</div>
	</div>
</div>
