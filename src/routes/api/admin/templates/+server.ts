import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

/**
 * GET /api/admin/templates
 * List all ad templates (admin only)
 */
export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		// Check admin role
		if (locals.user.role !== 'ADMIN') {
			throw svelteError(403, 'Admin access required');
		}

		// Get all templates, ordered by most recent first
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

		return json({ templates });
	} catch (error) {
		console.error('Error fetching templates:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to fetch templates');
	}
};

/**
 * POST /api/admin/templates
 * Create a new ad template (admin only)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		// Check admin role
		if (locals.user.role !== 'ADMIN') {
			throw svelteError(403, 'Admin access required');
		}

		// Parse request body
		const body = await request.json();
		const { name, description, category, templateData, thumbnailUrl, isActive, isPublic } = body;

		// Validate required fields
		if (!name || !category || !templateData) {
			throw svelteError(400, 'Missing required fields: name, category, templateData');
		}

		// Validate category
		const validCategories = ['lead_generation', 'conversion', 'awareness'];
		if (!validCategories.includes(category)) {
			throw svelteError(400, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
		}

		// Validate templateData structure
		if (!templateData.objective || !templateData.callToAction) {
			throw svelteError(400, 'templateData must include objective and callToAction');
		}

		// Create template
		const template = await prisma.adTemplate.create({
			data: {
				name,
				description: description || null,
				category,
				templateData,
				thumbnailUrl: thumbnailUrl || null,
				isActive: isActive !== undefined ? isActive : true,
				isPublic: isPublic !== undefined ? isPublic : true,
				createdBy: locals.user.id,
				usageCount: 0
			}
		});

		return json({ template }, { status: 201 });
	} catch (error) {
		console.error('Error creating template:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to create template');
	}
};
