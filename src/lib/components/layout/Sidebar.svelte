<script lang="ts">
	import { page } from '$app/stores';
	import {
		Home,
		Users,
		FormInput,
		Activity,
		Settings,
		Shield,
		LogOut,
		UserCog,
		Zap,
		TrendingUp,
		FileText,
		RefreshCw
	} from 'lucide-svelte';
	import { theme, getThemeClasses } from '$lib/stores/theme';

	$: currentPath = $page.url.pathname;
	$: themeClasses = getThemeClasses($theme);
	$: user = $page.data.user;
	$: isAdmin = user && user.role === 'ADMIN';

	const navigation = [
		{ name: 'Dashboard', href: '/dashboard', icon: Home, requiresAdmin: false },
		{ name: 'Leads', href: '/dashboard/leads', icon: Users, requiresAdmin: false },
		{ name: 'Ads', href: '/dashboard/ads', icon: TrendingUp, requiresAdmin: false },
		{ name: 'Ad Templates', href: '/dashboard/ads/templates', icon: FileText, requiresAdmin: false },
		{ name: 'Credentials', href: '/dashboard/credentials', icon: Shield, requiresAdmin: false },
		{ name: 'Forms', href: '/dashboard/forms', icon: FormInput, requiresAdmin: false },
		{ name: 'Integrations', href: '/dashboard/integrations', icon: Activity, requiresAdmin: false },
		{ name: 'Settings', href: '/dashboard/settings', icon: Settings, requiresAdmin: false },
		{ name: '— Admin Only —', href: '#', icon: Shield, requiresAdmin: true, isSection: true },
		{ name: 'User Management', href: '/dashboard/admin/users', icon: UserCog, requiresAdmin: true },
		{ name: 'Ad Template Manager', href: '/dashboard/admin/templates', icon: FileText, requiresAdmin: true },
		{ name: 'Reseed Templates', href: '/dashboard/admin/reseed-templates', icon: RefreshCw, requiresAdmin: true },
		{ name: 'Systeme.io Setup', href: '/dashboard/admin/systeme-setup', icon: Zap, requiresAdmin: true }
	];

	$: visibleNavigation = navigation.filter(item => !item.requiresAdmin || isAdmin);
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
		{#each visibleNavigation as item}
			{#if item.isSection}
				<!-- Section Header -->
				<div class="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
					{item.name}
				</div>
			{:else}
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
			{/if}
		{/each}
	</nav>

	<!-- Logout Button -->
	<div class="flex-shrink-0 p-4 border-t border-white/10">
		<a
			href="/logout"
			class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl transition-all shadow-lg"
		>
			<LogOut class="h-5 w-5 mr-2" />
			Logout
		</a>
	</div>
</div>