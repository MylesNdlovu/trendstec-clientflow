import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, fetch }) => {
	try {
		const { id } = params;
		const body = await request.json().catch(() => ({}));

		// Mock action lookup (in production, query database)
		const actions = [
			{
				id: 'action_1',
				name: 'Welcome Email Sequence',
				type: 'email',
				trigger: 'captured',
				template: 'welcome_sequence',
				systeme_workflow_id: 'workflow_123',
				active: true
			},
			{
				id: 'action_2',
				name: 'No Deposit Follow-up SMS',
				type: 'sms',
				trigger: 'no_deposit_24h',
				template: 'no_deposit_followup',
				active: true
			}
		];

		const action = actions.find(a => a.id === id);
		if (!action) {
			return json(
				{ error: 'Follow-up action not found' },
				{ status: 404 }
			);
		}

		if (!action.active) {
			return json(
				{ error: 'Action is not active' },
				{ status: 400 }
			);
		}

		console.log(`Triggering follow-up action: ${action.name} (${id})`);

		let result = null;

		// Execute different action types
		switch (action.type) {
			case 'email':
				result = await triggerEmailAction(action, body);
				break;

			case 'sms':
				result = await triggerSmsAction(action, body);
				break;

			case 'workflow':
				result = await triggerWorkflowAction(action, body);
				break;

			case 'webhook':
				result = await triggerWebhookAction(action, body);
				break;

			default:
				return json(
					{ error: 'Unknown action type' },
					{ status: 400 }
				);
		}

		// Update action statistics (in production, save to database)
		action.lastTriggered = new Date().toISOString();
		action.totalTriggers = (action.totalTriggers || 0) + 1;

		return json({
			success: true,
			action: {
				id: action.id,
				name: action.name,
				type: action.type
			},
			result,
			triggered_at: new Date().toISOString(),
			message: `${action.name} triggered successfully`
		});

	} catch (error) {
		console.error('Error triggering follow-up action:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};

async function triggerEmailAction(action: any, data: any) {
	console.log(`Triggering email action: ${action.name}`);

	// In production, integrate with email service (SendGrid, Mailgun, etc.)
	// or trigger Systeme.io email workflow

	const recipients = data.recipients || data.leads || [];
	const emailsSent = [];

	if (action.systeme_workflow_id) {
		// Trigger Systeme.io workflow
		console.log(`Triggering Systeme.io workflow: ${action.systeme_workflow_id}`);

		for (const recipient of recipients) {
			// Mock Systeme.io API call
			emailsSent.push({
				email: recipient.email,
				status: 'sent',
				workflow_id: action.systeme_workflow_id,
				sent_at: new Date().toISOString()
			});
		}
	} else {
		// Direct email sending
		for (const recipient of recipients) {
			emailsSent.push({
				email: recipient.email,
				status: 'sent',
				template: action.template,
				sent_at: new Date().toISOString()
			});
		}
	}

	return {
		type: 'email',
		emails_sent: emailsSent.length,
		details: emailsSent
	};
}

async function triggerSmsAction(action: any, data: any) {
	console.log(`Triggering SMS action: ${action.name}`);

	// In production, integrate with SMS service (Twilio, etc.)
	const recipients = data.recipients || data.leads || [];
	const smsSent = [];

	for (const recipient of recipients) {
		if (!recipient.phone) {
			console.log(`Skipping SMS for ${recipient.email} - no phone number`);
			continue;
		}

		// Mock SMS sending
		smsSent.push({
			phone: recipient.phone,
			email: recipient.email,
			status: 'sent',
			template: action.template,
			sent_at: new Date().toISOString()
		});
	}

	return {
		type: 'sms',
		sms_sent: smsSent.length,
		details: smsSent
	};
}

async function triggerWorkflowAction(action: any, data: any) {
	console.log(`Triggering workflow action: ${action.name}`);

	if (!action.systeme_workflow_id) {
		throw new Error('No Systeme.io workflow ID configured');
	}

	// Mock Systeme.io workflow trigger
	const recipients = data.recipients || data.leads || [];
	const workflowsTriggered = [];

	for (const recipient of recipients) {
		workflowsTriggered.push({
			email: recipient.email,
			workflow_id: action.systeme_workflow_id,
			status: 'triggered',
			triggered_at: new Date().toISOString()
		});
	}

	return {
		type: 'workflow',
		workflows_triggered: workflowsTriggered.length,
		workflow_id: action.systeme_workflow_id,
		details: workflowsTriggered
	};
}

async function triggerWebhookAction(action: any, data: any) {
	console.log(`Triggering webhook action: ${action.name}`);

	// In production, send to configured webhook URL
	const webhookPayload = {
		action_id: action.id,
		action_name: action.name,
		trigger: action.trigger,
		timestamp: new Date().toISOString(),
		data
	};

	// Mock webhook call
	return {
		type: 'webhook',
		status: 'sent',
		url: action.webhook_url || 'https://example.com/webhook',
		payload: webhookPayload,
		sent_at: new Date().toISOString()
	};
}