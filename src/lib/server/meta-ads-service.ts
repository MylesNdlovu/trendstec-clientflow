/**
 * Meta Ads API Service
 *
 * Tracks IB ad spend, campaign performance, and manages Facebook/Instagram ads
 * for affiliates and introducing brokers (IBs).
 */

import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad, AdsInsights } from 'facebook-nodejs-business-sdk';
import prisma from '$lib/config/database';
import { decrypt } from './security/encryption';

// Initialize Facebook Ads API
const FB_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

FacebookAdsApi.init(FB_APP_ID, FB_APP_SECRET);

export class MetaAdsService {
	/**
	 * Get ad account with user's access token
	 */
	private static async getAdAccount(userId: string) {
		const fbAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId, isConnected: true }
		});

		if (!fbAccount || !fbAccount.adAccountId || !fbAccount.accessToken) {
			throw new Error('No connected Facebook Ad Account found');
		}

		const accessToken = decrypt(fbAccount.accessToken);
		const api = FacebookAdsApi.init(FB_APP_ID, FB_APP_SECRET);
		api.setAccessToken(accessToken);

		return {
			adAccount: new AdAccount(fbAccount.adAccountId),
			fbAccount,
			accessToken
		};
	}

	/**
	 * Sync ad spend data from Meta Ads API
	 * Called daily via cron job to track IB spending
	 */
	static async syncAdSpend(userId: string): Promise<{
		totalSpend: number;
		campaigns: number;
		updated: boolean;
	}> {
		const { adAccount, fbAccount } = await this.getAdAccount(userId);

		// Get today's date range
		const today = new Date();
		const dateStart = today.toISOString().split('T')[0];
		const dateEnd = dateStart;

		try {
			// Fetch insights for all campaigns
			const insights = await adAccount.getInsights(
				[
					AdsInsights.Fields.spend,
					AdsInsights.Fields.impressions,
					AdsInsights.Fields.clicks,
					AdsInsights.Fields.cpc,
					AdsInsights.Fields.cpm,
					AdsInsights.Fields.ctr,
					AdsInsights.Fields.actions
				],
				{
					time_range: { since: dateStart, until: dateEnd },
					level: 'account'
				}
			);

			const data = insights[0];
			const spend = parseFloat(data.spend || '0');
			const impressions = parseInt(data.impressions || '0');
			const clicks = parseInt(data.clicks || '0');

			// Extract leads from actions
			let leads = 0;
			if (data.actions) {
				const leadAction = data.actions.find((a: any) => a.action_type === 'lead');
				leads = leadAction ? parseInt(leadAction.value) : 0;
			}

			// Save to database
			await prisma.adSpendHistory.create({
				data: {
					userId,
					adAccountId: fbAccount.adAccountId!,
					date: today,
					spend,
					impressions,
					clicks,
					leads,
					cpl: leads > 0 ? spend / leads : 0
				}
			});

			// Get active campaigns count
			const campaigns = await adAccount.getCampaigns([], { limit: 100 });

			return {
				totalSpend: spend,
				campaigns: campaigns.length,
				updated: true
			};
		} catch (error) {
			console.error('Error syncing ad spend:', error);
			throw error;
		}
	}

	/**
	 * Get IB ad spend statistics
	 */
	static async getAdSpendStats(userId: string, days: number = 30) {
		const since = new Date();
		since.setDate(since.getDate() - days);

		const spendHistory = await prisma.adSpendHistory.findMany({
			where: {
				userId,
				date: { gte: since }
			},
			orderBy: { date: 'desc' }
		});

		const totalSpend = spendHistory.reduce((sum, day) => sum + day.spend, 0);
		const totalImpressions = spendHistory.reduce((sum, day) => sum + day.impressions, 0);
		const totalClicks = spendHistory.reduce((sum, day) => sum + day.clicks, 0);
		const totalLeads = spendHistory.reduce((sum, day) => sum + day.leads, 0);

		return {
			period: `${days} days`,
			totalSpend,
			totalImpressions,
			totalClicks,
			totalLeads,
			avgCpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
			avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
			ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
			dailyAverage: totalSpend / days,
			history: spendHistory
		};
	}

	/**
	 * Create a new campaign for IB
	 */
	static async createCampaign(
		userId: string,
		params: {
			name: string;
			objective: string; // 'OUTCOME_LEADS' | 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS'
			dailyBudget?: number;
			lifetimeBudget?: number;
			status?: string;
		}
	) {
		const { adAccount, fbAccount } = await this.getAdAccount(userId);

		const campaign = new Campaign(null, fbAccount.adAccountId!);

		const campaignData: any = {
			name: params.name,
			objective: params.objective,
			status: params.status || 'PAUSED',
			special_ad_categories: []
		};

		if (params.dailyBudget) {
			campaignData.daily_budget = Math.round(params.dailyBudget * 100); // Convert to cents
		}

		if (params.lifetimeBudget) {
			campaignData.lifetime_budget = Math.round(params.lifetimeBudget * 100);
		}

		const createdCampaign = await campaign.create([], campaignData);

		// Save to database
		await prisma.adCampaign.create({
			data: {
				userId,
				fbCampaignId: createdCampaign.id,
				name: params.name,
				objective: params.objective,
				status: params.status || 'PAUSED',
				dailyBudget: params.dailyBudget || 0,
				lifetimeBudget: params.lifetimeBudget
			}
		});

		return createdCampaign;
	}

	/**
	 * Get all campaigns for IB
	 */
	static async getCampaigns(userId: string) {
		const { adAccount } = await this.getAdAccount(userId);

		const campaigns = await adAccount.getCampaigns(
			[
				Campaign.Fields.id,
				Campaign.Fields.name,
				Campaign.Fields.objective,
				Campaign.Fields.status,
				Campaign.Fields.daily_budget,
				Campaign.Fields.lifetime_budget,
				Campaign.Fields.created_time,
				Campaign.Fields.updated_time
			],
			{ limit: 100 }
		);

		// Get insights for each campaign
		const campaignsWithInsights = await Promise.all(
			campaigns.map(async (campaign: any) => {
				try {
					const insights = await new Campaign(campaign.id).getInsights(
						[
							AdsInsights.Fields.spend,
							AdsInsights.Fields.impressions,
							AdsInsights.Fields.clicks,
							AdsInsights.Fields.cpc,
							AdsInsights.Fields.actions
						],
						{
							time_range: { since: '2024-01-01', until: 'today' }
						}
					);

					const data = insights[0] || {};
					let leads = 0;
					if (data.actions) {
						const leadAction = data.actions.find((a: any) => a.action_type === 'lead');
						leads = leadAction ? parseInt(leadAction.value) : 0;
					}

					return {
						id: campaign.id,
						name: campaign.name,
						objective: campaign.objective,
						status: campaign.status,
						dailyBudget: campaign.daily_budget ? campaign.daily_budget / 100 : null,
						lifetimeBudget: campaign.lifetime_budget ? campaign.lifetime_budget / 100 : null,
						spend: parseFloat(data.spend || '0'),
						impressions: parseInt(data.impressions || '0'),
						clicks: parseInt(data.clicks || '0'),
						leads,
						cpl: leads > 0 ? parseFloat(data.spend || '0') / leads : 0,
						createdTime: campaign.created_time,
						updatedTime: campaign.updated_time
					};
				} catch (error) {
					console.error(`Error getting insights for campaign ${campaign.id}:`, error);
					return {
						id: campaign.id,
						name: campaign.name,
						objective: campaign.objective,
						status: campaign.status,
						dailyBudget: campaign.daily_budget ? campaign.daily_budget / 100 : null,
						lifetimeBudget: campaign.lifetime_budget ? campaign.lifetime_budget / 100 : null,
						spend: 0,
						impressions: 0,
						clicks: 0,
						leads: 0,
						cpl: 0,
						createdTime: campaign.created_time,
						updatedTime: campaign.updated_time
					};
				}
			})
		);

		return campaignsWithInsights;
	}

	/**
	 * Update campaign status (pause/resume)
	 */
	static async updateCampaignStatus(userId: string, campaignId: string, status: 'ACTIVE' | 'PAUSED') {
		await this.getAdAccount(userId); // Verify user has access

		const campaign = new Campaign(campaignId);
		await campaign.update([], { status });

		// Update in database
		await prisma.adCampaign.updateMany({
			where: { userId, fbCampaignId: campaignId },
			data: { status }
		});

		return { success: true, status };
	}

	/**
	 * Get campaign performance insights
	 */
	static async getCampaignInsights(userId: string, campaignId: string, dateRange: { since: string; until: string }) {
		await this.getAdAccount(userId);

		const campaign = new Campaign(campaignId);
		const insights = await campaign.getInsights(
			[
				AdsInsights.Fields.spend,
				AdsInsights.Fields.impressions,
				AdsInsights.Fields.clicks,
				AdsInsights.Fields.cpc,
				AdsInsights.Fields.cpm,
				AdsInsights.Fields.ctr,
				AdsInsights.Fields.actions,
				AdsInsights.Fields.cost_per_action_type
			],
			{
				time_range: dateRange,
				level: 'campaign',
				breakdowns: ['publisher_platform']
			}
		);

		return insights.map((insight: any) => ({
			date: insight.date_start,
			spend: parseFloat(insight.spend || '0'),
			impressions: parseInt(insight.impressions || '0'),
			clicks: parseInt(insight.clicks || '0'),
			cpc: parseFloat(insight.cpc || '0'),
			cpm: parseFloat(insight.cpm || '0'),
			ctr: parseFloat(insight.ctr || '0'),
			platform: insight.publisher_platform,
			actions: insight.actions || [],
			costPerAction: insight.cost_per_action_type || []
		}));
	}

	/**
	 * Check if IB is approaching spending limits
	 * Send alerts via Systeme.io workflows
	 */
	static async checkSpendingAlerts(userId: string) {
		const stats = await this.getAdSpendStats(userId, 1); // Today's spend
		const todaySpend = stats.totalSpend;

		// Get user's alert thresholds
		const alerts = await prisma.adSpendAlert.findMany({
			where: { userId, isActive: true }
		});

		const triggeredAlerts = [];

		for (const alert of alerts) {
			if (todaySpend >= alert.threshold) {
				// Trigger Systeme.io workflow
				// (Integration with existing systemeService)
				triggeredAlerts.push(alert);

				// Mark as triggered
				await prisma.adSpendAlert.update({
					where: { id: alert.id },
					data: { lastTriggered: new Date() }
				});
			}
		}

		return triggeredAlerts;
	}

	/**
	 * Calculate IB commission based on ad spend
	 */
	static async calculateAdSpendCommission(userId: string, month: Date) {
		const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
		const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

		const monthlySpend = await prisma.adSpendHistory.aggregate({
			where: {
				userId,
				date: { gte: startOfMonth, lte: endOfMonth }
			},
			_sum: { spend: true }
		});

		const totalSpend = monthlySpend._sum.spend || 0;

		// Get commission config (admin sets rates)
		const commissionConfig = await prisma.commissionConfig.findFirst({
			where: { type: 'AD_SPEND' }
		});

		const commissionRate = commissionConfig?.rate || 0.1; // Default 10%
		const commission = totalSpend * commissionRate;

		// Save commission record
		await prisma.ibCommission.upsert({
			where: {
				userId_month: {
					userId,
					month: startOfMonth
				}
			},
			update: {
				adSpend: totalSpend,
				commission,
				status: 'PENDING'
			},
			create: {
				userId,
				month: startOfMonth,
				adSpend: totalSpend,
				commission,
				status: 'PENDING',
				type: 'AD_SPEND'
			}
		});

		return {
			month: startOfMonth,
			adSpend: totalSpend,
			commissionRate,
			commission
		};
	}
}
