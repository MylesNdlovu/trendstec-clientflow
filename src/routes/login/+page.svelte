<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
	$: registered = $page.url.searchParams.get('registered') === 'true';
</script>

<svelte:head>
	<title>Login - TRENDSTEC ClientFlow</title>
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
			<h1 class="text-3xl font-bold text-white mb-2">Welcome Back</h1>
			<p class="text-gray-400">Sign in to your ClientFlow account</p>
		</div>

		<!-- Login Form -->
		<div class="p-8 rounded-xl" style="background: #000000; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
			{#if registered}
				<div class="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm">
					Account created successfully! Please sign in.
				</div>
			{/if}

			{#if form?.error}
				<div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
					{form.error}
				</div>
			{/if}

		<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ result, update }) => {
						if (result.type === 'redirect') {
							window.location.href = result.location;
						} else {
							loading = false;
							await update();
						}
					};
				}}
			>
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
							class="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 transition-colors"
							placeholder="you@example.com"
							value={form?.email || ''}
						/>
					</div>

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-300 mb-2">
							Password
						</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							disabled={loading}
							class="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 transition-colors"
							placeholder="••••••••"
						/>
					</div>

					<!-- Remember Me & Forgot Password -->
					<div class="flex items-center justify-between">
						<label class="flex items-center text-sm text-gray-300">
							<input
								type="checkbox"
								name="remember"
								disabled={loading}
								class="mr-2 rounded bg-black border-gray-700 text-orange-500 focus:ring-orange-500"
							/>
							Remember me
						</label>
						<a href="/forgot-password" class="text-sm text-orange-400 hover:text-orange-300 transition-colors">
							Forgot password?
						</a>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading}
						class="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-orange-500/25"
					>
						{loading ? 'Signing in...' : 'Sign In'}
					</button>
				</div>
			</form>

			<!-- Sign Up Link -->
			<div class="mt-6 text-center">
				<p class="text-sm text-gray-400">
					Don't have an account?
					<a href="/signup" class="text-orange-400 hover:text-orange-300 font-medium transition-colors">
						Sign up
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
