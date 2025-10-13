import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Mock forms data
	const forms = [
		{
			id: '1',
			name: 'Newsletter Signup',
			type: 'popup',
			views: 5420,
			submissions: 387,
			conversionRate: 7.14
		},
		{
			id: '2',
			name: 'Contact Form',
			type: 'inline',
			views: 2850,
			submissions: 195,
			conversionRate: 6.84
		},
		{
			id: '3',
			name: 'Free Trial Form',
			type: 'floating',
			views: 1250,
			submissions: 89,
			conversionRate: 7.12
		}
	];

	return json(forms);
};