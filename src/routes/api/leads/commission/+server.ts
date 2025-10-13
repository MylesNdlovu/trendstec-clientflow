import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// PUT: Update individual lead CPA commission
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { leadId, cpaCommission } = await request.json();

		if (!leadId || typeof cpaCommission !== 'number') {
			return json({
				success: false,
				error: 'Lead ID and valid CPA commission amount required'
			}, { status: 400 });
		}

		// TODO: Replace with actual database update
		// For now, we'll simulate the update
		console.log('Updating CPA commission:', {
			leadId,
			cpaCommission,
			timestamp: new Date().toISOString()
		});

		// In a real implementation, you would:
		// await db.leads.update({ id: leadId }, { cpaCommission });

		return json({
			success: true,
			message: 'CPA commission updated successfully',
			data: {
				leadId,
				cpaCommission
			}
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Commission update error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to update commission',
			details: errorMessage
		}, { status: 500 });
	}
};