import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET: Test if Facebook config is loaded
export const GET: RequestHandler = async () => {
	const config = {
		appIdSet: !!process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_ID !== 'your-facebook-app-id-here',
		appSecretSet: !!process.env.FACEBOOK_APP_SECRET && process.env.FACEBOOK_APP_SECRET !== 'your-facebook-app-secret-here',
		baseUrlSet: !!process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL !== 'http://localhost:5173',
		appIdValue: process.env.FACEBOOK_APP_ID ? process.env.FACEBOOK_APP_ID.substring(0, 4) + '...' : 'NOT SET',
		baseUrlValue: process.env.PUBLIC_BASE_URL || 'NOT SET'
	};

	return json(config);
};
