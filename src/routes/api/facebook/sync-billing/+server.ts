import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/config/database';
import { createFacebookClient } from '$lib/server/facebook-mcp';

/**
 * Background job to sync billing for all connected accounts
 * This should be called by a cron job
 */
export const POST: RequestHandler = async () => {
	try {
		console.log('Starting billing sync for all Facebook ad accounts...');

		// Get all connected accounts
		const accounts = await prisma.facebookAdAccount.findMany({
			where: {
				isConnected: true,
				adAccountId: { not: null }
			}
		});

		const results = [];

		for (const account of accounts) {
			try {
				const client = await createFacebookClient(account);
				const billingData = await client.syncBillingStatus();

				if (billingData.success) {
					// Update last sync time
					await prisma.facebookAdAccount.update({
						where: { id: account.id },
						data: { lastSyncAt: new Date() }
					});

					// Check for alerts and trigger Systeme.io workflows if needed
					if (billingData.alerts && billingData.alerts.length > 0) {
						await handleBillingAlerts(account.userId, billingData.alerts);
					}

					results.push({
						accountId: account.id,
						success: true,
						billing: billingData.billing
					});
				} else {
					results.push({
						accountId: account.id,
						success: false,
						error: billingData.error
					});
				}
			} catch (error: any) {
				console.error(`Error syncing account ${account.id}:`, error);
				results.push({
					accountId: account.id,
					success: false,
					error: error.message
				});
			}
		}

		console.log(`Billing sync completed for ${accounts.length} accounts`);

		return json({
			success: true,
			syncedAccounts: accounts.length,
			results
		});
	} catch (error) {
		console.error('Billing sync error:', error);
		return json(
			{ success: false, error: 'Failed to sync billing' },
			{ status: 500 }
		);
	}
};

async function handleBillingAlerts(userId: string, alerts: string[]) {
	// TODO: Integrate with Systeme.io to trigger workflows
	// For now, just log the alerts
	console.log(`Billing alerts for user ${userId}:`, alerts);

	// Example: Trigger low balance alert in Systeme.io
	// const systemeService = getSy stemeService();
	// await systemeService.addTagsToContact(userEmail, ['Low_Ad_Balance']);
}
