import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// PUT: Mark commission as paid or unpaid
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { leadId, paid } = await request.json();

		if (!leadId || typeof paid !== 'boolean') {
			return json({
				success: false,
				error: 'Lead ID and paid status (boolean) required'
			}, { status: 400 });
		}

		console.log('Updating commission paid status:', {
			leadId,
			paid,
			timestamp: new Date().toISOString()
		});

		// TODO: Replace with actual database update
		// In a real implementation, you would:
		// await db.leads.update(
		//   { id: leadId },
		//   {
		//     commissionPaid: paid,
		//     commissionPaidAt: paid ? new Date() : null
		//   }
		// );

		return json({
			success: true,
			message: `Commission marked as ${paid ? 'paid' : 'unpaid'}`,
			data: {
				leadId,
				paid,
				updatedAt: new Date().toISOString()
			}
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Commission paid status update error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to update commission paid status',
			details: errorMessage
		}, { status: 500 });
	}
};