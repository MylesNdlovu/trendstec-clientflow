import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/config/database';

/**
 * Facebook Deauthorize Callback
 * Called when a user removes your app from their Facebook account
 * https://developers.facebook.com/docs/facebook-login/deauth-callback
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const signedRequest = body.signed_request;

		if (!signedRequest) {
			return json({ error: 'Missing signed_request' }, { status: 400 });
		}

		// Parse the signed request
		// Format: <signature>.<payload>
		const [signature, payload] = signedRequest.split('.');
		const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

		const userId = data.user_id;

		if (!userId) {
			return json({ error: 'Invalid signed_request' }, { status: 400 });
		}

		console.log(`Facebook deauthorization request received for user: ${userId}`);

		// Find and disconnect the Facebook account
		await prisma.facebookAdAccount.updateMany({
			where: { fbUserId: userId },
			data: {
				isConnected: false,
				accessToken: null,
				disconnectedAt: new Date()
			}
		});

		console.log(`Successfully processed deauthorization for Facebook user: ${userId}`);

		// Facebook expects a JSON response with url and confirmation_code
		return json({
			url: `${request.url}/status`,
			confirmation_code: userId
		});

	} catch (error) {
		console.error('Error processing Facebook deauthorization:', error);
		return json(
			{ error: 'Failed to process deauthorization' },
			{ status: 500 }
		);
	}
};

// GET endpoint for status check
export const GET: RequestHandler = async () => {
	return json({
		status: 'ok',
		message: 'Facebook deauthorization callback endpoint'
	});
};
