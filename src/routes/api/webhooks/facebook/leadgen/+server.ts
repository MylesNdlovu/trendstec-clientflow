import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { decrypt } from '$lib/server/security/encryption';
import crypto from 'crypto';

/**
 * Facebook Lead Ads Webhook
 * Receives real-time notifications when leads are submitted
 *
 * Setup:
 * 1. Go to Facebook App Dashboard > Webhooks
 * 2. Subscribe to 'leadgen' events
 * 3. Set webhook URL: https://your-domain.com/api/webhooks/facebook/leadgen
 * 4. Set verify token: FACEBOOK_WEBHOOK_VERIFY_TOKEN from env
 */

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'trendstec_webhook_token';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

/**
 * GET - Webhook Verification
 * Facebook sends this to verify webhook ownership
 */
export const GET: RequestHandler = async ({ url }) => {
	const mode = url.searchParams.get('hub.mode');
	const token = url.searchParams.get('hub.verify_token');
	const challenge = url.searchParams.get('hub.challenge');

	console.log('[Facebook Webhook] Verification request:', { mode, token: token ? 'present' : 'missing' });

	// Check if a token and mode were sent
	if (mode && token) {
		// Check the mode and token sent are correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {
			// Respond with 200 OK and challenge token from the request
			console.log('[Facebook Webhook] Verification successful!');
			return new Response(challenge, { status: 200 });
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			console.error('[Facebook Webhook] Verification failed - token mismatch');
			return new Response('Forbidden', { status: 403 });
		}
	}

	return new Response('Bad Request', { status: 400 });
};

/**
 * POST - Receive Lead Notifications
 * Facebook sends this when a lead is submitted
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.text();
		const signature = request.headers.get('x-hub-signature-256');

		console.log('[Facebook Webhook] Received webhook');

		// Verify webhook signature for security
		if (APP_SECRET && signature) {
			const expectedSignature = 'sha256=' + crypto
				.createHmac('sha256', APP_SECRET)
				.update(body)
				.digest('hex');

			if (signature !== expectedSignature) {
				console.error('[Facebook Webhook] Invalid signature');
				return json({ error: 'Invalid signature' }, { status: 401 });
			}
		}

		const data = JSON.parse(body);

		console.log('[Facebook Webhook] Parsed data:', JSON.stringify(data, null, 2));

		// Facebook sends test events during setup
		if (data.object === 'test') {
			console.log('[Facebook Webhook] Test event received');
			return json({ success: true, message: 'Test event received' });
		}

		// Process lead generation events
		if (data.object === 'page') {
			for (const entry of data.entry || []) {
				for (const change of entry.changes || []) {
					if (change.field === 'leadgen') {
						await processLeadgenEvent(change.value);
					}
				}
			}
		}

		// Always return 200 OK to Facebook
		return json({ success: true });
	} catch (error: any) {
		console.error('[Facebook Webhook] Error processing webhook:', error);
		// Still return 200 to prevent Facebook from retrying
		return json({ success: false, error: error.message }, { status: 200 });
	}
};

/**
 * Process a leadgen event
 */
