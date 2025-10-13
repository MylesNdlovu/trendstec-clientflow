<script lang="ts">
	import {
		Shield,
		Lock,
		User,
		Building,
		Key,
		Server,
		Mail,
		Phone,
		CheckCircle,
		AlertTriangle
	} from 'lucide-svelte';

	let formData = {
		email: '',
		phone: '',
		firstName: '',
		lastName: '',
		broker: '',
		mt5Login: '',
		mt5Password: '',
		mt5Server: '',
		investorPassword: ''
	};

	let submitting = false;
	let submitted = false;
	let error = '';

	const brokerOptions = [
		'IC Markets',
		'Pepperstone',
		'OANDA',
		'IG',
		'XM',
		'FXCM',
		'Admiral Markets',
		'FxPro',
		'eToro',
		'Plus500',
		'Other'
	];

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
					source: 'mt5-form-embed',
					timestamp: new Date().toISOString()
				})
			});

			if (response.ok) {
				submitted = true;
				// Sync with Systeme.io
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
					tags: ['MT5-Lead', 'Affiliate-Signup', 'Embedded-Form']
				})
			});
		} catch (err) {
			console.error('Systeme.io sync error:', err);
		}
	}

	function isFormValid() {
		return formData.email &&
			   formData.firstName &&
			   formData.broker &&
			   formData.mt5Login &&
			   formData.investorPassword;
	}

	function resetForm() {
		formData = {
			email: '',
			phone: '',
			firstName: '',
			lastName: '',
			broker: '',
			mt5Login: '',
			mt5Password: '',
			mt5Server: '',
			investorPassword: ''
		};
		submitted = false;
		error = '';
	}
</script>

<svelte:head>
	<title>MT5 Investor Credentials - Secure Form</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			margin: 0;
			padding: 0;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
		}
	</style>
</svelte:head>

<div class="min-h-screen p-4 flex items-center justify-center">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
		{#if !submitted}
			<form on:submit|preventDefault={submitForm} class="p-8">
				<div class="text-center mb-8">
					<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<Shield class="w-8 h-8 text-white" />
					</div>
					<h1 class="text-2xl font-bold text-gray-900">MT5 Investor Form</h1>
					<p class="text-gray-600 text-sm mt-2">Secure credential capture for transparent tracking</p>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<div class="flex items-center">
							<AlertTriangle class="w-5 h-5 text-red-600 mr-3" />
							<p class="text-red-700 text-sm">{error}</p>
						</div>
					</div>
				{/if}

				<!-- Personal Information -->
				<div class="space-y-4 mb-6">
					<h3 class="text-lg font-semibold text-gray-900 flex items-center">
						<User class="w-5 h-5 mr-2" />
						Personal Info
					</h3>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								First Name *
							</label>
							<input
								type="text"
								bind:value={formData.firstName}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Last Name
							</label>
							<input
								type="text"
								bind:value={formData.lastName}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Mail class="w-4 h-4 inline mr-1" />
							Email Address *
						</label>
						<input
							type="email"
							bind:value={formData.email}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Phone class="w-4 h-4 inline mr-1" />
							Phone Number
						</label>
						<input
							type="tel"
							bind:value={formData.phone}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
						/>
					</div>
				</div>

				<!-- MT5 Information -->
				<div class="space-y-4 mb-6">
					<h3 class="text-lg font-semibold text-gray-900 flex items-center">
						<Building class="w-5 h-5 mr-2" />
						MT5 Details
					</h3>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Broker *
						</label>
						<select
							bind:value={formData.broker}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
						>
							<option value="">Select your broker</option>
							{#each brokerOptions as broker}
								<option value={broker}>{broker}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Key class="w-4 h-4 inline mr-1" />
							MT5 Login Number *
						</label>
						<input
							type="text"
							bind:value={formData.mt5Login}
							required
							placeholder="e.g., 12345678"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Server class="w-4 h-4 inline mr-1" />
							Server Name
						</label>
						<input
							type="text"
							bind:value={formData.mt5Server}
							placeholder="e.g., ICMarkets-Live01"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							<Lock class="w-4 h-4 inline mr-1" />
							Investor Password *
						</label>
						<input
							type="password"
							bind:value={formData.investorPassword}
							required
							placeholder="Read-only investor password"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
						/>
						<p class="text-xs text-gray-500 mt-1">
							This is your read-only investor password, not your main trading password
						</p>
					</div>
				</div>

				<!-- Security Notice -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
					<div class="flex items-center mb-2">
						<Shield class="w-5 h-5 text-blue-600 mr-2" />
						<h4 class="text-sm font-semibold text-blue-900">Security Notice</h4>
					</div>
					<ul class="text-xs text-blue-800 space-y-1">
						<li>• All data is encrypted and secure</li>
						<li>• Only read-only investor access required</li>
						<li>• Used for transparent conversion tracking</li>
						<li>• Automatically synced with workflows</li>
					</ul>
				</div>

				<button
					type="submit"
					disabled={submitting || !isFormValid()}
					class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
				>
					{#if submitting}
						<div class="flex items-center justify-center">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Submitting...
						</div>
					{:else}
						Submit Credentials
					{/if}
				</button>
			</form>
		{:else}
			<div class="text-center p-8">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<CheckCircle class="w-8 h-8 text-green-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-2">Successfully Submitted!</h3>
				<p class="text-gray-600 text-sm mb-6">
					Your MT5 credentials have been securely captured and synced with our tracking system.
				</p>
				<button
					on:click={resetForm}
					class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors text-sm"
				>
					Submit Another
				</button>
			</div>
		{/if}
	</div>
</div>