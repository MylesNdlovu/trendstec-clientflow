import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// Delete the auth cookie
	cookies.delete('auth-token', { path: '/' });

	// Redirect to login page
	throw redirect(303, '/login');
};
