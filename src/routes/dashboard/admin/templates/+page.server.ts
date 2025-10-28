import { redirect, error as svelteError } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// Check authentication
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check admin role
	if (locals.user.role !== 'ADMIN') {
		throw svelteError(403, 'Admin access required');
	}

	try {
		// Load all templates
		const templates = await prisma.adTemplate.findMany({
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				name: true,
				description: true,
				category: true,
				templateData: true,
				thumbnailUrl: true,
				isActive: true,
				isPublic: true,
				createdBy: true,
				usageCount: true,
				createdAt: true,
				updatedAt: true
			}
		});

		return {
			templates
		};
	} catch (error) {
		console.error('Error loading templates:', error);
		throw svelteError(500, 'Failed to load templates');
	}
};
