import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeService } from '$lib/services/systemeService';

// POST: Test Systeme.io API connection
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { api_key } = await request.json();

		// Temporarily use provided API key for testing
		const originalKey = process.env.SYSTEME_API_KEY;

		if (api_key) {
			process.env.SYSTEME_API_KEY = api_key;
		}

		try {
			console.log('Testing Systeme.io API connection...');

			// Test the connection
			const testResult = await systemeService.testConnection();

			// Get API stats for additional info
			const apiStats = systemeService.getApiStats();

			if (testResult.success) {
				console.log('Systeme.io API connection test successful:', {
					duration: testResult.duration,
					retries: testResult.retries,
					timestamp: new Date().toISOString()
				});

				return json({
					success: true,
					message: 'Connection test successful',
					connection_info: {
						response_time: testResult.duration,
						retries: testResult.retries,
						api_limits: apiStats.rateLimitInfo
					},
					timestamp: new Date().toISOString()
				});
			} else {
				console.error('Systeme.io API connection test failed:', testResult.error);

				return json({
					success: false,
					error: testResult.error || 'Connection test failed',
					connection_info: {
						retries: testResult.retries,
						api_limits: apiStats.rateLimitInfo
					},
					timestamp: new Date().toISOString()
				}, { status: 400 });
			}

		} finally {
			// Restore original API key
			if (originalKey) {
				process.env.SYSTEME_API_KEY = originalKey;
			} else if (api_key) {
				delete process.env.SYSTEME_API_KEY;
			}
		}

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Connection test error:', errorMessage);

		return json({
			success: false,
			error: 'Connection test failed',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};