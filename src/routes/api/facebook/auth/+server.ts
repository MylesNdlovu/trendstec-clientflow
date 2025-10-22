import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';

// Facebook OAuth Configuration
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const REDIRECT_URI = process.env.PUBLIC_BASE_URL + '/api/facebook/callback';

// GET: Initiate Facebook OAuth flow
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		console.log('🔵 Initiating Facebook OAuth for user:', user.id);
		console.log('  App ID:', FACEBOOK_APP_ID ? 'Set' : 'MISSING');
		console.log('  Redirect URI:', REDIRECT_URI);

		if (!FACEBOOK_APP_ID) {
			console.error('❌ FACEBOOK_APP_ID not set');
			throw redirect(302, '/dashboard/ads?error=oauth_failed&details=missing_app_id');
		}

		// Facebook OAuth URL with required permissions
		const permissions = [
			'pages_show_list',
			'pages_read_engagement',
			'pages_manage_ads',
			'business_management',
			'ads_management',
			'ads_read'
		].join(',');

		const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
			`client_id=${FACEBOOK_APP_ID}` +
			`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
			`&scope=${permissions}` +
			`&response_type=code` +
			`&state=${user.id}`;

		console.log('✅ Redirecting to Facebook OAuth');
		throw redirect(302, authUrl);
	} catch (error) {
		if (error instanceof Response) throw error;

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('❌ Error initiating Facebook OAuth:', errorMessage);
		throw redirect(302, `/dashboard/ads?error=oauth_failed&details=${encodeURIComponent(errorMessage)}`);
	}
};
