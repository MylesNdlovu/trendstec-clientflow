import { json } from '@sveltejs/kit';
import type { RequestHandler} from './$types';

/**
 * GET /api/webhooks/facebook/leadgen/status
 * Check Facebook webhook configuration status
 */
export const GET: RequestHandler = async () => {
	const envVarsSet = !!(
		process.env.FACEBOOK_APP_SECRET &&
		process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
	);

	// We can't easily check if Facebook is configured without making API calls
	// So we'll just check if env vars are set
	const status = {
		configured: envVarsSet,
		envVarsSet: envVarsSet,
		facebookConfigured: false, // Would need to check via Facebook API
		appReviewApproved: false, // Would need to check via Facebook API
		webhookUrl: `${process.env.PUBLIC_APP_URL || 'https://trendstec-clientflow.vercel.app'}/api/webhooks/facebook/leadgen`
	};

	return json({
		success: true,
		status
	});
};
