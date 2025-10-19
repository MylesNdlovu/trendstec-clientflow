<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		Shield,
		Lock,
		User,
		Building,
		Key,
		Server,
		Mail,
		Phone,
		Copy,
		CheckCircle,
		AlertTriangle,
		ExternalLink,
		Download,
		Code,
		Eye,
		EyeOff
	} from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';
	import { settingsStore } from '$lib/stores/settingsStore';

	let formData = {
		login: '',
		password: '',
		server: '',
		broker: 'Prime XBT'
	};

	// Lead data from webhook (fetched by token)
	let leadData = null;
	let leadToken = '';
	let loadingLead = false;
	let leadError = '';

	let submitting = false;
	let submitted = false;
	let error = '';
	let showEmbedCode = false;
	let copySuccess = false;
	let showPassword = false;

	// Optin Form State
	let optinData = {
		email: '',
		firstName: '',
		lastName: '',
		phone: ''
	};
	let optinSubmitting = false;
	let optinSubmitted = false;
	let optinError = '';
	let showOptinEmbedCode = false;
	let optinCopySuccess = false;

	// Real-time validation state
	let validating = false;
	let validationResult = null;
	let validationError = '';
	let validationTimeout = null;

	// Get brokers from settings
	$: ftdCpaSettings = $settingsStore.ftdCpaSettings;
	$: availableBrokers = ftdCpaSettings?.brokers ? Object.keys(ftdCpaSettings.brokers) : ['Prime XBT'];
	$: selectedBrokerConfig = ftdCpaSettings?.brokers?.[formData.broker];
	$: availableServers = selectedBrokerConfig?.servers || ['PXBTTrading-1'];

	onMount(async () => {
		// Load settings to get broker list
		await settingsStore.loadSettings();

		// Set default broker and server
		if (availableBrokers.length > 0) {
			formData.broker = availableBrokers[0];
		}
		if (availableServers.length > 0) {
			formData.server = availableServers[0];
		}

		// Get lead token from URL
		leadToken = $page.url.searchParams.get('token') || '';

		// Fetch lead data if token exists
		if (leadToken) {
			await fetchLeadData();
		}
	});

	async function fetchLeadData() {
		loadingLead = true;
		leadError = '';

		try {
			const response = await fetch(`/api/leads?token=${leadToken}`);
			const result = await response.json();

			if (response.ok) {
				leadData = result.lead;
			} else {
				leadError = result.error || 'Invalid or expired link';
			}
		} catch (err) {
			leadError = 'Failed to load lead information';
			console.error('Lead fetch error:', err);
		} finally {
			loadingLead = false;
		}
	}

	// Debounced validation function
	async function validateCredentials() {
		if (!formData.login || !formData.password || !formData.server || !formData.broker) {
			validationResult = null;
			validationError = '';
			return;
		}

		// Clear existing timeout
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}

		// Set new timeout for debounced validation
		validationTimeout = setTimeout(async () => {
			validating = true;
			validationError = '';
			validationResult = null;

			try {
				const response = await fetch('/api/validate-mt5', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						login: formData.login,
						password: formData.password,
						server: formData.server,
						broker: formData.broker
					})
				});

				const result = await response.json();

				if (result.valid) {
					validationResult = {
						valid: true,
						details: result.details
					};
					validationError = '';
				} else {
					validationResult = { valid: false };
					validationError = result.error || 'Invalid credentials';
				}
			} catch (err) {
				console.error('Validation error:', err);
				validationResult = { valid: false };
				validationError = 'Failed to validate credentials. Please try again.';
			} finally {
				validating = false;
			}
		}, 1500); // 1.5 second delay for debouncing
	}

	// Manual validation function (no auto-trigger)
	async function manualValidate() {
		await validateCredentials();
	}

	// Reactive theme classes
	$: themeClasses = getThemeClasses($theme);

	async function submitForm() {
		if (!isFormValid()) return;

		submitting = true;
		error = '';

		try {
			const response = await fetch('/api/leads/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...formData,
					leadToken,
					source: 'mt5-form',
					timestamp: new Date().toISOString()
				})
			});

			if (response.ok) {
				submitted = true;
				// Sync with Workflow Backend
				await syncWithSysteme();
			} else {
				throw new Error('Failed to submit form');
			}
		} catch (err) {
			error = 'Failed to submit form. Please try again.';
			console.error('Form submission error:', err);
		} finally {
			submitting = false;
		}
	}

	async function syncWithSysteme() {
		try {
			await fetch('/api/systeme/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contact: {
						email: formData.email,
						firstName: formData.firstName,
						lastName: formData.lastName,
						phone: formData.phone
					},
					customFields: {
						broker: formData.broker,
						mt5Login: formData.mt5Login,
						mt5Server: formData.mt5Server
					},
					tags: ['MT5-Lead', 'Affiliate-Signup']
				})
			});
		} catch (err) {
			console.error('Workflow Backend sync error:', err);
		}
	}

	function isFormValid() {
		return formData.login &&
			   formData.password &&
			   formData.server &&
			   !validating &&
			   (validationResult?.valid || !validationError);
	}

	function resetForm() {
		formData = {
			login: '',
			password: '',
			server: 'PXBTTrading-1'
		};
		submitted = false;
		error = '';
		validating = false;
		validationResult = null;
		validationError = '';
		if (validationTimeout) {
			clearTimeout(validationTimeout);
			validationTimeout = null;
		}
	}

	function toggleEmbedCode() {
		showEmbedCode = !showEmbedCode;
	}

	function copyEmbedCode() {
		const embedCode = getEmbedCode();
		navigator.clipboard.writeText(embedCode).then(() => {
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		});
	}

	function getEmbedCode() {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://my-svelte-79a8i428b-myles-projects-dd515697.vercel.app';
		return `<!-- MT5 Investor Credentials Form -->
<iframe
	src="${origin}/forms/mt5-investor"
	width="100%"
	height="800"
	frameborder="0"
	style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>

<!-- Alternative: Direct embed script -->
<script>
(function() {
	var iframe = document.createElement('iframe');
	iframe.src = '${origin}/forms/mt5-investor';
	iframe.style.width = '100%';
	iframe.style.height = '800px';
	iframe.style.border = 'none';
	iframe.style.borderRadius = '12px';
	iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
	document.currentScript.parentNode.insertBefore(iframe, document.currentScript);
})();
<\/script>`;
	}

	// Optin Form Functions
	async function submitOptinForm() {
		optinSubmitting = true;
		optinError = '';

		try {
			const response = await fetch('/api/systeme/contacts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: optinData.email,
					fields: [
						{ slug: 'first_name', value: optinData.firstName },
						{ slug: 'last_name', value: optinData.lastName },
						{ slug: 'phone', value: optinData.phone }
					],
					tags: ['optin-lead', 'website-signup']
				})
			});

			if (response.ok) {
				optinSubmitted = true;
			} else {
				throw new Error('Failed to submit optin form');
			}
		} catch (err) {
			optinError = 'Failed to submit form. Please try again.';
			console.error('Optin form submission error:', err);
		} finally {
			optinSubmitting = false;
		}
	}

	function toggleOptinEmbedCode() {
		showOptinEmbedCode = !showOptinEmbedCode;
	}

	function copyOptinEmbedCode() {
		const embedCode = getOptinEmbedCode();
		navigator.clipboard.writeText(embedCode).then(() => {
			optinCopySuccess = true;
			setTimeout(() => optinCopySuccess = false, 2000);
		});
	}

	function getOptinEmbedCode() {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
		return `<!-- Lead Optin Form -->
<iframe
	src="${origin}/forms/optin"
	width="100%"
	height="600"
	frameborder="0"
	style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>`;
	}

	function getOptinFormURL() {
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
		return `${origin}/forms/optin`;
	}

	function resetOptinForm() {
		optinData = {
			email: '',
			firstName: '',
			lastName: '',
			phone: ''
		};
		optinSubmitted = false;
		optinError = '';
	}
