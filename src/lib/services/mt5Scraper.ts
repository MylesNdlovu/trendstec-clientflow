import { PrismaClient } from '@prisma/client';
import { decrypt } from '$lib/utils/encryption';
import { systemeService } from './systemeService';
import { mcpClient } from './mcpClient';

const prisma = new PrismaClient();

interface MT5ScraperResult {
	success: boolean;
	data?: any;
	error?: string;
}

class MT5ScraperService {
	// Removed local MCP client - now using remote mcpClient service

	/**
	 * Get MT5 web URL for a specific broker from settings
	 */
	private async getBrokerMT5Url(brokerName: string): Promise<string> {
		try {
			// Normalize broker name for env var lookup
			const normalizedName = brokerName.toUpperCase().replace(/[\s.-]/g, '_');

			// Try to load from environment first
			const envUrl = process.env[`${normalizedName}_MT5_URL`];
			if (envUrl) {
				console.log(`Using MT5 URL from env for ${brokerName}: ${envUrl}`);
				return envUrl;
			}

			// Load from database settings
			try {
				const settingsResponse = await fetch('http://localhost:5173/api/settings?key=ftd_cpa_settings');
				const settingsResult = await settingsResponse.json();

				if (settingsResult.success && settingsResult.setting) {
					const settings = settingsResult.setting.value;
					if (settings.brokers && settings.brokers[brokerName]) {
						console.log(`Using MT5 URL from settings for ${brokerName}: ${settings.brokers[brokerName].mt5Link}`);
						return settings.brokers[brokerName].mt5Link;
					}
				}
			} catch (settingsError) {
				console.warn('Failed to load settings from database:', settingsError);
			}

			// Fall back to default broker URLs
			const brokerUrls: Record<string, string> = {
				'Prime XBT': process.env.PRIME_XBT_MT5_URL || 'https://mt5.pxbt.com',
			};

			const url = brokerUrls[brokerName] || 'https://mt5.pxbt.com';
			console.log(`Using default MT5 URL for ${brokerName}: ${url}`);
			return url;
		} catch (error) {
			console.warn(`Failed to get broker URL for ${brokerName}, using default:`, error);
			return 'https://mt5.pxbt.com';
		}
	}

	// Removed callMCPTool - now using remote mcpClient.scrapeMT5Account()

