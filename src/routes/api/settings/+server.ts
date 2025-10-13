import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

/**
 * GET /api/settings
 * Get all settings or a specific setting by key
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const key = url.searchParams.get('key');
		const userId = url.searchParams.get('userId'); // For user-specific settings

		if (key) {
			// Get specific setting
			const setting = await prisma.settings.findFirst({
				where: {
					userId: userId || null,
					key
				}
			});

			if (!setting) {
				return json({ success: false, error: 'Setting not found' }, { status: 404 });
			}

			return json({
				success: true,
				setting: {
					key: setting.key,
					value: JSON.parse(setting.value)
				}
			});
		}

		// Get all settings
		const settings = await prisma.settings.findMany({
			where: userId ? { userId } : {}
		});

		const settingsMap = settings.reduce((acc, setting) => {
			acc[setting.key] = JSON.parse(setting.value);
			return acc;
		}, {} as Record<string, any>);

		return json({ success: true, settings: settingsMap });
	} catch (error) {
		console.error('Error fetching settings:', error);
		return json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
	}
};

/**
 * POST /api/settings
 * Create or update a setting
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { key, value, userId } = body;

		if (!key || value === undefined) {
			return json({ success: false, error: 'Key and value are required' }, { status: 400 });
		}

		// Check if setting exists
		const existing = await prisma.settings.findFirst({
			where: {
				userId: userId || null,
				key
			}
		});

		let setting;
		if (existing) {
			// Update existing
			setting = await prisma.settings.update({
				where: { id: existing.id },
				data: {
					value: JSON.stringify(value),
					updatedAt: new Date()
				}
			});
		} else {
			// Create new
			setting = await prisma.settings.create({
				data: {
					userId: userId || null,
					key,
					value: JSON.stringify(value)
				}
			});
		}

		return json({
			success: true,
			setting: {
				key: setting.key,
				value: JSON.parse(setting.value)
			}
		});
	} catch (error) {
		console.error('Error saving setting:', error);
		return json({ success: false, error: 'Failed to save setting' }, { status: 500 });
	}
};

/**
 * DELETE /api/settings
 * Delete a setting
 */
export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const key = url.searchParams.get('key');
		const userId = url.searchParams.get('userId');

		if (!key) {
			return json({ success: false, error: 'Key is required' }, { status: 400 });
		}

		await prisma.settings.delete({
			where: {
				userId_key: {
					userId: userId || null,
					key
				}
			}
		});

		return json({ success: true, message: 'Setting deleted' });
	} catch (error) {
		console.error('Error deleting setting:', error);
		return json({ success: false, error: 'Failed to delete setting' }, { status: 500 });
	}
};
