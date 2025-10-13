<script lang="ts">
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/auth';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import { onMount } from 'svelte';

	export let data;

	onMount(() => {
		// Initialize user store with server data
		userStore.set(data.user);
	});
</script>

<div class="min-h-screen bg-black flex">
	<!-- Sidebar -->
	<div class="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
		<Sidebar />
	</div>

	<!-- Main content -->
	<div class="flex-1 lg:ml-64">
		<!-- Header -->
		<Header />

		<!-- Page content -->
		<main class="py-6 bg-black">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-black">
				<slot />
			</div>
		</main>
	</div>
</div>

<style>
	/* Add any global dashboard styles here */
</style>