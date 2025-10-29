import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/config/database';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const { id } = params;

	// Fetch campaign with ad account
	const campaign = await prisma.adCampaign.findFirst({
		where: {
			id,
			userId: locals.user.id
		},
		include: {
			adAccount: true,
			template: true
		}
	});

	if (!campaign) {
		throw error(404, 'Campaign not found');
	}

	return {
		campaign
	};
};
