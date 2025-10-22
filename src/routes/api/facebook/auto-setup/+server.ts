import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';
import { decrypt } from '$lib/server/security/encryption';

// POST: Auto-setup Facebook Page, Business Manager, and Ad Account for beginners
export const POST: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		// Get user's Facebook ad account
		const adAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId: user.id }
		});

		if (!adAccount || !adAccount.accessToken) {
			return json({
				success: false,
				error: 'No Facebook account connected. Please connect first.'
			}, { status: 400 });
		}

		const accessToken = decrypt(adAccount.accessToken);

		// Check current setup tier
		if (adAccount.setupTier === 3) {
			return json({
				success: true,
				message: 'Setup already complete!',
				data: {
					setupTier: 3,
					pageId: adAccount.pageId,
					businessId: adAccount.businessId,
					adAccountId: adAccount.adAccountId
				}
			});
		}

		const setupResult = {
			pageId: adAccount.pageId,
			pageName: adAccount.pageName,
			businessId: adAccount.businessId,
			businessName: adAccount.businessName,
			adAccountId: adAccount.adAccountId,
			adAccountName: adAccount.adAccountName,
			setupTier: adAccount.setupTier,
			steps: [] as string[]
		};

		// Step 1: Create Facebook Page if needed
		if (!adAccount.pageId) {
			console.log('Creating Facebook Page for user:', user.id);

			// Note: Facebook Graph API doesn't support programmatic page creation
			// Users must create pages manually via facebook.com/pages/create
			setupResult.steps.push('page_creation_required');

			return json({
				success: false,
				error: 'manual_page_creation_required',
				message: 'You need to create a Facebook Page first',
				guide: {
					step: 'page',
					instruction: 'Go to facebook.com/pages/create and create a page for your business',
					url: 'https://www.facebook.com/pages/create'
				},
				setupTier: 0
			}, { status: 400 });
		}

		// Step 2: Create Business Manager if needed (Tier 1 → Tier 2)
		if (!adAccount.businessId && adAccount.pageId) {
			console.log('User needs to create Business Manager:', user.id);

			// Note: Business Manager creation also requires manual setup
			setupResult.steps.push('business_creation_required');

			return json({
				success: false,
				error: 'manual_business_creation_required',
				message: 'Create a Business Manager to run ads',
				guide: {
					step: 'business',
					instruction: 'Go to business.facebook.com and create a Business Manager account',
					url: 'https://business.facebook.com/overview'
				},
				setupTier: 1
			}, { status: 400 });
		}

		// Step 3: Create Ad Account if needed (Tier 2 → Tier 3)
		if (!adAccount.adAccountId && adAccount.businessId) {
			console.log('Checking for existing ad accounts under business:', adAccount.businessId);

			// Check if user already has ad accounts they haven't connected
			const adAccountsResponse = await fetch(
				`https://graph.facebook.com/v19.0/${adAccount.businessId}/owned_ad_accounts?` +
				`access_token=${accessToken}&fields=id,name,account_status,currency`
			);

			const adAccountsData = await adAccountsResponse.json();

			if (adAccountsData.data && adAccountsData.data.length > 0) {
				// User has ad account(s), connect the first active one
				const activeAccount = adAccountsData.data.find((acc: any) => acc.account_status === 1)
					|| adAccountsData.data[0];

				await prisma.facebookAdAccount.update({
					where: { id: adAccount.id },
					data: {
						adAccountId: activeAccount.id,
						adAccountName: activeAccount.name,
						setupTier: 3,
						canCreateCampaigns: true,
						lastSyncAt: new Date()
					}
				});

				setupResult.adAccountId = activeAccount.id;
				setupResult.adAccountName = activeAccount.name;
				setupResult.setupTier = 3;
				setupResult.steps.push('ad_account_connected');

				return json({
					success: true,
					message: 'Ad account connected successfully! You can now create campaigns.',
					data: setupResult
				});
			}

			// No ad account exists - guide user to create one
			return json({
				success: false,
				error: 'manual_ad_account_creation_required',
				message: 'Create an Ad Account to start running campaigns',
				guide: {
					step: 'ad_account',
					instruction: 'Add a payment method and create an ad account in Business Manager',
					url: `https://business.facebook.com/settings/ad-accounts/${adAccount.businessId}`
				},
				setupTier: 2
			}, { status: 400 });
		}

		// All setup complete
		return json({
			success: true,
			message: 'Setup complete!',
			data: setupResult
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Auto-setup error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to auto-setup account',
			details: errorMessage
		}, { status: 500 });
	}
};

// GET: Check setup status and get guided next steps
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		const adAccount = await prisma.facebookAdAccount.findFirst({
			where: { userId: user.id }
		});

		if (!adAccount) {
			return json({
				success: true,
				setupTier: 0,
				nextStep: {
					step: 'connect',
					title: 'Connect with Facebook',
					description: 'Click "Connect with Facebook" to get started',
					action: 'oauth'
				}
			});
		}

		const accessToken = adAccount.accessToken ? decrypt(adAccount.accessToken) : null;

		// Determine next step based on current tier
		let nextStep;

		if (adAccount.setupTier === 0) {
			nextStep = {
				step: 'page',
				title: 'Create a Facebook Page',
				description: 'Create a page for your business (like "Joe\'s Pizza")',
				action: 'manual',
				url: 'https://www.facebook.com/pages/create'
			};
		} else if (adAccount.setupTier === 1) {
			nextStep = {
				step: 'business',
				title: 'Create Business Manager',
				description: 'Set up a Business Manager to manage your ads professionally',
				action: 'manual',
				url: 'https://business.facebook.com/overview'
			};
		} else if (adAccount.setupTier === 2) {
			nextStep = {
				step: 'ad_account',
				title: 'Create Ad Account',
				description: 'Add a payment method and create your ad account',
				action: 'manual',
				url: `https://business.facebook.com/settings/ad-accounts/${adAccount.businessId}`
			};
		} else {
			nextStep = {
				step: 'complete',
				title: 'Setup Complete',
				description: 'You\'re ready to create campaigns!',
				action: 'none'
			};
		}

		// Check if user has completed manual steps by re-checking their account
		let canRefresh = false;
		if (accessToken && adAccount.setupTier < 3) {
			canRefresh = true;
		}

		return json({
			success: true,
			setupTier: adAccount.setupTier,
			isConnected: adAccount.isConnected,
			hasPage: !!adAccount.pageId,
			hasBusiness: !!adAccount.businessId,
			hasAdAccount: !!adAccount.adAccountId,
			canRefresh,
			nextStep,
			account: {
				pageName: adAccount.pageName,
				businessName: adAccount.businessName,
				adAccountName: adAccount.adAccountName
			}
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Setup status check error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to check setup status',
			details: errorMessage
		}, { status: 500 });
	}
};
