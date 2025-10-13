import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This would be imported from the main templates server file in a real app
// For now, we'll simulate the templates array
let templates = []; // This would be shared or fetched from database

export const GET: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	const template = templates.find(t => t.id === id);

	if (!template) {
		return json({ error: 'Template not found' }, { status: 404 });
	}

	return json(template);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseInt(params.id);
		const templateData = await request.json();

		const templateIndex = templates.findIndex(t => t.id === id);

		if (templateIndex === -1) {
			return json({ error: 'Template not found' }, { status: 404 });
		}

		templates[templateIndex] = {
			...templates[templateIndex],
			...templateData,
			id,
			updatedAt: new Date().toISOString()
		};

		return json(templates[templateIndex]);
	} catch (error) {
		console.error('Error updating template:', error);
		return json({ error: 'Failed to update template' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id);
		const templateIndex = templates.findIndex(t => t.id === id);

		if (templateIndex === -1) {
			return json({ error: 'Template not found' }, { status: 404 });
		}

		templates.splice(templateIndex, 1);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting template:', error);
		return json({ error: 'Failed to delete template' }, { status: 500 });
	}
};