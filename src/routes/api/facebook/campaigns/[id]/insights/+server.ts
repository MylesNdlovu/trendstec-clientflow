import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler} from './$types';
import { prisma } from '$lib/prisma';
import { decrypt } from '$lib/server/security/encryption';

/**
 * GET /api/facebook/campaigns/:id/insights
 * Fetch campaign performance metrics from Facebook
 */
export const GET: RequestHandler = async ({ params, locals, url }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		const { id } = params;
		const datePreset = url.searchParams.get('date_preset') || 'last_7d'; // last_7d, last_30d, lifetime

		// Get campaign
		const campaign = await prisma.adCampaign.findUnique({
			where: { id },
			include: { adAccount: true }
		});

		if (!campaign) {
			throw svelteError(404, 'Campaign not found');
		}

		// Check ownership
		if (campaign.userId !== locals.user.id) {
			throw svelteError(403, 'You do not own this campaign');
		}

		if (!campaign.facebookCampaignId) {
			throw svelteError(400, 'Campaign not synced with Facebook');
		}

		// Get access token
		if (!campaign.adAccount.accessToken) {
			throw svelteError(400, 'No access token available');
		}

		const tokenData = JSON.parse(campaign.adAccount.accessToken);
		const accessToken = decrypt(tokenData);

		console.log(`[Campaign Insights] Fetching insights for campaign ${campaign.facebookCampaignId}`);

		// Fetch insights from Facebook
		const fields = [
			'impressions',
			'clicks',
			'spend',
			'reach',
			'cpc',
			'cpm',
			'ctr',
			'frequency'
		].join(',');

		const insightsUrl = `https://graph.facebook.com/v19.0/${campaign.facebookCampaignId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`;

		const response = await fetch(insightsUrl);

		if (!response.ok) {
			const error = await response.json();
			console.error('[Campaign Insights] Facebook API error:', error);
			throw svelteError(response.status, error.error?.message || 'Failed to fetch insights from Facebook');
		}

		const data = await response.json();
		const insights = data.data && data.data.length > 0 ? data.data[0] : null;

		if (!insights) {
			// No data yet - campaign might be new or not running
			return json({
				success: true,
				insights: {
					impressions: '0',
					clicks: '0',
					spend: '0',
					reach: '0',
					cpc: '0',
					cpm: '0',
					ctr: '0',
					frequency: '0'
				},
				noData: true
			});
		}

		console.log(`[Campaign Insights] Insights fetched successfully`);

		return json({
			success: true,
			insights,
			datePreset
		});

	} catch (error) {
		console.error('[Campaign Insights] Error:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to fetch campaign insights');
	}
};
