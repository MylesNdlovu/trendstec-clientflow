<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Plus,
		Settings,
		CheckCircle,
		AlertTriangle,
		ExternalLink,
		Trash2,
		Activity,
		Globe,
		Webhook,
		Zap,
		Copy
	} from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';

	// Reactive theme classes
	$: themeClasses = getThemeClasses($theme);

	let integrations: any[] = [];
	let loading = true;
	let error = '';
	let systemeConfig: any = null;
	let loadingSysteme = false;
	let systemeTestResult: any = null;
	let webhookUrl = '';
	let webhookCopied = false;

	let showAddForm = false;
	let showEditForm = false;
	let editingIntegrationId = '';
	let newIntegration = {
		name: '',
		type: 'automation',
		apiKey: '',
		webhookUrl: '',
		description: ''
	};
	let editIntegration = {
		name: '',
		type: 'automation',
		apiKey: '',
		webhookUrl: '',
		description: ''
	};

	const integrationTypes = [
		{ value: 'automation', label: 'Marketing Automation', icon: Zap },
		{ value: 'webhook', label: 'Webhook Integration', icon: Webhook },
		{ value: 'crm', label: 'CRM System', icon: Activity },
		{ value: 'analytics', label: 'Analytics Platform', icon: Globe }
	];

	onMount(async () => {
		await loadIntegrations();
		await loadSystemeConfig();
		if (typeof window !== 'undefined') {
			webhookUrl = `${window.location.origin}/api/webhooks/systeme`;
		}
	});

	async function copyWebhook() {
		try {
			await navigator.clipboard.writeText(webhookUrl);
			webhookCopied = true;
			setTimeout(() => webhookCopied = false, 2000);
		} catch (err) {
			console.error('Failed to copy webhook URL:', err);
		}
	}

	async function loadSystemeConfig() {
		loadingSysteme = true;
		try {
			const response = await fetch('/api/integrations/systeme/config');
			const result = await response.json();
			if (result.success) {
				systemeConfig = result.config;
			}
		} catch (err) {
			console.error('Error loading Systeme.io config:', err);
		} finally {
			loadingSysteme = false;
		}
	}

	async function testSystemeConnection() {
		loadingSysteme = true;
		systemeTestResult = null;
		try {
			const response = await fetch('/api/integrations/systeme/test');
			const result = await response.json();
			systemeTestResult = result;
		} catch (err) {
			systemeTestResult = {
				success: false,
				error: err instanceof Error ? err.message : 'Test failed'
			};
		} finally {
			loadingSysteme = false;
		}
	}

	async function saveSystemeApiKey(apiKey: string) {
		loadingSysteme = true;
		try {
			const response = await fetch('/api/integrations/systeme/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ apiKey })
			});
			const result = await response.json();
			if (result.success) {
				await loadSystemeConfig();
			} else {
				error = result.error || 'Failed to save API key';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save';
		} finally {
			loadingSysteme = false;
		}
	}

	async function loadIntegrations() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/integrations');
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to load integrations');
			}

			integrations = result.integrations;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load integrations';
			console.error('Error loading integrations:', err);
		} finally {
			loading = false;
		}
	}

	async function addIntegration() {
		if (!newIntegration.name || !newIntegration.type) return;

		try {
			const response = await fetch('/api/integrations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newIntegration.name,
					type: newIntegration.type,
					apiKey: newIntegration.apiKey || null,
					webhookUrl: newIntegration.webhookUrl || null,
					settings: {
						autoSync: true,
						syncContacts: true,
						syncTags: false,
						defaultTags: []
					}
				})
			});

			const result = await response.json();

			if (result.success) {
				await loadIntegrations();
				resetForm();
			} else {
				error = result.error || 'Failed to create integration';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create integration';
			console.error('Error creating integration:', err);
		}
	}

	async function removeIntegration(id: string) {
		if (!confirm('Are you sure you want to remove this integration?')) return;

		try {
			const response = await fetch(`/api/integrations?id=${id}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				await loadIntegrations();
			} else {
				error = result.error || 'Failed to delete integration';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete integration';
			console.error('Error deleting integration:', err);
		}
	}

	function resetForm() {
		newIntegration = {
			name: '',
			type: 'automation',
			apiKey: '',
			webhookUrl: '',
			description: ''
		};
		showAddForm = false;
	}

	function startEditIntegration(id: string) {
		const integration = integrations.find(i => i.id === id);
		if (!integration) return;

		editingIntegrationId = id;
		editIntegration = {
			name: integration.name,
			type: integration.type,
			apiKey: integration.apiKey || '',
			webhookUrl: integration.webhookUrl || '',
			description: integration.description
		};
		showEditForm = true;
		showAddForm = false;
	}

	async function saveEditIntegration() {
		if (!editIntegration.name || !editIntegration.type) return;

		try {
			const response = await fetch('/api/integrations', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: editingIntegrationId,
					name: editIntegration.name,
					type: editIntegration.type,
					apiKey: editIntegration.apiKey || null,
					webhookUrl: editIntegration.webhookUrl || null
				})
			});

			const result = await response.json();

			if (result.success) {
				await loadIntegrations();
				resetEditForm();
			} else {
				error = result.error || 'Failed to update integration';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update integration';
			console.error('Error updating integration:', err);
		}
	}

	function resetEditForm() {
		editIntegration = {
			name: '',
			type: 'automation',
			apiKey: '',
			webhookUrl: '',
			description: ''
		};
		showEditForm = false;
		editingIntegrationId = '';
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active': return 'active';
			case 'error': return 'text-red-400';
			case 'inactive': return 'text-gray-400';
			default: return 'text-gray-400';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'active': return CheckCircle;
			case 'error': return AlertTriangle;
			default: return CheckCircle;
		}
	}
</script>

<svelte:head>
	<title>Sales & Marketing CRM - Integrations</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
	<div class="max-w-7xl mx-auto space-y-8">
		<!-- Page header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-white">Sales & Marketing CRM</h1>
				<p class="mt-2 text-gray-400">
					Capture, Nurture, Convert and Retain Leads with automated workflows and integrations
				</p>
			</div>
			<button
				on:click={() => showAddForm = true}
				class="flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} text-white rounded-xl transition-colors font-medium"
			>
				<Plus class="w-4 h-4 mr-2" />
				Add Integration
			</button>
		</div>

		<!-- Add Integration Form -->
		{#if showAddForm}
			<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-white">Add New Integration</h3>
					<button
						on:click={resetForm}
						class="text-gray-400 hover:text-gray-300"
					>
						×
					</button>
				</div>

				<form on:submit|preventDefault={addIntegration} class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-300 mb-2">
								Integration Name
							</label>
							<input
								id="name"
								type="text"
								bind:value={newIntegration.name}
								placeholder="e.g., Zapier, ConvertKit"
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
								required
							/>
						</div>

						<div>
							<label for="type" class="block text-sm font-medium text-gray-300 mb-2">
								Integration Type
							</label>
							<select
								id="type"
								bind:value={newIntegration.type}
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
							>
								{#each integrationTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-300 mb-2">
							Description
						</label>
						<input
							id="description"
							type="text"
							bind:value={newIntegration.description}
							placeholder="Brief description of this integration"
							class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
						/>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="apiKey" class="block text-sm font-medium text-gray-300 mb-2">
								API Key (Optional)
							</label>
							<input
								id="apiKey"
								type="password"
								bind:value={newIntegration.apiKey}
								placeholder="Enter API key"
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
							/>
						</div>

						<div>
							<label for="webhookUrl" class="block text-sm font-medium text-gray-300 mb-2">
								Webhook URL (Optional)
							</label>
							<input
								id="webhookUrl"
								type="url"
								bind:value={newIntegration.webhookUrl}
								placeholder="https://example.com/webhook"
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
							/>
						</div>
					</div>

					<div class="flex space-x-4">
						<button
							type="submit"
							class="flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} text-white rounded-lg transition-colors font-medium"
						>
							<Plus class="w-4 h-4 mr-2" />
							Add Integration
						</button>
						<button
							type="button"
							on:click={resetForm}
							class="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Edit Integration Form -->
		{#if showEditForm}
			<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-lg font-semibold text-white">Edit Integration</h3>
					<button
						on:click={resetEditForm}
						class="text-gray-400 hover:text-gray-300"
					>
						×
					</button>
				</div>

				<form on:submit|preventDefault={saveEditIntegration} class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="edit-name" class="block text-sm font-medium text-gray-300 mb-2">
								Integration Name
							</label>
							<input
								id="edit-name"
								type="text"
								bind:value={editIntegration.name}
								placeholder="e.g., Zapier, ConvertKit"
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
								required
							/>
						</div>

						<div>
							<label for="edit-type" class="block text-sm font-medium text-gray-300 mb-2">
								Integration Type
							</label>
							<select
								id="edit-type"
								bind:value={editIntegration.type}
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
							>
								{#each integrationTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div>
						<label for="edit-description" class="block text-sm font-medium text-gray-300 mb-2">
							Description
						</label>
						<input
							id="edit-description"
							type="text"
							bind:value={editIntegration.description}
							placeholder="Brief description of this integration"
							class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
						/>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="edit-apiKey" class="block text-sm font-medium text-gray-300 mb-2">
								API Key (Optional)
							</label>
							<input
								id="edit-apiKey"
								type="password"
								bind:value={editIntegration.apiKey}
								placeholder="Enter API key"
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
							/>
						</div>

						<div>
							<label for="edit-webhookUrl" class="block text-sm font-medium text-gray-300 mb-2">
								Webhook URL (Optional)
							</label>
							<input
								id="edit-webhookUrl"
								type="url"
								bind:value={editIntegration.webhookUrl}
								placeholder="https://example.com/webhook"
								class="w-full px-3 py-2 bg-black border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
							/>
						</div>
					</div>

					<div class="flex space-x-4">
						<button
							type="submit"
							class="flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} text-white rounded-lg transition-colors font-medium"
						>
							<Settings class="w-4 h-4 mr-2" />
							Save Changes
						</button>
						<button
							type="button"
							on:click={resetEditForm}
							class="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Error Display -->
		{#if error}
			<div class="glass-card-ios rounded-2xl p-6 shadow-xl bg-red-500/10 border border-red-500/20">
				<div class="flex items-center space-x-3">
					<AlertTriangle class="w-5 h-5 text-red-500" />
					<p class="text-red-500 font-medium">{error}</p>
				</div>
			</div>
		{/if}

		<!-- Marketing Automation Platform -->
		<div class="glass-card-ios rounded-2xl p-6 shadow-xl border-2 {themeClasses.primaryBorder}">
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center space-x-3">
					<div class="w-12 h-12 bg-gradient-to-r {themeClasses.primaryGradient} rounded-xl flex items-center justify-center">
						<Zap class="w-6 h-6 text-white" />
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">Marketing Automation</h2>
						<p class="text-sm text-gray-400">Automated workflows, email & SMS campaigns, lead capture</p>
					</div>
				</div>
				{#if systemeConfig?.configured}
					<div class="flex items-center space-x-2 px-3 py-1 bg-green-500/20 rounded-lg">
						<CheckCircle class="w-4 h-4 text-green-400" />
						<span class="text-sm text-green-400 font-medium">Connected</span>
					</div>
				{:else}
					<div class="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 rounded-lg">
						<AlertTriangle class="w-4 h-4 text-yellow-400" />
						<span class="text-sm text-yellow-400 font-medium">Not Configured</span>
					</div>
				{/if}
			</div>

			<!-- Webhook URL Section (Incoming) -->
			<div class="mb-6 pb-6 border-b border-gray-700">
				<h3 class="text-lg font-semibold text-white mb-3 flex items-center">
					<Webhook class="w-5 h-5 mr-2 {themeClasses.primary}" />
					Lead Capture Webhook
				</h3>
				<p class="text-sm text-gray-400 mb-4">
					Connect your lead capture forms and landing pages to automatically sync leads into your CRM.
				</p>

				<div class="flex items-center gap-2 mb-3">
					<input
						type="text"
						value={webhookUrl}
						readonly
						class="flex-1 px-4 py-3 bg-black border border-gray-600 rounded-lg text-white font-mono text-sm"
					/>
					<button
						on:click={copyWebhook}
						class="px-4 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
					>
						{#if webhookCopied}
							<CheckCircle class="w-4 h-4" />
							Copied!
						{:else}
							<Copy class="w-4 h-4" />
							Copy
						{/if}
					</button>
				</div>

				<div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
					<p class="text-xs text-blue-300 mb-2"><strong>Quick Setup:</strong></p>
					<ol class="text-xs text-blue-200 space-y-1 ml-4 list-decimal">
						<li>Copy the webhook URL above</li>
						<li>Paste it into your marketing platform's webhook settings</li>
						<li>Configure to trigger on: <code class="bg-black/30 px-1 rounded">form submissions</code>, <code class="bg-black/30 px-1 rounded">new contacts</code></li>
						<li>Save and test the connection</li>
					</ol>
				</div>
			</div>

			<!-- API Configuration Form (Outgoing) -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-white mb-3 flex items-center">
					<Activity class="w-5 h-5 mr-2 {themeClasses.primary}" />
					Workflow Automation API
				</h3>
				<div>
					<label for="systeme-api-key" class="block text-sm font-medium text-gray-300 mb-2">
						Automation Platform API Key
					</label>
					<div class="flex space-x-3">
						<input
							id="systeme-api-key"
							type="password"
							placeholder="Enter your automation platform API key"
							value={systemeConfig?.apiKey || ''}
							on:input={(e) => {
								if (systemeConfig) {
									systemeConfig.apiKey = e.currentTarget.value;
								}
							}}
							class="flex-1 px-4 py-3 bg-black border border-gray-600 rounded-lg text-white focus:ring-2 {themeClasses.focusRing} {themeClasses.focusBorder}"
						/>
						<button
							on:click={() => saveSystemeApiKey(systemeConfig?.apiKey || '')}
							disabled={loadingSysteme}
							class="px-4 py-3 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
						>
							{loadingSysteme ? 'Saving...' : 'Save'}
						</button>
					</div>
					<p class="text-xs text-gray-500 mt-2">
						Connect your workflow automation backend for email, SMS, and triggered campaigns
					</p>
				</div>

				<!-- Test Connection -->
				<div class="flex items-center space-x-3">
					<button
						on:click={testSystemeConnection}
						disabled={loadingSysteme || !systemeConfig?.configured}
						class="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
					>
						<Activity class="w-4 h-4 mr-2" />
						{loadingSysteme ? 'Testing...' : 'Test Connection'}
					</button>

					{#if systemeTestResult}
						{#if systemeTestResult.success}
							<div class="flex items-center space-x-2 text-green-400">
								<CheckCircle class="w-4 h-4" />
								<span class="text-sm">Connection successful!</span>
							</div>
						{:else}
							<div class="flex items-center space-x-2 text-red-400">
								<AlertTriangle class="w-4 h-4" />
								<span class="text-sm">{systemeTestResult.error}</span>
							</div>
						{/if}
					{/if}
				</div>

				<!-- API Stats -->
				{#if systemeConfig?.stats}
					<div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
						<div>
							<div class="text-sm text-gray-400">Total Requests</div>
							<div class="text-lg font-bold text-white">{systemeConfig.stats.totalRequests || 0}</div>
						</div>
						<div>
							<div class="text-sm text-gray-400">Success Rate</div>
							<div class="text-lg font-bold text-white">{systemeConfig.stats.successRate || '0%'}</div>
						</div>
						<div>
							<div class="text-sm text-gray-400">Failed</div>
							<div class="text-lg font-bold text-white">{systemeConfig.stats.failedRequests || 0}</div>
						</div>
					</div>
				{/if}

				<!-- Usage Description -->
				<div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
					<p class="text-sm text-blue-300 mb-2">
						<strong>Automated Marketing Power:</strong> Your CRM automatically triggers personalized email sequences,
						SMS campaigns, and workflow automations based on lead behavior and trading activity. Set up sophisticated
						nurture campaigns that run on autopilot to convert and retain more clients.
					</p>
				</div>
			</div>
		</div>

		<!-- Email Integration (Mailgun) -->
		<div class="glass-card-ios rounded-2xl p-6 shadow-xl border-2 border-orange-500/30">
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center space-x-3">
					<div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
						<Mail class="w-6 h-6 text-white" />
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">Email Service</h2>
						<p class="text-sm text-gray-400">Email verification, password resets, and transactional emails</p>
					</div>
				</div>
				<a
					href="/dashboard/integrations/email"
					class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
				>
					<Settings class="w-4 h-4" />
					Configure
				</a>
			</div>

			<div class="space-y-4">
				<p class="text-sm text-gray-300">
					Configure Mailgun to enable email functionality for your application:
				</p>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="bg-black/50 border border-orange-500/20 rounded-lg p-4">
						<div class="flex items-center space-x-2 mb-2">
							<Mail class="w-4 h-4 text-orange-500" />
							<h3 class="text-sm font-semibold text-white">Email Verification</h3>
						</div>
						<p class="text-xs text-gray-400">Verify user email addresses on signup</p>
					</div>

					<div class="bg-black/50 border border-orange-500/20 rounded-lg p-4">
						<div class="flex items-center space-x-2 mb-2">
							<Mail class="w-4 h-4 text-orange-500" />
							<h3 class="text-sm font-semibold text-white">Password Reset</h3>
						</div>
						<p class="text-xs text-gray-400">Send secure password reset links</p>
					</div>

					<div class="bg-black/50 border border-orange-500/20 rounded-lg p-4">
						<div class="flex items-center space-x-2 mb-2">
							<Mail class="w-4 h-4 text-orange-500" />
							<h3 class="text-sm font-semibold text-white">Welcome Emails</h3>
						</div>
						<p class="text-xs text-gray-400">Onboard new users with welcome messages</p>
					</div>
				</div>

				<div class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
					<p class="text-sm text-orange-300 mb-2">
						<strong>Setup Required:</strong> Click the "Configure" button above to enter your Mailgun API credentials and enable email functionality.
					</p>
					<ul class="text-xs text-orange-200 space-y-1 ml-4 list-disc">
						<li>Get a free Mailgun account at <a href="https://www.mailgun.com" target="_blank" class="underline">mailgun.com</a></li>
						<li>Add your API key and domain in the configuration page</li>
						<li>Test the connection to verify everything works</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Integrations Grid -->
		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
				<span class="ml-3 text-gray-400">Loading integrations...</span>
			</div>
		{:else if integrations.length === 0}
			<div class="glass-card-ios rounded-2xl p-12 text-center">
				<Globe class="w-16 h-16 {themeClasses.primary} mx-auto mb-4 opacity-50" />
				<h3 class="text-xl font-semibold text-white mb-2">No integrations yet</h3>
				<p class="text-gray-400 mb-6">Connect your first marketing automation tool or webhook to get started.</p>
				<button
					on:click={() => showAddForm = true}
					class="inline-flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} {themeClasses.primaryGradientHover} text-white rounded-xl transition-colors font-medium"
				>
					<Plus class="w-4 h-4 mr-2" />
					Add Your First Integration
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{#each integrations as integration}
				<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center space-x-3">
							<div class="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
								{#if integration.type === 'automation'}
									<Zap class="w-6 h-6 {themeClasses.primary}" />
								{:else if integration.type === 'webhook'}
									<Webhook class="w-6 h-6 {themeClasses.primary}" />
								{:else if integration.type === 'crm'}
									<Activity class="w-6 h-6 {themeClasses.primary}" />
								{:else}
									<Globe class="w-6 h-6 {themeClasses.primary}" />
								{/if}
							</div>
							<div>
								<h3 class="text-lg font-semibold text-white">{integration.name}</h3>
								<p class="text-sm text-gray-400">{integration.description}</p>
							</div>
						</div>
						<div class="flex items-center space-x-2">
							<svelte:component
								this={getStatusIcon(integration.status)}
								class="w-4 h-4 {getStatusColor(integration.status) === 'active' ? themeClasses.primary : getStatusColor(integration.status)}"
							/>
							<span class="text-sm font-medium text-white capitalize">{integration.status}</span>
						</div>
					</div>

					<!-- Integration Stats -->
					<div class="grid grid-cols-2 gap-4 mb-6">
						<div>
							<div class="text-sm text-gray-400">Syncs</div>
							<div class="text-lg font-bold text-white">{integration.syncCount.toLocaleString()}</div>
						</div>
						<div>
							<div class="text-sm text-gray-400">Errors</div>
							<div class="text-lg font-bold text-white">{integration.errorCount}</div>
						</div>
					</div>

					<!-- Last Sync -->
					<div class="mb-6">
						<div class="text-sm text-gray-400">Last Sync</div>
						<div class="text-sm text-white">
							{integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : 'Never'}
						</div>
					</div>

					<!-- Integration Settings -->
					{#if integration.settings}
						<div class="mb-6">
							<div class="text-sm text-gray-400 mb-2">Settings</div>
							<div class="space-y-1">
								{#if integration.settings.autoSync}
									<div class="flex items-center text-sm {themeClasses.primary}">
										<CheckCircle class="w-3 h-3 mr-1" />
										Auto-sync enabled
									</div>
								{/if}
								{#if integration.settings.syncContacts}
									<div class="flex items-center text-sm {themeClasses.primary}">
										<CheckCircle class="w-3 h-3 mr-1" />
										Contact sync enabled
									</div>
								{/if}
								{#if integration.settings.defaultTags && integration.settings.defaultTags.length > 0}
									<div class="text-sm text-gray-300">
										Tags: {integration.settings.defaultTags.join(', ')}
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex space-x-3">
						<button
							on:click={() => startEditIntegration(integration.id)}
							class="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
						>
							<Settings class="w-4 h-4 mr-1" />
							Configure
						</button>
						{#if integration.webhookUrl}
							<a
								href={integration.webhookUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
							>
								<ExternalLink class="w-4 h-4 mr-1" />
								Test
							</a>
						{/if}
						<button
							on:click={() => removeIntegration(integration.id)}
							class="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
						>
							<Trash2 class="w-4 h-4 mr-1" />
							Remove
						</button>
					</div>
				</div>
				{/each}
			</div>
		{/if}

		<!-- Integration Types Info -->
		<div class="glass-card-ios rounded-2xl p-6 shadow-xl">
			<h3 class="text-lg font-semibold text-white mb-4">Supported Integration Types</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each integrationTypes as type}
					<div class="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
						<svelte:component this={type.icon} class="w-5 h-5 {themeClasses.primary}" />
						<div>
							<div class="text-white font-medium">{type.label}</div>
							<div class="text-xs text-gray-400">Connect marketing tools</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>