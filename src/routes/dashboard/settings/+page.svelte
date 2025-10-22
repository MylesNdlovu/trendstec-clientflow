<script lang="ts">
	import { onMount } from 'svelte';
	import { Settings, DollarSign, Save, RotateCcw, ExternalLink, Globe, Plus, Trash2, Palette, Copy, CheckCircle } from 'lucide-svelte';
	import { theme, setTheme, resetTheme, colorSchemes, getThemeClasses, type ColorScheme } from '$lib/stores/theme';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { browser } from '$app/environment';

	let showSuccess = false;
	let showError = false;
	let errorMessage = '';
	let newBrokerName = '';
	let newBrokerUrl = '';
	let newServerName = '';
	let saving = false;
	let webhookCopied = false;

	// Get webhook URL dynamically
	let webhookUrl = '';
	$: if (browser) {
		webhookUrl = `${window.location.origin}/api/webhooks/systeme`;
	}

	// Reactive theme classes
	$: themeClasses = getThemeClasses($theme);
	$: ftdCpaSettings = $settingsStore.ftdCpaSettings || {
		ftdAmount: 250,
		cpaAmount: 300,
		brokers: {
			'Prime XBT': {
				mt5Link: 'https://mt5.pxbt.com',
				servers: ['PXBTTrading-1']
			}
		}
	};
	$: loading = $settingsStore.loading;

	onMount(async () => {
		// Load settings from database
		await settingsStore.loadSettings();
	});

	async function saveSettings() {
		saving = true;
		const success = await settingsStore.saveSettings(ftdCpaSettings);
		saving = false;

		if (success) {
			showSuccess = true;
			setTimeout(() => showSuccess = false, 3000);
		} else {
			showError = true;
			errorMessage = $settingsStore.error || 'Failed to save settings';
			setTimeout(() => showError = false, 3000);
		}
	}

	async function copyWebhook() {
		try {
			await navigator.clipboard.writeText(webhookUrl);
			webhookCopied = true;
			setTimeout(() => webhookCopied = false, 2000);
		} catch (err) {
			console.error('Failed to copy webhook URL:', err);
		}
	}

	function resetToDefaults() {
		ftdCpaSettings = {
			ftdAmount: 250,
			cpaAmount: 300,
			brokers: {
				'Prime XBT': {
					mt5Link: 'https://mt5.pxbt.com',
					servers: ['PXBTTrading-1']
				}
			}
		};
		// Reset theme to default
		resetTheme();
	}

	function addBroker() {
		if (newBrokerName && newBrokerUrl) {
			ftdCpaSettings.brokers[newBrokerName] = {
				mt5Link: newBrokerUrl,
				servers: []
			};
			ftdCpaSettings = { ...ftdCpaSettings }; // Trigger reactivity
			newBrokerName = '';
			newBrokerUrl = '';
		}
	}

	function removeBroker(brokerName: string) {
		delete ftdCpaSettings.brokers[brokerName];
		ftdCpaSettings = { ...ftdCpaSettings }; // Trigger reactivity
	}

	function addServerToBroker(brokerName: string) {
		if (newServerName) {
			ftdCpaSettings.brokers[brokerName].servers.push(newServerName);
			ftdCpaSettings = { ...ftdCpaSettings }; // Trigger reactivity
			newServerName = '';
		}
	}

	function removeServerFromBroker(brokerName: string, serverIndex: number) {
		ftdCpaSettings.brokers[brokerName].servers.splice(serverIndex, 1);
		ftdCpaSettings = { ...ftdCpaSettings }; // Trigger reactivity
	}
</script>

