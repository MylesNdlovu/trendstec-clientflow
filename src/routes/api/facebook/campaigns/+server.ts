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

// POST: Create new campaign with ad set, creative, and ad
export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const body = await event.request.json();

		const {
			name,
			objective,
			callToAction,
			status,
			dailyBudget,
			lifetimeBudget,
			headline,
			description,
			adCopy,
			imageUrl,
			targeting,
			templateId
		} = body;

		// Validate required fields
		if (!name?.trim()) {
			return json({ success: false, error: 'Campaign name is required' }, { status: 400 });
		}

		if (!headline?.trim()) {
			return json({ success: false, error: 'Ad headline is required' }, { status: 400 });
		}

		if (!imageUrl) {
			return json({ success: false, error: 'Ad image is required' }, { status: 400 });
		}

		// Get user's Facebook ad account
		const adAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId: user.id, isConnected: true }
		});

		if (!adAccount) {
			return json({ success: false, error: 'Facebook account not connected' }, { status: 400 });
		}

		if (!adAccount.adAccountId) {
			return json(
				{ success: false, error: 'Facebook ad account ID not found' },
				{ status: 400 }
			);
		}

		// Decrypt access token
		const accessToken = decrypt(adAccount.accessToken);

		console.log('[Create Campaign] Starting campaign creation for user:', user.id);

		// STEP 1: Create Campaign on Facebook
		const campaignResponse = await fetch(
			`https://graph.facebook.com/v19.0/${adAccount.adAccountId}/campaigns`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name,
					objective: objective,
					status: status || 'PAUSED',
					special_ad_categories: [],
					access_token: accessToken
				})
			}
		);

		if (!campaignResponse.ok) {
			const error = await campaignResponse.json();
			console.error('[Create Campaign] Campaign creation failed:', error);
			return json(
				{
					success: false,
					error: error.error?.message || 'Failed to create campaign on Facebook'
				},
				{ status: campaignResponse.status }
			);
		}

		const campaignData = await campaignResponse.json();
		const facebookCampaignId = campaignData.id;
		console.log('[Create Campaign] Campaign created:', facebookCampaignId);

		// STEP 2: Create Ad Set with targeting and budget
		const dailyBudgetCents = dailyBudget ? Math.round(dailyBudget * 100) : null;
		const lifetimeBudgetCents = lifetimeBudget ? Math.round(lifetimeBudget * 100) : null;

		const targetingSpec: any = {
			geo_locations: {
				countries: targeting?.geo_locations?.countries || ['US']
			},
			age_min: targeting?.age_min || 18,
			age_max: targeting?.age_max || 65
		};

		if (targeting?.genders && targeting.genders.length > 0 && targeting.genders.length < 2) {
			targetingSpec.genders = targeting.genders;
		}

		if (targeting?.interests && targeting.interests.length > 0) {
			targetingSpec.interests = targeting.interests;
		}

		const adSetPayload: any = {
			name: `${name} - Ad Set`,
			campaign_id: facebookCampaignId,
			status: status || 'PAUSED',
			billing_event: 'IMPRESSIONS',
			optimization_goal: objective === 'LEAD_GENERATION' ? 'LEAD_GENERATION' : 'LINK_CLICKS',
			targeting: targetingSpec,
			access_token: accessToken
		};

		if (dailyBudgetCents) {
			adSetPayload.daily_budget = dailyBudgetCents;
		} else if (lifetimeBudgetCents) {
			adSetPayload.lifetime_budget = lifetimeBudgetCents;
		} else {
			adSetPayload.daily_budget = 5000; // Default $50/day
		}

		const adSetResponse = await fetch(
			`https://graph.facebook.com/v19.0/${adAccount.adAccountId}/adsets`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(adSetPayload)
			}
		);

		if (!adSetResponse.ok) {
			const error = await adSetResponse.json();
			console.error('[Create Campaign] Ad set creation failed:', error);
			// Clean up campaign
			await fetch(`https://graph.facebook.com/v19.0/${facebookCampaignId}`, {
				method: 'DELETE',
				body: JSON.stringify({ access_token: accessToken })
			});
			return json(
				{ success: false, error: error.error?.message || 'Failed to create ad set' },
				{ status: adSetResponse.status }
			);
		}

		const adSetData = await adSetResponse.json();
		const adSetId = adSetData.id;
		console.log('[Create Campaign] Ad set created:', adSetId);

		// STEP 3: Create Ad Creative
		const objectStorySpec: any = {
			page_id: adAccount.pageId,
			link_data: {
				link: 'https://trendstec-clientflow.vercel.app',
				message: adCopy || '',
				name: headline,
				call_to_action: {
					type: callToAction || 'LEARN_MORE'
				}
			}
		};

		if (description) {
			objectStorySpec.link_data.description = description;
		}

		if (imageUrl) {
			objectStorySpec.link_data.picture = imageUrl;
		}

		const creativePayload = {
			name: `${name} - Creative`,
			object_story_spec: objectStorySpec,
			degrees_of_freedom_spec: {
				creative_features_spec: {
					standard_enhancements: {
						enroll_status: 'OPT_OUT'
					}
				}
			},
			access_token: accessToken
		};

		const creativeResponse = await fetch(
			`https://graph.facebook.com/v19.0/${adAccount.adAccountId}/adcreatives`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(creativePayload)
			}
		);

		if (!creativeResponse.ok) {
			const error = await creativeResponse.json();
			console.error('[Create Campaign] Ad creative creation failed:', error);
			// Clean up
			await fetch(`https://graph.facebook.com/v19.0/${adSetId}`, {
				method: 'DELETE',
				body: JSON.stringify({ access_token: accessToken })
			});
			await fetch(`https://graph.facebook.com/v19.0/${facebookCampaignId}`, {
				method: 'DELETE',
				body: JSON.stringify({ access_token: accessToken })
			});
			return json(
				{ success: false, error: error.error?.message || 'Failed to create ad creative' },
				{ status: creativeResponse.status }
			);
		}

		const creativeData = await creativeResponse.json();
		const creativeId = creativeData.id;
		console.log('[Create Campaign] Ad creative created:', creativeId);

		// STEP 4: Create Ad
		const adPayload = {
			name: `${name} - Ad`,
			adset_id: adSetId,
			creative: { creative_id: creativeId },
			status: status || 'PAUSED',
			access_token: accessToken
		};

		const adResponse = await fetch(
			`https://graph.facebook.com/v19.0/${adAccount.adAccountId}/ads`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(adPayload)
			}
		);

		if (!adResponse.ok) {
			const error = await adResponse.json();
			console.error('[Create Campaign] Ad creation failed:', error);
			// Clean up all
			await fetch(`https://graph.facebook.com/v19.0/${creativeId}`, {
				method: 'DELETE',
				body: JSON.stringify({ access_token: accessToken })
			});
			await fetch(`https://graph.facebook.com/v19.0/${adSetId}`, {
				method: 'DELETE',
				body: JSON.stringify({ access_token: accessToken })
			});
			await fetch(`https://graph.facebook.com/v19.0/${facebookCampaignId}`, {
				method: 'DELETE',
				body: JSON.stringify({ access_token: accessToken })
			});
			return json(
				{ success: false, error: error.error?.message || 'Failed to create ad' },
				{ status: adResponse.status }
			);
		}

		const adData = await adResponse.json();
		const adId = adData.id;
		console.log('[Create Campaign] Ad created:', adId);

		// STEP 5: Save to database
		const campaign = await prisma.adCampaign.create({
			data: {
				userId: user.id,
				adAccountId: adAccount.id,
				fbCampaignId: facebookCampaignId,
				fbAdSetId: adSetId,
				fbAdId: adId,
				name: name,
				objective: objective,
				status: status || 'PAUSED',
				campaignType: 'CAMPAIGN', // Full campaign (Tier 3)
				dailyBudget: dailyBudget || null,
				lifetimeBudget: lifetimeBudget || null,
				adCopy: adCopy || null,
				imageUrl: imageUrl,
				callToAction: callToAction || 'LEARN_MORE',
				targetingData: targeting || {},
				templateId: templateId || null,
				lastSyncAt: new Date()
			}
		});

		// Update template usage count
		if (templateId) {
			await prisma.adTemplate.update({
				where: { id: templateId },
				data: { usageCount: { increment: 1 } }
			});
		}

		console.log('[Create Campaign] Campaign saved to database:', campaign.id);

		return json({
			success: true,
			message: 'Campaign created successfully',
			campaign: {
				id: campaign.id,
				facebookCampaignId: facebookCampaignId,
				name: campaign.name,
				status: campaign.status,
				objective: campaign.objective
			}
		});
	} catch (error: any) {
		console.error('[Create Campaign] Error:', error);
		return json(
			{
				success: false,
				error: 'Failed to create campaign',
				details: error?.message || 'Unknown error'
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
