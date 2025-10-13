import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, fetch }) => {
	try {
		const { id } = params;

		// Mock webhook lookup (in production, query database)
		const webhooks = [
			{
				id: 'webhook_1',
				name: 'Systeme.io Sync',
				url: 'https://api.systeme.io/webhooks/leads',
				events: ['lead.captured', 'lead.deposited', 'lead.trading'],
				active: true
			}
		];

		const webhook = webhooks.find(w => w.id === id);
		if (!webhook) {
			return json(
				{ error: 'Webhook not found' },
				{ status: 404 }
			);
		}

		if (!webhook.active) {
			return json(
				{ error: 'Webhook is inactive' },
				{ status: 400 }
			);
		}

		// Create test payload
		const testPayload = {
			event: 'webhook.test',
			timestamp: new Date().toISOString(),
			data: {
				webhook_id: webhook.id,
				webhook_name: webhook.name,
				test: true,
				message: 'This is a test webhook from your affiliate dashboard'
			},
			source: 'affiliate-dashboard'
		};

		console.log(`Testing webhook ${webhook.name} (${id}): ${webhook.url}`);

		// Send test webhook
		try {
			const startTime = Date.now();

			const response = await fetch(webhook.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'Affiliate-Dashboard-Webhook-Test/1.0',
					'X-Webhook-Test': 'true'
				},
				body: JSON.stringify(testPayload)
			});

			const endTime = Date.now();
			const responseTime = endTime - startTime;

			console.log(`Webhook test result: ${response.status} (${responseTime}ms)`);

			// Update last triggered time (in production, save to database)
			webhook.lastTriggered = new Date().toISOString();

			return json({
				success: response.ok,
				status: response.status,
				responseTime,
				message: response.ok
					? `Test webhook sent successfully (${responseTime}ms)`
					: `Test webhook failed with status ${response.status}`,
				webhook: {
					id: webhook.id,
					name: webhook.name,
					url: webhook.url
				}
			});

		} catch (networkError) {
			console.error(`Webhook test network error:`, networkError);

			return json({
				success: false,
				error: 'Network error',
				message: 'Failed to send webhook - check URL and network connectivity',
				details: networkError.message
			}, { status: 400 });
		}

	} catch (error) {
		console.error('Error testing webhook:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};