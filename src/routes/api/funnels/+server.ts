import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Mock funnels data
	const funnels = [
		{
			id: '1',
			name: 'Lead Generation Funnel',
			status: 'active',
			views: 3420,
			conversions: 245,
			conversionRate: 7.16
		},
		{
			id: '2',
			name: 'Product Sales Funnel',
			status: 'active',
			views: 1850,
			conversions: 127,
			conversionRate: 6.87
		},
		{
			id: '3',
			name: 'Webinar Registration',
			status: 'draft',
			views: 0,
			conversions: 0,
			conversionRate: 0
		}
	];

	return json(funnels);
};