import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Temporary mock user for development
	const user = {
		id: 'demo-user',
		email: 'demo@example.com',
		name: 'Demo User',
		role: 'USER'
	};

	return {
		user
	};
};