import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/config/database';

const MAILGUN_SETTINGS_KEY = 'mailgun_config';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only admins can view/edit email settings
		if (user.role !== 'ADMIN') {
			return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
		}

		// Get Mailgun settings from database
		const settings = await prisma.settings.findFirst({
			where: {
				key: MAILGUN_SETTINGS_KEY
			}
		});

		if (!settings) {
			return json({
				success: true,
				config: {
					apiKey: '',
					domain: '',
					fromEmail: '',
					appName: 'ClientFlow',
					enabled: false
				}
			});
		}

		const config = JSON.parse(settings.value);
		return json({
			success: true,
			config
		});
	} catch (error) {
		console.error('Error fetching Mailgun config:', error);
		return json({ error: 'Failed to fetch Mailgun configuration' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only admins can update email settings
		if (user.role !== 'ADMIN') {
			return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
		}

		const body = await request.json();
		const { apiKey, domain, fromEmail, appName, enabled } = body;

		// Validate required fields if enabled
		if (enabled && (!apiKey || !domain || !fromEmail)) {
			return json(
				{ error: 'API Key, Domain, and From Email are required when Mailgun is enabled' },
				{ status: 400 }
			);
		}

		const config = {
			apiKey: apiKey || '',
			domain: domain || '',
			fromEmail: fromEmail || '',
			appName: appName || 'ClientFlow',
			enabled: enabled || false
		};

		// Save to database
		await prisma.settings.upsert({
			where: {
				userId_key: {
					userId: null,
					key: MAILGUN_SETTINGS_KEY
				}
			},
			update: {
				value: JSON.stringify(config),
				updatedAt: new Date()
			},
			create: {
				userId: null,
				key: MAILGUN_SETTINGS_KEY,
				value: JSON.stringify(config)
			}
		});

		return json({
			success: true,
			message: 'Mailgun configuration saved successfully',
			config
		});
	} catch (error) {
		console.error('Error saving Mailgun config:', error);
		return json({ error: 'Failed to save Mailgun configuration' }, { status: 500 });
	}
};
