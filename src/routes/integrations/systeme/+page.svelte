<script lang="ts">
	import { onMount } from 'svelte';

	// Mock webhook data for display
	let webhookUrl = 'https://your-domain.com/api/webhooks/systeme';
	let webhookSecret = 'sk_live_abc123xyz789';
	let apiKey = 'sys_api_key_example_12345';
	let showApiKey = false;
	let showWebhookSecret = false;
	let activeTab: 'webhooks' | 'api' = 'webhooks';

	// Mock data for demonstration
	let recentWebhooks = [
		{
			id: '1',
			event: 'contact.created',
			email: 'john.doe@email.com',
			timestamp: new Date('2024-01-30T10:30:00'),
			status: 'success'
		},
		{
			id: '2',
			event: 'tag.added',
			email: 'sarah.smith@email.com',
			tag: 'MT5_Credentials_Submitted',
			timestamp: new Date('2024-01-30T09:15:00'),
			status: 'success'
		},
		{
			id: '3',
			event: 'contact.updated',
			email: 'mike.johnson@email.com',
			timestamp: new Date('2024-01-30T08:45:00'),
			status: 'failed'
		}
	];

	let apiCalls = [
		{
			id: '1',
			action: 'Add Tag',
			contact: 'emily.davis@email.com',
			tag: 'MT5_Verified',
			timestamp: new Date('2024-01-30T11:00:00'),
			status: 'success'
		},
		{
			id: '2',
			action: 'Update Contact',
			contact: 'david.wilson@email.com',
			field: 'mt5_login',
			timestamp: new Date('2024-01-30T10:20:00'),
			status: 'success'
		},
		{
			id: '3',
			action: 'Trigger Workflow',
			contact: 'lisa.brown@email.com',
			workflow: 'Deposit_Confirmation',
			timestamp: new Date('2024-01-30T09:30:00'),
			status: 'pending'
		}
	];

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			// Visual feedback could be added here
		});
	}

	function formatTimestamp(date: Date) {
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'success': return 'text-green-400';
			case 'failed': return 'text-red-400';
			case 'pending': return 'text-yellow-400';
			default: return 'text-gray-400';
		}
	}
</script>

<svelte:head>
	<title>Systeme.io Integration - Webhooks & API</title>
</svelte:head>

