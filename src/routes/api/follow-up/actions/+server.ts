import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock database for follow-up actions
let followUpActions = [
	{
		id: 'action_1',
		name: 'Welcome Email Sequence',
		type: 'email',
		trigger: 'captured',
		delay: 0,
		active: true,
		template: 'welcome_sequence',
		systeme_workflow_id: 'workflow_123',
		created: new Date('2024-01-15').toISOString(),
		lastTriggered: new Date('2024-01-20').toISOString(),
		totalTriggers: 45,
		successRate: 92.3
	},
	{
		id: 'action_2',
		name: 'No Deposit Follow-up SMS',
		type: 'sms',
		trigger: 'no_deposit_24h',
		delay: 1440, // 24 hours in minutes
		active: true,
		template: 'no_deposit_followup',
		phone_required: true,
		created: new Date('2024-01-10').toISOString(),
		lastTriggered: new Date('2024-01-19').toISOString(),
		totalTriggers: 23,
		successRate: 78.2
	},
	{
		id: 'action_3',
		name: 'Profitable Account Celebration',
		type: 'workflow',
		trigger: 'profitable',
		delay: 0,
		active: true,
		systeme_workflow_id: 'workflow_456',
		created: new Date('2024-01-12').toISOString(),
		lastTriggered: new Date('2024-01-18').toISOString(),
		totalTriggers: 8,
		successRate: 100
	},
	{
		id: 'action_4',
		name: 'Trading Activation Help',
		type: 'email',
		trigger: 'no_trades_24h',
		delay: 1440, // 24 hours
		active: true,
		template: 'trading_help',
		created: new Date('2024-01-08').toISOString(),
		lastTriggered: new Date('2024-01-17').toISOString(),
		totalTriggers: 12,
		successRate: 85.7
	}
];

export const GET: RequestHandler = async ({ url }) => {
	try {
		const type = url.searchParams.get('type');
		const active = url.searchParams.get('active');
		const trigger = url.searchParams.get('trigger');

		let filteredActions = [...followUpActions];

		// Apply filters
		if (type) {
			filteredActions = filteredActions.filter(a => a.type === type);
		}

		if (active !== null) {
			const isActive = active === 'true';
			filteredActions = filteredActions.filter(a => a.active === isActive);
		}

		if (trigger) {
			filteredActions = filteredActions.filter(a => a.trigger === trigger);
		}

		// Sort by creation date (newest first)
		filteredActions.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

		return json(filteredActions);

	} catch (error) {
		console.error('Error fetching follow-up actions:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const actionData = await request.json();

		// Validate required fields
		if (!actionData.name || !actionData.type || !actionData.trigger) {
			return json(
				{ error: 'Missing required fields: name, type, trigger' },
				{ status: 400 }
			);
		}

		// Validate type
		const validTypes = ['email', 'sms', 'workflow', 'webhook'];
		if (!validTypes.includes(actionData.type)) {
			return json(
				{ error: 'Invalid action type' },
				{ status: 400 }
			);
		}

		// Validate trigger
		const validTriggers = [
			'captured', 'no_deposit_24h', 'no_deposit_48h',
			'deposited', 'no_trades_24h', 'trading_started', 'profitable'
		];
		if (!validTriggers.includes(actionData.trigger)) {
			return json(
				{ error: 'Invalid trigger type' },
				{ status: 400 }
			);
		}

		// Create new follow-up action
		const newAction = {
			id: `action_${Date.now()}`,
			name: actionData.name,
			type: actionData.type,
			trigger: actionData.trigger,
			delay: actionData.delay || 0,
			active: actionData.active !== undefined ? actionData.active : true,
			template: actionData.template || '',
			systeme_workflow_id: actionData.systeme_workflow_id || null,
			phone_required: actionData.type === 'sms',
			created: new Date().toISOString(),
			lastTriggered: null,
			totalTriggers: 0,
			successRate: 0
		};

		followUpActions.push(newAction);

		console.log(`Created follow-up action: ${newAction.name} (${newAction.id})`);

		// If it's a Systeme.io workflow, create/link the workflow
		if (newAction.type === 'workflow' && !newAction.systeme_workflow_id) {
			try {
				const workflowResponse = await createSystemeWorkflow(newAction);
				if (workflowResponse?.workflow_id) {
					newAction.systeme_workflow_id = workflowResponse.workflow_id;
				}
			} catch (error) {
				console.error('Failed to create Systeme.io workflow:', error);
			}
		}

		return json({
			success: true,
			action: newAction,
			message: 'Follow-up action created successfully'
		});

	} catch (error) {
		console.error('Error creating follow-up action:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

async function createSystemeWorkflow(action: any) {
	// Mock Systeme.io workflow creation
	console.log(`Creating Systeme.io workflow for action: ${action.name}`);

	// In production, make actual API call to Systeme.io
	// const response = await fetch('https://api.systeme.io/workflows', {
	//     method: 'POST',
	//     headers: {
	//         'Authorization': `Bearer ${process.env.SYSTEME_API_KEY}`,
	//         'Content-Type': 'application/json'
	//     },
	//     body: JSON.stringify({
	//         name: action.name,
	//         trigger: action.trigger,
	//         actions: [
	//             {
	//                 type: 'email',
	//                 template: action.template
	//             }
	//         ]
	//     })
	// });

	// Mock response
	return {
		workflow_id: `systeme_workflow_${Date.now()}`,
		status: 'created'
	};
}