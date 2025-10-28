import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Check authentication
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const templateId = url.searchParams.get('templateId');
	let template = null;

	// Load template if ID provided
	if (templateId) {
		try {
			template = await prisma.adTemplate.findFirst({
				where: {
					id: templateId,
					isActive: true,
					isPublic: true
				},
				select: {
					id: true,
					name: true,
					description: true,
					category: true,
					templateData: true
				}
			});
		} catch (error) {
			console.error('[Campaign New Page] Error loading template:', error);
			// Don't throw, just continue without template
		}
	}

	// Load user's Facebook ad account
	let adAccount = null;
	try {
		adAccount = await prisma.facebookAdAccount.findUnique({
			where: { userId: locals.user.id }
		});
	} catch (error) {
		console.error('[Campaign New Page] Error loading ad account:', error);
		// Don't throw, page will show warning that FB not connected
	}

	return {
		template,
		adAccount,
		userId: locals.user.id
	};
};
