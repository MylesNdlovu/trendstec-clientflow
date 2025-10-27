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
		console.log('OAuth callback started');
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state'); // userId
		const error = url.searchParams.get('error');

		console.log('Params:', { code: code?.substring(0, 10) + '...', state, error });

		if (error) {
			console.error('Facebook OAuth error:', error);
			throw redirect(302, '/dashboard/ads?error=access_denied');
		}

		if (!code || !state) {
			console.error('Missing code or state:', { code: !!code, state: !!state });
			throw redirect(302, '/dashboard/ads?error=invalid_callback');
		}

		// Exchange code for access token
		console.log('Exchanging code for access token...');
		const tokenResponse = await fetch(
			`https://graph.facebook.com/v19.0/oauth/access_token?` +
			`client_id=${FACEBOOK_APP_ID}` +
			`&client_secret=${FACEBOOK_APP_SECRET}` +
			`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
			`&code=${code}`
		);

		const tokenData = await tokenResponse.json();
		console.log('Token response:', {
			hasAccessToken: !!tokenData.access_token,
			error: tokenData.error
		});

		if (!tokenData.access_token) {
			console.error('Failed to get access token:', JSON.stringify(tokenData, null, 2));
			throw redirect(302, '/dashboard/ads?error=token_exchange_failed&details=' + encodeURIComponent(tokenData.error?.message || 'unknown'));
		}

		const accessToken = tokenData.access_token;

		// Get long-lived token
		console.log('Getting long-lived token...');
		const longLivedResponse = await fetch(
			`https://graph.facebook.com/v19.0/oauth/access_token?` +
			`grant_type=fb_exchange_token` +
			`&client_id=${FACEBOOK_APP_ID}` +
			`&client_secret=${FACEBOOK_APP_SECRET}` +
			`&fb_exchange_token=${accessToken}`
		);

		const longLivedData = await longLivedResponse.json();
		console.log('Long-lived token response:', {
			hasAccessToken: !!longLivedData.access_token,
			expiresIn: longLivedData.expires_in,
			error: longLivedData.error
		});
		const longLivedToken = longLivedData.access_token || accessToken;

		// Detect user's Facebook setup
		console.log('Detecting Facebook setup...');
		const setupStatus = await detectFacebookSetup(longLivedToken);
		console.log('Setup status:', setupStatus);

		// Save or update ad account
		console.log('Checking for existing account for userId:', state);
		const existingAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId: state }
		});
		console.log('Existing account found:', !!existingAccount);

		if (existingAccount) {
			console.log('Updating existing account...');
			await prisma.facebookAdAccount.update({
				where: { id: existingAccount.id },
				data: {
					setupTier: setupStatus.tier,
					pageId: setupStatus.pageId,
					pageName: setupStatus.pageName,
					pageAccessToken: setupStatus.pageAccessToken ? encrypt(setupStatus.pageAccessToken) : null,
					businessId: setupStatus.businessId,
					businessName: setupStatus.businessName,
					adAccountId: setupStatus.adAccountId,
					adAccountName: setupStatus.adAccountName,
					accessToken: encrypt(longLivedToken),
					tokenExpiresAt: longLivedData.expires_in
						? new Date(Date.now() + longLivedData.expires_in * 1000)
						: null,
					canBoostPosts: setupStatus.tier >= 1,
					canCreateCampaigns: setupStatus.tier >= 3,
					isConnected: true,
					lastSyncAt: new Date()
				}
			});
			console.log('Account updated successfully');
		} else {
			console.log('Creating new account...');
			await prisma.facebookAdAccount.create({
				data: {
					userId: state,
					setupTier: setupStatus.tier,
					pageId: setupStatus.pageId,
					pageName: setupStatus.pageName,
					pageAccessToken: setupStatus.pageAccessToken ? encrypt(setupStatus.pageAccessToken) : null,
					businessId: setupStatus.businessId,
					businessName: setupStatus.businessName,
					adAccountId: setupStatus.adAccountId,
					adAccountName: setupStatus.adAccountName,
					accessToken: encrypt(longLivedToken),
					tokenExpiresAt: longLivedData.expires_in
						? new Date(Date.now() + longLivedData.expires_in * 1000)
						: null,
					canBoostPosts: setupStatus.tier >= 1,
					canCreateCampaigns: setupStatus.tier >= 3,
					isConnected: true,
					lastSyncAt: new Date()
				}
			});
			console.log('Account created successfully');
		}

		// Redirect based on setup tier
		console.log('Redirecting based on tier:', setupStatus.tier);
		if (setupStatus.tier === 3) {
			// Full setup - go to dashboard
			console.log('Redirecting to success page (tier 3)');
			throw redirect(302, '/dashboard/ads?success=connected');
		} else if (setupStatus.tier === 2) {
			// Has Business Manager but no Ad Account - show guided setup
			console.log('Redirecting to ad account setup (tier 2)');
			throw redirect(302, '/dashboard/ads/setup?step=ad_account');
		} else if (setupStatus.tier === 1) {
			// Only has page - can use basic boosting or upgrade
			console.log('Redirecting to basic connected page (tier 1)');
			throw redirect(302, '/dashboard/ads?success=basic_connected&upgrade=available');
		} else {
			// No page - needs to create one
			console.log('Redirecting to page setup (tier 0)');
			throw redirect(302, '/dashboard/ads/setup?step=page');
		}
	} catch (error) {
		if (error instanceof Response) throw error;

		console.error('OAuth callback error:', error);
		console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		throw redirect(302, '/dashboard/ads?error=callback_failed&message=' + encodeURIComponent(error instanceof Error ? error.message : String(error)));
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
		} else if (pagesData.error) {
			console.log('Pages permission not granted:', pagesData.error.message);
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
			} else if (adAccountsData.error) {
				console.log('Ad accounts permission not granted:', adAccountsData.error.message);
			}
		} else if (businessData.error) {
			console.log('Business permission not granted:', businessData.error.message);
		}
	} catch (error) {
		console.error('Error detecting Facebook setup:', error);
	}

	return setupStatus;
}
