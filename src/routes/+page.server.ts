import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is logged in, redirect to dashboard
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}

	// Otherwise show landing page (which has "Open Dashboard" button that will redirect to login)
	return {};
};
