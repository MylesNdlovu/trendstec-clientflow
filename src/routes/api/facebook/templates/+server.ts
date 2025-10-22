import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';

// GET: Get active ad templates
export const GET: RequestHandler = async (event) => {
	try {
		await requireAuth(event);

		const templates = await prisma.adTemplate.findMany({
			where: {
				isActive: true,
				isPublic: true
			},
			orderBy: { usageCount: 'desc' }
		});

		return json({
			success: true,
			templates
		});
	} catch (error) {
		console.error('Error fetching templates:', error);
		return json(
			{ success: false, error: 'Failed to fetch templates' },
			{ status: 500 }
		);
	}
};
