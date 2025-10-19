import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth/middleware';

export const load: PageServerLoad = async (event) => {
	// Only ADMIN and SUPER_ADMIN can access integrations
	await requireRole(event, ['ADMIN', 'SUPER_ADMIN']);

	return {};
};
