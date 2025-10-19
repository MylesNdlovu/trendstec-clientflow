<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;

	let loading = false;
	let showPassword = false;
	let showConfirmPassword = false;
</script>

<svelte:head>
	<title>Sign Up - TRENDSTEC ClientFlow</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-black px-4 py-12">
	<div class="max-w-md w-full space-y-8">
		<!-- Logo -->
		<div class="text-center">
			<img
				src="/trendstec-logo.png"
				alt="TRENDSTEC Logo"
				class="h-16 mx-auto mb-4"
			/>
			<h1 class="text-3xl font-bold text-white mb-2">Create Account</h1>
			<p class="text-gray-400">Join TRENDSTEC ClientFlow</p>
		</div>

		<!-- Signup Form -->
		<div class="p-8 rounded-xl" style="background: #000000; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1);">

			{#if form?.success}
				<div class="mb-4 p-3 bg-green-900/20 border border-green-800 rounded text-green-400 text-sm">
					Account created successfully! Redirecting to login...
				</div>
			{/if}

			{#if form?.error}
				<div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
					{form.error}
				</div>
			{/if}

			{#if form?.errors}
				<div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
					<ul class="list-disc list-inside space-y-1">
						{#each form.errors as error}
							<li>{error}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<form method="POST" use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					if (result.type === 'redirect') {
						window.location.href = result.location;
					} else {
						loading = false;
						await update();
					}
				};
			}}>
				<div class="space-y-4">
					<!-- Name -->
					<div>
						<label for="name" class="block text-sm font-medium text-gray-300 mb-2">
							Full Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							disabled={loading}
							class="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
							placeholder="John Doe"
							value={form?.name || ''}
						/>
					</div>

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

					<!-- Password -->
					<div>
						<label for="password" class="block text-sm font-medium text-gray-300 mb-2">
							Password
						</label>
						<div class="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								name="password"
								required
								disabled={loading}
								class="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
								placeholder="••••••••"
							/>
							<button
								type="button"
								on:click={() => showPassword = !showPassword}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
							>
								{showPassword ? '👁️' : '👁️‍🗨️'}
							</button>
						</div>
						<p class="mt-1 text-xs text-gray-500">
							At least 8 characters, with uppercase, lowercase, number, and special character
						</p>
					</div>

					<!-- Confirm Password -->
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
							Confirm Password
						</label>
						<div class="relative">
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								id="confirmPassword"
								name="confirmPassword"
								required
								disabled={loading}
								class="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
								placeholder="••••••••"
							/>
							<button
								type="button"
								on:click={() => showConfirmPassword = !showConfirmPassword}
								class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
							>
								{showConfirmPassword ? '👁️' : '👁️‍🗨️'}
							</button>
						</div>
					</div>

					<!-- Submit Button -->
					<button
						type="submit"
						disabled={loading}
						class="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-orange-500/25"
					>
						{loading ? 'Creating account...' : 'Create Account'}
					</button>
				</div>
			</form>

			<!-- Sign In Link -->
			<div class="mt-6 text-center">
				<p class="text-sm text-gray-400">
					Already have an account?
					<a href="/login" class="text-orange-400 hover:text-orange-300 font-medium">
						Sign in
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
