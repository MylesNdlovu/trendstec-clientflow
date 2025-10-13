import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Mock dashboard metrics data
	const metrics = {
		totalRevenue: 47382,
		totalLeads: 2847,
		conversionRate: 7.2,
		activeFunnels: 12
	};

	const chartData = [
		{ date: '2024-01-01', revenue: 12000 },
		{ date: '2024-02-01', revenue: 15000 },
		{ date: '2024-03-01', revenue: 18000 },
		{ date: '2024-04-01', revenue: 21000 },
		{ date: '2024-05-01', revenue: 25000 }
	];

	const recentActivities = [
		{
			id: 1,
			type: 'form_submission',
			message: 'New lead from contact form',
			time: '5 minutes ago'
		},
		{
			id: 2,
			type: 'email_sent',
			message: 'Welcome email sent to john@example.com',
			time: '12 minutes ago'
		},
		{
			id: 3,
			type: 'funnel_view',
			message: 'Pricing page viewed',
			time: '18 minutes ago'
		},
		{
			id: 4,
			type: 'scraping_complete',
			message: 'Competitor data scraped successfully',
			time: '1 hour ago'
		}
	];

	return json({
		metrics,
		chartData,
		recentActivities
	});
};