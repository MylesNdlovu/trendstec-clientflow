import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const response = await fetch(`/api/leads/${params.id}`);
	const result = await response.json();

	if (!result.success) {
		throw new Error(result.error || 'Failed to load lead');
	}

	return {
		lead: result.lead
	};
};
