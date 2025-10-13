import type { Handle } from '@sveltejs/kit';
import { scrapingScheduler } from '$lib/services/scrapingScheduler';

// Ensure DATABASE_URL is available for Prisma (fallback to POSTGRES_URL)
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
	process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

// Start the scraping scheduler when the server starts
scrapingScheduler.start();

// Cleanup on server shutdown
if (typeof process !== 'undefined') {
	process.on('SIGTERM', () => {
		scrapingScheduler.stop();
	});

	process.on('SIGINT', () => {
		scrapingScheduler.stop();
		process.exit(0);
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	return await resolve(event);
};
