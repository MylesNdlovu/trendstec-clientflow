import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/db/client';

/**
 * PUT /api/admin/templates/:id
 * Update an existing ad template (admin only)
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		// Check admin role
		if (locals.user.role !== 'ADMIN') {
			throw svelteError(403, 'Admin access required');
		}

		const { id } = params;

		// Check if template exists
		const existingTemplate = await prisma.adTemplate.findUnique({
			where: { id }
		});

		if (!existingTemplate) {
			throw svelteError(404, 'Template not found');
		}

		// Parse request body
		const body = await request.json();
		const { name, description, category, templateData, thumbnailUrl, isActive, isPublic } = body;

		// Validate category if provided
		if (category) {
			const validCategories = ['lead_generation', 'conversion', 'awareness'];
			if (!validCategories.includes(category)) {
				throw svelteError(400, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
			}
		}

		// Validate templateData structure if provided
		if (templateData && (!templateData.objective || !templateData.callToAction)) {
			throw svelteError(400, 'templateData must include objective and callToAction');
		}

		// Update template
		const template = await prisma.adTemplate.update({
			where: { id },
			data: {
				...(name !== undefined && { name }),
				...(description !== undefined && { description }),
				...(category !== undefined && { category }),
				...(templateData !== undefined && { templateData }),
				...(thumbnailUrl !== undefined && { thumbnailUrl }),
				...(isActive !== undefined && { isActive }),
				...(isPublic !== undefined && { isPublic }),
				updatedAt: new Date()
			}
		});

		return json({ template });
	} catch (error) {
		console.error('Error updating template:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to update template');
	}
};

/**
 * DELETE /api/admin/templates/:id
 * Delete an ad template (admin only)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		// Check admin role
		if (locals.user.role !== 'ADMIN') {
			throw svelteError(403, 'Admin access required');
		}

		const { id } = params;

		// Check if template exists
		const existingTemplate = await prisma.adTemplate.findUnique({
			where: { id }
		});

		if (!existingTemplate) {
			throw svelteError(404, 'Template not found');
		}

		// Check if template is being used by any campaigns
		const campaignsUsingTemplate = await prisma.adCampaign.count({
			where: { templateId: id }
		});

		if (campaignsUsingTemplate > 0) {
			throw svelteError(400, `Cannot delete template: ${campaignsUsingTemplate} campaign(s) are using it`);
		}

		// Delete template
		await prisma.adTemplate.delete({
			where: { id }
		});

		return json({ success: true, message: 'Template deleted successfully' });
	} catch (error) {
		console.error('Error deleting template:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to delete template');
	}
};
