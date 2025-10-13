import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ fetch }) => {
	try {
		console.log('Starting bulk conversion check...');

		// In production, this would query the database for all active leads
		// For now, we'll simulate with the mock leads from the stats endpoint
		const statsResponse = await fetch('/api/affiliate/stats');
		const statsData = await statsResponse.json();
		const leads = statsData.leads || [];

		let checkedCount = 0;
		let updatedCount = 0;
		let errorCount = 0;

		const results = [];

		// Process each lead
		for (const lead of leads) {
			try {
				checkedCount++;

				// Skip leads without MT5 credentials
				if (!lead.mt5Login || !lead.email) {
					continue;
				}

				console.log(`Checking conversion for lead ${lead.id} (${lead.email})`);

				// Get current MT5 status
				const mt5Response = await fetch(
					`/api/mt5/verify?login=${lead.mt5Login}&broker=${lead.broker}`,
					{ method: 'GET' }
				);

				if (!mt5Response.ok) {
					console.error(`MT5 check failed for ${lead.mt5Login}`);
					errorCount++;
					continue;
				}

				const mt5Data = await mt5Response.json();
				const newStatus = mt5Data.status;
				const hasStatusChanged = lead.status !== newStatus;

				if (hasStatusChanged) {
					updatedCount++;

					// Trigger conversion tracking for status change
					const trackingResponse = await fetch('/api/conversion/track', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							leadId: lead.id,
							email: lead.email,
							mt5Login: lead.mt5Login,
							investorPassword: 'mock-password', // In production, retrieve from secure storage
							broker: lead.broker,
							server: lead.mt5Server
						})
					});

					if (trackingResponse.ok) {
						const trackingData = await trackingResponse.json();
						results.push({
							leadId: lead.id,
							email: lead.email,
							oldStatus: lead.status,
							newStatus,
							commission: trackingData.commission,
							workflowTriggered: trackingData.workflowTriggered
						});

						console.log(`Updated ${lead.email}: ${lead.status} → ${newStatus}`);
					} else {
						errorCount++;
						console.error(`Tracking failed for ${lead.email}`);
					}
				}

				// Rate limiting - don't overwhelm the MT5 servers
				await new Promise(resolve => setTimeout(resolve, 500));

			} catch (error) {
				errorCount++;
				console.error(`Error processing lead ${lead.id}:`, error);
			}
		}

		const summary = {
			totalLeads: leads.length,
			checkedCount,
			updatedCount,
			errorCount,
			results
		};

		console.log('Bulk conversion check completed:', summary);

		return json({
			success: true,
			message: `Bulk conversion check completed. Updated ${updatedCount} of ${checkedCount} leads.`,
			summary
		});

	} catch (error) {
		console.error('Bulk conversion check error:', error);
		return json(
			{ error: 'Internal server error during bulk conversion check' },
			{ status: 500 }
		);
	}
};

// Health check endpoint
export const GET: RequestHandler = async () => {
	return json({
		service: 'Conversion Checker',
		status: 'healthy',
		lastRun: new Date().toISOString(),
		endpoints: {
			'/api/conversion/track': 'Individual conversion tracking',
			'/api/conversion/check-all': 'Bulk conversion checking',
			'/api/mt5/verify': 'MT5 credential verification',
			'/api/affiliate/stats': 'Affiliate statistics'
		}
	});
};