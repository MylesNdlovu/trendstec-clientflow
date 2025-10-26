/**
 * Meta Ads Sync Scheduler
 *
 * Daily cron job to sync IB ad spend from Meta Ads API
 * Tracks spend, impressions, clicks, leads for commission calculations
 */

import { MetaAdsService } from '../server/meta-ads-service.server';
import prisma from '../config/database';

export class MetaAdsSyncScheduler {
	private static isRunning = false;
	private static intervalId: NodeJS.Timeout | null = null;

	/**
	 * Start the daily sync scheduler
	 * Runs every 24 hours at midnight UTC
	 */
	static start() {
		if (this.intervalId) {
			console.log('⚠️  Meta Ads sync scheduler already running');
			return;
		}

		console.log('🚀 Starting Meta Ads sync scheduler (daily at midnight UTC)');

		// Run immediately on startup
		this.runSyncJob();

		// Then run every 24 hours
		const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
		this.intervalId = setInterval(() => {
			this.runSyncJob();
		}, TWENTY_FOUR_HOURS);
	}

	/**
	 * Stop the scheduler
	 */
	static stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			console.log('🛑 Meta Ads sync scheduler stopped');
		}
	}

	/**
	 * Run sync job for all connected IB accounts
	 */
	private static async runSyncJob() {
		if (this.isRunning) {
			console.log('⏭️  Meta Ads sync job already running, skipping...');
			return;
		}

		this.isRunning = true;
		const startTime = Date.now();

		console.log('🤖 Starting Meta Ads sync job at', new Date().toISOString());

		try {
			// Get all users with connected Facebook Ad Accounts
			const connectedAccounts = await prisma.facebookAdAccount.findMany({
				where: {
					isConnected: true,
					adAccountId: { not: null }
				},
				select: {
					userId: true,
					adAccountId: true,
					user: {
						select: {
							email: true,
							name: true
						}
					}
				}
			});

			console.log(`📊 Found ${connectedAccounts.length} connected ad accounts to sync`);

			const results = {
				total: connectedAccounts.length,
				successful: 0,
				failed: 0,
				errors: [] as Array<{ userId: string; error: string }>
			};

			// Sync each account
			for (const account of connectedAccounts) {
				try {
					console.log(`  ↳ Syncing ad spend for user: ${account.user?.email || account.userId}`);

					const syncResult = await MetaAdsService.syncAdSpend(account.userId);

					console.log(
						`    ✅ Synced: $${syncResult.totalSpend.toFixed(2)} | ${syncResult.campaigns} campaigns`
					);

					results.successful++;

					// Check for spending alerts
					await MetaAdsService.checkSpendingAlerts(account.userId);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					console.error(`    ❌ Failed to sync user ${account.userId}:`, errorMessage);

					results.failed++;
					results.errors.push({
						userId: account.userId,
						error: errorMessage
					});
				}
			}

			const duration = ((Date.now() - startTime) / 1000).toFixed(2);

			console.log(
				`✅ Meta Ads sync job completed in ${duration}s:`,
				`${results.successful} successful, ${results.failed} failed`
			);

			if (results.errors.length > 0) {
				console.log('Errors:', results.errors);
			}

			return results;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error('❌ Meta Ads sync job failed:', errorMessage);
			throw error;
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Manually trigger sync job
	 */
	static async triggerSync() {
		console.log('🔄 Manually triggering Meta Ads sync job');
		return await this.runSyncJob();
	}

	/**
	 * Calculate monthly commissions for all IBs
	 * Run this at the end of each month
	 */
	static async calculateMonthlyCommissions(month?: Date) {
		const targetMonth = month || new Date();

		console.log('💰 Calculating monthly ad spend commissions for', targetMonth.toISOString());

		try {
			// Get all users with ad accounts
			const users = await prisma.facebookAdAccount.findMany({
				where: { isConnected: true },
				select: { userId: true }
			});

			const results = {
				total: users.length,
				successful: 0,
				totalCommissions: 0
			};

			for (const { userId } of users) {
				try {
					const commission = await MetaAdsService.calculateAdSpendCommission(userId, targetMonth);

					results.successful++;
					results.totalCommissions += commission.commission;

					console.log(
						`  ✅ User ${userId}: $${commission.adSpend.toFixed(2)} spend → $${commission.commission.toFixed(2)} commission`
					);
				} catch (error) {
					console.error(`  ❌ Failed to calculate commission for user ${userId}:`, error);
				}
			}

			console.log(
				`✅ Monthly commission calculation complete: $${results.totalCommissions.toFixed(2)} total`
			);

			return results;
		} catch (error) {
			console.error('❌ Monthly commission calculation failed:', error);
			throw error;
		}
	}
}
