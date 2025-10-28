<script lang="ts">
	import { Plus, Edit, Trash2, Eye, Copy, Save, X, FileText, TrendingUp, Target, Users } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';
	import type { PageData } from './$types';

	export let data: PageData;

	$: themeClasses = getThemeClasses($theme);

	let templates: any[] = data.templates || [];
	let loading = false;
	let saving = false;
	let showForm = false;
	let editingTemplate: any = null;

	// Form state
	let form = {
		name: '',
		description: '',
		category: 'lead_generation',
		isPublic: true,
		templateData: {
			targeting: {
				age_min: 25,
				age_max: 55,
				genders: [1, 2], // 1=male, 2=female
				geo_locations: {
					countries: ['US']
				},
				interests: []
			},
			adCopy: '',
			headline: '',
			description: '',
			callToAction: 'LEARN_MORE',
			objective: 'LEAD_GENERATION',
			dailyBudget: 50,
			lifetimeBudget: null
		}
	};

	const categories = [
		{ value: 'lead_generation', label: 'Lead Generation', icon: Users },
		{ value: 'conversion', label: 'Conversion', icon: TrendingUp },
		{ value: 'awareness', label: 'Brand Awareness', icon: Eye }
	];

	const objectives = [
		{ value: 'LEAD_GENERATION', label: 'Lead Generation' },
		{ value: 'CONVERSIONS', label: 'Conversions' },
		{ value: 'TRAFFIC', label: 'Traffic' },
		{ value: 'ENGAGEMENT', label: 'Engagement' },
		{ value: 'BRAND_AWARENESS', label: 'Brand Awareness' }
	];

	const callToActions = [
		{ value: 'LEARN_MORE', label: 'Learn More' },
		{ value: 'SIGN_UP', label: 'Sign Up' },
		{ value: 'CONTACT_US', label: 'Contact Us' },
		{ value: 'GET_QUOTE', label: 'Get Quote' },
		{ value: 'DOWNLOAD', label: 'Download' },
		{ value: 'APPLY_NOW', label: 'Apply Now' }
	];

	async function loadTemplates() {
		loading = true;
		try {
			const res = await fetch('/api/admin/templates');
			if (res.ok) {
				const data = await res.json();
				templates = data.templates || [];
			}
		} catch (err) {
			console.error('Failed to load templates:', err);
		} finally {
			loading = false;
		}
	}

	function newTemplate() {
		editingTemplate = null;
		resetForm();
		showForm = true;
	}

	function editTemplate(template: any) {
		editingTemplate = template;
		form = {
			name: template.name,
			description: template.description || '',
			category: template.category,
			isPublic: template.isPublic,
			templateData: template.templateData
		};
		showForm = true;
	}

	function resetForm() {
		form = {
			name: '',
			description: '',
			category: 'lead_generation',
			isPublic: true,
			templateData: {
				targeting: {
					age_min: 25,
					age_max: 55,
					genders: [1, 2],
					geo_locations: { countries: ['US'] },
					interests: []
				},
				adCopy: '',
				headline: '',
				description: '',
				callToAction: 'LEARN_MORE',
				objective: 'LEAD_GENERATION',
				dailyBudget: 50,
				lifetimeBudget: null
			}
		};
	}

	async function saveTemplate() {
		saving = true;
		try {
			const url = editingTemplate
				? `/api/admin/templates/${editingTemplate.id}`
				: '/api/admin/templates';

			const res = await fetch(url, {
				method: editingTemplate ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});

			if (res.ok) {
				await loadTemplates();
				showForm = false;
				resetForm();
			}
		} catch (err) {
			console.error('Failed to save template:', err);
		} finally {
			saving = false;
		}
	}

	async function deleteTemplate(id: string) {
		if (!confirm('Are you sure you want to delete this template?')) return;

		try {
			const res = await fetch(`/api/admin/templates/${id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				await loadTemplates();
			}
		} catch (err) {
			console.error('Failed to delete template:', err);
		}
	}

	async function duplicateTemplate(template: any) {
		editingTemplate = null;
		form = {
			name: template.name + ' (Copy)',
			description: template.description,
			category: template.category,
			isPublic: template.isPublic,
			templateData: JSON.parse(JSON.stringify(template.templateData))
		};
		showForm = true;
	}

	function getCategoryIcon(category: string) {
		const cat = categories.find(c => c.value === category);
		return cat?.icon || FileText;
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold text-white flex items-center">
				<FileText class="w-8 h-8 mr-3 {themeClasses.primary}" />
				Ad Templates
			</h1>
			<p class="text-gray-400 mt-1">Create and manage campaign templates for IBs</p>
		</div>
		{#if !showForm}
			<button
				on:click={newTemplate}
				class="flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
			>
				<Plus class="w-5 h-5 mr-2" />
				New Template
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="glass-card-ios rounded-2xl p-12 text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
			<p class="text-gray-400">Loading templates...</p>
		</div>
	{:else if showForm}
		<!-- Template Form -->
		<div class="glass-card-ios rounded-2xl p-6">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-bold text-white">
					{editingTemplate ? 'Edit Template' : 'New Template'}
				</h2>
				<button
					on:click={() => { showForm = false; resetForm(); }}
					class="text-gray-400 hover:text-white"
				>
					<X class="w-6 h-6" />
				</button>
			</div>

			<div class="space-y-6">
				<!-- Basic Info -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
						<input
							type="text"
							bind:value={form.name}
							placeholder="Forex Lead Generation"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Category</label>
						<select
							bind:value={form.category}
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
						>
							{#each categories as cat}
								<option value={cat.value}>{cat.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
					<textarea
						bind:value={form.description}
						placeholder="Proven template for generating forex trading leads..."
						rows="2"
						class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
					></textarea>
				</div>

				<!-- Campaign Settings -->
				<div class="border-t border-white/10 pt-6">
					<h3 class="text-lg font-semibold text-white mb-4">Campaign Settings</h3>

					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Objective</label>
							<select
								bind:value={form.templateData.objective}
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							>
								{#each objectives as obj}
									<option value={obj.value}>{obj.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Call to Action</label>
							<select
								bind:value={form.templateData.callToAction}
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							>
								{#each callToActions as cta}
									<option value={cta.value}>{cta.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Daily Budget ($)</label>
							<input
								type="number"
								bind:value={form.templateData.dailyBudget}
								min="1"
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							/>
						</div>

						<div class="flex items-center">
							<label class="flex items-center text-white cursor-pointer">
								<input
									type="checkbox"
									bind:checked={form.isPublic}
									class="mr-2"
								/>
								<span>Public Template</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Ad Creative -->
				<div class="border-t border-white/10 pt-6">
					<h3 class="text-lg font-semibold text-white mb-4">Ad Creative</h3>

					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Headline</label>
							<input
								type="text"
								bind:value={form.templateData.headline}
								placeholder="Start Trading Forex Today"
								maxlength="40"
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
							/>
							<p class="text-xs text-gray-500 mt-1">{form.templateData.headline.length}/40 characters</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
							<input
								type="text"
								bind:value={form.templateData.description}
								placeholder="Learn to trade forex with expert guidance"
								maxlength="90"
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
							/>
							<p class="text-xs text-gray-500 mt-1">{form.templateData.description.length}/90 characters</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Ad Copy (Primary Text)</label>
							<textarea
								bind:value={form.templateData.adCopy}
								placeholder="Want to start trading forex? Join thousands of successful traders..."
								rows="4"
								maxlength="125"
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
							></textarea>
							<p class="text-xs text-gray-500 mt-1">{form.templateData.adCopy.length}/125 characters</p>
						</div>
					</div>
				</div>

				<!-- Targeting -->
				<div class="border-t border-white/10 pt-6">
					<h3 class="text-lg font-semibold text-white mb-4">Targeting</h3>

					<div class="grid grid-cols-3 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Min Age</label>
							<input
								type="number"
								bind:value={form.templateData.targeting.age_min}
								min="18"
								max="65"
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Max Age</label>
							<input
								type="number"
								bind:value={form.templateData.targeting.age_max}
								min="18"
								max="65"
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Gender</label>
							<select
								on:change={(e) => {
									const val = e.currentTarget.value;
									form.templateData.targeting.genders = val === 'all' ? [1,2] : [parseInt(val)];
								}}
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							>
								<option value="all">All</option>
								<option value="1">Male</option>
								<option value="2">Female</option>
							</select>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
					<button
						on:click={() => { showForm = false; resetForm(); }}
						class="px-6 py-2 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors"
					>
						Cancel
					</button>
					<button
						on:click={saveTemplate}
						disabled={saving || !form.name}
						class="flex items-center px-6 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
					>
						{#if saving}
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
							Saving...
						{:else}
							<Save class="w-5 h-5 mr-2" />
							Save Template
						{/if}
					</button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Templates List -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each templates as template}
				<div class="glass-card-ios rounded-xl p-6 hover:bg-white/5 transition-colors">
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center">
							<div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
								<svelte:component this={getCategoryIcon(template.category)} class="w-6 h-6 text-orange-400" />
							</div>
							<div>
								<h3 class="text-white font-semibold">{template.name}</h3>
								<p class="text-xs text-gray-500 capitalize">{template.category.replace('_', ' ')}</p>
							</div>
						</div>
					</div>

					{#if template.description}
						<p class="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>
					{/if}

					<div class="flex items-center justify-between text-xs text-gray-500 mb-4">
						<span>Used {template.usageCount || 0} times</span>
						<span class={template.isPublic ? 'text-green-400' : 'text-gray-500'}>
							{template.isPublic ? 'Public' : 'Private'}
						</span>
					</div>

					<div class="flex items-center space-x-2">
						<button
							on:click={() => editTemplate(template)}
							class="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm flex items-center justify-center"
						>
							<Edit class="w-4 h-4 mr-1" />
							Edit
						</button>
						<button
							on:click={() => duplicateTemplate(template)}
							class="flex-1 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm flex items-center justify-center"
						>
							<Copy class="w-4 h-4 mr-1" />
							Copy
						</button>
						<button
							on:click={() => deleteTemplate(template.id)}
							class="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}

			{#if templates.length === 0}
				<div class="col-span-full">
					<div class="glass-card-ios rounded-2xl p-12 text-center">
						<FileText class="w-16 h-16 text-gray-500 mx-auto mb-4" />
						<h3 class="text-xl font-bold text-white mb-2">No Templates Yet</h3>
						<p class="text-gray-400 mb-6">Create your first campaign template to get started</p>
						<button
							on:click={newTemplate}
							class="px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
						>
							Create First Template
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
