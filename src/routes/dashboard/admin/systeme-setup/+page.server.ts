import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth/middleware';

export const load: PageServerLoad = async (event) => {
	// Only ADMIN can access Systeme.io setup
	const currentUser = await requireRole(event, ['ADMIN']);

	return {
		currentUserId: currentUser.id,
		currentUserRole: currentUser.role
	};
};
