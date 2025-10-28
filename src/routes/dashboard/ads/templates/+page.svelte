<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { FileText, TrendingUp, Eye, Users, Target, DollarSign, MapPin, Calendar, ArrowRight } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	export let data;

	$: themeClasses = getThemeClasses($theme);

	let templates: any[] = data.templates || [];
	let selectedCategory: string = 'all';
	let selectedTemplate: any = null;

	const categories = [
		{ value: 'all', label: 'All Templates', icon: FileText },
		{ value: 'lead_generation', label: 'Lead Generation', icon: Users },
		{ value: 'conversion', label: 'Conversion', icon: TrendingUp },
		{ value: 'awareness', label: 'Brand Awareness', icon: Eye }
	];

	$: filteredTemplates = selectedCategory === 'all'
		? templates
		: templates.filter(t => t.category === selectedCategory);

	function getCategoryIcon(category: string) {
		const cat = categories.find(c => c.value === category);
		return cat?.icon || FileText;
	}

	function viewTemplate(template: any) {
		selectedTemplate = template;
	}

	function closeModal() {
		selectedTemplate = null;
	}

	function useTemplate(template: any) {
		// Navigate to campaign creation with template ID
		goto(`/dashboard/ads/campaigns/new?templateId=${template.id}`);
	}

	function formatBudget(amount: number | null) {
		if (!amount) return 'Not set';
		return `$${amount.toFixed(2)}`;
	}

	function formatTargeting(targeting: any) {
		const parts = [];

		if (targeting.age_min && targeting.age_max) {
			parts.push(`Ages ${targeting.age_min}-${targeting.age_max}`);
		}

		if (targeting.genders?.length === 1) {
			parts.push(targeting.genders[0] === 1 ? 'Male' : 'Female');
		} else {
			parts.push('All Genders');
		}

		if (targeting.geo_locations?.countries) {
			parts.push(targeting.geo_locations.countries.join(', '));
		}

		return parts.join(' • ');
	}
</script>

