import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// PUT: Bulk update CPA commission for multiple leads
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { leadIds, cpaCommission } = await request.json();

		if (!Array.isArray(leadIds) || leadIds.length === 0 || typeof cpaCommission !== 'number') {
			return json({
				success: false,
				error: 'Lead IDs array and valid CPA commission amount required'
			}, { status: 400 });
		}

		console.log('Bulk updating CPA commission:', {
			leadCount: leadIds.length,
			leadIds,
			cpaCommission,
			timestamp: new Date().toISOString()
		});

		// TODO: Replace with actual database bulk update
		// In a real implementation, you would:
		// await db.leads.updateMany(
		//   { id: { in: leadIds } },
		//   { cpaCommission }
		// );

		return json({
			success: true,
			message: `CPA commission updated for ${leadIds.length} leads`,
			data: {
				updatedCount: leadIds.length,
				leadIds,
				cpaCommission
			}
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Bulk commission update error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to bulk update commissions',
			details: errorMessage
		}, { status: 500 });
	}
};