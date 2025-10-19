<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let redirectCountdown = 5;

	onMount(() => {
		if (data.success) {
			const interval = setInterval(() => {
				redirectCountdown--;
				if (redirectCountdown === 0) {
					window.location.href = '/login?verified=true';
				}
			}, 1000);

			return () => clearInterval(interval);
		}
	});
</script>

<svelte:head>
	<title>Email Verification - ClientFlow</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
	<div class="max-w-md w-full">
		<div class="bg-gray-900 border border-orange-500/30 rounded-xl p-8 shadow-2xl">
			{#if data.success}
				<!-- Success State -->
				<div class="text-center">
					<div class="mb-6">
						<div class="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
							<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
							</svg>
						</div>
					</div>

					<h1 class="text-3xl font-bold text-white mb-4">
						Email Verified!
					</h1>

					<p class="text-gray-300 mb-6">
						Welcome, {data.name || 'there'}! Your email address has been successfully verified.
					</p>

					<div class="bg-black/50 border border-orange-500/30 rounded-lg p-4 mb-6">
						<p class="text-sm text-gray-400">
							Redirecting to login in <span class="text-orange-500 font-bold">{redirectCountdown}</span> seconds...
						</p>
					</div>

					<a
						href="/login?verified=true"
						class="inline-block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
					>
						Go to Login Now
					</a>
				</div>
			{:else}
				<!-- Error State -->
				<div class="text-center">
					<div class="mb-6">
						<div class="w-20 h-20 bg-red-900/30 border border-red-500 rounded-full flex items-center justify-center mx-auto">
							<svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</div>
					</div>

					<h1 class="text-3xl font-bold text-white mb-4">
						Verification Failed
					</h1>

					<p class="text-red-400 mb-6">
						{data.error}
					</p>

					<div class="space-y-3">
						<a
							href="/login"
							class="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
						>
							Go to Login
						</a>

						<a
							href="/signup"
							class="block w-full bg-gray-800 text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all border border-gray-700"
						>
							Create New Account
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
