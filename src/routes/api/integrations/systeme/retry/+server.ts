import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeService } from '$lib/services/systemeService';

// POST: Retry failed API requests
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const { queue_key } = body;

		console.log('Retrying failed Systeme.io API requests:', {
			queue_key: queue_key || 'all',
			timestamp: new Date().toISOString()
		});

		// Get current failed requests before retry
		const failedBefore = systemeService.getFailedRequests();
		const totalFailedBefore = Object.values(failedBefore).reduce((sum, queue) => sum + queue.length, 0);

		if (totalFailedBefore === 0) {
			return json({
				success: true,
				message: 'No failed requests to retry',
				results: {
					attempted: 0,
					successful: 0,
					failed: 0
				},
				timestamp: new Date().toISOString()
			});
		}

		// Attempt to retry failed requests
		const retryResult = await systemeService.retryFailedRequests(queue_key);

		// Get remaining failed requests after retry
		const failedAfter = systemeService.getFailedRequests();
		const totalFailedAfter = Object.values(failedAfter).reduce((sum, queue) => sum + queue.length, 0);

		const totalAttempted = retryResult.success + retryResult.failed;
		const successRate = totalAttempted > 0 ? Math.round((retryResult.success / totalAttempted) * 100) : 0;

		console.log('Retry operation completed:', {
			attempted: totalAttempted,
			successful: retryResult.success,
			failed: retryResult.failed,
			success_rate: successRate,
			remaining_failed: totalFailedAfter,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: `Retry operation completed: ${retryResult.success}/${totalAttempted} successful`,
			results: {
				attempted: totalAttempted,
				successful: retryResult.success,
				failed: retryResult.failed,
				success_rate: successRate
			},
			queue_status: {
				failed_before: totalFailedBefore,
				failed_after: totalFailedAfter,
				cleared: totalFailedBefore - totalFailedAfter
			},
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Retry operation error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to retry requests',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};