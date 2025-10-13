import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ConversionData {
	leadId: string;
	email: string;
	mt5Login: string;
	investorPassword: string;
	broker: string;
	server?: string;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { leadId, email, mt5Login, investorPassword, broker, server }: ConversionData = await request.json();

		if (!leadId || !email || !mt5Login || !investorPassword) {
			return json(
				{ error: 'Missing required conversion tracking data' },
				{ status: 400 }
			);
		}

		console.log(`Starting conversion tracking for lead ${leadId}`);

		// Step 1: Verify MT5 credentials with MCP server
		let mt5Status = 'pending';
		let accountData = null;

		try {
			// In production, this would call the MCP MT5 server
			const mt5Response = await fetch('/api/mt5/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					login: mt5Login,
					password: investorPassword,
					server: server || broker,
					broker
				})
			});

			if (mt5Response.ok) {
				accountData = await mt5Response.json();
				mt5Status = accountData.isActive ? 'verified' : 'inactive';
				console.log(`MT5 verification for ${mt5Login}: ${mt5Status}`);
			}
		} catch (error) {
			console.error('MT5 verification failed:', error);
			mt5Status = 'failed';
		}

		// Step 2: Check for deposits and trading activity
		let conversionStatus = 'captured';
		let hasDeposited = false;
		let isTrading = false;
		let commission = 0;

		if (mt5Status === 'verified' && accountData) {
			// Check account balance and equity to determine deposit status
			const balance = accountData.balance || 0;
			const equity = accountData.equity || 0;

			hasDeposited = balance > 0;

			// Check for trading activity (positions or recent trades)
			const positions = accountData.positions || [];
			const hasRecentTrades = accountData.hasRecentActivity || false;

			isTrading = positions.length > 0 || hasRecentTrades;

			// Calculate commission based on status
			if (isTrading) {
				conversionStatus = 'trading';
				commission = calculateCommission(balance, equity);
			} else if (hasDeposited) {
				conversionStatus = 'deposited';
				commission = calculateCommission(balance, equity) * 0.5; // Partial commission
			}
		}

		console.log(`Conversion status for ${email}: ${conversionStatus}, Commission: $${commission}`);

		// Step 3: Trigger appropriate Systeme.io workflow
		let workflowTriggered = null;

		try {
			if (conversionStatus === 'trading') {
				// Trigger profitable/trading workflow
				await triggerSystemeWorkflow('profitable', {
					email,
					leadId,
					status: conversionStatus,
					commission,
					mt5Login,
					broker,
					balance: accountData?.balance || 0
				});
				workflowTriggered = 'profitable';
			} else if (conversionStatus === 'deposited') {
				// Trigger deposit confirmation workflow
				await triggerSystemeWorkflow('deposited', {
					email,
					leadId,
					status: conversionStatus,
					commission,
					mt5Login,
					broker,
					balance: accountData?.balance || 0
				});
				workflowTriggered = 'deposited';
			} else {
				// Trigger follow-up workflow for non-deposited leads
				await triggerSystemeWorkflow('follow-up', {
					email,
					leadId,
					status: conversionStatus,
					mt5Login,
					broker,
					lastCheck: new Date().toISOString()
				});
				workflowTriggered = 'follow-up';
			}
		} catch (error) {
			console.error('Systeme.io workflow trigger failed:', error);
		}

		// Step 4: Update lead record (in production, store in database)
		const updatedLead = {
			leadId,
			email,
			status: conversionStatus,
			mt5Status,
			mt5Login,
			broker,
			commission,
			hasDeposited,
			isTrading,
			lastVerified: new Date().toISOString(),
			workflowTriggered,
			accountData: accountData ? {
				balance: accountData.balance,
				equity: accountData.equity,
				positionsCount: accountData.positions?.length || 0
			} : null
		};

		console.log('Lead updated:', updatedLead);

		return json({
			success: true,
			leadId,
			conversionStatus,
			mt5Status,
			commission,
			workflowTriggered,
			message: `Conversion tracking completed for ${email}`
		});

	} catch (error) {
		console.error('Conversion tracking error:', error);
		return json(
			{ error: 'Internal server error during conversion tracking' },
			{ status: 500 }
		);
	}
};

async function triggerSystemeWorkflow(workflowType: string, data: any) {
	// This would integrate with the actual Systeme.io API
	const workflowIds = {
		profitable: process.env.SYSTEME_PROFIT_WORKFLOW_ID,
		deposited: process.env.SYSTEME_DEPOSIT_WORKFLOW_ID,
		'follow-up': process.env.SYSTEME_FOLLOWUP_WORKFLOW_ID
	};

	const workflowId = workflowIds[workflowType as keyof typeof workflowIds];
	if (!workflowId) {
		console.warn(`No workflow ID configured for ${workflowType}`);
		return;
	}

	// Mock Systeme.io API call
	console.log(`Triggering Systeme.io workflow ${workflowType} (${workflowId}) for ${data.email}`);
	console.log('Workflow data:', data);

	// In production:
	// const response = await fetch(`https://systeme.io/api/workflows/${workflowId}/trigger`, {
	//     method: 'POST',
	//     headers: {
	//         'Authorization': `Bearer ${process.env.SYSTEME_API_KEY}`,
	//         'Content-Type': 'application/json'
	//     },
	//     body: JSON.stringify(data)
	// });
}

function calculateCommission(balance: number, equity: number): number {
	// Simple commission calculation - in production this would be more sophisticated
	if (balance <= 0) return 0;

	// Base commission tiers
	if (balance >= 10000) return 500;
	if (balance >= 5000) return 300;
	if (balance >= 1000) return 150;

	return Math.round(balance * 0.1); // 10% of balance as commission
}