<div class="p-6">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between mb-2">
			<h1 class="text-3xl font-bold text-white flex items-center">
				<FileText class="w-8 h-8 mr-3 {themeClasses.primary}" />
				Campaign Templates
			</h1>
			<a
				href="/dashboard/ads/campaigns/new"
				class="px-4 py-2 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors text-sm"
			>
				Create from Scratch
			</a>
		</div>
		<p class="text-gray-400">Choose a proven template to launch your campaign faster</p>
	</div>

	<!-- Category Filters -->
	<div class="flex space-x-2 mb-6 overflow-x-auto pb-2">
		{#each categories as category}
			<button
				on:click={() => selectedCategory = category.value}
				class="flex items-center px-4 py-2 rounded-lg transition-all whitespace-nowrap {
					selectedCategory === category.value
						? `bg-gradient-to-r ${themeClasses.primaryGradient} text-white`
						: 'bg-black/30 text-gray-400 hover:bg-black/40'
				}"
			>
				<svelte:component this={category.icon} class="w-5 h-5 mr-2" />
				{category.label}
			</button>
		{/each}
	</div>

	<!-- Templates Grid -->
	{#if filteredTemplates.length === 0}
		<div class="glass-card-ios rounded-2xl p-12 text-center">
			<FileText class="w-16 h-16 text-gray-500 mx-auto mb-4" />
			<h3 class="text-xl font-bold text-white mb-2">No Templates Found</h3>
			<p class="text-gray-400 mb-6">
				{selectedCategory === 'all'
					? 'No templates available yet'
					: 'No templates in this category'}
			</p>
			<button
				on:click={() => selectedCategory = 'all'}
				class="px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
			>
				View All Templates
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredTemplates as template}
				<div class="glass-card-ios rounded-xl p-6 hover:bg-white/5 transition-all cursor-pointer group">
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center flex-1">
							<div class="w-12 h-12 bg-gradient-to-br {themeClasses.primaryGradient} rounded-lg flex items-center justify-center mr-3">
								<svelte:component this={getCategoryIcon(template.category)} class="w-6 h-6 text-white" />
							</div>
							<div>
								<h3 class="text-white font-semibold text-lg group-hover:text-orange-400 transition-colors">
									{template.name}
								</h3>
								<p class="text-xs text-gray-500 capitalize">
									{template.category.replace('_', ' ')}
								</p>
							</div>
						</div>
					</div>

					{#if template.description}
						<p class="text-gray-400 text-sm mb-4 line-clamp-2">
							{template.description}
						</p>
					{/if}

					<!-- Quick Stats -->
					<div class="grid grid-cols-2 gap-3 mb-4 text-xs">
						<div class="flex items-center text-gray-400">
							<DollarSign class="w-4 h-4 mr-1 {themeClasses.primary}" />
							<span>${template.templateData.dailyBudget || 0}/day</span>
						</div>
						<div class="flex items-center text-gray-400">
							<Target class="w-4 h-4 mr-1 {themeClasses.primary}" />
							<span>{template.templateData.objective || 'N/A'}</span>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex items-center space-x-2 pt-4 border-t border-white/10">
						<button
							on:click={() => viewTemplate(template)}
							class="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm flex items-center justify-center"
						>
							<Eye class="w-4 h-4 mr-2" />
							Preview
						</button>
						<button
							on:click={() => useTemplate(template)}
							class="flex-1 px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center"
						>
							Use Template
							<ArrowRight class="w-4 h-4 ml-2" />
						</button>
					</div>

					<!-- Usage Badge -->
					<div class="mt-3 text-center text-xs text-gray-500">
						Used by {template.usageCount || 0} {template.usageCount === 1 ? 'user' : 'users'}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Template Preview Modal -->
{#if selectedTemplate}
	<div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" on:click={closeModal}>
		<div class="glass-card-ios rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
			<!-- Modal Header -->
			<div class="p-6 border-b border-white/10">
				<div class="flex items-start justify-between">
					<div class="flex items-center">
						<div class="w-12 h-12 bg-gradient-to-br {themeClasses.primaryGradient} rounded-lg flex items-center justify-center mr-4">
							<svelte:component this={getCategoryIcon(selectedTemplate.category)} class="w-6 h-6 text-white" />
						</div>
						<div>
							<h2 class="text-2xl font-bold text-white">{selectedTemplate.name}</h2>
							<p class="text-gray-400 capitalize">{selectedTemplate.category.replace('_', ' ')}</p>
						</div>
					</div>
					<button
						on:click={closeModal}
						class="text-gray-400 hover:text-white text-2xl"
					>
						×
					</button>
				</div>

				{#if selectedTemplate.description}
					<p class="text-gray-300 mt-4">{selectedTemplate.description}</p>
				{/if}
			</div>

			<!-- Modal Body -->
			<div class="p-6 space-y-6">
				<!-- Campaign Settings -->
				<div>
					<h3 class="text-lg font-semibold text-white mb-3 flex items-center">
						<Target class="w-5 h-5 mr-2 {themeClasses.primary}" />
						Campaign Settings
					</h3>
					<div class="grid grid-cols-2 gap-4">
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-xs text-gray-500 mb-1">Objective</p>
							<p class="text-white font-medium">{selectedTemplate.templateData.objective || 'Not set'}</p>
						</div>
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-xs text-gray-500 mb-1">Call to Action</p>
							<p class="text-white font-medium">{selectedTemplate.templateData.callToAction || 'Not set'}</p>
						</div>
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-xs text-gray-500 mb-1">Daily Budget</p>
							<p class="text-white font-medium">{formatBudget(selectedTemplate.templateData.dailyBudget)}</p>
						</div>
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-xs text-gray-500 mb-1">Lifetime Budget</p>
							<p class="text-white font-medium">{formatBudget(selectedTemplate.templateData.lifetimeBudget)}</p>
						</div>
					</div>
				</div>

				<!-- Ad Creative -->
				<div>
					<h3 class="text-lg font-semibold text-white mb-3 flex items-center">
						<FileText class="w-5 h-5 mr-2 {themeClasses.primary}" />
						Ad Creative
					</h3>
					<div class="space-y-4">
						{#if selectedTemplate.templateData.headline}
							<div class="bg-black/30 rounded-lg p-4">
								<p class="text-xs text-gray-500 mb-2">Headline</p>
								<p class="text-white text-lg font-semibold">{selectedTemplate.templateData.headline}</p>
							</div>
						{/if}

						{#if selectedTemplate.templateData.description}
							<div class="bg-black/30 rounded-lg p-4">
								<p class="text-xs text-gray-500 mb-2">Description</p>
								<p class="text-white">{selectedTemplate.templateData.description}</p>
							</div>
						{/if}

						{#if selectedTemplate.templateData.adCopy}
							<div class="bg-black/30 rounded-lg p-4">
								<p class="text-xs text-gray-500 mb-2">Ad Copy (Primary Text)</p>
								<p class="text-white">{selectedTemplate.templateData.adCopy}</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Targeting -->
				{#if selectedTemplate.templateData.targeting}
					<div>
						<h3 class="text-lg font-semibold text-white mb-3 flex items-center">
							<MapPin class="w-5 h-5 mr-2 {themeClasses.primary}" />
							Targeting
						</h3>
						<div class="bg-black/30 rounded-lg p-4">
							<p class="text-white">{formatTargeting(selectedTemplate.templateData.targeting)}</p>
						</div>
					</div>
				{/if}

				<!-- Usage Stats -->
				<div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-300">Used by {selectedTemplate.usageCount || 0} users</span>
						<span class="text-gray-500">Created {new Date(selectedTemplate.createdAt).toLocaleDateString()}</span>
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="p-6 border-t border-white/10 flex items-center justify-end space-x-4">
				<button
					on:click={closeModal}
					class="px-6 py-2 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors"
				>
					Close
				</button>
				<button
					on:click={() => useTemplate(selectedTemplate)}
					class="px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity flex items-center"
				>
					Use This Template
					<ArrowRight class="w-5 h-5 ml-2" />
				</button>
			</div>
		</div>
	</div>
{/if}