</script>

<svelte:head>
	<title>MT5 Investor Form - Affiliate Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
	<div class="max-w-7xl mx-auto space-y-8">
	<!-- Page header -->
	<div>
		<h1 class="text-3xl font-bold text-white">Forms</h1>
		<p class="mt-2 text-gray-400">
			Embed forms on your landing pages to capture leads and credentials
		</p>
	</div>

	<div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
		<!-- MT5 Form Section -->
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-white">MT5 Investor Form</h2>
				<button
					on:click={toggleEmbedCode}
					class="inline-flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
				>
					<Code class="w-4 h-4 mr-2" />
					Embed Code
				</button>
			</div>
		<!-- Form Section -->
		<div class="glass-card-ios rounded-2xl p-8 shadow-2xl">
			{#if !submitted}
				<form on:submit|preventDefault={submitForm} class="space-y-6">

					{#if error}
						<div class="bg-black border border-gray-700 rounded-lg p-4">
							<div class="flex items-center">
								<AlertTriangle class="w-5 h-5 {themeClasses.primary} mr-3" />
								<p class="text-gray-300">{error}</p>
							</div>
						</div>
					{/if}

					<!-- Real-time validation feedback -->
					{#if validating}
						<div class="bg-black border border-gray-700 rounded-lg p-4">
							<div class="flex items-center">
								<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
								<p class="text-gray-300">Validating MT5 credentials...</p>
							</div>
						</div>
					{:else if validationError}
						<div class="bg-black border border-red-600 rounded-lg p-4">
							<div class="flex items-center">
								<AlertTriangle class="w-5 h-5 text-red-400 mr-3" />
								<p class="text-red-300">{validationError}</p>
							</div>
						</div>
					{:else if validationResult?.valid}
						<div class="bg-black border border-green-600 rounded-lg p-4">
							<div class="flex items-center">
								<CheckCircle class="w-5 h-5 text-green-400 mr-3" />
								<p class="text-green-300">Credentials validated successfully!</p>
							</div>
							{#if validationResult.details}
								<div class="mt-2 text-sm text-gray-400">
									{#if validationResult.details.accountNumber}
										<p>Account: {validationResult.details.accountNumber}</p>
									{/if}
									{#if validationResult.details.balance !== undefined}
										<p>Balance: ${validationResult.details.balance}</p>
									{/if}
								</div>
							{/if}
						</div>
					{/if}


					<!-- Welcome Message with Lead Name -->
					{#if leadData}
						<div class="bg-gradient-to-r from-gray-900 to-black border border-gray-700 rounded-xl p-6 mb-6">
							<div class="flex items-center">
								<User class="w-6 h-6 {themeClasses.primary} mr-3" />
								<div>
									<p class="text-gray-400 text-sm">Welcome back,</p>
									<p class="text-white text-xl font-semibold">{leadData.firstName} {leadData.lastName}</p>
								</div>
							</div>
						</div>
					{:else if loadingLead}
						<div class="bg-black border border-gray-700 rounded-lg p-4 mb-6">
							<div class="flex items-center">
								<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
								<p class="text-gray-300">Loading your information...</p>
							</div>
						</div>
					{:else if leadError}
						<div class="bg-black border border-yellow-600 rounded-lg p-4 mb-6">
							<div class="flex items-center">
								<AlertTriangle class="w-5 h-5 text-yellow-400 mr-3" />
								<p class="text-yellow-300">{leadError}</p>
							</div>
						</div>
					{/if}

					<!-- MT5 Terminal Login -->
					<div class="space-y-6">
						<div class="text-center mb-8">
							<div class="w-24 h-24 mx-auto mb-6 relative">
								<!-- Real MT5 Logo Design -->
								<div class="relative w-full h-full">
									<!-- Main MT5 Badge -->
									<div class="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-2xl border border-slate-600 flex items-center justify-center">
										<!-- Inner content -->
										<div class="relative">
											<!-- MT5 Text -->
											<div class="text-white font-bold text-2xl tracking-wider">MT5</div>
											<!-- Accent line -->
											<div class="absolute -bottom-1 left-0 right-0 h-0.5 {themeClasses.primaryGradient}"></div>
										</div>
									</div>
									<!-- Professional accent corners -->
									<div class="absolute -top-1 -right-1 w-3 h-3 {themeClasses.primaryBg} rounded-full shadow-lg animate-pulse"></div>
									<div class="absolute -bottom-1 -left-1 w-2 h-2 {themeClasses.secondaryBg} rounded-full shadow-md"></div>
								</div>
							</div>
							<h2 class="text-2xl font-bold text-white">{formData.broker} MT5 Terminal</h2>
							<p class="text-gray-400">Enter your investor credentials to access the trading platform</p>
						</div>

						<!-- Broker Selection -->
						<div class="space-y-2">
							<label for="broker" class="block text-sm font-semibold text-gray-300 mb-3">
								Select Broker
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Building class="h-5 w-5 {themeClasses.primary}" />
								</div>
								<select
									id="broker"
									bind:value={formData.broker}
									on:change={() => {
										// Update server to first available when broker changes
										if (availableServers.length > 0) {
											formData.server = availableServers[0];
										}
									}}
									class="w-full pl-12 pr-4 py-4 bg-black border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder} transition-all duration-200 text-lg appearance-none cursor-pointer"
								>
									{#each availableBrokers as broker}
										<option value={broker}>{broker}</option>
									{/each}
								</select>
								<div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
									</svg>
								</div>
							</div>
						</div>

						<!-- Server Selection -->
						<div class="space-y-2">
							<label for="server" class="block text-sm font-semibold text-gray-300 mb-3">
								MT5 Server
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Server class="h-5 w-5 {themeClasses.primary}" />
								</div>
								<select
									id="server"
									bind:value={formData.server}
									required
									class="w-full pl-12 pr-4 py-4 bg-black border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder} transition-all duration-200 text-lg appearance-none cursor-pointer"
								>
									{#each availableServers as server}
										<option value={server}>{server}</option>
									{/each}
								</select>
								<div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
									</svg>
								</div>
							</div>
						</div>

						<!-- Login Field -->
						<div class="space-y-2">
							<label for="login" class="block text-sm font-semibold text-gray-300 mb-3">
								Account Number
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<User class="h-5 w-5 {themeClasses.primary}" />
								</div>
								<input
									id="login"
									name="mt5_account_number"
									type="text"
									bind:value={formData.login}
									required
									placeholder="Enter your MT5 account number"
									autocomplete="off"
									class="w-full pl-12 pr-12 py-4 bg-black border {validating ? 'border-yellow-500' : validationResult?.valid ? 'border-green-600' : validationError ? 'border-red-600' : 'border-slate-700'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder} transition-all duration-200 text-lg"
								/>
								<!-- Validation status icon -->
								<div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
									{#if validating}
										<div class="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
									{:else if validationResult?.valid}
										<CheckCircle class="h-4 w-4 text-green-400" />
									{:else if validationError}
										<AlertTriangle class="h-4 w-4 text-red-400" />
									{/if}
								</div>
							</div>
						</div>

						<!-- Password Field -->
						<div class="space-y-2">
							<label for="password" class="block text-sm font-semibold text-gray-300 mb-3">
								Investor Password
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<Lock class="h-5 w-5 {themeClasses.primary}" />
								</div>
								<input
									id="password"
									name="mt5_investor_password"
									type={showPassword ? 'text' : 'password'}
									bind:value={formData.password}
									required
									placeholder="Enter your investor password"
									autocomplete="new-password"
									class="w-full pl-12 pr-24 py-4 bg-black border {validating ? 'border-yellow-500' : validationResult?.valid ? 'border-green-600' : validationError ? 'border-red-600' : 'border-slate-700'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder} transition-all duration-200 text-lg"
								/>
								<!-- Password visibility toggle -->
								<button
									type="button"
									on:click={() => showPassword = !showPassword}
									class="absolute inset-y-0 right-12 pr-2 flex items-center text-gray-400 hover:text-white transition-colors"
								>
									{#if showPassword}
										<EyeOff class="h-5 w-5" />
									{:else}
										<Eye class="h-5 w-5" />
									{/if}
								</button>
								<!-- Validation status icon -->
								<div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
									{#if validating}
										<div class="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
									{:else if validationResult?.valid}
										<CheckCircle class="h-4 w-4 text-green-400" />
									{:else if validationError}
										<AlertTriangle class="h-4 w-4 text-red-400" />
									{/if}
								</div>
							</div>
						</div>

					</div>

					<!-- Validate Button -->
					<button
						type="button"
						on:click={manualValidate}
						disabled={validating || !formData.login || !formData.password || !formData.server}
						class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if validating}
							<div class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
							Validating MT5 Credentials...
						{:else}
							<Shield class="w-5 h-5" />
							Validate MT5 Credentials
						{/if}
					</button>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={submitting || !isFormValid()}
						class="w-full bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg {themeClasses.primaryShadow} transform hover:scale-[1.02] active:scale-[0.98]"
					>
						{#if submitting}
							<div class="flex items-center justify-center">
								<div class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
								<span class="text-lg">Connecting to MT5...</span>
							</div>
						{:else}
							<div class="flex items-center justify-center">
								<Lock class="w-5 h-5 mr-2" />
								<span>Access MT5 Terminal</span>
							</div>
						{/if}
					</button>
				</form>
			{:else}
				<div class="text-center py-12">
					<div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
						<CheckCircle class="w-8 h-8 {themeClasses.primary}" />
					</div>
					<h3 class="text-xl font-bold text-white mb-2">Successfully Submitted!</h3>
					<p class="text-gray-400 mb-6">
						Your MT5 credentials have been securely captured and synced with our tracking system.
					</p>
					<button
						on:click={resetForm}
						class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
					>
						Submit Another
					</button>
				</div>
			{/if}
		</div>

		<!-- Info & Embed Section -->
		<div class="space-y-6">
			<!-- Security Notice -->
			<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
				<div class="flex items-center mb-4">
					<Shield class="w-6 h-6 {themeClasses.primary} mr-3" />
					<h3 class="text-lg font-semibold text-white">Security & Privacy</h3>
				</div>
				<ul class="space-y-2 text-sm text-gray-300">
					<li class="flex items-center">
						<CheckCircle class="w-4 h-4 mr-2 flex-shrink-0 {themeClasses.primary}" />
						All data is encrypted in transit and at rest
					</li>
					<li class="flex items-center">
						<CheckCircle class="w-4 h-4 mr-2 flex-shrink-0 {themeClasses.primary}" />
						Only investor (read-only) passwords are accepted
					</li>
					<li class="flex items-center">
						<CheckCircle class="w-4 h-4 mr-2 flex-shrink-0 {themeClasses.primary}" />
						Used only for transparent conversion tracking
					</li>
					<li class="flex items-center">
						<CheckCircle class="w-4 h-4 mr-2 flex-shrink-0 {themeClasses.primary}" />
						Automatically synced with Workflow Backend
					</li>
				</ul>
			</div>

			<!-- Embed Code Section -->
			{#if showEmbedCode}
				<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-white">Embed Code</h3>
						<button
							on:click={copyEmbedCode}
							class="flex items-center px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
						>
							{#if copySuccess}
								<CheckCircle class="w-4 h-4 mr-1" />
								Copied!
							{:else}
								<Copy class="w-4 h-4 mr-1" />
								Copy
							{/if}
						</button>
					</div>
					<pre class="bg-black text-gray-300 p-4 rounded-lg text-xs overflow-x-auto">
						<code>{getEmbedCode()}</code>
					</pre>
					<p class="text-sm text-gray-400 mt-3">
						Use this code to embed the MT5 investor form in your landing pages or external websites.
					</p>
				</div>
			{/if}

			<!-- Integration Status -->
			<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
				<h3 class="text-lg font-semibold text-white mb-4">Integration Status</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-gray-300">Workflow Backend Sync</span>
						<div class="flex items-center {themeClasses.primary}">
							<CheckCircle class="w-4 h-4 mr-1" />
							<span class="text-sm font-medium">Active</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-300">MT5 Verification</span>
						<div class="flex items-center {themeClasses.primary}">
							<CheckCircle class="w-4 h-4 mr-1" />
							<span class="text-sm font-medium">Ready</span>
						</div>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-gray-300">Webhook Delivery</span>
						<div class="flex items-center {themeClasses.primary}">
							<CheckCircle class="w-4 h-4 mr-1" />
							<span class="text-sm font-medium">Connected</span>
						</div>
					</div>
				</div>
			</div>
		</div>
		</div>
		<!-- End MT5 Form Section -->

		<!-- Optin Form Section -->
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold text-white">Lead Optin Form</h2>
				<button
					on:click={toggleOptinEmbedCode}
					class="inline-flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
				>
					<Code class="w-4 h-4 mr-2" />
					Embed Code
				</button>
			</div>

			<!-- Optin Form Card -->
			<div class="glass-card-ios rounded-2xl p-8 shadow-2xl">
				{#if !optinSubmitted}
					<form on:submit|preventDefault={submitOptinForm} class="space-y-6">
						{#if optinError}
							<div class="bg-black border border-red-600 rounded-lg p-4">
								<div class="flex items-center">
									<AlertTriangle class="w-5 h-5 text-red-400 mr-3" />
									<p class="text-red-300">{optinError}</p>
								</div>
							</div>
						{/if}

						<!-- Email -->
						<div>
							<label for="optin-email" class="block text-sm font-medium text-gray-300 mb-2">
								<Mail class="w-4 h-4 inline mr-2" />
								Email Address *
							</label>
							<input
								type="email"
								id="optin-email"
								name="optin_email"
								bind:value={optinData.email}
								required
								autocomplete="off"
								class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
								placeholder="your@email.com"
							/>
						</div>

						<!-- First Name -->
						<div>
							<label for="optin-firstName" class="block text-sm font-medium text-gray-300 mb-2">
								<User class="w-4 h-4 inline mr-2" />
								First Name *
							</label>
							<input
								type="text"
								id="optin-firstName"
								name="optin_first_name"
								bind:value={optinData.firstName}
								required
								autocomplete="off"
								class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
								placeholder="John"
							/>
						</div>

						<!-- Last Name -->
						<div>
							<label for="optin-lastName" class="block text-sm font-medium text-gray-300 mb-2">
								<User class="w-4 h-4 inline mr-2" />
								Last Name *
							</label>
							<input
								type="text"
								id="optin-lastName"
								name="optin_last_name"
								bind:value={optinData.lastName}
								required
								autocomplete="off"
								class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
								placeholder="Doe"
							/>
						</div>

						<!-- Phone -->
						<div>
							<label for="optin-phone" class="block text-sm font-medium text-gray-300 mb-2">
								<Phone class="w-4 h-4 inline mr-2" />
								Phone Number
							</label>
							<input
								type="tel"
								id="optin-phone"
								name="optin_phone"
								bind:value={optinData.phone}
								autocomplete="off"
								class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
								placeholder="+1 (555) 123-4567"
							/>
						</div>

						<!-- Submit Button -->
						<button
							type="submit"
							disabled={optinSubmitting}
							class="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all shadow-lg shadow-orange-500/50"
						>
							{optinSubmitting ? 'Submitting...' : 'Submit'}
						</button>
					</form>
				{:else}
					<!-- Success Message -->
					<div class="text-center py-12">
						<CheckCircle class="w-16 h-16 text-green-400 mx-auto mb-4" />
						<h3 class="text-xl font-semibold text-white mb-2">Thank You!</h3>
						<p class="text-gray-400 mb-6">
							Your information has been submitted successfully. We'll be in touch soon!
						</p>
						<button
							on:click={resetOptinForm}
							class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
						>
							Submit Another
						</button>
					</div>
				{/if}
			</div>

			<!-- Optin Embed Code Section -->
			{#if showOptinEmbedCode}
				<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-white">Embed Code</h3>
						<button
							on:click={copyOptinEmbedCode}
							class="flex items-center px-3 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
						>
							{#if optinCopySuccess}
								<CheckCircle class="w-4 h-4 mr-1" />
								Copied!
							{:else}
								<Copy class="w-4 h-4 mr-1" />
								Copy
							{/if}
						</button>
					</div>
					<pre class="bg-black text-gray-300 p-4 rounded-lg text-xs overflow-x-auto border border-orange-500/20">
						<code>{getOptinEmbedCode()}</code>
					</pre>
					<div class="mt-4 p-4 bg-black border border-orange-500/20 rounded-lg">
						<p class="text-sm font-medium text-gray-300 mb-2">Direct URL:</p>
						<div class="flex items-center gap-2">
							<input
								type="text"
								readonly
								value={getOptinFormURL()}
								class="flex-1 px-3 py-2 bg-black border border-orange-500/30 rounded text-sm text-gray-300"
							/>
							<button
								on:click={() => {
									navigator.clipboard.writeText(getOptinFormURL());
									optinCopySuccess = true;
									setTimeout(() => optinCopySuccess = false, 2000);
								}}
								class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
							>
								<Copy class="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Optin Info -->
			<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
				<h3 class="text-lg font-semibold text-white mb-4">About This Form</h3>
				<ul class="space-y-3 text-sm text-gray-400">
					<li class="flex items-center">
						<CheckCircle class="w-4 h-4 mr-2 flex-shrink-0 {themeClasses.primary}" />
						Captures basic lead information
					</li>
					<li class="flex items-center">
						<CheckCircle class="w-4 h-4 mr-2 flex-shrink-0 {themeClasses.primary}" />
						Syncs directly with Workflow Backend
					</li>
					<li class="flex items-center">
						<CheckCircle class="w-4 h-4 mr-2 flex-shrink-0 {themeClasses.primary}" />
						Perfect for landing pages and websites
					</li>
				</ul>
			</div>
		</div>
		<!-- End Optin Form Section -->
	</div>
</div>
</div>