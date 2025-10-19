<script lang="ts">
	import { onMount } from 'svelte';
	import { Mail, Check, X, Loader, AlertTriangle } from 'lucide-svelte';

	let config = {
		apiKey: '',
		domain: '',
		fromEmail: '',
		appName: 'ClientFlow',
		enabled: false
	};

	let loading = true;
	let saving = false;
	let testing = false;
	let testResult: any = null;
	let saveMessage = '';

	onMount(async () => {
		await loadConfig();
	});

	async function loadConfig() {
		loading = true;
		try {
			const response = await fetch('/api/integrations/mailgun');
			const result = await response.json();
			if (result.success && result.config) {
				config = result.config;
			}
		} catch (error) {
			console.error('Error loading Mailgun config:', error);
		} finally {
			loading = false;
		}
	}

	async function saveConfig() {
		saving = true;
		saveMessage = '';
		testResult = null;

		try {
			const response = await fetch('/api/integrations/mailgun', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});

			const result = await response.json();

			if (result.success) {
				saveMessage = 'Configuration saved successfully!';
				setTimeout(() => saveMessage = '', 3000);
			} else {
				saveMessage = result.error || 'Failed to save configuration';
			}
		} catch (error) {
			saveMessage = 'Error saving configuration';
			console.error('Error saving Mailgun config:', error);
		} finally {
			saving = false;
		}
	}

	async function testConnection() {
		testing = true;
		testResult = null;

		try {
			const response = await fetch('/api/integrations/mailgun/test', {
				method: 'POST'
			});

			const result = await response.json();
			testResult = result;
		} catch (error) {
			testResult = {
				success: false,
				error: 'Failed to test connection'
			};
			console.error('Error testing Mailgun:', error);
		} finally {
			testing = false;
		}
	}
</script>

