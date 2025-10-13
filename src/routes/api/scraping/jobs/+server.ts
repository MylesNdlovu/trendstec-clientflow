import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Mock scraping jobs data
	const scrapingJobs = [
		{
			id: '1',
			name: 'Competitor Price Monitoring',
			status: 'running',
			targetUrl: 'https://competitor.com/products',
			lastRunAt: '2 hours ago',
			todayCount: 156,
			successRate: 98.5
		},
		{
			id: '2',
			name: 'LinkedIn Lead Collection',
			status: 'paused',
			targetUrl: 'https://linkedin.com/sales-navigator',
			lastRunAt: '1 day ago',
			todayCount: 0,
			successRate: 95.2
		},
		{
			id: '3',
			name: 'Industry News Scraping',
			status: 'running',
			targetUrl: 'https://techcrunch.com',
			lastRunAt: '30 minutes ago',
			todayCount: 47,
			successRate: 99.1
		}
	];

	return json(scrapingJobs);
};