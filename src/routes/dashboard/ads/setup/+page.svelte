<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { CheckCircle, ExternalLink, RefreshCw, AlertCircle } from 'lucide-svelte';
	import { getThemeClasses, theme } from '$lib/stores/theme';

	$: themeClasses = getThemeClasses($theme);
	$: step = $page.url.searchParams.get('step') || 'page';

	let checking = false;
	let accountStatus: any = null;

	onMount(async () => {
		await checkStatus();
	});

	async function checkStatus() {
		checking = true;
		try {
			const res = await fetch('/api/facebook/account');
			if (res.ok) {
				const data = await res.json();
				accountStatus = data.account;
			}
		} catch (err) {
			console.error('Failed to check status:', err);
		} finally {
			checking = false;
		}
	}

	async function refreshStatus() {
		await checkStatus();

		// If fully setup, redirect to ads dashboard
		if (accountStatus?.setupTier === 3) {
			window.location.href = '/dashboard/ads?success=setup_complete';
		}
	}

	const setupLinks = {
		page: {
			title: 'Create a Facebook Page',
			description: 'You need a Facebook Page to run ads',
			url: 'https://www.facebook.com/pages/create',
			steps: [
				'Click "Create" to start',
				'Choose a page type (Business or Community)',
				'Enter your business name and category',
				'Click "Create Page"'
			]
		},
		business: {
			title: 'Create Business Manager Account',
			description: 'Business Manager lets you manage ads and assets in one place',
			url: 'https://business.facebook.com/overview',
			steps: [
				'Click "Create Account" button',
				'Enter your business name',
				'Enter your name and work email',
				'Click "Submit" to create'
			]
		},
		ad_account: {
			title: 'Create Ad Account',
			description: 'An Ad Account is required to run advanced campaigns',
			url: 'https://business.facebook.com/settings/ad-accounts',
			steps: [
				'Click "Add" → "Create a new ad account"',
				'Enter an account name',
				'Select your time zone and currency',
				'Add your payment method',
				'Click "Create Ad Account"'
			]
		},
		payment: {
			title: 'Add Payment Method',
			description: 'Required to run ads and campaigns',
			url: 'https://business.facebook.com/billing_hub/payment_settings',
			steps: [
				'Click "Add Payment Method"',
				'Choose Credit/Debit Card',
				'Enter your card details',
				'Set as primary payment method',
				'Save changes'
			]
		}
	};

	$: currentSetup = setupLinks[step as keyof typeof setupLinks] || setupLinks.page;
</script>

