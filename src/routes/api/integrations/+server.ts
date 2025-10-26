import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/config/database';

/**
 * GET /api/integrations
 * Get all integrations
 */
export const GET: RequestHandler = async () => {
	try {
		const integrations = await prisma.integration.findMany({
			orderBy: { createdAt: 'desc' }
		});

		// Parse settings JSON
		const parsedIntegrations = integrations.map(integration => ({
			...integration,
			settings: integration.settings ? JSON.parse(integration.settings) : null
		}));

		return json({ success: true, integrations: parsedIntegrations });
	} catch (error) {
		console.error('Error fetching integrations:', error);
		return json({ success: false, error: 'Failed to fetch integrations' }, { status: 500 });
	}
};

/**
 * POST /api/integrations
 * Create a new integration
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { name, type, apiKey, webhookUrl, settings } = body;

		if (!name || !type) {
			return json({ success: false, error: 'Name and type are required' }, { status: 400 });
		}

		const integration = await prisma.integration.create({
			data: {
				name,
				type,
				status: 'active',
				apiKey: apiKey || null,
				webhookUrl: webhookUrl || null,
				settings: settings ? JSON.stringify(settings) : null
			}
		});

		return json({
			success: true,
			integration: {
				...integration,
				settings: integration.settings ? JSON.parse(integration.settings) : null
			}
		});
	} catch (error) {
		console.error('Error creating integration:', error);
		return json({ success: false, error: 'Failed to create integration' }, { status: 500 });
	}
};

/**
 * PATCH /api/integrations
 * Update an existing integration
 */
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { id, name, type, apiKey, webhookUrl, settings, status } = body;

		if (!id) {
			return json({ success: false, error: 'Integration ID is required' }, { status: 400 });
		}

		const integration = await prisma.integration.update({
			where: { id },
			data: {
				name: name || undefined,
				type: type || undefined,
				status: status || undefined,
				apiKey: apiKey !== undefined ? apiKey : undefined,
				webhookUrl: webhookUrl !== undefined ? webhookUrl : undefined,
				settings: settings ? JSON.stringify(settings) : undefined
			}
		});

		return json({
			success: true,
			integration: {
				...integration,
				settings: integration.settings ? JSON.parse(integration.settings) : null
			}
		});
	} catch (error) {
		console.error('Error updating integration:', error);
		return json({ success: false, error: 'Failed to update integration' }, { status: 500 });
	}
};

/**
 * DELETE /api/integrations
 * Delete an integration
 */
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');

		if (!id) {
			return json({ success: false, error: 'Integration ID is required' }, { status: 400 });
		}

		await prisma.integration.delete({
			where: { id }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting integration:', error);
		return json({ success: false, error: 'Failed to delete integration' }, { status: 500 });
	}
};
