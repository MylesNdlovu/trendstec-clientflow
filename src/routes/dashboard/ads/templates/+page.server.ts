import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// Check authentication
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	try {
		// Load public, active templates
		const templates = await prisma.adTemplate.findMany({
			where: {
				isActive: true,
				isPublic: true
			},
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				name: true,
				description: true,
				category: true,
				templateData: true,
				thumbnailUrl: true,
				usageCount: true,
				createdAt: true
			}
		});

		return {
			templates
		};
	} catch (error) {
		console.error('Error loading templates:', error);
		// Return empty array on error
		return {
			templates: []
		};
	}
};
