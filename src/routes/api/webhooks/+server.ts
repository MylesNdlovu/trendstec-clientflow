import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock database for webhooks
let webhooks = [
	{
		id: 'webhook_1',
		name: 'Systeme.io Sync',
		url: 'https://api.systeme.io/webhooks/leads',
		events: ['lead.captured', 'lead.deposited', 'lead.trading'],
		active: true,
		created: new Date('2024-01-15').toISOString(),
		lastTriggered: new Date('2024-01-20').toISOString()
	},
	{
		id: 'webhook_2',
		name: 'Slack Notifications',
		url: 'https://example.com/webhook-placeholder',
		events: ['lead.captured', 'workflow.triggered'],
		active: true,
		created: new Date('2024-01-10').toISOString(),
		lastTriggered: new Date('2024-01-19').toISOString()
	}
];

export const GET: RequestHandler = async () => {
	// Return all configured webhooks
	return json(webhooks);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const webhookData = await request.json();

		// Validate required fields
		if (!webhookData.name || !webhookData.url || !webhookData.events || !Array.isArray(webhookData.events)) {
			return json(
				{ error: 'Missing required fields: name, url, events' },
				{ status: 400 }
			);
		}

		// Validate URL format
		try {
			new URL(webhookData.url);
		} catch {
			return json(
				{ error: 'Invalid URL format' },
				{ status: 400 }
			);
		}

		// Create new webhook
		const newWebhook = {
			id: `webhook_${Date.now()}`,
			name: webhookData.name,
			url: webhookData.url,
			events: webhookData.events,
			active: webhookData.active !== undefined ? webhookData.active : true,
			created: new Date().toISOString(),
			lastTriggered: null
		};

		webhooks.push(newWebhook);

		console.log(`Created webhook: ${newWebhook.name} (${newWebhook.id})`);

		return json({
			success: true,
			webhook: newWebhook,
			message: 'Webhook created successfully'
		});

	} catch (error) {
		console.error('Error creating webhook:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};