async function processLeadgenEvent(value: any) {
	const { leadgen_id, form_id, ad_id, adgroup_id, created_time, page_id } = value;

	console.log('[Facebook Webhook] Processing lead:', {
		leadgen_id,
		form_id,
		ad_id,
		adgroup_id,
		page_id
	});

	try {
		// Find which user owns this ad based on ad_id or adgroup_id (ad set)
		const campaign = await prisma.adCampaign.findFirst({
			where: {
				OR: [
					{ fbAdId: ad_id },
					{ fbAdSetId: adgroup_id }
				]
			},
			include: {
				user: true,
				adAccount: true
			}
		});

		if (!campaign) {
			console.error('[Facebook Webhook] No campaign found for ad:', { ad_id, adgroup_id });
			// Still save the lead, but without user assignment
			await saveLeadWithoutCampaign(leadgen_id, form_id, page_id);
			return;
		}

		console.log('[Facebook Webhook] Found campaign:', campaign.name, 'for user:', campaign.user?.email);

		// Get access token for this user
		const tokenData = JSON.parse(campaign.adAccount.accessToken);
		const accessToken = decrypt(tokenData);

		// Fetch full lead data from Facebook
		const leadData = await fetchLeadData(leadgen_id, accessToken);

		if (!leadData) {
			console.error('[Facebook Webhook] Failed to fetch lead data');
			return;
		}

		// Extract field values
		const fields = leadData.field_data || [];
		const email = fields.find((f: any) => f.name === 'email' || f.name === 'EMAIL')?.values?.[0];
		const firstName = fields.find((f: any) => f.name === 'first_name' || f.name === 'FIRST_NAME')?.values?.[0];
		const lastName = fields.find((f: any) => f.name === 'last_name' || f.name === 'LAST_NAME')?.values?.[0];
		const phone = fields.find((f: any) => f.name === 'phone' || f.name === 'PHONE' || f.name === 'phone_number')?.values?.[0];

		console.log('[Facebook Webhook] Lead data:', { email, firstName, lastName, phone });

		// Save lead to database
		const lead = await prisma.lead.create({
			data: {
				userId: campaign.userId,
				email: email || null,
				firstName: firstName || null,
				lastName: lastName || null,
				phone: phone || null,
				source: 'facebook_leadgen',
				status: 'captured',
				leadType: 'trader',
				webhookData: JSON.stringify({
					leadgen_id,
					form_id,
					ad_id,
					adgroup_id,
					campaign_id: campaign.id,
					campaign_name: campaign.name,
					field_data: fields,
					created_time
				}),
				leadCapturedAt: created_time ? new Date(parseInt(created_time) * 1000) : new Date()
			}
		});

		console.log('[Facebook Webhook] Lead saved:', lead.id);

		// Create activity log
		await prisma.leadActivity.create({
			data: {
				leadId: lead.id,
				activityType: 'lead_captured',
				description: `Lead captured from Facebook ad: ${campaign.name}`,
				metadata: JSON.stringify({ source: 'facebook_webhook', campaign_id: campaign.id })
			}
		});

		// TODO: Trigger follow-up actions
		// - Send welcome email
		// - Sync to Systeme.io
		// - Send Slack notification
		// - Trigger automated follow-up sequence

		console.log('[Facebook Webhook] Lead processing complete');
	} catch (error: any) {
		console.error('[Facebook Webhook] Error processing lead:', error);
		throw error;
	}
}

/**
 * Fetch full lead data from Facebook Graph API
 */
async function fetchLeadData(leadgenId: string, accessToken: string) {
	try {
		const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`;
		const response = await fetch(url);

		if (!response.ok) {
			const error = await response.json();
			console.error('[Facebook Webhook] Failed to fetch lead:', error);
			return null;
		}

		const data = await response.json();
		return data;
	} catch (error: any) {
		console.error('[Facebook Webhook] Error fetching lead data:', error);
		return null;
	}
}

/**
 * Save lead without campaign assignment (fallback)
 */
async function saveLeadWithoutCampaign(leadgenId: string, formId: string, pageId: string) {
	console.log('[Facebook Webhook] Saving orphaned lead');

	// We can't fetch lead data without an access token
	// Just log it for manual review
	await prisma.lead.create({
		data: {
			email: null,
			firstName: null,
			lastName: null,
			source: 'facebook_leadgen_orphaned',
			status: 'captured',
			leadType: 'trader',
			webhookData: JSON.stringify({
				leadgen_id: leadgenId,
				form_id: formId,
				page_id: pageId,
				note: 'Orphaned lead - no matching campaign found'
			})
		}
	});

	console.log('[Facebook Webhook] Orphaned lead saved for manual review');
}
