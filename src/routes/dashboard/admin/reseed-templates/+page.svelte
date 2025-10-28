<script lang="ts">
	import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	$: themeClasses = getThemeClasses($theme);

	let loading = false;
	let result: any = null;
	let error: string | null = null;

	async function reseedTemplates() {
		if (!confirm('Are you sure you want to reseed all templates? This will DELETE all existing templates and create new ones.')) {
			return;
		}

		loading = true;
		error = null;
		result = null;

		try {
			const res = await fetch('/api/admin/reseed-templates', {
				method: 'POST'
			});

			const data = await res.json();

			if (res.ok) {
				result = data;
			} else {
				error = data.error || 'Failed to reseed templates';
			}
		} catch (err) {
			console.error('Error reseeding templates:', err);
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="p-6 max-w-4xl mx-auto">
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-white flex items-center">
			<RefreshCw class="w-8 h-8 mr-3 {themeClasses.primary}" />
			Reseed Templates
		</h1>
		<p class="text-gray-400 mt-2">Update production templates to African forex markets</p>
	</div>

	<!-- Warning -->
	<div class="glass-card-ios rounded-xl p-6 mb-6 border-2 border-orange-500/50 bg-orange-500/10">
		<div class="flex items-start">
			<AlertCircle class="w-6 h-6 text-orange-400 mr-3 flex-shrink-0 mt-1" />
			<div>
				<h3 class="text-lg font-semibold text-white mb-2">⚠️ Important</h3>
				<p class="text-gray-300 mb-2">
					This will <strong>DELETE ALL existing templates</strong> and create 6 new optimized templates targeting African forex markets.
				</p>
				<p class="text-gray-400 text-sm">
					Target countries: South Africa, Nigeria, Kenya, Ghana, Egypt, Morocco, Tanzania, Uganda, Zambia, Botswana
				</p>
			</div>
		</div>
	</div>

	<!-- Action Button -->
	<div class="glass-card-ios rounded-xl p-6 mb-6">
		<button
			on:click={reseedTemplates}
			disabled={loading}
			class="w-full px-6 py-4 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
		>
			{#if loading}
				<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
				Reseeding Templates...
			{:else}
				<RefreshCw class="w-6 h-6 mr-3" />
				Reseed Templates Now
			{/if}
		</button>
	</div>

	<!-- Success Result -->
	{#if result}
		<div class="glass-card-ios rounded-xl p-6 border-2 border-green-500/50 bg-green-500/10">
			<div class="flex items-start mb-4">
				<CheckCircle class="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-1" />
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-white mb-2">✅ Success!</h3>
					<p class="text-gray-300 mb-4">{result.message}</p>

					<!-- Target Countries -->
					<div class="mb-4">
						<h4 class="text-sm font-semibold text-white mb-2">Target Countries:</h4>
						<div class="grid grid-cols-2 gap-2">
							{#each result.countryNames as country}
								<div class="text-sm text-gray-300">{country}</div>
							{/each}
						</div>
					</div>

					<!-- Created Templates -->
					<div>
						<h4 class="text-sm font-semibold text-white mb-2">Created Templates ({result.templates.length}):</h4>
						<div class="space-y-1">
							{#each result.templates as template}
								<div class="text-sm text-gray-300 bg-black/20 rounded px-3 py-2">
									{template.name}
									<span class="text-xs text-gray-500 ml-2">({template.category})</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="mt-4 pt-4 border-t border-white/10">
				<a
					href="/dashboard/ads/templates"
					class="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
				>
					View Templates
				</a>
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="glass-card-ios rounded-xl p-6 border-2 border-red-500/50 bg-red-500/10">
			<div class="flex items-center text-red-400">
				<AlertCircle class="w-5 h-5 mr-2" />
				<span>{error}</span>
			</div>
		</div>
	{/if}

	<!-- Info Box -->
	<div class="glass-card-ios rounded-xl p-6 mt-6">
		<h3 class="text-lg font-semibold text-white mb-3">What This Does:</h3>
		<ul class="space-y-2 text-gray-300">
			<li class="flex items-start">
				<span class="text-orange-400 mr-2">•</span>
				<span>Deletes all existing ad templates from the database</span>
			</li>
			<li class="flex items-start">
				<span class="text-orange-400 mr-2">•</span>
				<span>Creates 6 new optimized templates focused on $1000 instant funding</span>
			</li>
			<li class="flex items-start">
				<span class="text-orange-400 mr-2">•</span>
				<span>Targets 10 top lucrative African forex markets (ZA, NG, KE, GH, EG, MA, TZ, UG, ZM, BW)</span>
			</li>
			<li class="flex items-start">
				<span class="text-orange-400 mr-2">•</span>
				<span>Removes demographic-specific language for lower CPC/CPL</span>
			</li>
			<li class="flex items-start">
				<span class="text-orange-400 mr-2">•</span>
				<span>Uses scarcity and urgency tactics to maximize clicks</span>
			</li>
		</ul>
	</div>
</div>
