import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';

// GET: Get user's ad campaigns
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		const campaigns = await prisma.adCampaign.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: 'desc' },
			include: {
				template: true
			}
		});

		return json({
			success: true,
			campaigns
		});
	} catch (error) {
		console.error('Error fetching campaigns:', error);
		return json(
			{ success: false, error: 'Failed to fetch campaigns' },
			{ status: 500 }
		);
	}
};
