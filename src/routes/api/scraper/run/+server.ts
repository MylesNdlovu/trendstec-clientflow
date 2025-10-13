import { json } from '@sveltejs/kit';
import { mt5Scraper } from '$lib/services/mt5Scraper';
import type { RequestHandler } from './$types';

/**
 * POST /api/scraper/run
 * Trigger MT5 scraping for a specific credential or all credentials
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { credentialId } = body;

		let result;

		if (credentialId) {
			// Scrape specific credential
			result = await mt5Scraper.scrapeAccountData(credentialId);
		} else {
			// Scrape all credentials
			result = await mt5Scraper.scrapeAllCredentials();
		}

		return json({ success: true, result });
	} catch (error) {
		console.error('Error running scraper:', error);
		return json(
			{ success: false, error: error instanceof Error ? error.message : 'Scraping failed' },
			{ status: 500 }
		);
	}
};
