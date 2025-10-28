import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { decrypt } from '$lib/server/security/encryption';

/**
 * PATCH /api/facebook/campaigns/:id
 * Update campaign status (pause/resume)
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		const { id } = params;
		const { action } = await request.json();

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

		// Determine new status
		let newStatus = campaign.status;
		if (action === 'pause') {
			newStatus = 'PAUSED';
		} else if (action === 'resume') {
			newStatus = 'ACTIVE';
		} else {
			throw svelteError(400, 'Invalid action. Use "pause" or "resume"');
		}

		console.log(`[Campaign Action] ${action} campaign ${campaign.facebookCampaignId}`);

		// Update on Facebook
		const fbResponse = await fetch(
			`https://graph.facebook.com/v19.0/${campaign.facebookCampaignId}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: newStatus,
					access_token: accessToken
				})
			}
		);

		if (!fbResponse.ok) {
			const error = await fbResponse.json();
			console.error('[Campaign Action] Facebook API error:', error);
			throw svelteError(fbResponse.status, error.error?.message || 'Failed to update campaign on Facebook');
		}

		// Update in database
		const updated = await prisma.adCampaign.update({
			where: { id },
			data: {
				status: newStatus,
				lastSyncedAt: new Date()
			}
		});

		console.log(`[Campaign Action] Campaign ${action}d successfully`);

		return json({
			success: true,
			campaign: updated
		});

	} catch (error) {
		console.error('[Campaign Action] Error:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to update campaign');
	}
};

/**
 * DELETE /api/facebook/campaigns/:id
 * Delete campaign from Facebook and database
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		const { id } = params;

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
			// If not synced with Facebook, just delete from database
			await prisma.adCampaign.delete({ where: { id } });
			return json({ success: true });
		}

		// Get access token
		if (!campaign.adAccount.accessToken) {
			throw svelteError(400, 'No access token available');
		}

		const tokenData = JSON.parse(campaign.adAccount.accessToken);
		const accessToken = decrypt(tokenData);

		console.log(`[Campaign Delete] Deleting campaign ${campaign.facebookCampaignId}`);

		// Delete from Facebook
		const fbResponse = await fetch(
			`https://graph.facebook.com/v19.0/${campaign.facebookCampaignId}?access_token=${accessToken}`,
			{ method: 'DELETE' }
		);

		if (!fbResponse.ok) {
			const error = await fbResponse.json();
			console.error('[Campaign Delete] Facebook API error:', error);
			// Continue to delete from database even if Facebook delete fails
		}

		// Delete from database
		await prisma.adCampaign.delete({ where: { id } });

		console.log(`[Campaign Delete] Campaign deleted successfully`);

		return json({ success: true });

	} catch (error) {
		console.error('[Campaign Delete] Error:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to delete campaign');
	}
};
