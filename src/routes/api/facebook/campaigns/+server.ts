import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import { FacebookAPI } from '$lib/server/facebook-api';
import prisma from '$lib/config/database';
import { decrypt } from '$lib/server/security/encryption';
import { MetaAdsService } from '$lib/server/meta-ads-service-stub';

// GET: Get user's ad campaigns with live Meta Ads data
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		// Fetch live campaigns from Meta Ads API
		const fbAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId: user.id, isConnected: true }
		});

		if (!fbAccount || !fbAccount.accessToken) {
			return json({ success: false, error: 'No connected Facebook account' }, { status: 404 });
		}

		const accessToken = decrypt(fbAccount.accessToken);
		const campaignsData = await FacebookAPI.getCampaigns(fbAccount.adAccountId!, accessToken);
		const campaigns = campaignsData.data || [];

		return json({
			success: true,
			campaigns
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error fetching campaigns:', errorMessage);

		return json(
			{
				success: false,
				error: 'Failed to fetch campaigns',
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};

// POST: Create new campaign
export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const body = await event.request.json();

		const { name, objective, dailyBudget, lifetimeBudget, status } = body;

		if (!name || !objective) {
			return json(
				{ success: false, error: 'Name and objective are required' },
				{ status: 400 }
			);
		}

		// Create campaign via Meta Ads API
		const campaign = await MetaAdsService.createCampaign(user.id, {
			name,
			objective,
			dailyBudget,
			lifetimeBudget,
			status: status || 'PAUSED'
		});

		return json({
			success: true,
			campaign
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error creating campaign:', errorMessage);

		return json(
			{
				success: false,
				error: 'Failed to create campaign',
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};

// PATCH: Update campaign status
export const PATCH: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const body = await event.request.json();

		const { campaignId, status } = body;

		if (!campaignId || !status) {
			return json(
				{ success: false, error: 'Campaign ID and status are required' },
				{ status: 400 }
			);
		}

		// Update campaign status via Meta Ads API
		const result = await MetaAdsService.updateCampaignStatus(user.id, campaignId, status);

		return json({
			success: true,
			...result
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Error updating campaign:', errorMessage);

		return json(
			{
				success: false,
				error: 'Failed to update campaign',
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};
