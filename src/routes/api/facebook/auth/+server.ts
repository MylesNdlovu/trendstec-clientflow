import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';

// Facebook OAuth Configuration
const FACEBOOK_APP_ID = (process.env.FACEBOOK_APP_ID || '').trim();
const REDIRECT_URI = ((process.env.PUBLIC_BASE_URL || '').trim() + '/api/facebook/callback').trim();

// GET: Initiate Facebook OAuth flow
export const GET: RequestHandler = async (event) => {
	console.log('🔵 Facebook OAuth endpoint called');
	console.log('  Cookies:', event.cookies.getAll());

	try {
		const user = await requireAuth(event);

		console.log('✅ User authenticated:', user.id, user.email);
		console.log('  App ID:', FACEBOOK_APP_ID ? 'Set' : 'MISSING');
		console.log('  Redirect URI:', REDIRECT_URI);

		if (!FACEBOOK_APP_ID) {
			console.error('❌ FACEBOOK_APP_ID not set');
			throw redirect(302, '/dashboard/ads?error=oauth_failed&details=missing_app_id');
		}

		console.log('  Redirect URI:', REDIRECT_URI);

		// Meta Marketing API - Required permissions for ad management
		// These permissions allow full campaign creation and management
		const permissions = [
			'ads_management',        // Create and manage ads, ad campaigns, ad sets, and ad accounts
			'ads_read',              // Read ad account insights and campaigns
			'business_management',   // Access Business Manager and ad accounts
			'pages_read_engagement', // Read page data (for ad creatives)
			'pages_show_list',       // List pages user manages
			'public_profile',        // Basic profile info
			'email'                  // User email
		].join(',');

		const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
			`client_id=${FACEBOOK_APP_ID}` +
			`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
			`&scope=${permissions}` +
			`&response_type=code` +
			`&state=${user.id}` +
			`&auth_type=rerequest`;  // Force permission dialog even if previously declined

		console.log('✅ Redirecting to Facebook OAuth URL:', authUrl.substring(0, 100) + '...');
		throw redirect(302, authUrl);
	} catch (error) {
		// Let redirects pass through
		if (error instanceof Response || (error && typeof error === 'object' && 'status' in error && 'location' in error)) {
			throw error;
		}

		const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
		console.error('❌ Error initiating Facebook OAuth:', errorMessage, error);
		throw redirect(302, `/dashboard/ads?error=oauth_failed&details=${encodeURIComponent(errorMessage)}`);
	}
};
