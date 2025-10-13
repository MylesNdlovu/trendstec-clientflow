import { mt5Scraper } from './mt5Scraper';

class ScrapingScheduler {
	private intervalId: NodeJS.Timeout | null = null;
	private isRunning = false;

	/**
	 * Start the scraping scheduler
	 * Runs every 30 minutes
	 */
	start() {
		if (this.intervalId) {
			console.log('⚠️ Scraping scheduler already running');
			return;
		}

		console.log('🚀 Starting MT5 scraping scheduler (every 30 minutes)');

		// Run immediately on start
		this.runScrapingJob();

		// Then run every 30 minutes (30 * 60 * 1000 ms)
		this.intervalId = setInterval(() => {
			this.runScrapingJob();
		}, 30 * 60 * 1000);
	}

	/**
	 * Stop the scraping scheduler
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			console.log('🛑 Scraping scheduler stopped');
		}
	}

	/**
	 * Execute the scraping job
	 */
	private async runScrapingJob() {
		if (this.isRunning) {
			console.log('⏭️ Skipping scraping job - previous job still running');
			return;
		}

		this.isRunning = true;
		const startTime = new Date();

		try {
			console.log(`🤖 Starting scheduled MT5 scraping job at ${startTime.toISOString()}`);

			const result = await mt5Scraper.scrapeAllCredentials();

			const endTime = new Date();
			const duration = (endTime.getTime() - startTime.getTime()) / 1000;

			console.log(`✅ Scraping job completed in ${duration}s:`, {
				total: result.total,
				successful: result.successful,
				failed: result.failed,
				timestamp: endTime.toISOString()
			});
		} catch (error) {
			console.error('❌ Scraping job failed:', error);
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Get scheduler status
	 */
	getStatus() {
		return {
			isScheduled: this.intervalId !== null,
			isRunning: this.isRunning,
			interval: '30 minutes'
		};
	}
}

export const scrapingScheduler = new ScrapingScheduler();
