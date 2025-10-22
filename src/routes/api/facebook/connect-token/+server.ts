import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';
import { encrypt } from '$lib/server/security/encryption';

// POST: Connect Facebook account via System User Access Token
export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);
		const { accessToken } = await event.request.json();

		if (!accessToken || accessToken.length < 50) {
			return json({
				success: false,
				error: 'Invalid access token provided'
			}, { status: 400 });
		}

		// Validate token by making a test API call
		const validationResponse = await fetch(
			`https://graph.facebook.com/v19.0/me?access_token=${accessToken}&fields=id,name`
		);

		if (!validationResponse.ok) {
			return json({
				success: false,
				error: 'Invalid access token. Please check and try again.'
			}, { status: 400 });
		}

		// Detect user's Facebook setup
		const setupStatus = await detectFacebookSetup(accessToken);

		if (setupStatus.tier === 0) {
			return json({
				success: false,
				error: 'No Facebook Page or Business Manager found. Please create one first.'
			}, { status: 400 });
		}

		// Save or update ad account
		const existingAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId: user.id }
		});

		const accountData = {
			setupTier: setupStatus.tier,
			pageId: setupStatus.pageId,
			pageName: setupStatus.pageName,
			pageAccessToken: setupStatus.pageAccessToken ? encrypt(setupStatus.pageAccessToken) : null,
			businessId: setupStatus.businessId,
			businessName: setupStatus.businessName,
			adAccountId: setupStatus.adAccountId,
			adAccountName: setupStatus.adAccountName,
			accessToken: encrypt(accessToken),
			canBoostPosts: setupStatus.tier >= 1,
			canCreateCampaigns: setupStatus.tier >= 3,
			isConnected: true,
			lastSyncAt: new Date(),
			connectionError: null
		};

		if (existingAccount) {
			await prisma.facebookAdAccount.update({
				where: { id: existingAccount.id },
				data: accountData
			});
		} else {
			await prisma.facebookAdAccount.create({
				data: {
					userId: user.id,
					...accountData
				}
			});
		}

		return json({
			success: true,
			message: 'Facebook account connected successfully',
			setupTier: setupStatus.tier,
			redirectUrl: setupStatus.tier === 3 ? '/dashboard/ads' : '/dashboard/ads/setup?step=ad_account'
		});
	} catch (error: any) {
		console.error('Error connecting with token:', error);
		return json({
			success: false,
			error: 'Failed to connect account. Please try again.'
		}, { status: 500 });
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
		// 1. Check for Facebook Pages
		const pagesResponse = await fetch(
			`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token`
		);
		const pagesData = await pagesResponse.json();

		if (pagesData.data && pagesData.data.length > 0) {
			setupStatus.tier = 1;
			setupStatus.pageId = pagesData.data[0].id;
			setupStatus.pageName = pagesData.data[0].name;
			setupStatus.pageAccessToken = pagesData.data[0].access_token;
		}

		// 2. Check for Business Manager
		const businessResponse = await fetch(
			`https://graph.facebook.com/v19.0/me/businesses?access_token=${accessToken}&fields=id,name`
		);
		const businessData = await businessResponse.json();

		if (businessData.data && businessData.data.length > 0) {
			setupStatus.tier = 2;
			setupStatus.businessId = businessData.data[0].id;
			setupStatus.businessName = businessData.data[0].name;

			// 3. Check for Ad Accounts under Business Manager
			const adAccountsResponse = await fetch(
				`https://graph.facebook.com/v19.0/${setupStatus.businessId}/adaccounts?access_token=${accessToken}&fields=id,name,account_status,currency`
			);
			const adAccountsData = await adAccountsResponse.json();

			if (adAccountsData.data && adAccountsData.data.length > 0) {
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
