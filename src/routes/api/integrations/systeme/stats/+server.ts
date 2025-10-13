import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeService } from '$lib/services/systemeService';
import { webhookQueue } from '$lib/utils/webhook-queue';

// GET: Get comprehensive integration statistics
export const GET: RequestHandler = async () => {
	try {
		// Get API client statistics
		const apiStats = systemeService.getApiStats();
		const failedRequests = systemeService.getFailedRequests();

		// Get webhook queue statistics
		const queueStats = webhookQueue.getQueueStats();

		// Get system health indicators
		const healthIndicators = {
			api_connection: process.env.SYSTEME_API_KEY ? 'configured' : 'not_configured',
			webhook_secret: process.env.SYSTEME_WEBHOOK_SECRET ? 'configured' : 'not_configured',
			failed_request_count: Object.values(failedRequests).reduce((sum, queue) => sum + queue.length, 0),
			pending_webhooks: queueStats.pending,
			dead_letter_events: queueStats.deadLetter
		};

		// Calculate overall health score
		const healthFactors = [
			healthIndicators.api_connection === 'configured' ? 1 : 0,
			healthIndicators.failed_request_count === 0 ? 1 : 0,
			healthIndicators.pending_webhooks < 10 ? 1 : 0,
			healthIndicators.dead_letter_events === 0 ? 1 : 0
		];

		const healthScore = Math.round((healthFactors.reduce((sum, factor) => sum + factor, 0) / healthFactors.length) * 100);

		return json({
			success: true,
			api_stats: apiStats,
			failed_requests: failedRequests,
			webhook_stats: queueStats,
			health_indicators: healthIndicators,
			health_score: healthScore,
			recommendations: generateRecommendations(healthIndicators, apiStats, queueStats),
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Stats fetch error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to fetch integration statistics',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

function generateRecommendations(
	health: any,
	apiStats: any,
	queueStats: any
): string[] {
	const recommendations = [];

	// API Configuration
	if (health.api_connection !== 'configured') {
		recommendations.push('Configure Systeme.io API key for integration');
	}

	if (health.webhook_secret !== 'configured') {
		recommendations.push('Add webhook secret for enhanced security');
	}

	// Performance Issues
	if (health.failed_request_count > 0) {
		recommendations.push(`Retry ${health.failed_request_count} failed API requests`);
	}

	if (health.pending_webhooks > 5) {
		recommendations.push(`Review ${health.pending_webhooks} pending webhook events`);
	}

	if (health.dead_letter_events > 0) {
		recommendations.push(`Investigate ${health.dead_letter_events} dead letter events`);
	}

	// Rate Limiting
	const rateLimitUsage = apiStats.rateLimitInfo.currentRequests / apiStats.rateLimitInfo.maxRequests;
	if (rateLimitUsage > 0.8) {
		recommendations.push('High API usage detected - consider rate limiting optimization');
	}

	// Queue Health
	if (queueStats.processing > 10) {
		recommendations.push('High number of processing events - monitor queue performance');
	}

	// Success case
	if (recommendations.length === 0) {
		recommendations.push('Integration is healthy - no action required');
	}

	return recommendations;
}