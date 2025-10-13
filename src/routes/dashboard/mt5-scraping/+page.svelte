<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Plus,
		Play,
		Pause,
		RefreshCw,
		Download,
		Eye,
		Settings,
		AlertCircle,
		CheckCircle,
		Clock,
		DollarSign,
		TrendingUp,
		Activity,
		Users,
		Search,
		Filter
	} from 'lucide-svelte';

	export let data;

	let scrapingJobs = [];
	let leads = [];
	let loading = true;
	let searchTerm = '';
	let filterStatus = 'all';
	let showNewJobModal = false;
	let showMT5FormModal = false;
	let selectedLead = null;
	let mt5OptinForms = [];

	let newJob = {
		leadId: '',
		investorPassword: '',
		brokerUrl: 'https://mt5.example-broker.com',
		scheduledFor: new Date().toISOString().slice(0, 16),
		isRecurring: false,
		recurringInterval: 'daily'
	};

	let newMT5Form = {
		name: '',
		title: 'Complete Your MT5 Verification',
		description: 'To personalize your trading experience, please provide your MT5 account details.',
		fields: [
			{ name: 'broker_name', label: 'Broker Name', type: 'select', required: true, options: ['MetaQuotes', 'IC Markets', 'FXTM', 'XM', 'Other'] },
			{ name: 'account_number', label: 'MT5 Account Number', type: 'text', required: true },
			{ name: 'investor_password', label: 'Investor Password (Read-only)', type: 'password', required: true },
			{ name: 'server', label: 'Server', type: 'text', required: true }
		],
		styling: {
			theme: 'modern',
			primaryColor: '#4F46E5'
		},
		automationTrigger: 'mt5-verification-submitted'
	};

	onMount(async () => {
		await Promise.all([loadScrapingJobs(), loadLeads(), loadMT5Forms()]);
	});

	async function loadScrapingJobs() {
		try {
			const response = await fetch('/api/mt5-scraping');
			scrapingJobs = await response.json();
		} catch (error) {
			console.error('Failed to load scraping jobs:', error);
		} finally {
			loading = false;
		}
	}

	async function loadLeads() {
		try {
			const response = await fetch('/api/leads');
			leads = await response.json();
		} catch (error) {
			console.error('Failed to load leads:', error);
		}
	}

	async function loadMT5Forms() {
		try {
			const response = await fetch('/api/forms/mt5-optin');
			mt5OptinForms = await response.json();
		} catch (error) {
			console.error('Failed to load MT5 forms:', error);
		}
	}

	async function createScrapingJob() {
		try {
			const response = await fetch('/api/mt5-scraping', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newJob)
			});

			if (response.ok) {
				await loadScrapingJobs();
				showNewJobModal = false;
				resetNewJob();
			}
		} catch (error) {
			console.error('Failed to create scraping job:', error);
		}
	}

	async function runJob(jobId: string) {
		try {
			await fetch(`/api/mt5-scraping/${jobId}/run`, {
				method: 'POST'
			});
			await loadScrapingJobs();
		} catch (error) {
			console.error('Failed to run job:', error);
		}
	}

	async function pauseJob(jobId: string) {
		try {
			await fetch(`/api/mt5-scraping/${jobId}/pause`, {
				method: 'POST'
			});
			await loadScrapingJobs();
		} catch (error) {
			console.error('Failed to pause job:', error);
		}
	}

	function resetNewJob() {
		newJob = {
			leadId: '',
			investorPassword: '',
			brokerUrl: 'https://mt5.example-broker.com',
			scheduledFor: new Date().toISOString().slice(0, 16),
			isRecurring: false,
			recurringInterval: 'daily'
		};
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'completed': return CheckCircle;
			case 'running': return Activity;
			case 'failed': return AlertCircle;
			case 'scheduled': return Clock;
			default: return Clock;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed': return 'text-green-600';
			case 'running': return 'text-blue-600';
			case 'failed': return 'text-red-600';
			case 'scheduled': return 'text-yellow-600';
			default: return 'text-gray-600';
		}
	}

	$: filteredJobs = scrapingJobs.filter(job => {
		const matchesSearch = job.leadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
							 job.leadEmail?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	$: totalJobs = scrapingJobs.length;
	$: activeJobs = scrapingJobs.filter(j => j.status === 'running').length;
	$: completedJobs = scrapingJobs.filter(j => j.status === 'completed').length;
	$: verifiedAccounts = scrapingJobs.filter(j => j.data?.isVerified).length;
</script>

<svelte:head>
	<title>MT5 Scraping - Marketing Automation Platform</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-semibold text-text-primary">MT5 Account Scraping</h1>
			<p class="mt-1 text-sm text-text-secondary">
				Automated verification of MT5 accounts using Playwright MCP to check deposits, trades, and account activity.
			</p>
		</div>
		<div class="flex gap-3">
			<button
				on:click={() => showMT5FormModal = true}
				class="glass-button inline-flex items-center px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
			>
				<Settings class="w-4 h-4 mr-2" />
				MT5 Opt-in Forms
			</button>
			<button
				on:click={() => loadScrapingJobs()}
				class="glass-button inline-flex items-center px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
			>
				<RefreshCw class="w-4 h-4 mr-2" />
				Refresh
			</button>
			<button
				on:click={() => showNewJobModal = true}
				class="glass-button inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent-primary to-accent-secondary hover:scale-105"
			>
				<Plus class="w-4 h-4 mr-2" />
				New Scraping Job
			</button>
		</div>
	</div>

	<!-- Stats overview -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<div class="stats-card">
			<div class="flex items-center">
				<div class="h-10 w-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
					<Activity class="w-5 h-5 text-blue-400" />
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-text-tertiary">Total Jobs</div>
					<div class="text-2xl font-bold text-text-primary">{totalJobs.toLocaleString()}</div>
				</div>
			</div>
		</div>
		<div class="stats-card">
			<div class="flex items-center">
				<div class="h-10 w-10 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
					<Clock class="w-5 h-5 text-yellow-400" />
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-text-tertiary">Active Jobs</div>
					<div class="text-2xl font-bold text-yellow-400">{activeJobs.toLocaleString()}</div>
				</div>
			</div>
		</div>
		<div class="stats-card">
			<div class="flex items-center">
				<div class="h-10 w-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
					<CheckCircle class="w-5 h-5 text-green-400" />
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-text-tertiary">Completed</div>
					<div class="text-2xl font-bold text-green-400">{completedJobs.toLocaleString()}</div>
				</div>
			</div>
		</div>
		<div class="stats-card">
			<div class="flex items-center">
				<div class="h-10 w-10 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
					<Users class="w-5 h-5 text-purple-400" />
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-text-tertiary">Verified Accounts</div>
					<div class="text-2xl font-bold text-purple-400">{verifiedAccounts.toLocaleString()}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Search and filters -->
	<div class="glass-card">
		<div class="flex flex-col lg:flex-row gap-4">
			<div class="flex-1">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-4 h-4" />
					<input
						type="text"
						placeholder="Search by lead name or email..."
						bind:value={searchTerm}
						class="glass-input w-full pl-10 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:ring-2 focus:ring-accent-primary"
					/>
				</div>
			</div>
			<div class="flex gap-3">
				<div class="flex items-center gap-2">
					<Filter class="w-4 h-4 text-text-tertiary" />
					<select
						bind:value={filterStatus}
						class="glass-input px-3 py-3 text-text-primary focus:ring-2 focus:ring-accent-primary"
					>
						<option value="all">All Status</option>
						<option value="scheduled">Scheduled</option>
						<option value="running">Running</option>
						<option value="completed">Completed</option>
						<option value="failed">Failed</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Scraping Jobs Table -->
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
		</div>
	{:else if filteredJobs.length === 0}
		<div class="text-center py-12">
			<div class="mx-auto h-12 w-12 text-gray-400">
				<Activity class="w-12 h-12" />
			</div>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No scraping jobs found</h3>
			<p class="mt-1 text-sm text-gray-500">Create your first MT5 scraping job to verify lead accounts.</p>
			<div class="mt-6">
				<button
					on:click={() => showNewJobModal = true}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
				>
					<Plus class="w-4 h-4 mr-2" />
					Create First Job
				</button>
			</div>
		</div>
	{:else}
		<div class="glass-card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-border-primary/20">
					<thead class="bg-bg-secondary/50 backdrop-blur-sm">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Lead</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Account Data</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Last Run</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-primary/10">
						{#each filteredJobs as job}
							<tr class="hover:bg-bg-secondary/30 transition-colors duration-200">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="h-10 w-10 flex-shrink-0">
											<div class="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
												{(job.leadName?.[0] || 'L').toUpperCase()}
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">{job.leadName}</div>
											<div class="text-sm text-gray-500">{job.leadEmail}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<svelte:component this={getStatusIcon(job.status)} class="w-4 h-4 mr-2 {getStatusColor(job.status)}" />
										<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
											{job.status === 'completed' ? 'bg-green-100 text-green-800' :
											 job.status === 'running' ? 'bg-blue-100 text-blue-800' :
											 job.status === 'failed' ? 'bg-red-100 text-red-800' :
											 'bg-yellow-100 text-yellow-800'}">
											{job.status}
										</span>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									{#if job.data}
										<div class="text-sm text-gray-900">
											<div class="flex items-center gap-4">
												<div class="flex items-center">
													<DollarSign class="w-4 h-4 mr-1 text-green-600" />
													<span>${job.data.balance || 0}</span>
												</div>
												<div class="flex items-center">
													<TrendingUp class="w-4 h-4 mr-1 text-blue-600" />
													<span>{job.data.totalTrades || 0} trades</span>
												</div>
											</div>
											<div class="text-xs text-gray-500 mt-1">
												{job.data.isVerified ? '✅ Verified' : '❌ Not verified'}
											</div>
										</div>
									{:else}
										<span class="text-gray-400">No data</span>
									{/if}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{job.lastRun ? new Date(job.lastRun).toLocaleDateString() : 'Never'}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div class="flex space-x-2">
										{#if job.status === 'scheduled' || job.status === 'failed'}
											<button
												on:click={() => runJob(job.id)}
												class="text-indigo-600 hover:text-indigo-900"
												title="Run job"
											>
												<Play class="w-4 h-4" />
											</button>
										{/if}
										{#if job.status === 'running'}
											<button
												on:click={() => pauseJob(job.id)}
												class="text-yellow-600 hover:text-yellow-900"
												title="Pause job"
											>
												<Pause class="w-4 h-4" />
											</button>
										{/if}
										<button
											class="text-blue-600 hover:text-blue-900"
											title="View details"
										>
											<Eye class="w-4 h-4" />
										</button>
										<button
											class="text-gray-600 hover:text-gray-900"
											title="Settings"
										>
											<Settings class="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<!-- New Job Modal -->
{#if showNewJobModal}
	<div class="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
		<div class="relative top-20 mx-auto p-5 w-11/12 md:w-2/3 lg:w-1/2 glass-modal rounded-2xl animate-scale-up">
			<div class="mt-3">
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-medium text-text-primary">Create MT5 Scraping Job</h3>
					<button
						on:click={() => showNewJobModal = false}
						class="glass-button p-2 text-text-tertiary hover:text-text-primary"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={createScrapingJob} class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Select Lead</label>
						<select
							bind:value={newJob.leadId}
							required
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						>
							<option value="">Choose a lead...</option>
							{#each leads as lead}
								<option value={lead.id}>{lead.firstName} {lead.lastName} - {lead.email}</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">MT5 Investor Password</label>
						<input
							type="password"
							bind:value={newJob.investorPassword}
							required
							placeholder="Enter MT5 investor password..."
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						/>
						<p class="text-xs text-gray-500 mt-1">Read-only investor password for MT5 account access</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Broker URL</label>
						<input
							type="url"
							bind:value={newJob.brokerUrl}
							required
							placeholder="https://mt5.your-broker.com"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
						<input
							type="datetime-local"
							bind:value={newJob.scheduledFor}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
						/>
					</div>

					<div class="flex items-center">
						<input
							type="checkbox"
							bind:checked={newJob.isRecurring}
							class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
						/>
						<label class="ml-2 block text-sm text-gray-900">Recurring job</label>
					</div>

					{#if newJob.isRecurring}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Interval</label>
							<select
								bind:value={newJob.recurringInterval}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
							>
								<option value="hourly">Every Hour</option>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</select>
						</div>
					{/if}

					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							on:click={() => showNewJobModal = false}
							class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
						>
							Create Job
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- MT5 Opt-in Form Modal -->
{#if showMT5FormModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
		<div class="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
			<div class="mt-3">
				<div class="flex justify-between items-center mb-6">
					<div>
						<h3 class="text-lg font-medium text-gray-900">MT5 Verification Forms</h3>
						<p class="text-sm text-gray-500">Second opt-in forms triggered by workflow automation to capture MT5 credentials</p>
					</div>
					<button
						on:click={() => showMT5FormModal = false}
						class="text-gray-400 hover:text-gray-600"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<!-- Create New MT5 Form Section -->
				<div class="bg-gray-50 p-6 rounded-lg mb-6">
					<h4 class="text-md font-medium text-gray-900 mb-4">Create New MT5 Verification Form</h4>

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Form Configuration -->
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
								<input
									type="text"
									bind:value={newMT5Form.name}
									placeholder="MT5 Verification Form"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Form Title</label>
								<input
									type="text"
									bind:value={newMT5Form.title}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
								<textarea
									bind:value={newMT5Form.description}
									rows="3"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
								></textarea>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Automation Trigger</label>
								<select
									bind:value={newMT5Form.automationTrigger}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="mt5-verification-submitted">MT5 Verification Submitted</option>
									<option value="mt5-credentials-provided">MT5 Credentials Provided</option>
									<option value="account-verification-request">Account Verification Request</option>
								</select>
								<p class="text-xs text-gray-500 mt-1">This trigger will be fired when the form is submitted</p>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
								<input
									type="color"
									bind:value={newMT5Form.styling.primaryColor}
									class="h-10 w-20 border border-gray-300 rounded-md"
								/>
							</div>
						</div>

						<!-- Form Preview -->
						<div class="border border-gray-300 rounded-lg p-4 bg-white">
							<h5 class="text-sm font-medium text-gray-900 mb-4">Form Preview</h5>
							<div class="space-y-4">
								<div class="text-center">
									<h6 class="text-lg font-semibold" style="color: {newMT5Form.styling.primaryColor}">{newMT5Form.title}</h6>
									<p class="text-sm text-gray-600 mt-2">{newMT5Form.description}</p>
								</div>

								{#each newMT5Form.fields as field}
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">
											{field.label}
											{#if field.required}<span class="text-red-500">*</span>{/if}
										</label>
										{#if field.type === 'select'}
											<select class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled>
												<option>Choose {field.label.toLowerCase()}...</option>
												{#each field.options as option}
													<option>{option}</option>
												{/each}
											</select>
										{:else}
											<input
												type={field.type}
												placeholder="Enter {field.label.toLowerCase()}..."
												class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
												disabled
											/>
										{/if}
									</div>
								{/each}

								<button
									class="w-full py-2 rounded-md text-white text-sm font-medium"
									style="background-color: {newMT5Form.styling.primaryColor}"
									disabled
								>
									Submit Verification
								</button>
							</div>
						</div>
					</div>

					<div class="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Save as Draft
						</button>
						<button
							type="button"
							class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
						>
							Create & Activate Form
						</button>
					</div>
				</div>

				<!-- Existing MT5 Forms -->
				<div>
					<h4 class="text-md font-medium text-gray-900 mb-4">Existing MT5 Verification Forms</h4>

					{#if mt5OptinForms.length === 0}
						<div class="text-center py-8 bg-gray-50 rounded-lg">
							<div class="mx-auto h-12 w-12 text-gray-400">
								<Settings class="w-12 h-12" />
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900">No MT5 forms created</h3>
							<p class="mt-1 text-sm text-gray-500">Create your first MT5 verification form above</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each mt5OptinForms as form}
								<div class="border border-gray-200 rounded-lg p-4 bg-white">
									<div class="flex justify-between items-start mb-3">
										<div>
											<h5 class="text-sm font-medium text-gray-900">{form.name}</h5>
											<p class="text-xs text-gray-500 mt-1">{form.title}</p>
										</div>
										<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
											Active
										</span>
									</div>

									<div class="text-sm text-gray-600 mb-3">
										{form.description}
									</div>

									<div class="text-xs text-gray-500 mb-3">
										<strong>Trigger:</strong> {form.automationTrigger}
									</div>

									<div class="text-xs text-gray-500 mb-4">
										<strong>Fields:</strong> {form.fields?.length || 0} fields
									</div>

									<div class="flex justify-between items-center">
										<div class="text-xs text-gray-500">
											Embed code available
										</div>
										<div class="flex space-x-2">
											<button class="text-blue-600 hover:text-blue-900 text-xs">
												<Eye class="w-3 h-3 inline mr-1" />Preview
											</button>
											<button class="text-indigo-600 hover:text-indigo-900 text-xs">
												<Settings class="w-3 h-3 inline mr-1" />Edit
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}