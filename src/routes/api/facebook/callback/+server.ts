import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/config/database';
import { encrypt } from '$lib/server/security/encryption';

const FACEBOOK_APP_ID = (process.env.FACEBOOK_APP_ID || '').trim();
const FACEBOOK_APP_SECRET = (process.env.FACEBOOK_APP_SECRET || '').trim();
const REDIRECT_URI = ((process.env.PUBLIC_BASE_URL || '').trim() + '/api/facebook/callback').trim();

// GET: Handle Facebook OAuth callback
export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state'); // userId
		const error = url.searchParams.get('error');

		if (error) {
			console.error('Facebook OAuth error:', error);
			throw redirect(302, '/dashboard/ads?error=access_denied');
		}

		if (!code || !state) {
			console.error('Missing code or state');
			throw redirect(302, '/dashboard/ads?error=invalid_callback');
		}

		// Exchange code for access token
		const tokenResponse = await fetch(
			`https://graph.facebook.com/v19.0/oauth/access_token?` +
			`client_id=${FACEBOOK_APP_ID}` +
			`&client_secret=${FACEBOOK_APP_SECRET}` +
			`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
			`&code=${code}`
		);

		const tokenData = await tokenResponse.json();

		if (!tokenData.access_token) {
			console.error('Failed to get access token:', JSON.stringify(tokenData, null, 2));
			throw redirect(302, '/dashboard/ads?error=token_exchange_failed&details=' + encodeURIComponent(tokenData.error?.message || 'unknown'));
		}

		const accessToken = tokenData.access_token;

		// Get long-lived token
		const longLivedResponse = await fetch(
			`https://graph.facebook.com/v19.0/oauth/access_token?` +
			`grant_type=fb_exchange_token` +
			`&client_id=${FACEBOOK_APP_ID}` +
			`&client_secret=${FACEBOOK_APP_SECRET}` +
			`&fb_exchange_token=${accessToken}`
		);

		const longLivedData = await longLivedResponse.json();
		const longLivedToken = longLivedData.access_token || accessToken;

		// Detect user's Facebook setup
		const setupStatus = await detectFacebookSetup(longLivedToken);

		// Save or update ad account
		const existingAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId: state }
		});

		if (existingAccount) {
			await prisma.facebookAdAccount.update({
				where: { id: existingAccount.id },
				data: {
					setupTier: setupStatus.tier,
					pageId: setupStatus.pageId,
					pageName: setupStatus.pageName,
					pageAccessToken: setupStatus.pageAccessToken ? JSON.stringify(encrypt(setupStatus.pageAccessToken)) : null,
					businessId: setupStatus.businessId,
					businessName: setupStatus.businessName,
					adAccountId: setupStatus.adAccountId,
					adAccountName: setupStatus.adAccountName,
					accessToken: JSON.stringify(encrypt(longLivedToken)),
					tokenExpiresAt: longLivedData.expires_in
						? new Date(Date.now() + longLivedData.expires_in * 1000)
						: null,
					canBoostPosts: setupStatus.tier >= 1,
					canCreateCampaigns: setupStatus.tier >= 3,
					isConnected: true,
					lastSyncAt: new Date()
				}
			});
		} else {
			await prisma.facebookAdAccount.create({
				data: {
					userId: state,
					setupTier: setupStatus.tier,
					pageId: setupStatus.pageId,
					pageName: setupStatus.pageName,
					pageAccessToken: setupStatus.pageAccessToken ? JSON.stringify(encrypt(setupStatus.pageAccessToken)) : null,
					businessId: setupStatus.businessId,
					businessName: setupStatus.businessName,
					adAccountId: setupStatus.adAccountId,
					adAccountName: setupStatus.adAccountName,
					accessToken: JSON.stringify(encrypt(longLivedToken)),
					tokenExpiresAt: longLivedData.expires_in
						? new Date(Date.now() + longLivedData.expires_in * 1000)
						: null,
					canBoostPosts: setupStatus.tier >= 1,
					canCreateCampaigns: setupStatus.tier >= 3,
					isConnected: true,
					lastSyncAt: new Date()
				}
			});
		}

		// Redirect based on setup tier
		if (setupStatus.tier === 3) {
			// Full setup - go to dashboard
			throw redirect(302, '/dashboard/ads?success=connected');
		} else if (setupStatus.tier === 2) {
			// Has Business Manager but no Ad Account - show guided setup
			throw redirect(302, '/dashboard/ads/setup?step=ad_account');
		} else if (setupStatus.tier === 1) {
			// Only has page - can use basic boosting or upgrade
			throw redirect(302, '/dashboard/ads?success=basic_connected&upgrade=available');
		} else {
			// No page - needs to create one
			throw redirect(302, '/dashboard/ads?success=connected&tier=0&message=basic_profile_only');
		}
	} catch (error) {
		// Check if this is a redirect (SvelteKit redirect objects have status and location)
		if (error instanceof Response ||
		    (typeof error === 'object' && error !== null && 'status' in error && 'location' in error)) {
			throw error;
		}

		console.error('OAuth callback error:', error);

		let errorMsg = 'Unknown error';
		let errorName = 'UnknownError';

		if (error instanceof Error) {
			errorMsg = error.message;
			errorName = error.name;
		} else if (typeof error === 'object' && error !== null) {
			// Try to stringify the error object properly
			try {
				errorMsg = JSON.stringify(error);
			} catch {
				errorMsg = 'Error object cannot be stringified';
			}
		} else {
			errorMsg = String(error);
		}

		throw redirect(302, '/dashboard/ads?error=callback_failed&name=' + encodeURIComponent(errorName) + '&message=' + encodeURIComponent(errorMsg));
	}
};

