import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';
import { createFacebookClient } from '$lib/server/facebook-mcp';

// GET: Get billing information for user's ad account
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		// Get user's Facebook ad account
		const account = await prisma.facebookAdAccount.findFirst({
			where: {
				userId: user.id,
				isConnected: true
			}
		});

		if (!account) {
			return json({
				success: false,
				error: 'No connected Facebook account found'
			}, { status: 404 });
		}

		if (!account.adAccountId) {
			return json({
				success: false,
				error: 'Ad account not set up. Please complete setup.'
			}, { status: 400 });
		}

		// Create MCP client and get billing info
		const client = await createFacebookClient(account);
		const billingData = await client.syncBillingStatus();

		if (!billingData.success) {
			return json({
				success: false,
				error: billingData.error
			}, { status: 500 });
		}

		// Update account with latest sync time
		await prisma.facebookAdAccount.update({
			where: { id: account.id },
			data: { lastSyncAt: new Date() }
		});

		return json({
			success: true,
			billing: billingData.billing,
			alerts: billingData.alerts
		});
	} catch (error) {
		console.error('Error fetching billing info:', error);
		return json(
			{ success: false, error: 'Failed to fetch billing information' },
			{ status: 500 }
		);
	}
};
