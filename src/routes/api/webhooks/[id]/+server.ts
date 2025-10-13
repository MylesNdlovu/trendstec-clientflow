import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock database reference (in production, use a real database)
let webhooks = [
	{
		id: 'webhook_1',
		name: 'Systeme.io Sync',
		url: 'https://api.systeme.io/webhooks/leads',
		events: ['lead.captured', 'lead.deposited', 'lead.trading'],
		active: true,
		created: new Date('2024-01-15').toISOString(),
		lastTriggered: new Date('2024-01-20').toISOString()
	}
];

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		const webhookIndex = webhooks.findIndex(w => w.id === id);
		if (webhookIndex === -1) {
			return json(
				{ error: 'Webhook not found' },
				{ status: 404 }
			);
		}

		const deletedWebhook = webhooks[webhookIndex];
		webhooks.splice(webhookIndex, 1);

		console.log(`Deleted webhook: ${deletedWebhook.name} (${id})`);

		return json({
			success: true,
			message: 'Webhook deleted successfully'
		});

	} catch (error) {
		console.error('Error deleting webhook:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const updateData = await request.json();

		const webhookIndex = webhooks.findIndex(w => w.id === id);
		if (webhookIndex === -1) {
			return json(
				{ error: 'Webhook not found' },
				{ status: 404 }
			);
		}

		// Update webhook
		webhooks[webhookIndex] = {
			...webhooks[webhookIndex],
			...updateData,
			id // Don't allow ID changes
		};

		console.log(`Updated webhook: ${webhooks[webhookIndex].name} (${id})`);

		return json({
			success: true,
			webhook: webhooks[webhookIndex],
			message: 'Webhook updated successfully'
		});

	} catch (error) {
		console.error('Error updating webhook:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};