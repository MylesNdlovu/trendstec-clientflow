import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { webhookQueue } from '$lib/utils/webhook-queue';

// Get webhook queue statistics and events
export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status') as any;
		const limit = url.searchParams.get('limit');

		const stats = webhookQueue.getQueueStats();
		const events = webhookQueue.getEvents(status, limit ? parseInt(limit) : undefined);

		return json({
			success: true,
			stats,
			events,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({
			error: 'Failed to fetch queue data',
			details: errorMessage
		}, { status: 500 });
	}
};

// Manage webhook queue operations
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { action, eventId, olderThanDays } = await request.json();

		let result;

		switch (action) {
			case 'retry_event':
				if (!eventId) {
					return json({ error: 'eventId required for retry_event' }, { status: 400 });
				}
				result = webhookQueue.retryEvent(eventId);
				break;

			case 'purge_old':
				const days = olderThanDays || 30;
				result = webhookQueue.purgeOldEvents(days);
				break;

			case 'clear_dead_letter':
				result = webhookQueue.clearDeadLetterQueue();
				break;

			case 'get_event':
				if (!eventId) {
					return json({ error: 'eventId required for get_event' }, { status: 400 });
				}
				result = webhookQueue.getEvent(eventId);
				break;

			default:
				return json({ error: 'Unknown action' }, { status: 400 });
		}

		return json({
			success: true,
			action,
			result,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({
			error: 'Queue operation failed',
			details: errorMessage
		}, { status: 500 });
	}
};