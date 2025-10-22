<script lang="ts">
	import { CheckCircle, Copy, ExternalLink, AlertCircle, Key } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	$: themeClasses = getThemeClasses($theme);

	let accessToken = '';
	let connecting = false;
	let error = '';
	let success = false;

	async function connectWithToken() {
		if (!accessToken || accessToken.length < 50) {
			error = 'Please enter a valid access token';
			return;
		}

		connecting = true;
		error = '';

		try {
			const res = await fetch('/api/facebook/connect-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ accessToken })
			});

			const data = await res.json();

			if (data.success) {
				success = true;
				setTimeout(() => {
					window.location.href = '/dashboard/ads';
				}, 2000);
			} else {
				error = data.error || 'Failed to connect';
			}
		} catch (err) {
			error = 'Connection failed. Please try again.';
		} finally {
			connecting = false;
		}
	}
</script>

<div class="p-6 max-w-5xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Connect Your Facebook Ads Account</h1>
		<p class="text-gray-400">Follow these simple steps to connect via System User Token (No App Review Required!)</p>
	</div>

	{#if success}
		<div class="glass-card-ios rounded-2xl p-8 text-center">
			<CheckCircle class="w-16 h-16 text-green-400 mx-auto mb-4" />
			<h2 class="text-2xl font-bold text-white mb-2">Successfully Connected!</h2>
			<p class="text-gray-400">Redirecting to your ads dashboard...</p>
		</div>
	{:else}
		<!-- Step-by-Step Guide -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- Left Column: Instructions -->
			<div class="space-y-6">
				<!-- Step 1 -->
				<div class="glass-card-ios rounded-xl p-6">
					<div class="flex items-start mb-4">
						<div class="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
							1
						</div>
						<div>
							<h3 class="text-lg font-bold text-white mb-2">Create Facebook App (Optional)</h3>
							<p class="text-sm text-gray-400 mb-3">
								If you don't have one, create a Facebook app. Stay in <span class="text-orange-400">Development Mode</span> (no review needed).
							</p>
							<a
								href="https://developers.facebook.com/apps/create/"
								target="_blank"
								class="inline-flex items-center text-sm {themeClasses.primary} hover:underline"
							>
								Create App
								<ExternalLink class="w-4 h-4 ml-1" />
							</a>
						</div>
					</div>
				</div>

				<!-- Step 2 -->
				<div class="glass-card-ios rounded-xl p-6">
					<div class="flex items-start mb-4">
						<div class="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
							2
						</div>
						<div>
							<h3 class="text-lg font-bold text-white mb-2">Create System User in Business Manager</h3>
							<p class="text-sm text-gray-400 mb-3">
								Go to Business Settings → Users → System Users → Add
							</p>
							<ol class="text-sm text-gray-300 space-y-1 mb-3">
								<li>• Name: "Ad Management System"</li>
								<li>• Role: Admin</li>
								<li>• Grant access to your Ad Account</li>
							</ol>
							<a
								href="https://business.facebook.com/settings/system-users"
								target="_blank"
								class="inline-flex items-center text-sm {themeClasses.primary} hover:underline"
							>
								Open Business Manager
								<ExternalLink class="w-4 h-4 ml-1" />
							</a>
						</div>
					</div>
				</div>

				<!-- Step 3 -->
				<div class="glass-card-ios rounded-xl p-6">
					<div class="flex items-start mb-4">
						<div class="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
							3
						</div>
						<div>
							<h3 class="text-lg font-bold text-white mb-2">Generate Access Token</h3>
							<p class="text-sm text-gray-400 mb-3">
								Click on your System User → Generate New Token
							</p>
							<div class="bg-black/30 rounded-lg p-3 mb-3">
								<p class="text-xs text-gray-400 mb-2">Select these permissions:</p>
								<div class="grid grid-cols-2 gap-1 text-xs">
									<span class="text-green-400">✓ ads_management</span>
									<span class="text-green-400">✓ ads_read</span>
									<span class="text-green-400">✓ business_management</span>
									<span class="text-green-400">✓ pages_read_engagement</span>
								</div>
							</div>
							<p class="text-xs text-gray-400 mb-3">
								<strong>Important:</strong> Select "Never Expire" for the token duration
							</p>
						</div>
					</div>
				</div>

				<!-- Step 4 -->
				<div class="glass-card-ios rounded-xl p-6">
					<div class="flex items-start">
						<div class="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
							4
						</div>
						<div class="flex-1">
							<h3 class="text-lg font-bold text-white mb-2">Copy Token & Paste Below</h3>
							<p class="text-sm text-gray-400">
								Copy your System User access token and paste it in the form →
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Right Column: Token Input Form -->
			<div class="glass-card-ios rounded-xl p-6 h-fit sticky top-6">
				<div class="mb-6">
					<div class="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
						<Key class="w-8 h-8 text-blue-400" />
					</div>
					<h2 class="text-xl font-bold text-white text-center mb-2">Enter Access Token</h2>
					<p class="text-sm text-gray-400 text-center">Paste your System User access token</p>
				</div>

				{#if error}
					<div class="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
						<div class="text-red-400 text-sm flex items-center">
							<AlertCircle class="w-4 h-4 mr-2" />
							{error}
						</div>
					</div>
				{/if}

				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-300 mb-2">
						System User Access Token
					</label>
					<textarea
						bind:value={accessToken}
						placeholder="EAAG..."
						rows="5"
						class="w-full px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder} font-mono"
					></textarea>
					<p class="text-xs text-gray-500 mt-1">
						Starts with "EAAG..." and should be ~200+ characters
					</p>
				</div>

				<button
					on:click={connectWithToken}
					disabled={connecting || !accessToken}
					class="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if connecting}
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
						Connecting...
					{:else}
						Connect Ad Account
					{/if}
				</button>

				<div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
					<div class="flex items-start">
						<AlertCircle class="w-4 h-4 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
						<div class="text-xs text-blue-200">
							<strong>Security Note:</strong> Your token is encrypted and securely stored. We never see your Facebook password.
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Video Tutorial (Optional) -->
		<div class="glass-card-ios rounded-xl p-6">
			<h3 class="text-lg font-bold text-white mb-4">Video Tutorial (Coming Soon)</h3>
			<div class="aspect-video bg-black/30 rounded-lg flex items-center justify-center">
				<p class="text-gray-500">Step-by-step video guide</p>
			</div>
		</div>

		<!-- Why This Method? -->
		<div class="mt-6 grid grid-cols-3 gap-4">
			<div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
				<CheckCircle class="w-6 h-6 text-green-400 mb-2" />
				<p class="text-sm font-medium text-white mb-1">No App Review</p>
				<p class="text-xs text-gray-400">No waiting for Facebook approval</p>
			</div>
			<div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
				<CheckCircle class="w-6 h-6 text-green-400 mb-2" />
				<p class="text-sm font-medium text-white mb-1">Never Expires</p>
				<p class="text-xs text-gray-400">System User tokens don't expire</p>
			</div>
			<div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
				<CheckCircle class="w-6 h-6 text-green-400 mb-2" />
				<p class="text-sm font-medium text-white mb-1">You Control It</p>
				<p class="text-xs text-gray-400">Revoke access anytime in your BM</p>
			</div>
		</div>
	{/if}
</div>
