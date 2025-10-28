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
			template = await prisma.adTemplate.findUnique({
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
			console.error('Error loading template:', error);
		}
	}

	// Load user's Facebook ad account
	const adAccount = await prisma.facebookAdAccount.findUnique({
		where: { userId: locals.user.id }
	});

	return {
		template,
		adAccount,
		userId: locals.user.id
	};
};