<div class="min-h-screen bg-black p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Page Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-white mb-2">Systeme.io Integration</h1>
			<p class="text-gray-400">Configure webhooks for incoming data and API for outgoing data</p>
		</div>

		<!-- Tab Navigation -->
		<div class="mb-8">
			<nav class="flex space-x-8 border-b border-gray-800">
				<button
					on:click={() => activeTab = 'webhooks'}
					class="py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'webhooks' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}"
				>
					Webhook Configuration
				</button>
				<button
					on:click={() => activeTab = 'api'}
					class="py-3 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'api' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}"
				>
					API Configuration
				</button>
			</nav>
		</div>

		<!-- Webhooks Tab -->
		{#if activeTab === 'webhooks'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Webhook Setup -->
				<div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
					<h3 class="text-lg font-semibold text-white mb-4">Incoming Webhooks</h3>
					<p class="text-gray-400 text-sm mb-6">Configure Systeme.io to send data to your application</p>

					<div class="space-y-4">
						<!-- Webhook URL -->
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Webhook URL</label>
							<div class="flex">
								<input
									type="text"
									value={webhookUrl}
									readonly
									class="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-l-md text-gray-300 text-sm font-mono"
								/>
								<button
									on:click={() => copyToClipboard(webhookUrl)}
									class="px-3 py-2 bg-gray-700 border border-gray-700 border-l-0 rounded-r-md text-gray-300 hover:bg-gray-600 transition-colors text-sm"
								>
									Copy
								</button>
							</div>
						</div>

						<!-- Webhook Secret -->
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Webhook Secret</label>
							<div class="flex">
								<input
									type={showWebhookSecret ? 'text' : 'password'}
									value={webhookSecret}
									readonly
									class="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-l-md text-gray-300 text-sm font-mono"
								/>
								<button
									on:click={() => showWebhookSecret = !showWebhookSecret}
									class="px-3 py-2 bg-gray-700 border border-gray-700 border-l-0 rounded-r-md text-gray-300 hover:bg-gray-600 transition-colors text-sm"
								>
									{showWebhookSecret ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<!-- Events to Subscribe -->
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-3">Subscribe to Events</label>
							<div class="space-y-2">
								{#each ['contact.created', 'contact.updated', 'tag.added', 'tag.removed'] as event}
									<label class="flex items-center">
										<input type="checkbox" checked class="rounded border-gray-600 bg-black text-gray-300 focus:ring-gray-500" />
										<span class="ml-2 text-sm text-gray-300 font-mono">{event}</span>
									</label>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Recent Webhooks -->
				<div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
					<h3 class="text-lg font-semibold text-white mb-4">Recent Webhooks</h3>
					<div class="space-y-3">
						{#each recentWebhooks as webhook}
							<div class="bg-black rounded-md p-3 border border-gray-700">
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm font-mono text-gray-300">{webhook.event}</span>
									<span class="text-xs {getStatusColor(webhook.status)}">{webhook.status}</span>
								</div>
								<div class="text-xs text-gray-400">
									{webhook.email || webhook.contact}
								</div>
								{#if webhook.tag}
									<div class="text-xs text-gray-500 mt-1">Tag: {webhook.tag}</div>
								{/if}
								<div class="text-xs text-gray-500 mt-1">{formatTimestamp(webhook.timestamp)}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- API Tab -->
		{#if activeTab === 'api'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- API Setup -->
				<div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
					<h3 class="text-lg font-semibold text-white mb-4">Outgoing API</h3>
					<p class="text-gray-400 text-sm mb-6">Send data to Systeme.io workflows and contacts</p>

					<div class="space-y-4">
						<!-- API Key -->
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">API Key</label>
							<div class="flex">
								<input
									type={showApiKey ? 'text' : 'password'}
									value={apiKey}
									class="flex-1 px-3 py-2 bg-black border border-gray-700 rounded-l-md text-gray-300 text-sm font-mono"
								/>
								<button
									on:click={() => showApiKey = !showApiKey}
									class="px-3 py-2 bg-gray-700 border border-gray-700 border-l-0 rounded-r-md text-gray-300 hover:bg-gray-600 transition-colors text-sm"
								>
									{showApiKey ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<!-- Available Actions -->
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-3">Available Actions</label>
							<div class="space-y-2">
								{#each [
									{ action: 'Add Tag', endpoint: 'POST /contacts/{id}/tags' },
									{ action: 'Update Contact', endpoint: 'PUT /contacts/{id}' },
									{ action: 'Trigger Workflow', endpoint: 'POST /workflows/{id}/trigger' },
									{ action: 'Create Contact', endpoint: 'POST /contacts' }
								] as api}
									<div class="bg-black rounded-md p-3 border border-gray-700">
										<div class="text-sm text-gray-300 font-medium">{api.action}</div>
										<div class="text-xs text-gray-500 font-mono mt-1">{api.endpoint}</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Test Connection -->
						<button class="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors">
							Test API Connection
						</button>
					</div>
				</div>

				<!-- Recent API Calls -->
				<div class="bg-gray-900 rounded-lg p-6 border border-gray-800">
					<h3 class="text-lg font-semibold text-white mb-4">Recent API Calls</h3>
					<div class="space-y-3">
						{#each apiCalls as call}
							<div class="bg-black rounded-md p-3 border border-gray-700">
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm font-medium text-gray-300">{call.action}</span>
									<span class="text-xs {getStatusColor(call.status)}">{call.status}</span>
								</div>
								<div class="text-xs text-gray-400">
									{call.contact}
								</div>
								{#if call.tag}
									<div class="text-xs text-gray-500 mt-1">Tag: {call.tag}</div>
								{/if}
								{#if call.field}
									<div class="text-xs text-gray-500 mt-1">Field: {call.field}</div>
								{/if}
								{#if call.workflow}
									<div class="text-xs text-gray-500 mt-1">Workflow: {call.workflow}</div>
								{/if}
								<div class="text-xs text-gray-500 mt-1">{formatTimestamp(call.timestamp)}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Integration Status -->
		<div class="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
			<h3 class="text-lg font-semibold text-white mb-4">Integration Status</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="text-center">
					<div class="text-2xl font-bold text-green-400">{recentWebhooks.filter(w => w.status === 'success').length}</div>
					<div class="text-sm text-gray-400">Successful Webhooks</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-400">{apiCalls.filter(c => c.status === 'success').length}</div>
					<div class="text-sm text-gray-400">Successful API Calls</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-red-400">{[...recentWebhooks, ...apiCalls].filter(i => i.status === 'failed').length}</div>
					<div class="text-sm text-gray-400">Failed Requests</div>
				</div>
			</div>
		</div>
	</div>
</div>