import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

/**
 * GET /api/facebook/templates
 * Get public, active ad templates (for users)
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		// Get public, active templates
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

		return json({ templates });
	} catch (error) {
		console.error('Error fetching templates:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to fetch templates');
	}
};
