import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock automations data with real workflow structures
let automations = [
	{
		id: 1,
		name: 'Welcome Email Sequence',
		description: 'Automated welcome sequence for new leads from forms',
		isActive: true,
		nodes: [
			{
				id: 'trigger-1',
				type: 'trigger',
				position: { x: 100, y: 100 },
				data: {
					label: 'Form Submission',
					triggerType: 'form_submission',
					formId: 'opt-in-form-1'
				}
			},
			{
				id: 'action-1',
				type: 'action',
				position: { x: 350, y: 100 },
				data: {
					label: 'Send Welcome Email',
					actionType: 'email',
					templateId: 1
				}
			},
			{
				id: 'delay-1',
				type: 'delay',
				position: { x: 600, y: 100 },
				data: {
					label: 'Wait 2 Days',
					duration: 2,
					unit: 'days'
				}
			},
			{
				id: 'action-2',
				type: 'action',
				position: { x: 850, y: 100 },
				data: {
					label: 'Follow-up Email',
					actionType: 'email',
					templateId: 2
				}
			}
		],
		edges: [
			{ id: 'e1', source: 'trigger-1', target: 'action-1', type: 'smoothstep', animated: true },
			{ id: 'e2', source: 'action-1', target: 'delay-1', type: 'smoothstep', animated: true },
			{ id: 'e3', source: 'delay-1', target: 'action-2', type: 'smoothstep', animated: true }
		],
		triggers: ['form_submission'],
		actions: ['email', 'delay', 'email'],
		components: [
			{ type: 'email', name: 'Welcome Email' },
			{ type: 'delay', name: 'Wait 2 Days' },
			{ type: 'email', name: 'Follow-up Email' }
		],
		executions: 1247,
		successRate: 94.2,
		createdAt: new Date('2024-01-10T10:00:00Z').toISOString(),
		updatedAt: new Date('2024-01-15T14:30:00Z').toISOString()
	},
	{
		id: 2,
		name: 'MT5 Verification Flow',
		description: 'Automated MT5 account verification with smart branching',
		isActive: true,
		nodes: [
			{
				id: 'trigger-1',
				type: 'trigger',
				position: { x: 100, y: 150 },
				data: {
					label: 'MT5 Form Submitted',
					triggerType: 'form_submission',
					formId: 'mt5-verification-1'
				}
			},
			{
				id: 'action-1',
				type: 'action',
				position: { x: 350, y: 150 },
				data: {
					label: 'Start MT5 Scraping',
					actionType: 'mt5_check',
					checkType: 'verification'
				}
			},
			{
				id: 'condition-1',
				type: 'condition',
				position: { x: 600, y: 150 },
				data: {
					label: 'Account Verified?',
					field: 'mt5_verified',
					operator: 'equals',
					value: 'true'
				}
			},
			{
				id: 'action-2',
				type: 'action',
				position: { x: 850, y: 50 },
				data: {
					label: 'Success Email',
					actionType: 'email',
					templateId: 3
				}
			},
			{
				id: 'action-3',
				type: 'action',
				position: { x: 850, y: 250 },
				data: {
					label: 'Follow-up SMS',
					actionType: 'sms',
					templateId: 4
				}
			}
		],
		edges: [
			{ id: 'e1', source: 'trigger-1', target: 'action-1', type: 'smoothstep', animated: true },
			{ id: 'e2', source: 'action-1', target: 'condition-1', type: 'smoothstep', animated: true },
			{
				id: 'e3',
				source: 'condition-1',
				target: 'action-2',
				sourceHandle: 'condition-yes',
				type: 'smoothstep',
				animated: true,
				style: 'stroke: #10b981;',
				label: 'YES'
			},
			{
				id: 'e4',
				source: 'condition-1',
				target: 'action-3',
				sourceHandle: 'condition-no',
				type: 'smoothstep',
				animated: true,
				style: 'stroke: #ef4444;',
				label: 'NO'
			}
		],
		triggers: ['form_submission'],
		actions: ['mt5_check', 'condition', 'email', 'sms'],
		components: [
			{ type: 'mt5', name: 'MT5 Check' },
			{ type: 'condition', name: 'Verification Check' },
			{ type: 'email', name: 'Success Email' },
			{ type: 'sms', name: 'Follow-up SMS' }
		],
		executions: 523,
		successRate: 87.6,
		createdAt: new Date('2024-01-12T09:00:00Z').toISOString(),
		updatedAt: new Date('2024-01-15T16:45:00Z').toISOString()
	},
	{
		id: 3,
		name: 'Email Engagement Nurture',
		description: 'Smart nurture campaign based on email engagement patterns',
		isActive: false,
		nodes: [
			{
				id: 'trigger-1',
				type: 'trigger',
				position: { x: 100, y: 150 },
				data: {
					label: 'Email Opened',
					triggerType: 'email_opened',
					templateId: 1
				}
			},
			{
				id: 'delay-1',
				type: 'delay',
				position: { x: 350, y: 150 },
				data: {
					label: 'Wait 3 Days',
					duration: 3,
					unit: 'days'
				}
			},
			{
				id: 'condition-1',
				type: 'condition',
				position: { x: 600, y: 150 },
				data: {
					label: 'Link Clicked?',
					field: 'link_clicked',
					operator: 'equals',
					value: 'true'
				}
			},
			{
				id: 'action-1',
				type: 'action',
				position: { x: 850, y: 50 },
				data: {
					label: 'Send Personal DM',
					actionType: 'dm',
					templateId: 5
				}
			},
			{
				id: 'action-2',
				type: 'action',
				position: { x: 850, y: 250 },
				data: {
					label: 'Nurture Email',
					actionType: 'email',
					templateId: 6
				}
			}
		],
		edges: [
			{ id: 'e1', source: 'trigger-1', target: 'delay-1', type: 'smoothstep', animated: true },
			{ id: 'e2', source: 'delay-1', target: 'condition-1', type: 'smoothstep', animated: true },
			{
				id: 'e3',
				source: 'condition-1',
				target: 'action-1',
				sourceHandle: 'condition-yes',
				type: 'smoothstep',
				animated: true,
				style: 'stroke: #10b981;',
				label: 'Engaged'
			},
			{
				id: 'e4',
				source: 'condition-1',
				target: 'action-2',
				sourceHandle: 'condition-no',
				type: 'smoothstep',
				animated: true,
				style: 'stroke: #ef4444;',
				label: 'Not Engaged'
			}
		],
		triggers: ['email_opened'],
		actions: ['delay', 'condition', 'dm', 'email'],
		components: [
			{ type: 'delay', name: 'Wait 3 Days' },
			{ type: 'condition', name: 'Engagement Check' },
			{ type: 'dm', name: 'Personal DM' },
			{ type: 'email', name: 'Nurture Email' }
		],
		executions: 0,
		successRate: 0,
		createdAt: new Date('2024-01-14T11:00:00Z').toISOString(),
		updatedAt: new Date('2024-01-14T11:00:00Z').toISOString()
	}
];

