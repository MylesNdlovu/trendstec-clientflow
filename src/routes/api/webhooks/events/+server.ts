import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock webhook events log
const webhookEvents = [
	{
		id: 'event_1',
		webhook_id: 'webhook_1',
		webhook_name: 'Systeme.io Sync',
		event: 'lead.captured',
		status: 'success',
		response_time: 245,
		timestamp: new Date('2024-01-20T10:30:00Z').toISOString(),
		payload: {
			lead_id: 'lead_123',
			email: 'john@example.com',
			broker: 'IC Markets'
		}
	},
	{
		id: 'event_2',
		webhook_id: 'webhook_2',
		webhook_name: 'Slack Notifications',
		event: 'lead.deposited',
		status: 'success',
		response_time: 180,
		timestamp: new Date('2024-01-20T09:15:00Z').toISOString(),
		payload: {
			lead_id: 'lead_123',
			email: 'john@example.com',
			amount: 1000
		}
	},
	{
		id: 'event_3',
		webhook_id: 'webhook_1',
		webhook_name: 'Systeme.io Sync',
		event: 'lead.trading',
		status: 'error',
		response_time: 5000,
		timestamp: new Date('2024-01-19T16:45:00Z').toISOString(),
		error: 'Connection timeout',
		payload: {
			lead_id: 'lead_456',
			email: 'sarah@example.com',
			first_trade: true
		}
	},
	{
		id: 'event_4',
		webhook_id: 'webhook_2',
		webhook_name: 'Slack Notifications',
		event: 'workflow.triggered',
		status: 'success',
		response_time: 120,
		timestamp: new Date('2024-01-19T14:20:00Z').toISOString(),
		payload: {
			workflow_id: 'profitable_campaign',
			lead_count: 5
		}
	},
	{
		id: 'event_5',
		webhook_id: 'webhook_1',
		webhook_name: 'Systeme.io Sync',
		event: 'lead.captured',
		status: 'pending',
		response_time: null,
		timestamp: new Date('2024-01-19T12:30:00Z').toISOString(),
		payload: {
			lead_id: 'lead_789',
			email: 'mike@example.com',
			broker: 'Pepperstone'
		}
	}
];

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const offset = parseInt(url.searchParams.get('offset') || '0');
		const status = url.searchParams.get('status');
		const event = url.searchParams.get('event');
		const webhookId = url.searchParams.get('webhook_id');

		let filteredEvents = [...webhookEvents];

		// Apply filters
		if (status) {
			filteredEvents = filteredEvents.filter(e => e.status === status);
		}

		if (event) {
			filteredEvents = filteredEvents.filter(e => e.event === event);
		}

		if (webhookId) {
			filteredEvents = filteredEvents.filter(e => e.webhook_id === webhookId);
		}

		// Sort by timestamp (newest first)
		filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

		// Apply pagination
		const paginatedEvents = filteredEvents.slice(offset, offset + limit);

		return json({
			events: paginatedEvents,
			pagination: {
				total: filteredEvents.length,
				limit,
				offset,
				hasMore: offset + limit < filteredEvents.length
			}
		});

	} catch (error) {
		console.error('Error fetching webhook events:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

// Webhook receiver endpoint for incoming data from Systeme.io
export const POST: RequestHandler = async ({ request }) => {
	try {
		const signature = request.headers.get('x-systeme-signature');
		const eventType = request.headers.get('x-systeme-event');
		const payload = await request.json();

		console.log(`Received webhook from Systeme.io: ${eventType}`, payload);

		// Verify webhook signature (in production)
		// const isValidSignature = verifySystemeSignature(payload, signature, process.env.SYSTEME_WEBHOOK_SECRET);
		// if (!isValidSignature) {
		//     return json({ error: 'Invalid signature' }, { status: 401 });
		// }

		// Process different Systeme.io events
		let processResult = null;

		switch (eventType) {
			case 'contact.created':
				processResult = await processContactCreated(payload);
				break;

			case 'workflow.triggered':
				processResult = await processWorkflowTriggered(payload);
				break;

			case 'email.sent':
				processResult = await processEmailSent(payload);
				break;

			case 'contact.updated':
				processResult = await processContactUpdated(payload);
				break;

			default:
				console.log(`Unknown Systeme.io event type: ${eventType}`);
		}

		// Log the incoming webhook event
		const eventLog = {
			id: `incoming_${Date.now()}`,
			source: 'systeme.io',
			event: eventType || 'unknown',
			status: 'received',
			timestamp: new Date().toISOString(),
			payload,
			processed: processResult !== null
		};

		console.log('Incoming webhook logged:', eventLog);

		return json({
			received: true,
			event: eventType,
			processed: processResult !== null,
			message: 'Webhook received and processed successfully'
		});

	} catch (error) {
		console.error('Error processing incoming webhook:', error);
		return json(
			{ error: 'Webhook processing failed' },
			{ status: 500 }
		);
	}
};

async function processContactCreated(payload: any) {
	console.log('Processing contact.created:', payload.email);

	// Update local lead record with Systeme.io contact ID
	// In production, update database

	return { action: 'contact_linked', email: payload.email };
}

async function processWorkflowTriggered(payload: any) {
	console.log('Processing workflow.triggered:', payload.workflow_name);

	// Update lead status based on workflow type
	// Trigger additional actions if needed

	return { action: 'workflow_acknowledged', workflow: payload.workflow_name };
}

async function processEmailSent(payload: any) {
	console.log('Processing email.sent:', payload.subject);

	// Track email delivery for lead engagement
	// Update engagement metrics

	return { action: 'email_tracked', subject: payload.subject };
}

async function processContactUpdated(payload: any) {
	console.log('Processing contact.updated:', payload.email);

	// Sync contact updates back to local database

	return { action: 'contact_synced', email: payload.email };
}