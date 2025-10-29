<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Save, Eye, Upload, X, AlertCircle, CheckCircle } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	export let data;

	$: themeClasses = getThemeClasses($theme);

	let saving = false;
	let error: string | null = null;
	let uploadingImage = false;
	let imagePreview: string | null = null;

	// Initialize form with template data or defaults
	let form = {
		name: data.template ? `${data.template.name} - Campaign` : '',
		objective: data.template?.templateData?.objective || 'LEAD_GENERATION',
		callToAction: data.template?.templateData?.callToAction || 'LEARN_MORE',
		status: 'PAUSED', // Always start paused so user can review
		dailyBudget: data.template?.templateData?.dailyBudget || 50,
		lifetimeBudget: data.template?.templateData?.lifetimeBudget || null,
		headline: data.template?.templateData?.headline || '',
		description: data.template?.templateData?.description || '',
		adCopy: data.template?.templateData?.adCopy || '',
		imageUrl: '',
		targeting: {
			age_min: data.template?.templateData?.targeting?.age_min || 25,
			age_max: data.template?.templateData?.targeting?.age_max || 55,
			genders: data.template?.templateData?.targeting?.genders || [1, 2],
			geo_locations: data.template?.templateData?.targeting?.geo_locations || { countries: ['ZA', 'NG', 'KE', 'GH', 'EG', 'MA', 'TZ', 'UG', 'ZM', 'BW'] }
		}
	};

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

	// Top 10 lucrative African forex markets
	const countries = [
		{ code: 'ZA', name: '🇿🇦 South Africa' },
		{ code: 'NG', name: '🇳🇬 Nigeria' },
		{ code: 'KE', name: '🇰🇪 Kenya' },
		{ code: 'GH', name: '🇬🇭 Ghana' },
		{ code: 'EG', name: '🇪🇬 Egypt' },
		{ code: 'MA', name: '🇲🇦 Morocco' },
		{ code: 'TZ', name: '🇹🇿 Tanzania' },
		{ code: 'UG', name: '🇺🇬 Uganda' },
		{ code: 'ZM', name: '🇿🇲 Zambia' },
		{ code: 'BW', name: '🇧🇼 Botswana' }
	];

	async function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			error = 'Please upload an image file';
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Image must be smaller than 5MB';
			return;
		}

		// Create preview immediately for UX
		const reader = new FileReader();
		reader.onload = (e) => {
			imagePreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);

		// Upload to Vercel Blob
		uploadingImage = true;
		error = null;

		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await fetch('/api/upload/image', {
				method: 'POST',
				body: formData
			});

			const result = await res.json();

			if (res.ok) {
				form.imageUrl = result.url;
				console.log('Image uploaded successfully:', result.url);
			} else {
				error = result.error || 'Failed to upload image';
				imagePreview = null;
			}
		} catch (err) {
			console.error('Upload error:', err);
			error = 'Failed to upload image. Please try again.';
			imagePreview = null;
		} finally {
			uploadingImage = false;
		}
	}

	function removeImage() {
		imagePreview = null;
		form.imageUrl = '';
	}

	async function handleSubmit() {
		error = null;

		// Validation
		if (!form.name.trim()) {
			error = 'Campaign name is required';
			return;
		}

		if (!form.headline.trim()) {
			error = 'Ad headline is required';
			return;
		}

		if (!form.imageUrl) {
			error = 'Ad image is required';
			return;
		}

		// Check Facebook connection
		if (!data.adAccount) {
			error = 'Please connect your Facebook account first';
			return;
		}

		if (data.adAccount.setupTier < 3) {
			error = 'Your Facebook account needs additional permissions. Please complete the setup in the Ads dashboard.';
			return;
		}

		saving = true;

		try {
			const res = await fetch('/api/facebook/campaigns', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					templateId: data.template?.id || null
				})
			});

			const result = await res.json();

			if (res.ok) {
				// Success! Redirect to campaign view
				goto(`/dashboard/ads/campaigns/${result.campaign.id}`);
			} else {
				error = result.error || 'Failed to create campaign';
			}
		} catch (err) {
			console.error('Error creating campaign:', err);
			error = 'Network error. Please try again.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="mb-6">
		<button
			on:click={() => goto('/dashboard/ads/templates')}
			class="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
		>
			<ArrowLeft class="w-5 h-5 mr-2" />
			Back to Templates
		</button>

		<h1 class="text-3xl font-bold text-white">Create New Campaign</h1>
		{#if data.template}
			<p class="text-gray-400 mt-2">
				Using template: <span class="text-orange-400 font-semibold">{data.template.name}</span>
			</p>
		{/if}
	</div>

	<!-- Facebook Connection Warning -->
	{#if !data.adAccount}
		<div class="glass-card-ios rounded-xl p-6 mb-6 border-2 border-red-500/50 bg-red-500/10">
			<div class="flex items-start">
				<AlertCircle class="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-1" />
				<div>
					<h3 class="text-lg font-semibold text-white mb-2">Facebook Account Not Connected</h3>
					<p class="text-gray-300 mb-4">
						You need to connect your Facebook account before creating campaigns.
					</p>
					<a
						href="/dashboard/ads"
						class="inline-flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
					>
						Connect Facebook Account
					</a>
				</div>
			</div>
		</div>
	{:else if data.adAccount.setupTier < 3}
		<div class="glass-card-ios rounded-xl p-6 mb-6 border-2 border-orange-500/50 bg-orange-500/10">
			<div class="flex items-start">
				<AlertCircle class="w-6 h-6 text-orange-400 mr-3 flex-shrink-0 mt-1" />
				<div>
					<h3 class="text-lg font-semibold text-white mb-2">Additional Permissions Needed</h3>
					<p class="text-gray-300 mb-4">
						Your Facebook account needs additional permissions to create ad campaigns (Tier {data.adAccount.setupTier}/3).
					</p>
					<a
						href="/dashboard/ads"
						class="inline-flex items-center px-4 py-2 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity"
					>
						Complete Setup
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="glass-card-ios rounded-xl p-4 mb-6 border-2 border-red-500/50 bg-red-500/10">
			<div class="flex items-center text-red-400">
				<AlertCircle class="w-5 h-5 mr-2" />
				<span>{error}</span>
			</div>
		</div>
	{/if}

	<!-- Campaign Form -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column: Form -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Basic Info -->
			<div class="glass-card-ios rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4">Campaign Details</h2>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Campaign Name *</label>
						<input
							type="text"
							bind:value={form.name}
							placeholder="My Forex Lead Generation Campaign"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Objective *</label>
							<select
								bind:value={form.objective}
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							>
								{#each objectives as obj}
									<option value={obj.value}>{obj.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-300 mb-2">Call to Action *</label>
							<select
								bind:value={form.callToAction}
								class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
							>
								{#each callToActions as cta}
									<option value={cta.value}>{cta.label}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
			</div>

			<!-- Ad Creative -->
			<div class="glass-card-ios rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4">Ad Creative</h2>

				<div class="space-y-4">
					<!-- Image Upload -->
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Ad Image *</label>

						{#if uploadingImage}
							<div class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-orange-500/50 rounded-lg bg-black/20">
								<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
								<span class="text-sm text-gray-300">Uploading image...</span>
							</div>
						{:else if imagePreview}
							<div class="relative">
								<img src={imagePreview} alt="Ad preview" class="w-full rounded-lg" />
								<button
									on:click={removeImage}
									disabled={uploadingImage}
									class="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors disabled:opacity-50"
								>
									<X class="w-5 h-5 text-white" />
								</button>
							</div>
						{:else}
							<label class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-orange-500 transition-colors bg-black/20">
								<Upload class="w-12 h-12 text-gray-500 mb-2" />
								<span class="text-sm text-gray-400">Click to upload image</span>
								<span class="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</span>
								<input
									type="file"
									accept="image/*"
									on:change={handleImageUpload}
									class="hidden"
									disabled={uploadingImage}
								/>
							</label>
						{/if}
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Headline *</label>
						<input
							type="text"
							bind:value={form.headline}
							placeholder="Start Trading Forex Today"
							maxlength="40"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
						/>
						<p class="text-xs text-gray-500 mt-1">{form.headline.length}/40 characters</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
						<input
							type="text"
							bind:value={form.description}
							placeholder="Learn to trade forex with expert guidance"
							maxlength="90"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
						/>
						<p class="text-xs text-gray-500 mt-1">{form.description.length}/90 characters</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Primary Text (Ad Copy)</label>
						<textarea
							bind:value={form.adCopy}
							placeholder="Want to achieve financial freedom through forex trading? Join thousands..."
							rows="4"
							maxlength="125"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
						></textarea>
						<p class="text-xs text-gray-500 mt-1">{form.adCopy.length}/125 characters</p>
					</div>
				</div>
			</div>

			<!-- Targeting -->
			<div class="glass-card-ios rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4">Targeting</h2>

				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Min Age</label>
						<input
							type="number"
							bind:value={form.targeting.age_min}
							min="18"
							max="65"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Max Age</label>
						<input
							type="number"
							bind:value={form.targeting.age_max}
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
								form.targeting.genders = val === 'all' ? [1,2] : [parseInt(val)];
							}}
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
						>
							<option value="all">All</option>
							<option value="1">Male</option>
							<option value="2">Female</option>
						</select>
					</div>
				</div>

				<div class="mt-4">
					<label class="block text-sm font-medium text-gray-300 mb-2">Countries</label>
					<select
						multiple
						bind:value={form.targeting.geo_locations.countries}
						class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500 h-32"
					>
						{#each countries as country}
							<option value={country.code}>{country.name}</option>
						{/each}
					</select>
					<p class="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple countries</p>
				</div>
			</div>

			<!-- Budget -->
			<div class="glass-card-ios rounded-xl p-6">
				<h2 class="text-xl font-bold text-white mb-4">Budget</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Daily Budget ($) *</label>
						<input
							type="number"
							bind:value={form.dailyBudget}
							min="1"
							step="0.01"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-300 mb-2">Lifetime Budget ($)</label>
						<input
							type="number"
							bind:value={form.lifetimeBudget}
							min="1"
							step="0.01"
							placeholder="Optional"
							class="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
						/>
					</div>
				</div>

				<div class="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
					<p class="text-sm text-gray-300">
						<strong>Note:</strong> Campaign will start in <strong class="text-white">PAUSED</strong> status. You can review and activate it from the Ads dashboard.
					</p>
				</div>
			</div>
		</div>

		<!-- Right Column: Preview & Actions -->
		<div class="lg:col-span-1">
			<div class="sticky top-6 space-y-6">
				<!-- Ad Preview -->
				<div class="glass-card-ios rounded-xl p-6">
					<h3 class="text-lg font-bold text-white mb-4 flex items-center">
						<Eye class="w-5 h-5 mr-2 {themeClasses.primary}" />
						Ad Preview
					</h3>

					<div class="bg-white rounded-lg p-4">
						<!-- Mock Facebook Ad -->
						<div class="space-y-3">
							<!-- Sponsored Badge -->
							<div class="flex items-center text-xs text-gray-500">
								<span class="font-semibold">Sponsored</span>
							</div>

							<!-- Ad Copy -->
							{#if form.adCopy}
								<p class="text-sm text-gray-900">{form.adCopy}</p>
							{/if}

							<!-- Image -->
							{#if imagePreview}
								<img src={imagePreview} alt="Ad" class="w-full rounded" />
							{:else}
								<div class="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
									<span class="text-gray-400 text-sm">No image uploaded</span>
								</div>
							{/if}

							<!-- Link Preview -->
							<div class="bg-gray-50 p-3 rounded">
								{#if form.headline}
									<p class="font-semibold text-sm text-gray-900 mb-1">{form.headline}</p>
								{/if}
								{#if form.description}
									<p class="text-xs text-gray-600">{form.description}</p>
								{/if}
								{#if form.callToAction}
									<button class="mt-2 px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-semibold rounded">
										{callToActions.find(c => c.value === form.callToAction)?.label}
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="glass-card-ios rounded-xl p-6">
					<button
						on:click={handleSubmit}
						disabled={saving || !data.adAccount || data.adAccount.setupTier < 3}
						class="w-full px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-3"
					>
						{#if saving}
							<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
							Creating...
						{:else}
							<Save class="w-5 h-5 mr-2" />
							Create Campaign
						{/if}
					</button>

					<button
						on:click={() => goto('/dashboard/ads/templates')}
						class="w-full px-6 py-3 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
