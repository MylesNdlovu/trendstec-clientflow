import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// Check authentication
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	try {
		// Load user's Facebook ad account
		const adAccount = await prisma.facebookAdAccount.findUnique({
			where: { userId: locals.user.id }
		});

		// Load user's campaigns
		const campaigns = await prisma.adCampaign.findMany({
			where: { userId: locals.user.id },
			orderBy: { createdAt: 'desc' }
		});

		return {
			adAccount,
			campaigns
		};
	} catch (error) {
		console.error('[Campaigns Page] Error loading data:', error);
		return {
			adAccount: null,
			campaigns: []
		};
	}
};
