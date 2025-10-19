<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
</script>

<svelte:head>
	<title>Forgot Password - TRENDSTEC ClientFlow</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-black px-4">
	<div class="max-w-md w-full space-y-8">
		<!-- Logo -->
		<div class="text-center">
			<img
				src="/trendstec-logo.png"
				alt="TRENDSTEC Logo"
				class="h-16 mx-auto mb-4"
			/>
			<h1 class="text-3xl font-bold text-white mb-2">Reset Password</h1>
			<p class="text-gray-400">We'll send you a reset link</p>
		</div>

		<!-- Forgot Password Form -->
		<div class="p-8 rounded-xl" style="background: #000000; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
			<h2 class="text-xl font-semibold text-white mb-2">Enter Your Email</h2>
			<p class="text-gray-400 text-sm mb-6">
				Enter your email address and we'll send you a link to reset your password.
			</p>

			{#if form?.success}
				<div class="mb-4 p-3 bg-green-900/20 border border-green-800 rounded text-green-400 text-sm">
					Password reset link sent! Check your email.
				</div>
			{/if}

			{#if form?.error}
				<div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
					{form.error}
				</div>
			{/if}

			<form method="POST" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}>
				<div class="space-y-4">
					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-300 mb-2">
							Email Address
						</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							disabled={loading}
							class="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
							placeholder="you@example.com"
							value={form?.email || ''}
						/>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading}
						class="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-orange-500/25"
					>
						{loading ? 'Sending...' : 'Send Reset Link'}
					</button>
				</div>
			</form>

			<!-- Back to Login -->
			<div class="mt-6 text-center">
				<a href="/login" class="text-sm text-orange-400 hover:text-orange-300">
					← Back to login
				</a>
			</div>
		</div>
	</div>
</div>
