import { json } from '@sveltejs/kit';
import { scrapingScheduler } from '$lib/services/scrapingScheduler';
import type { RequestHandler } from './$types';

/**
 * GET /api/scraper/status
 * Get the status of the scraping scheduler
 */
export const GET: RequestHandler = async () => {
	const status = scrapingScheduler.getStatus();

	return json({
		success: true,
		scheduler: status,
		message: status.isScheduled
			? `Scraping scheduler is active (runs every ${status.interval})`
			: 'Scraping scheduler is not running'
	});
};
