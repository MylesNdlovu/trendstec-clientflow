<script lang="ts">
	import { page } from '$app/stores';
	import {
		Home,
		Users,
		FormInput,
		Activity,
		Settings,
		Shield
	} from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';

	const navigation = [
		{ name: 'Dashboard', href: '/dashboard', icon: Home },
		{ name: 'Leads', href: '/dashboard/leads', icon: Users },
		{ name: 'Credentials', href: '/dashboard/credentials', icon: Shield },
		{ name: 'Forms', href: '/dashboard/forms', icon: FormInput },
		{ name: 'Integrations', href: '/dashboard/integrations', icon: Activity },
		{ name: 'Settings', href: '/dashboard/settings', icon: Settings }
	];

	$: currentPath = $page.url.pathname;
	$: themeClasses = getThemeClasses($theme);
</script>

<div class="flex flex-col h-full glass-sidebar">
	<!-- Logo -->
	<div class="flex items-center h-16 px-6 border-b border-white/10 bg-black">
		<a href="/dashboard" class="flex items-center">
			<img src="/trendstec-logo.png" alt="TRENDSTEC" class="h-12 w-auto" />
		</a>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
		{#each navigation as item}
			<a
				href={item.href}
				class="nav-item-glass group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 relative z-10 {currentPath === item.href || currentPath.startsWith(item.href + '/')
					? 'active text-white'
					: 'text-gray-300 hover:text-white'}"
			>
				<svelte:component
					this={item.icon}
					class="mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-300 {currentPath === item.href || currentPath.startsWith(item.href + '/')
						? themeClasses.primary
						: 'text-gray-400 group-hover:text-gray-300'}"
				/>
				{item.name}
			</a>
		{/each}
	</nav>

	<!-- User section -->
	<div class="flex-shrink-0 p-4 border-t border-white/10">
		<div class="glass-button flex items-center p-3 rounded-xl">
			<div class="h-8 w-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
				<span class="text-white text-sm font-medium">U</span>
			</div>
			<div class="ml-3">
				<p class="text-white text-sm font-medium">User Account</p>
				<p class="text-gray-400 text-xs">user@example.com</p>
			</div>
		</div>
	</div>
</div>