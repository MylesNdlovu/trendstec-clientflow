import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear auth cookie
	cookies.delete('auth-token', { path: '/' });

	// Redirect to login
	throw redirect(303, '/login');
};
