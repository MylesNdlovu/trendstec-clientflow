<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let countdown = 10;
	let countdownInterval: number;

	onMount(() => {
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(countdownInterval);
				goto('/');
			}
		}, 1000);

		return () => {
			if (countdownInterval) {
				clearInterval(countdownInterval);
			}
		};
	});
</script>

<svelte:head>
	<title>MT5 Credentials Submitted Successfully</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
	<div class="max-w-2xl mx-auto text-center">
		<!-- Success Icon -->
		<div class="mb-8">
			<div class="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
				<svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
		</div>

		<!-- Success Message -->
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">
				🎉 Credentials Submitted Successfully!
			</h1>

			<div class="text-lg text-gray-700 mb-6">
				<p class="mb-4">
					Thank you for submitting your MT5 credentials. We've successfully received your information and initiated the verification process.
				</p>
			</div>

			<!-- What happens next -->
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
				<h3 class="text-lg font-semibold text-blue-900 mb-4">What happens next?</h3>
				<div class="space-y-3 text-left">
					<div class="flex items-start">
						<div class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
						<div>
							<p class="font-medium text-blue-900">Automatic Verification</p>
							<p class="text-blue-700 text-sm">Our system will verify your MT5 credentials within 5-10 minutes.</p>
						</div>
					</div>
					<div class="flex items-start">
						<div class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
						<div>
							<p class="font-medium text-blue-900">Email Confirmation</p>
							<p class="text-blue-700 text-sm">You'll receive an email confirmation once verification is complete.</p>
						</div>
					</div>
					<div class="flex items-start">
						<div class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
						<div>
							<p class="font-medium text-blue-900">Tracking Begins</p>
							<p class="text-blue-700 text-sm">We'll start monitoring your account activity for deposits and trades.</p>
						</div>
					</div>
					<div class="flex items-start">
						<div class="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
						<div>
							<p class="font-medium text-blue-900">Automated Follow-ups</p>
							<p class="text-blue-700 text-sm">You'll receive helpful guidance and support based on your trading activity.</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Support Information -->
			<div class="bg-gray-50 rounded-lg p-6 mb-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-3">Need Support?</h3>
				<div class="text-gray-700 space-y-2">
					<p>If you have any questions or need assistance:</p>
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<a
							href="mailto:support@example.com"
							class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
						>
							📧 Email Support
						</a>
						<a
							href="/help/mt5-setup"
							class="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
						>
							📚 Help Center
						</a>
					</div>
				</div>
			</div>

			<!-- Countdown -->
			<div class="text-gray-500">
				<p>Redirecting to homepage in <span class="font-bold text-blue-600">{countdown}</span> seconds...</p>
				<button
					on:click={() => goto('/')}
					class="mt-2 text-blue-600 hover:text-blue-800 underline"
				>
					Go to Homepage Now
				</button>
			</div>
		</div>

		<!-- Security Reminder -->
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<div class="flex items-center">
				<svg class="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
				</svg>
				<div>
					<p class="text-sm text-yellow-800">
						<strong>Security Reminder:</strong> Never share your main trading passwords. We only use investor passwords for read-only monitoring.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>