async function detectFacebookSetup(accessToken: string) {
	const setupStatus = {
		tier: 0,
		pageId: null as string | null,
		pageName: null as string | null,
		pageAccessToken: null as string | null,
		businessId: null as string | null,
		businessName: null as string | null,
		adAccountId: null as string | null,
		adAccountName: null as string | null
	};

	try {
		// 1. Check for Facebook Pages (requires pages_show_list permission)
		const pagesResponse = await fetch(
			`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`
		);
		const pagesData = await pagesResponse.json();

		// Check if we got an error due to insufficient permissions
		if (!pagesData.error && pagesData.data && pagesData.data.length > 0) {
			setupStatus.tier = 1;
			setupStatus.pageId = pagesData.data[0].id;
			setupStatus.pageName = pagesData.data[0].name;
			setupStatus.pageAccessToken = pagesData.data[0].access_token;
		}

		// 2. Check for Business Manager (requires business_management permission)
		const businessResponse = await fetch(
			`https://graph.facebook.com/v19.0/me/businesses?access_token=${accessToken}&fields=id,name`
		);
		const businessData = await businessResponse.json();

		// Check if we got an error due to insufficient permissions
		if (!businessData.error && businessData.data && businessData.data.length > 0) {
			setupStatus.tier = 2;
			setupStatus.businessId = businessData.data[0].id;
			setupStatus.businessName = businessData.data[0].name;

			// 3. Check for Ad Accounts under Business Manager (requires ads_management permission)
			const adAccountsResponse = await fetch(
				`https://graph.facebook.com/v19.0/${setupStatus.businessId}/adaccounts?access_token=${accessToken}&fields=id,name,account_status,currency,timezone_name`
			);
			const adAccountsData = await adAccountsResponse.json();

			// Check if we got an error due to insufficient permissions
			if (!adAccountsData.error && adAccountsData.data && adAccountsData.data.length > 0) {
				setupStatus.tier = 3;
				setupStatus.adAccountId = adAccountsData.data[0].id;
				setupStatus.adAccountName = adAccountsData.data[0].name;
			}
		}
	} catch (error) {
		console.error('Error detecting Facebook setup:', error);
	}

	return setupStatus;
}