<svelte:head>
	<title>Email Settings - Integrations</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-2">
				<div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
					<Mail class="w-6 h-6 text-white" />
				</div>
				<div>
					<h1 class="text-3xl font-bold text-white">Email Configuration</h1>
					<p class="text-gray-400">Configure Mailgun for email verification and password resets</p>
				</div>
			</div>
		</div>

		{#if loading}
			<div class="bg-gray-900 border border-orange-500/30 rounded-xl p-8 text-center">
				<Loader class="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
				<p class="text-gray-400">Loading configuration...</p>
			</div>
		{:else}
			<!-- Configuration Form -->
			<div class="bg-gray-900 border border-orange-500/30 rounded-xl p-8 mb-6">
				<h2 class="text-xl font-bold text-white mb-6">Mailgun Settings</h2>

				<div class="space-y-6">
					<!-- Enabled Toggle -->
					<div class="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-orange-500/20">
						<div>
							<label class="text-white font-semibold">Enable Mailgun</label>
							<p class="text-sm text-gray-400">Turn on email functionality</p>
						</div>
						<label class="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								bind:checked={config.enabled}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
						</label>
					</div>

					<!-- API Key -->
					<div>
						<label for="apiKey" class="block text-white font-semibold mb-2">
							Mailgun API Key *
						</label>
						<input
							id="apiKey"
							type="password"
							bind:value={config.apiKey}
							placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxx"
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
						/>
						<p class="text-sm text-gray-400 mt-1">Found in your Mailgun dashboard under API Keys</p>
					</div>

					<!-- Domain -->
					<div>
						<label for="domain" class="block text-white font-semibold mb-2">
							Mailgun Domain *
						</label>
						<input
							id="domain"
							type="text"
							bind:value={config.domain}
							placeholder="sandboxXXXXXXXX.mailgun.org or mg.yourdomain.com"
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
						/>
						<p class="text-sm text-gray-400 mt-1">Your Mailgun sandbox or custom domain</p>
					</div>

					<!-- From Email -->
					<div>
						<label for="fromEmail" class="block text-white font-semibold mb-2">
							From Email Address *
						</label>
						<input
							id="fromEmail"
							type="email"
							bind:value={config.fromEmail}
							placeholder="noreply@yourdomain.com"
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
						/>
						<p class="text-sm text-gray-400 mt-1">The sender email address for all outgoing emails</p>
					</div>

					<!-- App Name -->
					<div>
						<label for="appName" class="block text-white font-semibold mb-2">
							Application Name
						</label>
						<input
							id="appName"
							type="text"
							bind:value={config.appName}
							placeholder="ClientFlow"
							class="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
						/>
						<p class="text-sm text-gray-400 mt-1">Used in email headers and subject lines</p>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-3 mt-8">
					<button
						on:click={saveConfig}
						disabled={saving}
						class="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if saving}
							<span class="flex items-center justify-center gap-2">
								<Loader class="w-5 h-5 animate-spin" />
								Saving...
							</span>
						{:else}
							Save Configuration
						{/if}
					</button>

					<button
						on:click={testConnection}
						disabled={testing || !config.enabled || !config.apiKey || !config.domain}
						class="flex-1 bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-orange-500/30"
					>
						{#if testing}
							<span class="flex items-center justify-center gap-2">
								<Loader class="w-5 h-5 animate-spin" />
								Testing...
							</span>
						{:else}
							Send Test Email
						{/if}
					</button>
				</div>

				<!-- Save Message -->
				{#if saveMessage}
					<div class="mt-4 p-4 rounded-lg {saveMessage.includes('success') ? 'bg-green-900/30 border border-green-500/50 text-green-400' : 'bg-red-900/30 border border-red-500/50 text-red-400'}">
						{saveMessage}
					</div>
				{/if}

				<!-- Test Result -->
				{#if testResult}
					<div class="mt-4 p-4 rounded-lg {testResult.success ? 'bg-green-900/30 border border-green-500/50' : 'bg-red-900/30 border border-red-500/50'}">
						<div class="flex items-start gap-3">
							{#if testResult.success}
								<Check class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
								<div class="flex-1">
									<p class="text-green-400 font-semibold">Test Email Sent Successfully!</p>
									<p class="text-sm text-green-300 mt-1">{testResult.message}</p>
									{#if testResult.messageId}
										<p class="text-xs text-green-300/70 mt-2">Message ID: {testResult.messageId}</p>
									{/if}
								</div>
							{:else}
								<X class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
								<div class="flex-1">
									<p class="text-red-400 font-semibold">Test Failed</p>
									<p class="text-sm text-red-300 mt-1">{testResult.error}</p>
									{#if testResult.details}
										<p class="text-xs text-red-300/70 mt-2">{testResult.details}</p>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Help Section -->
			<div class="bg-gray-900 border border-orange-500/30 rounded-xl p-8">
				<div class="flex items-start gap-3 mb-4">
					<AlertTriangle class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
					<div>
						<h3 class="text-lg font-bold text-white mb-2">Setup Instructions</h3>
						<div class="space-y-2 text-gray-300 text-sm">
							<p><strong>1. Create Mailgun Account:</strong> Sign up at <a href="https://www.mailgun.com" target="_blank" class="text-orange-500 hover:text-orange-400">mailgun.com</a></p>
							<p><strong>2. Get API Key:</strong> Find it in Settings → API Keys → Private API key</p>
							<p><strong>3. Use Sandbox or Custom Domain:</strong></p>
							<ul class="list-disc list-inside ml-4 space-y-1">
								<li><strong>Sandbox</strong> (free, for testing): sandboxXXXXXXXX.mailgun.org - Must add authorized recipients</li>
								<li><strong>Custom Domain</strong> (production): mg.yourdomain.com - Requires DNS setup</li>
							</ul>
							<p><strong>4. Save & Test:</strong> Click "Save Configuration" then "Send Test Email"</p>
						</div>
					</div>
				</div>

				<div class="mt-6 p-4 bg-black/50 rounded-lg border border-orange-500/20">
					<h4 class="text-white font-semibold mb-2">What emails will be sent?</h4>
					<ul class="text-sm text-gray-300 space-y-1">
						<li>✉️ Email verification when users sign up</li>
						<li>🔑 Password reset links</li>
						<li>👋 Welcome emails after verification</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>
