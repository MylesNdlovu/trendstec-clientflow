import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /api/webhooks/facebook/leadgen/test
 * Test Facebook webhook endpoint
 */
export const POST: RequestHandler = async () => {
	try {
		// Check environment variables
		if (!process.env.FACEBOOK_APP_SECRET) {
			return json({
				success: false,
				error: 'FACEBOOK_APP_SECRET environment variable not set'
			}, { status: 400 });
		}

		if (!process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
			return json({
				success: false,
				error: 'FACEBOOK_WEBHOOK_VERIFY_TOKEN environment variable not set'
			}, { status: 400 });
		}

		// Webhook endpoint exists and env vars are configured
		return json({
			success: true,
			message: 'Webhook endpoint is configured correctly',
			details: {
				envVarsSet: true,
				webhookUrl: `${process.env.PUBLIC_APP_URL || 'https://trendstec-clientflow.vercel.app'}/api/webhooks/facebook/leadgen`,
				nextSteps: [
					'Configure webhook in Facebook App Dashboard',
					'Subscribe to leadgen events',
					'Subscribe your Facebook Page',
					'Test with a real lead submission'
				]
			}
		});
	} catch (error: any) {
		console.error('[Facebook Webhook Test] Error:', error);
		return json({
			success: false,
			error: error?.message || 'Test failed'
		}, { status: 500 });
	}
};
