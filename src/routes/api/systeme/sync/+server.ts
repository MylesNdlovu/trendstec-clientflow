import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SYSTEME_API_KEY = process.env.SYSTEME_API_KEY || '';
const SYSTEME_API_BASE = 'https://api.systeme.io/api/v1';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const { mt5Data, action } = body;

		if (!SYSTEME_API_KEY) {
			console.warn('SYSTEME_API_KEY not configured');
			return json({
				success: false,
				error: 'Systeme.io API key not configured'
			}, { status: 400 });
		}

		// Determine the action based on MT5 data or explicit action
		let systemeAction = action;
		if (!systemeAction && mt5Data) {
			// Auto-determine action based on MT5 data
			if (mt5Data.profit > 1000) {
				systemeAction = 'trigger_profitable_campaign';
			} else if (mt5Data.profit < -500) {
				systemeAction = 'trigger_loss_recovery';
			} else if (mt5Data.positions > 5) {
				systemeAction = 'trigger_high_activity_alert';
			}
		}

		let response;
		switch (systemeAction) {
			case 'trigger_profitable_campaign':
				// Trigger a profitable campaign in Systeme.io
				response = await fetch(`${SYSTEME_API_BASE}/workflows/trigger`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${SYSTEME_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						workflow_id: process.env.SYSTEME_PROFIT_WORKFLOW_ID,
						data: {
							profit: mt5Data?.profit,
							balance: mt5Data?.balance,
							trigger_time: new Date().toISOString()
						}
					})
				});
				break;

			case 'trigger_loss_recovery':
				// Trigger loss recovery sequence
				response = await fetch(`${SYSTEME_API_BASE}/workflows/trigger`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${SYSTEME_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						workflow_id: process.env.SYSTEME_LOSS_WORKFLOW_ID,
						data: {
							loss: Math.abs(mt5Data?.profit || 0),
							balance: mt5Data?.balance,
							trigger_time: new Date().toISOString()
						}
					})
				});
				break;

			case 'trigger_high_activity_alert':
				// Trigger high activity alert
				response = await fetch(`${SYSTEME_API_BASE}/workflows/trigger`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${SYSTEME_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						workflow_id: process.env.SYSTEME_ACTIVITY_WORKFLOW_ID,
						data: {
							positions: mt5Data?.positions,
							balance: mt5Data?.balance,
							trigger_time: new Date().toISOString()
						}
					})
				});
				break;

			case 'add_contact':
				// Add a new contact to Systeme.io
				response = await fetch(`${SYSTEME_API_BASE}/contacts`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${SYSTEME_API_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body.contactData)
				});
				break;

			default:
				// General sync - update contact with MT5 data
				if (body.contactId) {
					response = await fetch(`${SYSTEME_API_BASE}/contacts/${body.contactId}`, {
						method: 'PUT',
						headers: {
							'Authorization': `Bearer ${SYSTEME_API_KEY}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							custom_fields: {
								mt5_balance: mt5Data?.balance,
								mt5_equity: mt5Data?.equity,
								mt5_profit: mt5Data?.profit,
								mt5_positions: mt5Data?.positions,
								last_sync: new Date().toISOString()
							}
						})
					});
				} else {
					// Just ping the API to verify connection
					response = await fetch(`${SYSTEME_API_BASE}/me`, {
						headers: {
							'Authorization': `Bearer ${SYSTEME_API_KEY}`
						}
					});
				}
		}

		if (response && response.ok) {
			const responseData = await response.json().catch(() => ({}));
			return json({
				success: true,
				action: systemeAction,
				data: responseData,
				timestamp: new Date().toISOString()
			});
		} else {
			throw new Error(`Systeme.io API error: ${response?.status} ${response?.statusText}`);
		}

	} catch (error) {
		console.error('Error syncing with Systeme.io:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};