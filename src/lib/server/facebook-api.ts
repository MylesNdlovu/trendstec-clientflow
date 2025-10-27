/**
 * Facebook Marketing API - REST API Client
 * Uses direct HTTP calls instead of the problematic Node.js SDK
 */

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0';

export class FacebookAPI {
	/**
	 * Make a Graph API request
	 */
	static async graphRequest(endpoint: string, accessToken: string, params: any = {}) {
		const url = new URL(`${FB_GRAPH_API}${endpoint}`);
		Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
		url.searchParams.append('access_token', accessToken);

		const response = await fetch(url.toString());
		if (!response.ok) {
			throw new Error(`Facebook API error: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * Get ad account insights
	 */
	static async getAdAccountInsights(adAccountId: string, accessToken: string, dateRange: { since: string; until: string }) {
		return this.graphRequest(`/${adAccountId}/insights`, accessToken, {
			fields: 'spend,impressions,clicks,cpc,cpm,ctr,actions',
			time_range: JSON.stringify(dateRange),
			level: 'account'
		});
	}

	/**
	 * Get campaigns
	 */
	static async getCampaigns(adAccountId: string, accessToken: string) {
		return this.graphRequest(`/${adAccountId}/campaigns`, accessToken, {
			fields: 'id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time'
		});
	}

	/**
	 * Get ad accounts for user
	 */
	static async getAdAccounts(accessToken: string) {
		return this.graphRequest('/me/adaccounts', accessToken, {
			fields: 'id,name,account_status,currency,timezone_name'
		});
	}
}
