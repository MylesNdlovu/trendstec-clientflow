import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import { FacebookAPI } from '$lib/server/facebook-api';
import prisma from '$lib/config/database';
import { decrypt } from '$lib/server/security/encryption';
import { MetaAdsService } from '$lib/server/meta-ads-service-stub';

// GET: Get user's ad spend statistics from Meta Ads API
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const url = new URL(event.request.url);
		const days = parseInt(url.searchParams.get('days') || '30');

		// Get live ad spend stats from Meta Ads API
		const stats = await MetaAdsService.getAdSpendStats(user.id, days);

		// Calculate today and month stats from history
		const today = stats.history[0] || { spend: 0, leads: 0 };

		// Get current month stats
		const now = new Date();
		const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthHistory = stats.history.filter((day) => new Date(day.date) >= firstDayOfMonth);

		const monthSpend = monthHistory.reduce((sum, day) => sum + day.spend, 0);
		const monthLeads = monthHistory.reduce((sum, day) => sum + day.leads, 0);

		return json({
			success: true,
			stats: {
				today: today.spend,
				month: monthSpend,
				totalLeads: monthLeads,
				avgCpl: monthLeads > 0 ? monthSpend / monthLeads : 0,
				// Additional detailed stats
				period: stats.period,
				totalImpressions: stats.totalImpressions,
				totalClicks: stats.totalClicks,
				avgCpc: stats.avgCpc,
				ctr: stats.ctr,
				dailyAverage: stats.dailyAverage,
				history: stats.history
			}
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error fetching stats:', errorMessage);

		// Return empty stats if not connected yet
		return json({
			success: true,
			stats: {
				today: 0,
				month: 0,
				totalLeads: 0,
				avgCpl: 0,
				totalImpressions: 0,
				totalClicks: 0,
				avgCpc: 0,
				ctr: 0,
				dailyAverage: 0,
				history: []
			}
		});
	}
};

// POST: Manually sync ad spend from Meta Ads API
export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		// Sync today's ad spend from Meta Ads API
		const result = await MetaAdsService.syncAdSpend(user.id);

		return json({
			success: true,
			message: 'Ad spend synced successfully',
			...result
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error syncing ad spend:', errorMessage);

		return json(
			{
				success: false,
				error: 'Failed to sync ad spend',
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};
