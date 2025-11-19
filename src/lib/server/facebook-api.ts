/**
 * Meta Marketing API - REST API Client
 * Full implementation for ad campaign management
 * Supports OAuth flow, long-lived tokens, and system user tokens
 */

const FB_GRAPH_API = 'https://graph.facebook.com/v19.0';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

export class FacebookAPI {
	/**
	 * Make a Graph API request with proper error handling
	 */
	static async graphRequest(endpoint: string, accessToken: string, params: any = {}, method: string = 'GET') {
		const url = new URL(`${FB_GRAPH_API}${endpoint}`);
		
		if (method === 'GET') {
			Object.keys(params).forEach(key => {
				const value = typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key];
				url.searchParams.append(key, value);
			});
			url.searchParams.append('access_token', accessToken);
		}

		const options: RequestInit = {
			method,
			headers: {
				'Content-Type': 'application/json'
			}
		};

		if (method === 'POST' || method === 'PUT') {
			options.body = JSON.stringify({
				...params,
				access_token: accessToken
			});
		}

		const response = await fetch(url.toString(), options);
		const data = await response.json();
		
		if (!response.ok || data.error) {
			const error = data.error || { message: response.statusText };
			throw new Error(`Meta API error: ${error.message} (${error.code || response.status})`);
		}
		
		return data;
	}

	/**
	 * Exchange short-lived token for long-lived user token (60 days)
	 */
	static async exchangeForLongLivedToken(shortLivedToken: string): Promise<{ access_token: string; expires_in: number }> {
		const url = `${FB_GRAPH_API}/oauth/access_token?` +
			`grant_type=fb_exchange_token` +
			`&client_id=${FACEBOOK_APP_ID}` +
			`&client_secret=${FACEBOOK_APP_SECRET}` +
			`&fb_exchange_token=${shortLivedToken}`;
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (data.error) {
			throw new Error(`Token exchange failed: ${data.error.message}`);
		}
		
		return data;
	}

	/**
	 * Get user's ad accounts
	 * Endpoint: /me/adaccounts or /<business_id>/owned_ad_accounts
	 */
	static async getAdAccounts(accessToken: string, businessId?: string) {
		const endpoint = businessId 
			? `/${businessId}/owned_ad_accounts`
			: '/me/adaccounts';
		
		return this.graphRequest(endpoint, accessToken, {
			fields: 'id,name,account_status,currency,timezone_name,business,funding_source'
		});
	}

	/**
	 * Get campaigns for an ad account
	 * Endpoint: /act_<ad_account_id>/campaigns
	 */
	static async getCampaigns(adAccountId: string, accessToken: string) {
		return this.graphRequest(`/${adAccountId}/campaigns`, accessToken, {
			fields: 'id,name,objective,status,daily_budget,lifetime_budget,created_time,updated_time,effective_status'
		});
	}

	/**
	 * Create a new campaign
	 * Endpoint: /act_<ad_account_id>/campaigns
	 */
	static async createCampaign(adAccountId: string, accessToken: string, campaignData: {
		name: string;
		objective: string;
		status: 'ACTIVE' | 'PAUSED';
		special_ad_categories?: string[];
	}) {
		return this.graphRequest(`/${adAccountId}/campaigns`, accessToken, campaignData, 'POST');
	}

	/**
	 * Get ad sets for an ad account
	 * Endpoint: /act_<ad_account_id>/adsets
	 */
	static async getAdSets(adAccountId: string, accessToken: string) {
		return this.graphRequest(`/${adAccountId}/adsets`, accessToken, {
			fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,targeting,bid_amount,billing_event,optimization_goal'
		});
	}

	/**
	 * Create a new ad set
	 * Endpoint: /act_<ad_account_id>/adsets
	 */
	static async createAdSet(adAccountId: string, accessToken: string, adSetData: {
		name: string;
		campaign_id: string;
		daily_budget?: number;
		lifetime_budget?: number;
		billing_event: string;
		optimization_goal: string;
		bid_amount?: number;
		targeting: any;
		status: 'ACTIVE' | 'PAUSED';
		start_time?: string;
		end_time?: string;
	}) {
		return this.graphRequest(`/${adAccountId}/adsets`, accessToken, adSetData, 'POST');
	}

	/**
	 * Get ad creatives for an ad account
	 * Endpoint: /act_<ad_account_id>/adcreatives
	 */
	static async getAdCreatives(adAccountId: string, accessToken: string) {
		return this.graphRequest(`/${adAccountId}/adcreatives`, accessToken, {
			fields: 'id,name,object_story_spec,image_url,thumbnail_url,title,body,call_to_action_type'
		});
	}

	/**
	 * Create a new ad creative
	 * Endpoint: /act_<ad_account_id>/adcreatives
	 */
	static async createAdCreative(adAccountId: string, accessToken: string, creativeData: {
		name: string;
		object_story_spec?: any;
		image_url?: string;
		link_url?: string;
		message?: string;
		call_to_action?: any;
	}) {
		return this.graphRequest(`/${adAccountId}/adcreatives`, accessToken, creativeData, 'POST');
	}

	/**
	 * Get ads for an ad account
	 * Endpoint: /act_<ad_account_id>/ads
	 */
	static async getAds(adAccountId: string, accessToken: string) {
		return this.graphRequest(`/${adAccountId}/ads`, accessToken, {
			fields: 'id,name,adset_id,creative,status,effective_status,tracking_specs'
		});
	}

	/**
	 * Create a new ad
	 * Endpoint: /act_<ad_account_id>/ads
	 */
	static async createAd(adAccountId: string, accessToken: string, adData: {
		name: string;
		adset_id: string;
		creative: { creative_id: string };
		status: 'ACTIVE' | 'PAUSED';
		tracking_specs?: any;
	}) {
		return this.graphRequest(`/${adAccountId}/ads`, accessToken, adData, 'POST');
	}

	/**
	 * Get ad account insights (performance metrics)
	 * Endpoint: /act_<ad_account_id>/insights
	 */
	static async getAdAccountInsights(adAccountId: string, accessToken: string, params: {
		date_preset?: string;
		time_range?: { since: string; until: string };
		fields?: string;
		level?: 'account' | 'campaign' | 'adset' | 'ad';
	}) {
		return this.graphRequest(`/${adAccountId}/insights`, accessToken, {
			fields: params.fields || 'spend,impressions,clicks,cpc,cpm,ctr,actions,action_values',
			date_preset: params.date_preset,
			time_range: params.time_range,
			level: params.level || 'account'
		});
	}

	/**
	 * Update campaign status
	 */
	static async updateCampaignStatus(campaignId: string, accessToken: string, status: 'ACTIVE' | 'PAUSED') {
		return this.graphRequest(`/${campaignId}`, accessToken, { status }, 'POST');
	}

	/**
	 * Get user businesses (for system user creation)
	 */
	static async getBusinesses(accessToken: string) {
		return this.graphRequest('/me/businesses', accessToken, {
			fields: 'id,name,verification_status'
		});
	}

	/**
	 * Debug token (verify permissions and expiration)
	 */
	static async debugToken(accessToken: string) {
		return this.graphRequest('/debug_token', accessToken, {
			input_token: accessToken
		});
	}
}
