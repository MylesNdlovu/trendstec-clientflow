import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeService } from '$lib/services/systemeService';

// GET: Get current configuration status
export const GET: RequestHandler = async () => {
	try {
		const { SYSTEME_API_KEY, SYSTEME_WEBHOOK_SECRET } = process.env;

		// Test current connection if API key exists
		let connectionStatus = 'unknown';
		if (SYSTEME_API_KEY) {
			try {
				const testResult = await systemeService.testConnection();
				connectionStatus = testResult.success ? 'connected' : 'failed';
			} catch {
				connectionStatus = 'failed';
			}
		}

		return json({
			success: true,
			config: {
				configured: !!SYSTEME_API_KEY,
				apiKey: SYSTEME_API_KEY || '',
				webhookSecret: SYSTEME_WEBHOOK_SECRET ? '••••••••••••••••' : '',
				connectionStatus,
				stats: null // Can be populated with actual stats from database
			},
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Config fetch error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to fetch configuration',
			details: errorMessage
		}, { status: 500 });
	}
};

// POST: Update configuration (in production, this would update environment variables or database)
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { api_key, webhook_secret } = await request.json();

		// In production, you would:
		// 1. Store the API key securely (encrypted in database or update env vars)
		// 2. Validate the API key by testing it
		// 3. Update webhook secret configuration

		// For now, we'll just validate the API key if provided
		if (api_key) {
			// Test the provided API key
			const originalKey = process.env.SYSTEME_API_KEY;

			// Temporarily set the new key for testing
			process.env.SYSTEME_API_KEY = api_key;

			try {
				const testResult = await systemeService.testConnection();

				if (!testResult.success) {
					// Restore original key
					if (originalKey) {
						process.env.SYSTEME_API_KEY = originalKey;
					} else {
						delete process.env.SYSTEME_API_KEY;
					}

					return json({
						success: false,
						error: 'Invalid API key - connection test failed',
						details: testResult.error
					}, { status: 400 });
				}
			} catch (error) {
				// Restore original key
				if (originalKey) {
					process.env.SYSTEME_API_KEY = originalKey;
				} else {
					delete process.env.SYSTEME_API_KEY;
				}

				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				return json({
					success: false,
					error: 'API key validation failed',
					details: errorMessage
				}, { status: 400 });
			}
		}

		// Update webhook secret if provided
		if (webhook_secret !== undefined) {
			if (webhook_secret) {
				process.env.SYSTEME_WEBHOOK_SECRET = webhook_secret;
			} else {
				delete process.env.SYSTEME_WEBHOOK_SECRET;
			}
		}

		console.log('Systeme.io configuration updated:', {
			api_key_updated: !!api_key,
			webhook_secret_updated: webhook_secret !== undefined,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'Configuration updated successfully',
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Config update error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to update configuration',
			details: errorMessage
		}, { status: 500 });
	}
};