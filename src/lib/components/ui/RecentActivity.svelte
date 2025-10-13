<script lang="ts">
	export let activities: any[] = [];

	// Mock activities if none provided
	if (activities.length === 0) {
		activities = [
			{ id: 1, type: 'form_submission', message: 'New lead from contact form', time: '5 minutes ago' },
			{ id: 2, type: 'email_sent', message: 'Welcome email sent to john@example.com', time: '12 minutes ago' },
			{ id: 3, type: 'funnel_view', message: 'Pricing page viewed', time: '18 minutes ago' },
			{ id: 4, type: 'scraping_complete', message: 'Competitor data scraped successfully', time: '1 hour ago' }
		];
	}
</script>

<div class="space-y-3">
	{#each activities as activity}
		<div class="flex items-start space-x-3">
			<div class="flex-shrink-0">
				<div class="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm text-gray-900">{activity.message}</p>
				<p class="text-xs text-gray-500">{activity.time}</p>
			</div>
		</div>
	{/each}
</div>