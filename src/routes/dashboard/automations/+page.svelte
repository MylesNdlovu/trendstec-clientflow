<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Activity,
		Send,
		MessageSquare,
		Webhook,
		Settings,
		Plus,
		Trash2,
		Edit,
		Copy,
		CheckCircle,
		XCircle,
		AlertCircle,
		Clock,
		RefreshCw,
		ExternalLink,
		Zap,
		Database,
		Key,
		Globe,
		Mail,
		Phone,
		Users,
		PlayCircle,
		PauseCircle
	} from 'lucide-svelte';

	let webhooks = [];
	let systemeWorkflows = [];
	let recentEvents = [];
	let followUpActions = [];

	let loading = true;
	let showWebhookModal = false;
	let showActionModal = false;
	let selectedAction = null;

	let newWebhook = {
		name: '',
		url: '',
		events: [],
		active: true
	};

	let newAction = {
		type: 'email',
		name: '',
		trigger: 'captured',
		delay: 0,
		template: '',
		active: true
	};

	let connectionStatus = {
		webhooksActive: false,
		systemeConnected: false,
		lastSync: null,
		apiCallsToday: 0,
		apiLimit: 1000
	};

	const availableEvents = [
		'lead.captured',
		'lead.deposited',
		'lead.trading',
		'workflow.triggered',
		'email.sent',
		'sms.sent'
	];

	const followUpTypes = [
		{ value: 'email', label: 'Email Campaign', icon: Mail },
		{ value: 'sms', label: 'SMS Follow-up', icon: MessageSquare },
		{ value: 'workflow', label: 'Systeme Workflow', icon: Zap },
		{ value: 'webhook', label: 'Custom Webhook', icon: Webhook }
	];

	const triggerEvents = [
		{ value: 'captured', label: 'Lead Captured', delay: '0 minutes' },
		{ value: 'no_deposit_24h', label: 'No Deposit (24h)', delay: '24 hours' },
		{ value: 'no_deposit_48h', label: 'No Deposit (48h)', delay: '48 hours' },
		{ value: 'deposited', label: 'Deposit Made', delay: '0 minutes' },
		{ value: 'no_trades_24h', label: 'No Trades (24h)', delay: '24 hours' },
		{ value: 'trading_started', label: 'Trading Started', delay: '0 minutes' },
		{ value: 'profitable', label: 'Profitable Account', delay: '0 minutes' }
	];

	onMount(async () => {
		await loadIntegrationData();
		setInterval(loadIntegrationData, 30000);
	});

	async function loadIntegrationData() {
		loading = true;
		try {
			// Load webhooks
			const webhookResponse = await fetch('/api/webhooks');
			if (webhookResponse.ok) {
				webhooks = await webhookResponse.json();
			}

			// Load Systeme workflows
			const workflowResponse = await fetch('/api/systeme/workflows');
			if (workflowResponse.ok) {
				systemeWorkflows = await workflowResponse.json();
			}

			// Load recent webhook events
			const eventsResponse = await fetch('/api/webhooks/events?limit=10');
			if (eventsResponse.ok) {
				recentEvents = await eventsResponse.json();
			}

			// Load follow-up actions
			const actionsResponse = await fetch('/api/follow-up/actions');
			if (actionsResponse.ok) {
				followUpActions = await actionsResponse.json();
			}

			// Update connection status
			connectionStatus = {
				webhooksActive: webhooks.some(w => w.active),
				systemeConnected: systemeWorkflows.length > 0,
				lastSync: new Date().toISOString(),
				apiCallsToday: Math.floor(Math.random() * 500),
				apiLimit: 1000
			};

		} catch (error) {
			console.error('Failed to load integration data:', error);
		} finally {
			loading = false;
		}
	}

	async function createWebhook() {
		try {
			const response = await fetch('/api/webhooks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newWebhook)
			});

			if (response.ok) {
				await loadIntegrationData();
				showWebhookModal = false;
				resetWebhookForm();
			}
		} catch (error) {
			console.error('Failed to create webhook:', error);
		}
	}

	async function deleteWebhook(id) {
		if (!confirm('Are you sure you want to delete this webhook?')) return;

		try {
			const response = await fetch(`/api/webhooks/${id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadIntegrationData();
			}
		} catch (error) {
			console.error('Failed to delete webhook:', error);
		}
	}

	async function createFollowUpAction() {
		try {
			const response = await fetch('/api/follow-up/actions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newAction)
			});

			if (response.ok) {
				await loadIntegrationData();
				showActionModal = false;
				resetActionForm();
			}
		} catch (error) {
			console.error('Failed to create follow-up action:', error);
		}
	}

	async function triggerAction(actionId) {
		try {
			const response = await fetch(`/api/follow-up/actions/${actionId}/trigger`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadIntegrationData();
			}
		} catch (error) {
			console.error('Failed to trigger action:', error);
		}
	}

	async function testWebhook(webhookId) {
		try {
			const response = await fetch(`/api/webhooks/${webhookId}/test`, {
				method: 'POST'
			});

			if (response.ok) {
				alert('Test webhook sent successfully');
			}
		} catch (error) {
			console.error('Failed to test webhook:', error);
			alert('Failed to test webhook');
		}
	}

	function copyWebhookUrl(url) {
		navigator.clipboard.writeText(url).then(() => {
			alert('Webhook URL copied to clipboard');
		});
	}

	function resetWebhookForm() {
		newWebhook = {
			name: '',
			url: '',
			events: [],
			active: true
		};
	}

	function resetActionForm() {
		newAction = {
			type: 'email',
			name: '',
			trigger: 'captured',
			delay: 0,
			template: '',
			active: true
		};
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleString();
	}

	function getStatusColor(status) {
		switch (status) {
			case 'success': return 'text-green-600 bg-green-100';
			case 'error': return 'text-red-600 bg-red-100';
			case 'pending': return 'text-yellow-600 bg-yellow-100';
			default: return 'text-gray-600 bg-gray-100';
		}
	}
</script>

<svelte:head>
	<title>Integrations & Webhooks - Affiliate Dashboard</title>
</svelte:head>

<div class="p-6 max-w-7xl mx-auto space-y-8">
	<!-- Page header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Integrations & Automation</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Manage webhooks, Systeme.io workflows, and automated follow-up actions
			</p>
		</div>
		<div class="mt-4 sm:mt-0 flex space-x-3">
			<button
				on:click={() => showWebhookModal = true}
				class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
			>
				<Plus class="w-4 h-4 mr-2" />
				Add Webhook
			</button>
			<button
				on:click={() => showActionModal = true}
				class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
			>
				<Plus class="w-4 h-4 mr-2" />
				Add Action
			</button>
		</div>
	</div>

	<!-- Connection Status -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="bg-white dark:bg-black rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Webhooks</p>
					<div class="flex items-center gap-2 mt-1">
						{#if connectionStatus.webhooksActive}
							<CheckCircle class="w-4 h-4 text-green-500" />
							<span class="text-sm text-green-600 dark:text-green-400">Active</span>
						{:else}
							<XCircle class="w-4 h-4 text-red-500" />
							<span class="text-sm text-red-600 dark:text-red-400">Inactive</span>
						{/if}
					</div>
					<p class="text-xs text-gray-500 mt-1">{webhooks.length} configured</p>
				</div>
				<Webhook class="w-8 h-8 text-blue-500" />
			</div>
		</div>

		<div class="bg-white dark:bg-black rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Systeme.io</p>
					<div class="flex items-center gap-2 mt-1">
						{#if connectionStatus.systemeConnected}
							<CheckCircle class="w-4 h-4 text-green-500" />
							<span class="text-sm text-green-600 dark:text-green-400">Connected</span>
						{:else}
							<XCircle class="w-4 h-4 text-red-500" />
							<span class="text-sm text-red-600 dark:text-red-400">Disconnected</span>
						{/if}
					</div>
					<p class="text-xs text-gray-500 mt-1">{systemeWorkflows.length} workflows</p>
				</div>
				<Zap class="w-8 h-8 text-purple-500" />
			</div>
		</div>

		<div class="bg-white dark:bg-black rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Follow-ups</p>
					<p class="text-2xl font-bold text-gray-900 dark:text-white">{followUpActions.length}</p>
					<p class="text-xs text-gray-500 mt-1">{followUpActions.filter(a => a.active).length} active</p>
				</div>
				<Send class="w-8 h-8 text-green-500" />
			</div>
		</div>

		<div class="bg-white dark:bg-black rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">API Usage</p>
					<p class="text-2xl font-bold text-gray-900 dark:text-white">{connectionStatus.apiCallsToday}</p>
					<p class="text-xs text-gray-500 mt-1">of {connectionStatus.apiLimit} daily</p>
				</div>
				<Globe class="w-8 h-8 text-orange-500" />
			</div>
		</div>
	</div>

	<!-- Webhooks Management -->
	<div class="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
		<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
				<Webhook class="w-5 h-5 mr-2" />
				Webhook Endpoints
			</h3>
		</div>
		<div class="p-6">
			{#if webhooks.length === 0}
				<div class="text-center py-8">
					<Webhook class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p class="text-gray-500 dark:text-gray-400">No webhooks configured</p>
					<button
						on:click={() => showWebhookModal = true}
						class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
					>
						<Plus class="w-4 h-4 mr-2" />
						Add Your First Webhook
					</button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each webhooks as webhook}
						<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-3">
										<h4 class="font-medium text-gray-900 dark:text-white">{webhook.name}</h4>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {webhook.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
											{webhook.active ? 'Active' : 'Inactive'}
										</span>
									</div>
									<p class="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-black px-2 py-1 rounded mt-2">
										{webhook.url}
									</p>
									<div class="flex items-center gap-2 mt-2">
										<span class="text-xs text-gray-500">Events:</span>
										{#each webhook.events as event}
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
												{event}
											</span>
										{/each}
									</div>
								</div>
								<div class="flex items-center gap-2">
									<button
										on:click={() => copyWebhookUrl(webhook.url)}
										class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
										title="Copy URL"
									>
										<Copy class="w-4 h-4" />
									</button>
									<button
										on:click={() => testWebhook(webhook.id)}
										class="p-2 text-blue-600 hover:text-blue-800 transition-colors"
										title="Test webhook"
									>
										<Send class="w-4 h-4" />
									</button>
									<button
										on:click={() => deleteWebhook(webhook.id)}
										class="p-2 text-red-600 hover:text-red-800 transition-colors"
										title="Delete webhook"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Follow-up Actions -->
	<div class="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
		<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
				<Send class="w-5 h-5 mr-2" />
				Automated Follow-up Actions
			</h3>
		</div>
		<div class="p-6">
			{#if followUpActions.length === 0}
				<div class="text-center py-8">
					<Send class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p class="text-gray-500 dark:text-gray-400">No follow-up actions configured</p>
					<button
						on:click={() => showActionModal = true}
						class="mt-4 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
					>
						<Plus class="w-4 h-4 mr-2" />
						Create Your First Action
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{#each followUpActions as action}
						<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-3">
										<svelte:component this={followUpTypes.find(t => t.value === action.type)?.icon || Mail} class="w-5 h-5 text-blue-500" />
										<h4 class="font-medium text-gray-900 dark:text-white">{action.name}</h4>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {action.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
											{action.active ? 'Active' : 'Paused'}
										</span>
									</div>
									<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
										<span class="font-medium">Trigger:</span> {triggerEvents.find(t => t.value === action.trigger)?.label}
									</p>
									<p class="text-sm text-gray-600 dark:text-gray-400">
										<span class="font-medium">Type:</span> {followUpTypes.find(t => t.value === action.type)?.label}
									</p>
									{#if action.delay > 0}
										<p class="text-sm text-gray-600 dark:text-gray-400">
											<span class="font-medium">Delay:</span> {action.delay} minutes
										</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button
										on:click={() => triggerAction(action.id)}
										class="p-2 text-green-600 hover:text-green-800 transition-colors"
										title="Trigger now"
									>
										<PlayCircle class="w-4 h-4" />
									</button>
									<button
										on:click={() => selectedAction = action}
										class="p-2 text-blue-600 hover:text-blue-800 transition-colors"
										title="Edit action"
									>
										<Edit class="w-4 h-4" />
									</button>
									<button
										class="p-2 text-red-600 hover:text-red-800 transition-colors"
										title="Delete action"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Recent Events -->
	<div class="bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
		<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
				<Activity class="w-5 h-5 mr-2" />
				Recent Webhook Events
			</h3>
		</div>
		<div class="p-6">
			{#if recentEvents.length === 0}
				<div class="text-center py-8">
					<Activity class="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p class="text-gray-500 dark:text-gray-400">No recent events</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each recentEvents as event}
						<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-black rounded-lg">
							<div class="flex items-center gap-3">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getStatusColor(event.status)}">
									{event.status}
								</span>
								<span class="text-sm font-medium text-gray-900 dark:text-white">{event.event}</span>
								<span class="text-sm text-gray-600 dark:text-gray-400">{event.webhook_name}</span>
							</div>
							<div class="text-right">
								<p class="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
								{#if event.response_time}
									<p class="text-xs text-gray-400">{event.response_time}ms</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Webhook Modal -->
{#if showWebhookModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-black rounded-xl p-6 shadow-xl max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Webhook</h3>

			<form on:submit|preventDefault={createWebhook} class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Name
					</label>
					<input
						type="text"
						bind:value={newWebhook.name}
						required
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
						placeholder="Webhook name"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						URL
					</label>
					<input
						type="url"
						bind:value={newWebhook.url}
						required
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
						placeholder="https://your-webhook.com/endpoint"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Events
					</label>
					<div class="space-y-2 max-h-32 overflow-y-auto">
						{#each availableEvents as event}
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:group={newWebhook.events}
									value={event}
									class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{event}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="flex justify-end gap-3 mt-6">
					<button
						type="button"
						on:click={() => showWebhookModal = false}
						class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
					>
						Create Webhook
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Action Modal -->
{#if showActionModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-black rounded-xl p-6 shadow-xl max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Follow-up Action</h3>

			<form on:submit|preventDefault={createFollowUpAction} class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Name
					</label>
					<input
						type="text"
						bind:value={newAction.name}
						required
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
						placeholder="Action name"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Type
					</label>
					<select
						bind:value={newAction.type}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
					>
						{#each followUpTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Trigger
					</label>
					<select
						bind:value={newAction.trigger}
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
					>
						{#each triggerEvents as trigger}
							<option value={trigger.value}>{trigger.label} ({trigger.delay})</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Delay (minutes)
					</label>
					<input
						type="number"
						bind:value={newAction.delay}
						min="0"
						max="10080"
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
						placeholder="0"
					/>
				</div>

				<div class="flex justify-end gap-3 mt-6">
					<button
						type="button"
						on:click={() => showActionModal = false}
						class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
					>
						Create Action
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if loading}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-black rounded-lg p-6 shadow-xl">
			<div class="flex items-center gap-3">
				<RefreshCw class="w-5 h-5 animate-spin text-blue-500" />
				<span class="text-gray-700 dark:text-gray-300">Loading integration data...</span>
			</div>
		</div>
	</div>
{/if}