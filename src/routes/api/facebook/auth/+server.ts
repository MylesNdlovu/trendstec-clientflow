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

		// Facebook OAuth URL with minimal permissions
		// Only public_profile works without any setup
		// Even 'email' requires app configuration
		const permissions = 'public_profile';

		const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
			`client_id=${FACEBOOK_APP_ID}` +
			`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
			`&scope=${permissions}` +
			`&response_type=code` +
			`&state=${user.id}`;

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
