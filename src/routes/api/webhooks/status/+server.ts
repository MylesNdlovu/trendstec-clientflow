import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Mock webhook status data (in production, query database)
		const webhookStats = {
			active: true,
			total_webhooks: 2,
			active_webhooks: 2,
			inactive_webhooks: 0,
			total_events_today: 47,
			successful_events_today: 44,
			failed_events_today: 3,
			average_response_time: 245,
			uptime_percentage: 98.7,
			last_event: new Date('2024-01-20T10:30:00Z').toISOString(),
			health_status: 'healthy'
		};

		const systemStatus = {
			database: 'healthy',
			systeme_api: 'healthy',
			mt5_connection: 'healthy',
			webhook_delivery: 'healthy'
		};

		const endpoints = {
			'/api/webhooks/events': {
				status: 'active',
				last_request: new Date('2024-01-20T10:30:00Z').toISOString(),
				response_time: 120
			},
			'/api/webhooks/systeme': {
				status: 'active',
				last_request: new Date('2024-01-20T09:15:00Z').toISOString(),
				response_time: 350
			}
		};

		return json({
			status: 'operational',
			webhooks: webhookStats,
			system: systemStatus,
			endpoints,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Error fetching webhook status:', error);
		return json({
			status: 'error',
			error: 'Failed to fetch webhook status',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};