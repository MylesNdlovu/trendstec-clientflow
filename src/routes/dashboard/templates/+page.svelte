<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import {
		Plus,
		Save,
		Edit,
		Copy,
		Trash2,
		Mail,
		MessageSquare,
		MessageCircle,
		Search,
		Filter,
		Eye,
		Play,
		Settings
	} from 'lucide-svelte';

	export let data;

	let templates = [];
	let loading = true;
	let searchTerm = '';
	let filterType = 'all';
	let filterCategory = 'all';
	let showEditor = false;
	let selectedTemplate = null;
	let previewMode = false;

	const templateStore = writable({
		id: null,
		name: '',
		type: 'email',
		category: 'welcome',
		subject: '',
		content: '',
		variables: [],
		isActive: true
	});

	const templateTypes = [
		{ value: 'email', label: 'Email', icon: Mail, color: 'indigo' },
		{ value: 'sms', label: 'SMS', icon: MessageSquare, color: 'green' },
		{ value: 'dm', label: 'Direct Message', icon: MessageCircle, color: 'blue' }
	];

	const templateCategories = [
		{ value: 'welcome', label: 'Welcome Sequence' },
		{ value: 'follow-up', label: 'Follow-up' },
		{ value: 'mt5-verification', label: 'MT5 Verification' },
		{ value: 'nurture', label: 'Lead Nurturing' },
		{ value: 'promotion', label: 'Promotional' },
		{ value: 'abandoned', label: 'Abandoned Process' },
		{ value: 'conversion', label: 'Conversion' }
	];

	onMount(async () => {
		await loadTemplates();
	});

	async function loadTemplates() {
		try {
			const response = await fetch('/api/templates');
			templates = await response.json();
		} catch (error) {
			console.error('Failed to load templates:', error);
		} finally {
			loading = false;
		}
	}

	async function saveTemplate() {
		try {
			const template = $templateStore;
			const method = template.id ? 'PUT' : 'POST';
			const url = template.id ? `/api/templates/${template.id}` : '/api/templates';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(template)
			});

			if (response.ok) {
				await loadTemplates();
				showEditor = false;
				resetEditor();
			}
		} catch (error) {
			console.error('Failed to save template:', error);
		}
	}

	function createNewTemplate(type = 'email') {
		templateStore.set({
			id: null,
			name: '',
			type,
			category: 'welcome',
			subject: '',
			content: '',
			variables: [],
			isActive: true
		});
		showEditor = true;
		previewMode = false;
	}

	function editTemplate(template) {
		templateStore.set({ ...template });
		selectedTemplate = template;
		showEditor = true;
		previewMode = false;
	}

	function previewTemplate(template) {
		templateStore.set({ ...template });
		selectedTemplate = template;
		showEditor = true;
		previewMode = true;
	}

	function resetEditor() {
		selectedTemplate = null;
		previewMode = false;
		templateStore.set({
			id: null,
			name: '',
			type: 'email',
			category: 'welcome',
			subject: '',
			content: '',
			variables: [],
			isActive: true
		});
	}

	async function duplicateTemplate(template) {
		const duplicated = {
			...template,
			id: null,
			name: `${template.name} (Copy)`,
			isActive: false
		};
		templateStore.set(duplicated);
		showEditor = true;
		previewMode = false;
	}

	async function deleteTemplate(id) {
		if (confirm('Are you sure you want to delete this template?')) {
			try {
				await fetch(`/api/templates/${id}`, { method: 'DELETE' });
				await loadTemplates();
			} catch (error) {
				console.error('Failed to delete template:', error);
			}
		}
	}

	function addVariable() {
		templateStore.update(template => ({
			...template,
			variables: [...template.variables, { name: '', defaultValue: '' }]
		}));
	}

	function removeVariable(index) {
		templateStore.update(template => ({
			...template,
			variables: template.variables.filter((_, i) => i !== index)
		}));
	}

	function getTypeConfig(type) {
		return templateTypes.find(t => t.value === type) || templateTypes[0];
	}

	$: filteredTemplates = templates.filter(template => {
		const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
							 template.subject?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = filterType === 'all' || template.type === filterType;
		const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
		return matchesSearch && matchesType && matchesCategory;
	});
</script>

