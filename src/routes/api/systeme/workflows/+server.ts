import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock Systeme.io workflows
const systemeWorkflows = [
	{
		id: 'workflow_123',
		name: 'Welcome Email Sequence',
		type: 'email_sequence',
		status: 'active',
		trigger: 'contact_created',
		steps: 3,
		contacts: 145,
		open_rate: 68.2,
		click_rate: 12.4,
		created: new Date('2024-01-15').toISOString(),
		last_modified: new Date('2024-01-18').toISOString()
	},
	{
		id: 'workflow_456',
		name: 'Profitable Account Celebration',
		type: 'conditional',
		status: 'active',
		trigger: 'tag_added',
		steps: 2,
		contacts: 23,
		open_rate: 89.1,
		click_rate: 34.8,
		created: new Date('2024-01-12').toISOString(),
		last_modified: new Date('2024-01-16').toISOString()
	},
	{
		id: 'workflow_789',
		name: 'No Deposit Follow-up',
		type: 'delay_sequence',
		status: 'active',
		trigger: 'tag_added',
		steps: 5,
		contacts: 78,
		open_rate: 45.7,
		click_rate: 8.9,
		created: new Date('2024-01-10').toISOString(),
		last_modified: new Date('2024-01-14').toISOString()
	},
	{
		id: 'workflow_101',
		name: 'Trading Activation Help',
		type: 'email_sequence',
		status: 'paused',
		trigger: 'custom_field_changed',
		steps: 4,
		contacts: 34,
		open_rate: 52.9,
		click_rate: 15.2,
		created: new Date('2024-01-08').toISOString(),
		last_modified: new Date('2024-01-12').toISOString()
	}
];

export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const type = url.searchParams.get('type');

		let filteredWorkflows = [...systemeWorkflows];

		// Apply filters
		if (status) {
			filteredWorkflows = filteredWorkflows.filter(w => w.status === status);
		}

		if (type) {
			filteredWorkflows = filteredWorkflows.filter(w => w.type === type);
		}

		// Sort by last modified (newest first)
		filteredWorkflows.sort((a, b) =>
			new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()
		);

		return json({
			workflows: filteredWorkflows,
			summary: {
				total: filteredWorkflows.length,
				active: filteredWorkflows.filter(w => w.status === 'active').length,
				paused: filteredWorkflows.filter(w => w.status === 'paused').length,
				total_contacts: filteredWorkflows.reduce((sum, w) => sum + w.contacts, 0),
				avg_open_rate: filteredWorkflows.reduce((sum, w) => sum + w.open_rate, 0) / filteredWorkflows.length || 0,
				avg_click_rate: filteredWorkflows.reduce((sum, w) => sum + w.click_rate, 0) / filteredWorkflows.length || 0
			}
		});

	} catch (error) {
		console.error('Error fetching Systeme.io workflows:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const workflowData = await request.json();

		// Validate required fields
		if (!workflowData.name || !workflowData.type || !workflowData.trigger) {
			return json(
				{ error: 'Missing required fields: name, type, trigger' },
				{ status: 400 }
			);
		}

		// In production, create actual Systeme.io workflow via API
		const newWorkflow = await createSystemeWorkflow(workflowData);

		// Mock response
		const workflow = {
			id: `workflow_${Date.now()}`,
			name: workflowData.name,
			type: workflowData.type,
			status: 'active',
			trigger: workflowData.trigger,
			steps: workflowData.steps || 1,
			contacts: 0,
			open_rate: 0,
			click_rate: 0,
			created: new Date().toISOString(),
			last_modified: new Date().toISOString()
		};

		console.log(`Created Systeme.io workflow: ${workflow.name} (${workflow.id})`);

		return json({
			success: true,
			workflow,
			message: 'Workflow created successfully'
		});

	} catch (error) {
		console.error('Error creating Systeme.io workflow:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

async function createSystemeWorkflow(workflowData: any) {
	console.log('Creating Systeme.io workflow:', workflowData.name);

	// In production, make actual API call to Systeme.io
	// const response = await fetch('https://api.systeme.io/workflows', {
	//     method: 'POST',
	//     headers: {
	//         'Authorization': `Bearer ${process.env.SYSTEME_API_KEY}`,
	//         'Content-Type': 'application/json'
	//     },
	//     body: JSON.stringify({
	//         name: workflowData.name,
	//         type: workflowData.type,
	//         trigger: {
	//             type: workflowData.trigger,
	//             conditions: workflowData.conditions || []
	//         },
	//         steps: workflowData.steps || []
	//     })
	// });
	//
	// if (!response.ok) {
	//     throw new Error(`Systeme.io API error: ${response.status}`);
	// }
	//
	// return await response.json();

	// Mock successful creation
	return {
		id: `systeme_${Date.now()}`,
		status: 'created'
	};
}