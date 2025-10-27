/**
 * Temporary stub for MetaAdsService
 * Returns empty data until FacebookAPI REST client is fully implemented
 * This prevents errors from undefined MetaAdsService references
 */

export class MetaAdsService {
	static async getAdSpendStats(userId: string, days: number) {
		return {
			period: { start: new Date(), end: new Date() },
			totalImpressions: 0,
			totalClicks: 0,
			avgCpc: 0,
			ctr: 0,
			dailyAverage: 0,
			history: []
		};
	}

	static async syncAdSpend(userId: string) {
		return {
			spend: 0,
			leads: 0,
			synced: false
		};
	}

	static async createCampaign(userId: string, campaignData: any) {
		throw new Error('Campaign creation temporarily disabled - API migration in progress');
	}

	static async updateCampaignStatus(userId: string, campaignId: string, status: string) {
		throw new Error('Campaign updates temporarily disabled - API migration in progress');
	}

	static async checkSpendingAlerts(userId: string) {
		// No-op
		return;
	}

	static async calculateAdSpendCommission(userId: string, month: Date) {
		return {
			totalSpend: 0,
			commission: 0
		};
	}
}
