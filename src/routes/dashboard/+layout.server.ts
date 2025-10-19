import type { LayoutServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';

export const load: LayoutServerLoad = async (event) => {
	// Require authentication for all dashboard routes
	const user = await requireAuth(event);

	return {
		user
	};
};