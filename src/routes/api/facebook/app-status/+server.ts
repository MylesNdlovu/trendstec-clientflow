import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/facebook/app-status
 * Check Facebook app review status and permissions
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Get app credentials from env
		const appId = process.env.FACEBOOK_APP_ID;
		const appSecret = process.env.FACEBOOK_APP_SECRET;

		if (!appId || !appSecret) {
			return json({
				success: false,
				error: 'Facebook app credentials not configured',
				details: {
					appId: !!appId,
					appSecret: !!appSecret
				}
			}, { status: 400 });
		}

		// Get app access token
		const tokenResponse = await fetch(
			`https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`
		);

		if (!tokenResponse.ok) {
			return json({
				success: false,
				error: 'Failed to get app access token'
			}, { status: 500 });
		}

		const tokenData = await tokenResponse.json();
		const accessToken = tokenData.access_token;

		// Check app info and permissions
		const appInfoResponse = await fetch(
			`https://graph.facebook.com/v19.0/${appId}?fields=id,name,category,link,namespace,permissions,restrictions&access_token=${accessToken}`
		);

		if (!appInfoResponse.ok) {
			const error = await appInfoResponse.json();
			return json({
				success: false,
				error: 'Failed to fetch app info',
				details: error
			}, { status: 500 });
		}

		const appInfo = await appInfoResponse.json();

		// Try to check permission status (this might require different endpoint based on app setup)
		let permissionStatus = null;
		try {
			const permResponse = await fetch(
				`https://graph.facebook.com/v19.0/${appId}/permissions?access_token=${accessToken}`
			);
			if (permResponse.ok) {
				permissionStatus = await permResponse.json();
			}
		} catch (err) {
			console.log('Could not fetch permissions:', err);
		}

		// Check if we can query for leads_retrieval specifically
		let leadsRetrievalStatus = 'unknown';
		try {
			// Try to access a test endpoint that requires leads_retrieval
			// If it fails with permission error, we know it's not approved
			const testResponse = await fetch(
				`https://graph.facebook.com/v19.0/me/permissions?access_token=${accessToken}`
			);
			if (testResponse.ok) {
				const perms = await testResponse.json();
				const leadsRetrieval = perms.data?.find((p: any) => p.permission === 'leads_retrieval');
				if (leadsRetrieval) {
					leadsRetrievalStatus = leadsRetrieval.status; // 'granted' or 'declined'
				}
			}
		} catch (err) {
			console.log('Could not check leads_retrieval:', err);
		}

		return json({
			success: true,
			app: {
				id: appInfo.id,
				name: appInfo.name,
				category: appInfo.category,
				link: appInfo.link,
				namespace: appInfo.namespace
			},
			permissions: permissionStatus,
			leadsRetrievalStatus,
			note: 'To get exact review status, you may need to check the App Dashboard manually',
			dashboardUrl: `https://developers.facebook.com/apps/${appId}/app-review/permissions/`
		});
	} catch (error: any) {
		console.error('[Facebook App Status] Error:', error);
		return json({
			success: false,
			error: error?.message || 'Failed to check app status',
			recommendation: 'Check Facebook App Dashboard manually at https://developers.facebook.com/apps'
		}, { status: 500 });
	}
};