<svelte:head>
	<title>Settings - FTD & CPA Configuration</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
	<div class="max-w-4xl mx-auto space-y-8">
		<!-- Page Header -->
		<div>
			<h1 class="text-3xl font-bold text-white">Settings</h1>
			<p class="mt-2 text-gray-400">Configure your FTD and CPA commission rates</p>
		</div>

		{#if showSuccess}
			<div class="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
				<div class="flex items-center">
					<div class="text-green-400">✓ Settings saved successfully to database!</div>
				</div>
			</div>
		{/if}

		{#if showError}
			<div class="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
				<div class="flex items-center">
					<div class="text-red-400">✗ {errorMessage}</div>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
				<div class="flex items-center">
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
					<div class="text-blue-400">Loading settings from database...</div>
				</div>
			</div>
		{/if}

		<!-- FTD & CPA Configuration -->
		<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
			<h2 class="text-xl font-semibold text-white mb-6 flex items-center">
				<DollarSign class="w-5 h-5 mr-2 {themeClasses.primary}" />
				FTD & CPA Commission Rates
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- FTD Amount -->
				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">
						FTD Amount (First Time Deposit)
					</label>
					<div class="flex items-center">
						<span class="text-gray-400 mr-2 text-lg">$</span>
						<input
							type="number"
							bind:value={ftdCpaSettings.ftdAmount}
							class="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
							min="0"
							step="25"
							placeholder="250"
						/>
					</div>
					<p class="text-xs text-gray-500 mt-1">Commission earned per first-time deposit</p>
				</div>

				<!-- CPA Amount -->
				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">
						CPA Amount (Cost Per Acquisition)
					</label>
					<div class="flex items-center">
						<span class="text-gray-400 mr-2 text-lg">$</span>
						<input
							type="number"
							bind:value={ftdCpaSettings.cpaAmount}
							class="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
							min="0"
							step="25"
							placeholder="300"
						/>
					</div>
					<p class="text-xs text-gray-500 mt-1">Commission earned per qualified lead</p>
				</div>
			</div>
		</div>

		<!-- UI Theme Settings -->
		<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
			<h2 class="text-xl font-semibold text-white mb-6 flex items-center">
				<Palette class="w-5 h-5 mr-2 {themeClasses.primary}" />
				UI Theme & Colors
			</h2>

			<div>
				<label class="block text-sm font-medium text-gray-300 mb-4">
					Accent Color Scheme
				</label>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each Object.entries(colorSchemes) as [key, scheme]}
						<button
							on:click={() => setTheme(key as ColorScheme)}
							class="relative p-4 rounded-xl border-2 transition-all duration-200 {$theme.accentColor === key
								? themeClasses.primaryBorder + ' bg-black/70'
								: 'border-gray-600 bg-black/30 hover:border-gray-500'}"
						>
							<div class="flex items-center space-x-3">
								<div class="w-6 h-6 rounded-full shadow-lg" style="background-color: {scheme.primary}"></div>
								<div class="w-4 h-4 rounded-full" style="background-color: {scheme.secondary}"></div>
							</div>
							<div class="mt-2 text-left">
								<div class="text-white font-medium text-sm">{scheme.name}</div>
								<div class="text-gray-400 text-xs">Primary & secondary</div>
							</div>
							{#if $theme.accentColor === key}
								<div class="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style="background-color: {scheme.primary}">
									<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
									</svg>
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Broker Management -->
		<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-semibold text-white flex items-center">
					<Globe class="w-5 h-5 mr-2 {themeClasses.primary}" />
					Broker Management
				</h2>
				<button
					on:click={addBroker}
					disabled={!newBrokerName || !newBrokerUrl}
					class="flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} disabled:bg-gray-600 disabled:opacity-50 text-white rounded-xl transition-colors text-sm font-medium"
				>
					<Plus class="w-4 h-4 mr-1" />
					Add Broker
				</button>
			</div>

			<!-- Add New Broker Form -->
			<div class="bg-black/30 rounded-xl p-4 mb-6 border border-gray-700/50">
				<h3 class="text-white font-medium mb-3">Add New Broker</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="broker-name" class="block text-sm font-medium text-gray-300 mb-2">
							Broker Name
						</label>
						<input
							id="broker-name"
							type="text"
							bind:value={newBrokerName}
							placeholder="e.g., IC Markets"
							class="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
						/>
					</div>
					<div>
						<label for="broker-url" class="block text-sm font-medium text-gray-300 mb-2">
							MT5 Web Portal URL
						</label>
						<input
							id="broker-url"
							type="url"
							bind:value={newBrokerUrl}
							placeholder="https://mt5.broker.com"
							class="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
						/>
					</div>
				</div>
			</div>

			<!-- Existing Brokers -->
			<div class="space-y-4">
				{#each Object.entries(ftdCpaSettings.brokers) as [brokerName, brokerConfig]}
					<div class="bg-black/30 rounded-xl p-4 border border-gray-700/50">
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-white font-medium text-lg">{brokerName}</h3>
							<button
								on:click={() => removeBroker(brokerName)}
								class="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
							>
								<Trash2 class="w-4 h-4 mr-1" />
								Remove
							</button>
						</div>

						<!-- Broker URL -->
						<div class="mb-4">
							<label class="block text-sm font-medium text-gray-300 mb-2">
								MT5 Web Portal URL
							</label>
							<div class="flex items-center space-x-2">
								<input
									type="url"
									bind:value={brokerConfig.mt5Link}
									class="flex-1 px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
								/>
								<a
									href={brokerConfig.mt5Link}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
								>
									<ExternalLink class="w-4 h-4" />
								</a>
							</div>
						</div>

						<!-- Servers Management -->
						<div>
							<div class="flex items-center justify-between mb-3">
								<label class="block text-sm font-medium text-gray-300">
									Trading Servers
								</label>
								<button
									on:click={() => addServerToBroker(brokerName)}
									disabled={!newServerName}
									class="flex items-center px-3 py-1 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
								>
									<Plus class="w-3 h-3 mr-1" />
									Add Server
								</button>
							</div>

							<!-- Add Server Input -->
							<div class="mb-3">
								<input
									type="text"
									bind:value={newServerName}
									placeholder="e.g., ICMarkets-Demo01"
									class="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
								/>
							</div>

							<!-- Server List -->
							<div class="space-y-2">
								{#each brokerConfig.servers as server, index}
									<div class="flex items-center justify-between p-2 bg-black/50 rounded-lg">
										<span class="text-gray-300 text-sm">{server}</span>
										<button
											on:click={() => removeServerFromBroker(brokerName, index)}
											class="text-red-400 hover:text-red-300 p-1"
										>
											<Trash2 class="w-3 h-3" />
										</button>
									</div>
								{/each}
								{#if brokerConfig.servers.length === 0}
									<div class="text-gray-500 text-sm italic p-2">
										No servers configured
									</div>
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<!-- No brokers configured -->
					<div class="bg-black/30 rounded-xl p-6 border border-gray-700/50 text-center">
						<Globe class="w-12 h-12 mx-auto mb-3 text-gray-500" />
						<h3 class="text-white font-medium mb-2">No Brokers Configured</h3>
						<p class="text-gray-400 text-sm mb-4">Add your first broker above or click "Reset to Defaults" to load Prime XBT</p>
						<button
							on:click={resetToDefaults}
							class="px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg text-sm"
						>
							Load Prime XBT Default
						</button>
					</div>
				{/each}
			</div>
		</div>

		<!-- Debug Info -->
		<div class="glass-card-ios rounded-2xl p-4 shadow-xl text-sm">
			<p class="text-white">Current theme: <span class="text-orange-400">{$theme.name}</span> ({$theme.accentColor})</p>
			<p class="text-gray-400">Primary color: {$theme.primary}</p>
		</div>

		<!-- Action Buttons -->
		<div class="flex space-x-4">
			<button
				on:click={saveSettings}
				class="flex items-center px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} text-white rounded-xl {themeClasses.primaryShadow} shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-medium"
			>
				<Save class="w-4 h-4 mr-2" />
				Save Settings
			</button>
			<button
				on:click={resetToDefaults}
				class="flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-all duration-200 font-medium border border-gray-600"
			>
				<RotateCcw class="w-4 h-4 mr-2" />
				Reset to Defaults
			</button>
			<button
				on:click={() => setTheme('orange')}
				class="flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all duration-200 font-medium"
			>
				Force Orange
			</button>
		</div>
	</div>
</div>