	/**
	 * Scrape MT5 account data for a specific investor credential with retry logic
	 * Now using remote MCP server via mcpClient
	 */
	async scrapeAccountData(credentialId: string, retryCount: number = 0): Promise<MT5ScraperResult> {
		const MAX_RETRIES = 2;

		try {
			// Get credential from database
			const credential = await prisma.investorCredential.findUnique({
				where: { id: credentialId },
				include: { lead: true }
			});

			if (!credential) {
				return { success: false, error: 'Credential not found' };
			}

			console.log(`🔄 Scraping MT5 account for login: ${credential.login} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

			// Decrypt password
			const decryptedPassword = decrypt(credential.password);

			// Get broker MT5 URL from settings
			const brokerUrl = await this.getBrokerMT5Url(credential.broker);

			// Use remote MCP client to scrape account
			const scrapeResult = await mcpClient.scrapeMT5Account({
				username: credential.login,
				password: decryptedPassword,
				server: credential.server,
				brokerUrl: brokerUrl
			});

			if (!scrapeResult.success) {
				const errorMsg = scrapeResult.error || 'Scraping failed';
				console.error(`❌ MT5 scraping failed for ${credential.login}: ${errorMsg}`);

				// Retry on certain errors
				if (retryCount < MAX_RETRIES && this.isRetryableError(errorMsg)) {
					console.log(`⏳ Retrying in 5 seconds...`);
					await new Promise(resolve => setTimeout(resolve, 5000));
					return this.scrapeAccountData(credentialId, retryCount + 1);
				}

				// Increment failed attempts for non-retryable errors (invalid credentials)
				const isRetryable = this.isRetryableError(errorMsg);
				await this.updateCredentialScrapingStatus(credentialId, 'failed', errorMsg, !isRetryable);
				return { success: false, error: errorMsg };
			}

			console.log(`✅ MT5 scraping successful for ${credential.login}`);

			const accountData = scrapeResult.data;
			const positions = accountData.positions || [];

			// Update credential with scraped data
			await prisma.investorCredential.update({
				where: { id: credentialId },
				data: {
					balance: accountData.balance,
					equity: accountData.equity,
					margin: accountData.margin,
					freeMargin: accountData.freeMargin,
					marginLevel: accountData.marginLevel,
					profit: accountData.profit,
					lastScrapedAt: new Date(),
					scrapingStatus: 'success',
					scrapingError: null,
					isVerified: true,
					verifiedAt: new Date(),
					failedAttempts: 0 // Reset failed attempts on success
				}
			});

			// Store or update positions
			for (const position of positions) {
				await prisma.mT5Position.upsert({
					where: {
						credentialId_ticket: {
							credentialId: credentialId,
							ticket: position.ticket
						}
					},
					create: {
						credentialId: credentialId,
						ticket: position.ticket,
						symbol: position.symbol,
						type: position.type,
						volume: position.volume,
						openPrice: position.openPrice,
						currentPrice: position.currentPrice,
						profit: position.profit,
						openTime: new Date(position.timestamp),
						isOpen: true
					},
					update: {
						currentPrice: position.currentPrice,
						profit: position.profit,
						updatedAt: new Date()
					}
				});
			}

			// Calculate total volume
			const totalVolume = positions.reduce((sum: number, pos: any) => sum + pos.volume, 0);
			const meetsMinVolume = totalVolume >= 0.2;

			// Update credential volume tracking
			await prisma.investorCredential.update({
				where: { id: credentialId },
				data: {
					totalVolume,
					meetsMinVolume,
					lastTradeAt: positions.length > 0 ? new Date() : undefined
				}
			});

			// Update lead status if needed
			if (credential.leadId) {
				await this.updateLeadStatus(credential.leadId, accountData, totalVolume);
			}

			return {
				success: true,
				data: {
					accountData,
					positions,
					totalVolume,
					meetsMinVolume
				}
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			await this.updateCredentialScrapingStatus(credentialId, 'failed', errorMessage);

			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Scrape all active investor credentials
	 */
	async scrapeAllCredentials(): Promise<{
		total: number;
		successful: number;
		failed: number;
		skipped: number;
		results: MT5ScraperResult[];
	}> {
		// Get all unverified credentials
		const allCredentials = await prisma.investorCredential.findMany({
			where: { isVerified: false }
		});

		// Filter out credentials that have exceeded max failed attempts
		const credentials = allCredentials.filter(
			c => c.failedAttempts < c.maxFailedAttempts
		);

		const skipped = allCredentials.length - credentials.length;

		if (skipped > 0) {
			console.log(`⏭️  Skipping ${skipped} credentials that have exceeded max failed attempts`);
		}

		const results: MT5ScraperResult[] = [];
		let successful = 0;
		let failed = 0;

		for (const credential of credentials) {
			const result = await this.scrapeAccountData(credential.id);
			results.push(result);

			if (result.success) {
				successful++;
			} else {
				failed++;
			}

			// Add delay between scrapes to avoid detection
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		return {
			total: allCredentials.length,
			successful,
			failed,
			skipped,
			results
		};
	}

	/**
	 * Update credential scraping status
	 */
	private async updateCredentialScrapingStatus(
		credentialId: string,
		status: string,
		error?: string,
		incrementFailedAttempts: boolean = false
	): Promise<void> {
		const credential = await prisma.investorCredential.findUnique({
			where: { id: credentialId }
		});

		if (!credential) return;

		const updateData: any = {
			scrapingStatus: status,
			scrapingError: error || null,
			lastScrapedAt: new Date()
		};

		// Increment failed attempts if this is a non-retryable error (invalid credentials)
		if (incrementFailedAttempts) {
			updateData.failedAttempts = credential.failedAttempts + 1;

			if (credential.failedAttempts + 1 >= credential.maxFailedAttempts) {
				console.log(`⛔ Credential ${credential.login} has reached max failed attempts (${credential.maxFailedAttempts}). Will be skipped in future scraping.`);
			}
		}

		await prisma.investorCredential.update({
			where: { id: credentialId },
			data: updateData
		});
	}

	/**
	 * Determine if an error is retryable
	 */
	private isRetryableError(errorMessage: string): boolean {
		const retryableErrors = [
			'timeout',
			'network',
			'connection',
			'ECONNREFUSED',
			'ETIMEDOUT',
			'failed to load',
			'page not found temporarily'
		];

		return retryableErrors.some(err =>
			errorMessage.toLowerCase().includes(err.toLowerCase())
		);
	}

	/**
	 * Update lead status based on trading activity
	 */
	private async updateLeadStatus(
		leadId: string,
		accountData: any,
		totalVolume: number
	): Promise<void> {
		const lead = await prisma.lead.findUnique({ where: { id: leadId } });
		if (!lead) return;

		let newStatus = lead.status;
		const updates: any = {};

		// Check if deposited (has balance)
		if (accountData.balance > 0 && lead.status === 'captured') {
			newStatus = 'deposited';
			updates.depositedAt = new Date();
			updates.status = newStatus;

			// Create activity record
			await prisma.leadActivity.create({
				data: {
					leadId: leadId,
					type: 'deposit',
					description: `Lead deposited $${accountData.balance}`,
					previousValue: lead.status,
					newValue: newStatus,
					amount: accountData.balance
				}
			});
		}

		// Check if trading (has positions or volume)
		if (totalVolume > 0 && ['captured', 'deposited'].includes(lead.status)) {
			newStatus = 'trading';
			updates.tradingStartAt = new Date();
			updates.status = newStatus;

			// Create activity record
			await prisma.leadActivity.create({
				data: {
					leadId: leadId,
					type: 'trade',
					description: `Lead started trading with ${totalVolume} lots`,
					previousValue: lead.status,
					newValue: newStatus,
					amount: totalVolume
				}
			});
		}

		// Check if qualified (meets minimum volume)
		if (totalVolume >= 0.2 && lead.status !== 'qualified') {
			newStatus = 'qualified';
			updates.qualifiedAt = new Date();
			updates.status = newStatus;

			// Create activity record
			await prisma.leadActivity.create({
				data: {
					leadId: leadId,
					type: 'qualification',
					description: `Lead qualified with ${totalVolume} lots`,
					previousValue: lead.status,
					newValue: newStatus,
					amount: totalVolume
				}
			});
		}

		// Update lead if status changed
		if (Object.keys(updates).length > 0) {
			await prisma.lead.update({
				where: { id: leadId },
				data: updates
			});
		}

		// Sync status to Systeme.io tags
		await this.syncLeadStatusToSysteme(lead, accountData, totalVolume);
	}

	/**
	 * Sync lead status to Systeme.io tags after scraping
	 */
	private async syncLeadStatusToSysteme(
		lead: any,
		accountData: any,
		totalVolume: number
	): Promise<void> {
		// Only sync if lead has email and came from Systeme.io
		if (!lead.email || lead.source !== 'systeme.io') {
			console.log(`⏭️  Skipping Systeme.io sync for ${lead.email || 'unknown'} (source: ${lead.source})`);
			return;
		}

		try {
			// Get total trades count from positions
			// Fix: Need to get credentials first, then count their positions
			const credentials = await prisma.investorCredential.findMany({
				where: {
					leadId: lead.id
				},
				select: {
					id: true
				}
			});

			const credentialIds = credentials.map(c => c.id);

			const positionsCount = await prisma.mT5Position.count({
				where: {
					credentialId: {
						in: credentialIds
					}
				}
			});

			const hasDeposited = accountData.balance > 0;
			const isTrading = totalVolume > 0;
			const isQualified = totalVolume >= 0.2;

			console.log(`🔄 Syncing status to Systeme.io for ${lead.email}:`, {
				hasDeposited,
				isTrading,
				isQualified,
				balance: accountData.balance,
				volume: totalVolume,
				trades: positionsCount
			});

			// Update Systeme.io tags
			const result = await systemeService.updateLeadStatusTags(lead.email, {
				hasDeposited,
				isTrading,
				isQualified,
				balance: accountData.balance,
				totalVolume,
				totalTrades: positionsCount
			});

			if (result.success) {
				console.log(`✅ Systeme.io tags synced successfully for ${lead.email}`);
			} else {
				console.error(`❌ Failed to sync Systeme.io tags for ${lead.email}:`, result.error);
			}

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`❌ Error syncing to Systeme.io for ${lead.email}:`, errorMessage);
			// Don't throw - scraping should continue even if Systeme.io sync fails
		}
	}
}

export const mt5Scraper = new MT5ScraperService();