<svelte:head>
	<title>Communication Templates - Marketing Automation Platform</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-semibold text-gray-900">Communication Templates</h1>
			<p class="mt-1 text-sm text-gray-500">
				Create and manage email, SMS, and DM templates for your automation workflows.
			</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/dashboard/automations"
				class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
			>
				<Settings class="w-4 h-4 mr-2" />
				Manage Automations
			</a>
			<div class="relative">
				<button
					on:click={() => createNewTemplate('email')}
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
				>
					<Plus class="w-4 h-4 mr-2" />
					Create Template
				</button>
			</div>
		</div>
	</div>

	{#if showEditor}
		<!-- Template Editor -->
		<div class="bg-white rounded-lg shadow-lg overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<div class="flex justify-between items-center">
					<div>
						<h2 class="text-lg font-medium text-gray-900">
							{previewMode ? 'Preview Template' : selectedTemplate ? 'Edit Template' : 'Create New Template'}
						</h2>
						<p class="text-sm text-gray-500">
							{previewMode ? 'Review your template before using in automations' : 'Design your communication template with dynamic variables'}
						</p>
					</div>
					<div class="flex gap-2">
						<button
							on:click={() => showEditor = false}
							class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
						{#if !previewMode}
							<button
								on:click={saveTemplate}
								class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
							>
								<Save class="w-4 h-4 mr-2 inline" />
								Save Template
							</button>
						{/if}
					</div>
				</div>
			</div>

			<div class="p-6 space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Template Settings -->
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
							<input
								type="text"
								bind:value={$templateStore.name}
								disabled={previewMode}
								placeholder="Enter template name..."
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Communication Type</label>
							<div class="grid grid-cols-3 gap-2">
								{#each templateTypes as type}
									<button
										on:click={() => !previewMode && templateStore.update(t => ({ ...t, type: type.value }))}
										disabled={previewMode}
										class="flex items-center justify-center px-3 py-2 border rounded-md text-sm font-medium disabled:opacity-50 {$templateStore.type === type.value
											? `bg-${type.color}-100 border-${type.color}-300 text-${type.color}-800`
											: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}"
									>
										<svelte:component this={type.icon} class="w-4 h-4 mr-2" />
										{type.label}
									</button>
								{/each}
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
							<select
								bind:value={$templateStore.category}
								disabled={previewMode}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
							>
								{#each templateCategories as category}
									<option value={category.value}>{category.label}</option>
								{/each}
							</select>
						</div>

						{#if $templateStore.type === 'email'}
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
								<input
									type="text"
									bind:value={$templateStore.subject}
									disabled={previewMode}
									placeholder="Enter email subject..."
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
								/>
							</div>
						{/if}
					</div>

					<!-- Variables Section -->
					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<label class="block text-sm font-medium text-gray-700">Dynamic Variables</label>
							{#if !previewMode}
								<button
									on:click={addVariable}
									class="text-sm text-indigo-600 hover:text-indigo-900"
								>
									<Plus class="w-4 h-4 inline mr-1" />
									Add Variable
								</button>
							{/if}
						</div>

						<div class="space-y-2 max-h-48 overflow-y-auto">
							{#each $templateStore.variables as variable, i}
								<div class="flex gap-2">
									<input
										type="text"
										bind:value={variable.name}
										disabled={previewMode}
										placeholder="Variable name (e.g., firstName)"
										class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
									/>
									<input
										type="text"
										bind:value={variable.defaultValue}
										disabled={previewMode}
										placeholder="Default value"
										class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
									/>
									{#if !previewMode}
										<button
											on:click={() => removeVariable(i)}
											class="px-2 py-2 text-red-600 hover:text-red-900"
										>
											<Trash2 class="w-4 h-4" />
										</button>
									{/if}
								</div>
							{/each}
						</div>

						<div class="text-xs text-gray-500">
							Use variables in your content with {'{variable_name}'} syntax
						</div>
					</div>
				</div>

				<!-- Content Editor -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						{$templateStore.type === 'email' ? 'Email Content' :
						 $templateStore.type === 'sms' ? 'SMS Message' : 'Direct Message'}
					</label>
					<textarea
						bind:value={$templateStore.content}
						disabled={previewMode}
						rows={$templateStore.type === 'sms' ? 4 : 12}
						placeholder={$templateStore.type === 'email'
							? 'Write your email content here. Use {firstName}, {lastName}, {email} for personalization...'
							: $templateStore.type === 'sms'
							? 'Write your SMS message here (max 160 characters)...'
							: 'Write your direct message here...'}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
					></textarea>

					{#if $templateStore.type === 'sms'}
						<div class="text-sm text-gray-500 mt-1">
							Characters: {$templateStore.content?.length || 0}/160
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Template Type Quick Create -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			{#each templateTypes as type}
				<button
					on:click={() => createNewTemplate(type.value)}
					class="p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-{type.color}-400 hover:bg-{type.color}-50 transition-colors group"
				>
					<div class="text-center">
						<svelte:component this={type.icon} class="mx-auto h-8 w-8 text-{type.color}-600 group-hover:text-{type.color}-700" />
						<h3 class="mt-2 text-sm font-medium text-gray-900">Create {type.label} Template</h3>
						<p class="mt-1 text-xs text-gray-500">Build a new {type.label.toLowerCase()} template for automations</p>
					</div>
				</button>
			{/each}
		</div>

		<!-- Search and Filters -->
		<div class="glass-card-ios rounded-lg p-4 shadow">
			<div class="flex flex-col lg:flex-row gap-4">
				<div class="flex-1">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Search templates by name or subject..."
							bind:value={searchTerm}
							class="w-full pl-10 pr-4 py-2 bg-black border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-cyan-400/50 focus:border-cyan-400"
						/>
					</div>
				</div>
				<div class="flex gap-2">
					<div class="flex items-center gap-2">
						<Filter class="w-4 h-4 text-gray-400" />
						<select
							bind:value={filterType}
							class="bg-black border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-cyan-400/50 focus:border-cyan-400"
						>
							<option value="all" class="bg-black">All Types</option>
							{#each templateTypes as type}
								<option value={type.value} class="bg-black">{type.label}</option>
							{/each}
						</select>
					</div>
					<select
						bind:value={filterCategory}
						class="bg-black border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-cyan-400/50 focus:border-cyan-400"
					>
						<option value="all" class="bg-black">All Categories</option>
						{#each templateCategories as category}
							<option value={category.value} class="bg-black">{category.label}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- Templates Grid -->
		{#if loading}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
			</div>
		{:else if filteredTemplates.length === 0}
			<div class="text-center py-12">
				<div class="mx-auto h-12 w-12 text-gray-400">
					<Mail class="w-12 h-12" />
				</div>
				<h3 class="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
				<p class="mt-1 text-sm text-gray-500">Create your first communication template to use in workflows.</p>
				<div class="mt-6">
					<button
						on:click={() => createNewTemplate()}
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
					>
						<Plus class="w-4 h-4 mr-2" />
						Create First Template
					</button>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredTemplates as template}
					{@const typeConfig = getTypeConfig(template.type)}
					<div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
						<div class="p-6">
							<div class="flex items-center justify-between">
								<div class="flex items-center">
									<div class="h-8 w-8 bg-{typeConfig.color}-100 rounded-lg flex items-center justify-center">
										<svelte:component this={typeConfig.icon} class="w-4 h-4 text-{typeConfig.color}-600" />
									</div>
									<div class="ml-3">
										<h3 class="text-sm font-medium text-gray-900">{template.name}</h3>
										<p class="text-xs text-gray-500">{typeConfig.label}</p>
									</div>
								</div>
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {template.isActive
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-800'}"
								>
									{template.isActive ? 'Active' : 'Draft'}
								</span>
							</div>

							<div class="mt-4">
								<div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</div>
								<div class="text-sm text-gray-900 mt-1">
									{templateCategories.find(c => c.value === template.category)?.label || template.category}
								</div>
							</div>

							{#if template.subject}
								<div class="mt-3">
									<div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</div>
									<div class="text-sm text-gray-900 mt-1 truncate">{template.subject}</div>
								</div>
							{/if}

							<div class="mt-3">
								<div class="text-xs font-medium text-gray-500 uppercase tracking-wider">Content Preview</div>
								<div class="text-sm text-gray-900 mt-1 line-clamp-2">
									{template.content?.substring(0, 100)}...
								</div>
							</div>

							<div class="mt-6 flex justify-between">
								<div class="flex space-x-2">
									<button
										on:click={() => previewTemplate(template)}
										class="text-sm text-blue-600 hover:text-blue-900"
									>
										<Eye class="w-4 h-4" />
									</button>
									<button
										on:click={() => editTemplate(template)}
										class="text-sm text-indigo-600 hover:text-indigo-900"
									>
										<Edit class="w-4 h-4" />
									</button>
									<button
										on:click={() => duplicateTemplate(template)}
										class="text-sm text-green-600 hover:text-green-900"
									>
										<Copy class="w-4 h-4" />
									</button>
									<button
										on:click={() => deleteTemplate(template.id)}
										class="text-sm text-red-600 hover:text-red-900"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
								<div class="text-xs text-gray-500">
									{template.variables?.length || 0} variables
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>