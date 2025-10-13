<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Form state
	let email = '';
	let mt5Login = '';
	let mt5Server = '';
	let investorPassword = '';
	let selectedBroker = '';

	// UI state
	let isSubmitting = false;
	let submitSuccess = false;
	let submitError = '';
	let verificationStatus: 'not_started' | 'pending' | 'verified' | 'failed' = 'not_started';
	let showAdvanced = false;

	// Popular MT5 servers by broker
	const brokerServers = {
		exness: ['ExnessEU-Demo', 'ExnessEU-Real', 'ExnessEU-Real2', 'ExnessEU-Real3'],
		xm: ['XM-Demo', 'XM-Real', 'XM-Real 2', 'XM-Real 3'],
		fxpro: ['FxPro-Demo', 'FxPro-Live', 'FxPro-Live02'],
		pepperstone: ['PepperstoneEU-Demo', 'PepperstoneEU-Live', 'PepperstoneEU-Live02'],
		'ic-markets': ['ICMarkets-Demo', 'ICMarkets-Live01', 'ICMarkets-Live02'],
		'admiral-markets': ['Admiral-Demo', 'Admiral-Live', 'Admiral-Live2']
	};

	onMount(async () => {
		// Capture email from URL parameter
		const emailParam = $page.url.searchParams.get('email');
		if (emailParam) {
			email = emailParam;
			// Check if user already has MT5 credentials
			await checkExistingCredentials();
		} else {
			// Redirect to home if no email provided
			goto('/');
		}
	});

	async function checkExistingCredentials() {
		try {
			const response = await fetch(`/api/systeme-sync/status?email=${encodeURIComponent(email)}`);
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					verificationStatus = data.verification_status;
					if (data.has_credentials) {
						// Pre-fill form if credentials exist
						mt5Login = data.mt5_login || '';
						mt5Server = data.mt5_server || '';
					}
				}
			}
		} catch (error) {
			console.error('Failed to check existing credentials:', error);
		}
	}

	async function submitCredentials() {
		if (!email || !mt5Login || !mt5Server) {
			submitError = 'Please fill in all required fields';
			return;
		}

		isSubmitting = true;
		submitError = '';

		try {
			const response = await fetch('/api/systeme-sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email,
					mt5Login,
					mt5Server,
					investorPassword: investorPassword || undefined,
					broker: selectedBroker || undefined,
					source: 'mt5_form'
				})
			});

			const result = await response.json();

			if (result.success) {
				submitSuccess = true;
				verificationStatus = 'pending';
				// Optionally redirect to a success page
				setTimeout(() => {
					goto('/mt5/success');
				}, 2000);
			} else {
				submitError = result.error || 'Failed to submit credentials';
				if (result.validation_errors) {
					submitError += ': ' + result.validation_errors.join(', ');
				}
			}
		} catch (error) {
			submitError = 'Network error. Please try again.';
			console.error('Submit error:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function onBrokerChange() {
		// Auto-suggest server based on broker
		if (selectedBroker && brokerServers[selectedBroker]) {
			if (!mt5Server || !brokerServers[selectedBroker].includes(mt5Server)) {
				mt5Server = brokerServers[selectedBroker][0];
			}
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'verified': return 'text-green-600';
			case 'pending': return 'text-yellow-600';
			case 'failed': return 'text-red-600';
			default: return 'text-gray-600';
		}
	}

	function getStatusText(status: string): string {
		switch (status) {
			case 'verified': return 'Verified ✓';
			case 'pending': return 'Verification Pending...';
			case 'failed': return 'Verification Failed';
			default: return 'Not Started';
		}
	}
</script>

<svelte:head>
	<title>MT5 Credentials Submission</title>
	<meta name="description" content="Submit your MT5 trading credentials for verification and tracking" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">MT5 Credentials Submission</h1>
			<p class="text-gray-600 mb-2">
				Please provide your MT5 investor credentials to enable tracking and verification.
			</p>
			{#if email}
				<div class="bg-blue-100 border border-blue-300 rounded-lg p-3 mt-4">
					<p class="text-blue-800">
						<strong>Email:</strong> {email}
					</p>
					<p class="text-sm text-blue-600 mt-1">
						Status: <span class={getStatusColor(verificationStatus)}>{getStatusText(verificationStatus)}</span>
					</p>
				</div>
			{/if}
		</div>

		<!-- Success Message -->
		{#if submitSuccess}
			<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
				<strong class="font-bold">Success!</strong>
				<span class="block sm:inline">Your MT5 credentials have been submitted successfully. You will be redirected shortly.</span>
			</div>
		{/if}

		<!-- Error Message -->
		{#if submitError}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
				<strong class="font-bold">Error:</strong>
				<span class="block sm:inline">{submitError}</span>
			</div>
		{/if}

		<!-- Main Form -->
		<div class="bg-white rounded-lg shadow-lg p-8">
			<form on:submit|preventDefault={submitCredentials} class="space-y-6">
				<!-- Email Field (Read-only) -->
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						Email Address
					</label>
					<input
						type="email"
						id="email"
						bind:value={email}
						readonly
						class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
						placeholder="your.email@example.com"
					/>
				</div>

				<!-- Broker Selection -->
				<div>
					<label for="broker" class="block text-sm font-medium text-gray-700 mb-2">
						Broker (Optional)
					</label>
					<select
						id="broker"
						bind:value={selectedBroker}
						on:change={onBrokerChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value="">Select your broker</option>
						<option value="exness">Exness</option>
						<option value="xm">XM</option>
						<option value="fxpro">FxPro</option>
						<option value="pepperstone">Pepperstone</option>
						<option value="ic-markets">IC Markets</option>
						<option value="admiral-markets">Admiral Markets</option>
					</select>
				</div>

				<!-- MT5 Login -->
				<div>
					<label for="mt5Login" class="block text-sm font-medium text-gray-700 mb-2">
						MT5 Login Number <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="mt5Login"
						bind:value={mt5Login}
						required
						pattern="[0-9]{6,12}"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="e.g., 12345678"
						title="MT5 login should be 6-12 digits"
					/>
					<p class="text-sm text-gray-500 mt-1">
						Your MT5 account login number (6-12 digits)
					</p>
				</div>

				<!-- MT5 Server -->
				<div>
					<label for="mt5Server" class="block text-sm font-medium text-gray-700 mb-2">
						MT5 Server <span class="text-red-500">*</span>
					</label>
					{#if selectedBroker && brokerServers[selectedBroker]}
						<select
							id="mt5Server"
							bind:value={mt5Server}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">Select server</option>
							{#each brokerServers[selectedBroker] as server}
								<option value={server}>{server}</option>
							{/each}
						</select>
					{:else}
						<input
							type="text"
							id="mt5Server"
							bind:value={mt5Server}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="e.g., ExnessEU-Real"
						/>
					{/if}
					<p class="text-sm text-gray-500 mt-1">
						Your MT5 server name (found in MT5 terminal)
					</p>
				</div>

				<!-- Advanced Options Toggle -->
				<div>
					<button
						type="button"
						on:click={() => showAdvanced = !showAdvanced}
						class="text-blue-600 hover:text-blue-800 text-sm font-medium"
					>
						{showAdvanced ? '▼' : '▶'} Advanced Options
					</button>
				</div>

				<!-- Advanced Fields -->
				{#if showAdvanced}
					<div class="border-t pt-4 space-y-4">
						<!-- Investor Password -->
						<div>
							<label for="investorPassword" class="block text-sm font-medium text-gray-700 mb-2">
								Investor Password (Optional)
							</label>
							<input
								type="password"
								id="investorPassword"
								bind:value={investorPassword}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Read-only password for account monitoring"
							/>
							<p class="text-sm text-gray-500 mt-1">
								Optional: Provides read-only access for account monitoring and verification
							</p>
						</div>
					</div>
				{/if}

				<!-- Submit Button -->
				<div>
					<button
						type="submit"
						disabled={isSubmitting || submitSuccess}
						class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						{#if isSubmitting}
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Submitting...
						{:else if submitSuccess}
							✓ Submitted Successfully
						{:else}
							Submit MT5 Credentials
						{/if}
					</button>
				</div>
			</form>

			<!-- Security Notice -->
			<div class="mt-6 p-4 bg-gray-50 rounded-lg">
				<h4 class="text-sm font-medium text-gray-800 mb-2">🔒 Security & Privacy</h4>
				<ul class="text-sm text-gray-600 space-y-1">
					<li>• Your credentials are transmitted securely via HTTPS</li>
					<li>• Investor passwords provide read-only access only</li>
					<li>• Your information is used solely for tracking and verification</li>
					<li>• We never store or transmit your main trading passwords</li>
				</ul>
			</div>
		</div>

		<!-- Help Section -->
		<div class="mt-8 text-center text-sm text-gray-600">
			<p>Need help finding your MT5 credentials?</p>
			<a href="/help/mt5-setup" class="text-blue-600 hover:text-blue-800 underline">
				View Setup Guide
			</a>
		</div>
	</div>
</div>

<style>
	/* Custom loading animation */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>