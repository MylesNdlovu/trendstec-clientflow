import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

/**
 * GET /api/credentials
 * Get all MT5 credentials with validation status
 */
export const GET: RequestHandler = async () => {
	try {
		const credentials = await prisma.investorCredential.findMany({
			orderBy: [
				{ createdAt: 'desc' }
			],
			select: {
				id: true,
				login: true,
				server: true,
				broker: true,
				isVerified: true,
				verifiedAt: true,
				lastScrapedAt: true,
				balance: true,
				equity: true,
				margin: true,
				profit: true,
				totalVolume: true,
				meetsMinVolume: true,
				scrapingStatus: true,
				scrapingError: true,
				failedAttempts: true,
				maxFailedAttempts: true,
				createdAt: true,
				updatedAt: true
			}
		});

		return json({
			success: true,
			credentials
		});
	} catch (error) {
		console.error('Error fetching credentials:', error);
		return json(
			{
				success: false,
				error: 'Failed to fetch credentials: ' + (error instanceof Error ? error.message : 'Unknown error')
			},
			{ status: 500 }
		);
	}
};
