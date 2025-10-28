import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { decrypt } from '$lib/server/security/encryption';

/**
 * POST /api/facebook/campaigns/sync
 * Sync campaigns from Facebook Marketing API to local database
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		// Get user's Facebook ad account
		const adAccount = await prisma.facebookAdAccount.findUnique({
			where: { userId: locals.user.id }
		});

		if (!adAccount) {
			throw svelteError(404, 'Facebook account not connected');
		}

		if (!adAccount.accessToken) {
			throw svelteError(400, 'No access token available');
		}

		// Decrypt access token
		const tokenData = JSON.parse(adAccount.accessToken);
		const accessToken = decrypt(tokenData);

		// Check if user has ad account (Tier 3)
		if (adAccount.setupTier < 3 || !adAccount.adAccountId) {
			throw svelteError(400, 'Ad account not configured. Please complete Facebook setup.');
		}

		console.log(`[Campaign Sync] Syncing campaigns for ad account: ${adAccount.adAccountId}`);

		// Fetch campaigns from Facebook Marketing API
		const campaignsUrl = `https://graph.facebook.com/v19.0/${adAccount.adAccountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}`;

		const response = await fetch(campaignsUrl);

		if (!response.ok) {
			const error = await response.json();
			console.error('[Campaign Sync] Facebook API error:', error);
			throw svelteError(response.status, error.error?.message || 'Failed to fetch campaigns from Facebook');
		}

		const data = await response.json();
		const fbCampaigns = data.data || [];

		console.log(`[Campaign Sync] Found ${fbCampaigns.length} campaigns on Facebook`);

		// Sync each campaign to database
		const syncedCampaigns = [];
		for (const fbCampaign of fbCampaigns) {
			// Check if campaign already exists
			const existing = await prisma.adCampaign.findFirst({
				where: {
					facebookCampaignId: fbCampaign.id
				}
			});

			if (existing) {
				// Update existing campaign
				const updated = await prisma.adCampaign.update({
					where: { id: existing.id },
					data: {
						name: fbCampaign.name,
						status: fbCampaign.status,
						objective: fbCampaign.objective,
						dailyBudget: fbCampaign.daily_budget ? parseFloat(fbCampaign.daily_budget) / 100 : null,
						lifetimeBudget: fbCampaign.lifetime_budget ? parseFloat(fbCampaign.lifetime_budget) / 100 : null,
						lastSyncedAt: new Date()
					}
				});
				syncedCampaigns.push(updated);
				console.log(`[Campaign Sync] Updated campaign: ${fbCampaign.name}`);
			} else {
				// Create new campaign record
				const created = await prisma.adCampaign.create({
					data: {
						userId: locals.user.id,
						adAccountId: adAccount.id,
						facebookCampaignId: fbCampaign.id,
						name: fbCampaign.name,
						status: fbCampaign.status,
						objective: fbCampaign.objective,
						dailyBudget: fbCampaign.daily_budget ? parseFloat(fbCampaign.daily_budget) / 100 : null,
						lifetimeBudget: fbCampaign.lifetime_budget ? parseFloat(fbCampaign.lifetime_budget) / 100 : null,
						lastSyncedAt: new Date()
					}
				});
				syncedCampaigns.push(created);
				console.log(`[Campaign Sync] Created campaign: ${fbCampaign.name}`);
			}
		}

		console.log(`[Campaign Sync] Sync complete. ${syncedCampaigns.length} campaigns synced`);

		return json({
			success: true,
			synced: syncedCampaigns.length,
			campaigns: syncedCampaigns
		});

	} catch (error) {
		console.error('[Campaign Sync] Error:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to sync campaigns');
	}
};