<div class="p-6 max-w-4xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Complete Your Facebook Setup</h1>
		<p class="text-gray-400">Follow these quick steps to get your ads account ready</p>
	</div>

	<!-- Progress -->
	<div class="glass-card-ios rounded-2xl p-6 mb-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-white">Setup Progress</h2>
			<button
				on:click={refreshStatus}
				disabled={checking}
				class="flex items-center px-3 py-1 text-sm {themeClasses.primary} hover:underline disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4 mr-1 {checking ? 'animate-spin' : ''}" />
				Refresh Status
			</button>
		</div>

		<div class="space-y-3">
			<div class="flex items-center p-3 bg-black/30 rounded-lg">
				<CheckCircle class="w-5 h-5 {accountStatus?.pageId ? 'text-green-400' : 'text-gray-500'} mr-3" />
				<div class="flex-1">
					<p class="text-white font-medium">Facebook Page</p>
					<p class="text-sm text-gray-400">
						{accountStatus?.pageId ? accountStatus.pageName : 'Not connected'}
					</p>
				</div>
			</div>

			<div class="flex items-center p-3 bg-black/30 rounded-lg">
				<CheckCircle class="w-5 h-5 {accountStatus?.businessId ? 'text-green-400' : 'text-gray-500'} mr-3" />
				<div class="flex-1">
					<p class="text-white font-medium">Business Manager</p>
					<p class="text-sm text-gray-400">
						{accountStatus?.businessId ? accountStatus.businessName : 'Not created'}
					</p>
				</div>
			</div>

			<div class="flex items-center p-3 bg-black/30 rounded-lg">
				<CheckCircle class="w-5 h-5 {accountStatus?.adAccountId ? 'text-green-400' : 'text-gray-500'} mr-3" />
				<div class="flex-1">
					<p class="text-white font-medium">Ad Account</p>
					<p class="text-sm text-gray-400">
						{accountStatus?.adAccountId ? accountStatus.adAccountName : 'Not created'}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Current Step Instructions -->
	<div class="glass-card-ios rounded-2xl p-6 mb-6">
		<div class="flex items-start mb-6">
			<div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
				<AlertCircle class="w-6 h-6 text-blue-400" />
			</div>
			<div>
				<h2 class="text-xl font-bold text-white mb-2">{currentSetup.title}</h2>
				<p class="text-gray-400">{currentSetup.description}</p>
			</div>
		</div>

		<div class="mb-6">
			<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Steps to Complete:</h3>
			<ol class="space-y-3">
				{#each currentSetup.steps as stepText, index}
					<li class="flex items-start">
						<span class="flex items-center justify-center w-6 h-6 bg-orange-500/20 text-orange-400 text-sm font-bold rounded-full mr-3 flex-shrink-0">
							{index + 1}
						</span>
						<p class="text-white pt-0.5">{stepText}</p>
					</li>
				{/each}
			</ol>
		</div>

		<a
			href={currentSetup.url}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center px-6 py-3 bg-gradient-to-r {themeClasses.primaryGradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
		>
			Open {currentSetup.title.split(' ').pop()}
			<ExternalLink class="w-5 h-5 ml-2" />
		</a>

		<p class="text-sm text-gray-500 mt-4">
			After completing the steps, come back here and click "Refresh Status" above.
		</p>
	</div>

	<!-- Quick Links -->
	<div class="glass-card-ios rounded-2xl p-6">
		<h3 class="text-lg font-semibold text-white mb-4">Quick Access Links</h3>
		<div class="grid grid-cols-2 gap-3">
			<a
				href="https://www.facebook.com/pages/create"
				target="_blank"
				class="flex items-center p-3 bg-black/30 hover:bg-black/40 rounded-lg transition-colors"
			>
				<div class="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
					<span class="text-blue-400 text-xl">📄</span>
				</div>
				<div class="flex-1">
					<p class="text-white text-sm font-medium">Create Page</p>
					<p class="text-xs text-gray-400">Start here</p>
				</div>
				<ExternalLink class="w-4 h-4 text-gray-500" />
			</a>

			<a
				href="https://business.facebook.com/overview"
				target="_blank"
				class="flex items-center p-3 bg-black/30 hover:bg-black/40 rounded-lg transition-colors"
			>
				<div class="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mr-3">
					<span class="text-purple-400 text-xl">🏢</span>
				</div>
				<div class="flex-1">
					<p class="text-white text-sm font-medium">Business Manager</p>
					<p class="text-xs text-gray-400">Step 2</p>
				</div>
				<ExternalLink class="w-4 h-4 text-gray-500" />
			</a>

			<a
				href="https://business.facebook.com/settings/ad-accounts"
				target="_blank"
				class="flex items-center p-3 bg-black/30 hover:bg-black/40 rounded-lg transition-colors"
			>
				<div class="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mr-3">
					<span class="text-green-400 text-xl">💳</span>
				</div>
				<div class="flex-1">
					<p class="text-white text-sm font-medium">Ad Account</p>
					<p class="text-xs text-gray-400">Step 3</p>
				</div>
				<ExternalLink class="w-4 h-4 text-gray-500" />
			</a>

			<a
				href="https://business.facebook.com/billing_hub/payment_settings"
				target="_blank"
				class="flex items-center p-3 bg-black/30 hover:bg-black/40 rounded-lg transition-colors"
			>
				<div class="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mr-3">
					<span class="text-orange-400 text-xl">💰</span>
				</div>
				<div class="flex-1">
					<p class="text-white text-sm font-medium">Payment</p>
					<p class="text-xs text-gray-400">Final step</p>
				</div>
				<ExternalLink class="w-4 h-4 text-gray-500" />
			</a>
		</div>
	</div>

	<!-- Help Section -->
	<div class="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
		<div class="flex items-start">
			<AlertCircle class="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
			<div class="text-sm">
				<p class="text-blue-300 font-medium mb-1">Need Help?</p>
				<p class="text-blue-200/80">
					Setup typically takes 5-10 minutes. If you encounter any issues, please contact support or check Facebook's help documentation.
				</p>
			</div>
		</div>
	</div>
</div>