export const GET: RequestHandler = async () => {
	return json(automations);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const automationData = await request.json();

		// Validate workflow structure
		if (!automationData.nodes || !Array.isArray(automationData.nodes)) {
			return json({ error: 'Invalid workflow structure: nodes required' }, { status: 400 });
		}

		// Check for at least one trigger
		const triggers = automationData.nodes.filter(n => n.type === 'trigger');
		if (triggers.length === 0) {
			return json({ error: 'Workflow must have at least one trigger' }, { status: 400 });
		}

		const newAutomation = {
			...automationData,
			id: Math.max(...automations.map(a => a.id || 0)) + 1,
			isActive: false,
			executions: 0,
			successRate: 0,
			components: extractComponents(automationData),
			triggers: extractTriggers(automationData),
			actions: extractActions(automationData),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		automations.push(newAutomation);

		console.log('Saved automation:', newAutomation.name);
		return json(newAutomation, { status: 201 });
	} catch (error) {
		console.error('Error creating automation:', error);
		return json({ error: 'Failed to create automation' }, { status: 500 });
	}
};

function extractComponents(automation: any) {
	const components = [];

	if (automation.nodes) {
		automation.nodes.forEach((node: any) => {
			if (node.type === 'action' && node.data) {
				components.push({
					type: node.data.actionType,
					name: node.data.label || node.data.actionType
				});
			} else if (node.type === 'condition' && node.data) {
				components.push({
					type: 'condition',
					name: node.data.label || 'Condition'
				});
			} else if (node.type === 'delay' && node.data) {
				components.push({
					type: 'delay',
					name: node.data.label || 'Delay'
				});
			}
		});
	}

	return components;
}

function extractTriggers(automation: any) {
	const triggers = [];

	if (automation.nodes) {
		automation.nodes.forEach((node: any) => {
			if (node.type === 'trigger' && node.data) {
				triggers.push(node.data.triggerType);
			}
		});
	}

	return [...new Set(triggers)]; // Remove duplicates
}

function extractActions(automation: any) {
	const actions = [];

	if (automation.nodes) {
		automation.nodes.forEach((node: any) => {
			if (node.type === 'action' && node.data) {
				actions.push(node.data.actionType);
			} else if (['condition', 'delay'].includes(node.type)) {
				actions.push(node.type);
			}
		});
	}

	return actions;
}