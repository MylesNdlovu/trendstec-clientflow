import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth/middleware';

export const load: PageServerLoad = async (event) => {
	try {
		// Only ADMIN and SUPER_ADMIN can access integrations
		await requireRole(event, ['ADMIN', 'SUPER_ADMIN']);

		// Return the webhook URL for Vercel
		const baseUrl = event.url.origin;

		return {
			webhookUrl: `${baseUrl}/api/webhooks/systeme`,
			metaAdsWebhook: `${baseUrl}/api/facebook/webhook`
		};
	} catch (error) {
		console.error('Integrations page load error:', error);
		throw error;
	}
};
