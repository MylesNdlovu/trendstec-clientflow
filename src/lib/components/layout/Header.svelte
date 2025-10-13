<script lang="ts">
	import { Bell, Search, User } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/ui/ThemeToggle.svelte';
</script>

<header class="bg-black border-b border-gray-800 sticky top-0 z-40">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<!-- Title and Search -->
			<div class="flex items-center flex-1 space-x-6 bg-black">
				<!-- Client Flow Title -->
				<a href="/dashboard" class="flex items-center px-3 py-2 bg-black">
					<h1 class="text-xl font-bold text-white">Client Flow</h1>
				</a>

				<!-- Search -->
				<div class="max-w-lg w-full lg:max-w-xs">
					<label for="search" class="sr-only">Search</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="search"
							name="search"
							class="block w-full pl-10 pr-3 py-2 leading-5 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
							placeholder="Search..."
							type="search"
						/>
					</div>
				</div>
			</div>

			<!-- Right side -->
			<div class="flex items-center space-x-4">
				<!-- Theme Toggle -->
				<ThemeToggle />

				<!-- Notifications -->
				<button
					type="button"
					class="glass-button p-2 rounded-xl text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
				>
					<span class="sr-only">View notifications</span>
					<Bell class="h-5 w-5" />
				</button>

				<!-- Profile dropdown -->
				<div class="relative">
					<button
						type="button"
						class="glass-button flex items-center p-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
					>
						<span class="sr-only">Open user menu</span>
						<div class="h-8 w-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center">
							<User class="h-4 w-4 text-white" />
						</div>
					</button>
				</div>
			</div>
		</div>
	</div>
</header>