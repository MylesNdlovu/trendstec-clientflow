import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';

// GET: Get user's Facebook ad account status
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		const account = await prisma.facebookAdAccount.findFirst({
			where: { userId: user.id },
			orderBy: { createdAt: 'desc' }
		});

		return json({
			success: true,
			account: account || null,
			hasAccount: !!account
		});
	} catch (error) {
		console.error('Error fetching Facebook account:', error);
		return json(
			{ success: false, error: 'Failed to fetch account' },
			{ status: 500 }
		);
	}
};
