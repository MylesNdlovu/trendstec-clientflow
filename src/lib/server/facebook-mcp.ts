/**
 * Facebook Ads MCP Server Integration
 * Uses Meta Ads MCP for campaign management and billing tracking
 */

import { decrypt } from '$lib/server/security/encryption';

interface FacebookAccount {
	accessToken: string;
	adAccountId?: string;
	pageId?: string;
	businessId?: string;
}

/**
 * Meta Ads MCP Client
 * Note: This is a placeholder for the actual MCP server integration
 * You'll need to install: npm install @pipeboard/meta-ads-mcp
 */
class FacebookMCPClient {
	private accessToken: string;
	private adAccountId?: string;

	constructor(account: FacebookAccount) {
		this.accessToken = account.accessToken;
		this.adAccountId = account.adAccountId;
	}

	/**
	 * Get ad account billing information
	 */
	async getBillingInfo() {
		try {
			const response = await fetch(
				`https://graph.facebook.com/v19.0/${this.adAccountId}?` +
				`fields=account_status,balance,amount_spent,currency,spend_cap,funding_source_details` +
				`&access_token=${this.accessToken}`
			);

			const data = await response.json();

			return {
				success: true,
				billing: {
					accountStatus: data.account_status,
					balance: parseFloat(data.balance) / 100, // Convert cents to dollars
					amountSpent: parseFloat(data.amount_spent) / 100,
					currency: data.currency,
					spendCap: data.spend_cap ? parseFloat(data.spend_cap) / 100 : null,
					fundingSource: data.funding_source_details
				}
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Get campaign insights (performance data)
	 */
	async getCampaignInsights(campaignId: string, dateRange?: { since: string; until: string }) {
		try {
			const params = new URLSearchParams({
				access_token: this.accessToken,
				fields: 'spend,impressions,clicks,actions,action_values,ctr,cpc,cpm',
				level: 'campaign'
			});

			if (dateRange) {
				params.append('time_range', JSON.stringify({
					since: dateRange.since,
					until: dateRange.until
				}));
			}

			const response = await fetch(
				`https://graph.facebook.com/v19.0/${campaignId}/insights?${params}`
			);

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error.message);
			}

			const insights = data.data[0] || {};

			return {
				success: true,
				insights: {
					spend: parseFloat(insights.spend || 0),
					impressions: parseInt(insights.impressions || 0),
					clicks: parseInt(insights.clicks || 0),
					ctr: parseFloat(insights.ctr || 0),
					cpc: parseFloat(insights.cpc || 0),
					cpm: parseFloat(insights.cpm || 0),
					leads: this.extractLeads(insights.actions),
					conversions: this.extractConversions(insights.actions)
				}
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Create a boosted post (Tier 1)
	 */
	async boostPost(postId: string, targeting: any, budget: number) {
		try {
			const response = await fetch(
				`https://graph.facebook.com/v19.0/${postId}/promotions`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						access_token: this.accessToken,
						ad_account_id: this.adAccountId,
						budget_rebalance_flag: true,
						targeting: targeting,
						bid_amount: budget * 100, // Convert to cents
						currency: 'USD'
					})
				}
			);

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error.message);
			}

			return {
				success: true,
				promotionId: data.id
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Sync billing status and update spend tracking
	 */
	async syncBillingStatus() {
		try {
			const billing = await this.getBillingInfo();

			if (!billing.success) {
				return billing;
			}

			return {
				success: true,
				billing: billing.billing,
				alerts: this.checkBillingAlerts(billing.billing)
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Extract lead count from actions array
	 */
	private extractLeads(actions: any[]): number {
		if (!actions) return 0;

		const leadAction = actions.find(
			(a: any) => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead'
		);

		return parseInt(leadAction?.value || 0);
	}

	/**
	 * Extract conversion count from actions array
	 */
	private extractConversions(actions: any[]): number {
		if (!actions) return 0;

		const conversionAction = actions.find(
			(a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
			           a.action_type === 'purchase'
		);

		return parseInt(conversionAction?.value || 0);
	}

	/**
	 * Check for billing alerts (low balance, spend cap reached, etc.)
	 */
	private checkBillingAlerts(billing: any): string[] {
		const alerts: string[] = [];

		if (billing.accountStatus !== 1) {
			alerts.push('Account is not active. Please check your payment method.');
		}

		if (billing.spendCap && billing.amountSpent >= billing.spendCap * 0.9) {
			alerts.push('You are approaching your spend cap limit.');
		}

		if (billing.balance < 0 && Math.abs(billing.balance) > 100) {
			alerts.push('Your account has a negative balance. Please add funds.');
		}

		return alerts;
	}
}

/**
 * Create Facebook MCP client from database account
 */
export async function createFacebookClient(encryptedAccount: any): Promise<FacebookMCPClient> {
	const accessToken = decrypt(encryptedAccount.accessToken);

	return new FacebookMCPClient({
		accessToken,
		adAccountId: encryptedAccount.adAccountId,
		pageId: encryptedAccount.pageId,
		businessId: encryptedAccount.businessId
	});
}

export { FacebookMCPClient };
