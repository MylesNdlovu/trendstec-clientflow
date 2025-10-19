import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import crypto from 'crypto';
import { validateAndSanitize, ValidationError } from '$lib/utils/validation';
import { webhookQueue } from '$lib/utils/webhook-queue';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enhanced Systeme.io webhook receiver with failure recovery
export const POST: RequestHandler = async ({ request }) => {
	try {
		const signature = request.headers.get('x-systeme-signature');
		const eventType = request.headers.get('x-systeme-event') || 'unknown';
		const rawPayload = await request.text();
		let payload;

		try {
			payload = JSON.parse(rawPayload);
		} catch (parseError) {
			console.error('❌ Invalid JSON payload in webhook');
			return json({ error: 'Invalid JSON payload' }, { status: 400 });
		}

		console.log(`🔔 Systeme.io webhook received: ${eventType}`, {
			contact_email: payload.contact?.email || payload.data?.email,
			timestamp: new Date().toISOString()
		});

		// Verify webhook signature for security
		if (!verifySystemeSignature(rawPayload, signature)) {
			console.error('❌ Invalid Systeme.io webhook signature');
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		// Validate webhook payload
		try {
			validateAndSanitize(payload, 'webhookPayload');
		} catch (error) {
			if (error instanceof ValidationError) {
				console.error('❌ Invalid webhook payload:', error.errors);
				// Still process but log validation issues
			}
		}

		// Add event to processing queue for reliable processing
		const eventId = webhookQueue.addEvent(eventType || payload.event, {
			...payload,
			headers: {
				signature,
				eventType,
				timestamp: new Date().toISOString()
			}
		});

		// Attempt immediate processing
		const processed = await webhookQueue.processEvent(eventId, async (eventPayload) => {
			try {
				const result = await processWebhookEvent(eventPayload);
				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';

				// Determine if we should retry based on error type
				const shouldRetry = !errorMessage.includes('validation') &&
								   !errorMessage.includes('signature') &&
								   !errorMessage.includes('unauthorized');

				return {
					success: false,
					error: errorMessage,
					shouldRetry
				};
			}
		});

		return json({
			received: true,
			event: eventType || payload.event,
			event_id: eventId,
			processed_immediately: processed,
			message: processed
				? 'Systeme.io webhook processed successfully'
				: 'Systeme.io webhook queued for processing'
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('❌ Systeme.io webhook processing error:', errorMessage);
		return json({
			error: 'Webhook processing failed',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

async function processWebhookEvent(payload: any): Promise<any> {
	const eventType = payload.headers?.eventType || payload.event;
	let processResult = null;

	// Handle different Systeme.io webhook events
	switch (eventType) {
		case 'lead.created':
		case 'funnel.lead.created':
		case 'contact.created':
			processResult = await handleContactCreated(payload);
			break;

		case 'lead.updated':
		case 'funnel.lead.updated':
		case 'contact.updated':
			processResult = await handleContactUpdated(payload);
			break;

		case 'workflow.completed':
		case 'workflow.triggered':
			processResult = await handleWorkflowEvent(payload);
			break;

		case 'email.opened':
			processResult = await handleEmailOpened(payload);
			break;

		case 'email.clicked':
			processResult = await handleEmailClicked(payload);
			break;

		case 'email.sent':
			processResult = await handleEmailSent(payload);
			break;

		case 'form.submitted':
			processResult = await handleFormSubmitted(payload);
			break;

		case 'tag.added':
		case 'tag.removed':
			processResult = await handleTagChange(payload);
			break;

		case 'purchase.completed':
			processResult = await handlePurchaseCompleted(payload);
			break;

		default:
			console.log(`⚠️ Unhandled Systeme.io event: ${eventType}`);
			processResult = { action: 'ignored', reason: 'unknown_event_type' };
	}

	// Log the webhook event for analytics and debugging
	await logWebhookEvent({
		source: 'systeme.io',
		event: eventType,
		contact_email: payload.contact?.email || payload.data?.email,
		processed: processResult !== null,
		result: processResult,
		timestamp: new Date().toISOString(),
		raw_payload: payload
	});

	return processResult;
}

function verifySystemeSignature(payload: string, signature: string | null): boolean {
	if (!signature || !process.env.SYSTEME_WEBHOOK_SECRET) {
		console.warn('⚠️ Webhook signature verification skipped (no secret configured)');
		return true; // Allow in development
	}

	try {
		const expectedSignature = crypto
			.createHmac('sha256', process.env.SYSTEME_WEBHOOK_SECRET)
			.update(payload)
			.digest('hex');

		return `sha256=${expectedSignature}` === signature;
	} catch (error) {
		console.error('Signature verification error:', error);
		return false;
	}
}

async function handleContactCreated(payload: any) {
	// Support both lead and contact data structures
	const contact = payload.lead || payload.contact || payload.data;

	// Extract email (handle both cases)
	const email = contact.email || contact.Email;

	// Validate email exists
	if (!email) {
		console.error('❌ Cannot create lead from Systeme.io: email is required');
		return {
			action: 'error',
			details: 'Email is required for Systeme.io leads'
		};
	}

	console.log(`👤 New lead/contact created in Systeme.io: ${email}`);

	try {
		// Generate tracking token
		const trackingToken = crypto.randomBytes(32).toString('hex');

		const firstName = contact.first_name || contact.firstName || contact.FirstName || '';
		const lastName = contact.last_name || contact.lastName || contact.LastName || '';
		const phone = contact.phone || contact.Phone || null;

		// Find or create lead
		let lead = await prisma.lead.findFirst({
			where: { email }
		});

		if (!lead) {
			console.log('📋 Creating new lead from Systeme.io');
			lead = await prisma.lead.create({
				data: {
					email,
					firstName,
					lastName,
					phone,
					broker: contact.custom_fields?.broker || contact.Broker || 'Prime XBT',
					source: 'systeme.io',
					status: 'captured',
					trackingToken: trackingToken,
					systemeContactId: contact.id?.toString() || contact.Id?.toString() || null
				}
			});
			console.log('✅ Lead created:', lead.id, 'with token:', trackingToken);
		} else {
			console.log('📋 Lead already exists:', lead.id);
			// Update tracking token if not set
			if (!lead.trackingToken) {
				lead = await prisma.lead.update({
					where: { id: lead.id },
					data: { trackingToken }
				});
			}
		}

		// Create activity record
		await prisma.leadActivity.create({
			data: {
				leadId: lead.id,
				type: 'contact_created',
				description: `Contact created in Systeme.io`,
				metadata: JSON.stringify({ systemeContactId: contact.id })
			}
		});

		// Generate tracking link
		const trackingLink = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/dashboard/forms?token=${lead.trackingToken}`;

		console.log('🔗 Tracking link:', trackingLink);

		return {
			action: 'lead_created',
			email: contact.email,
			leadId: lead.id,
			trackingLink
		};
	} catch (error) {
		console.error('Contact creation processing error:', error);
		return { action: 'error', details: error instanceof Error ? error.message : 'Unknown error' };
	}
}

async function handleContactUpdated(payload: any) {
	const contact = payload.contact || payload.data;
	const changes = payload.changes || [];

	console.log(`📝 Contact updated in Systeme.io: ${contact.email}`);
	console.log('Changes:', changes);

	// If conversion status changed, update our tracking
	if (changes.some((c: any) => c.field === 'conversion_status')) {
		const newStatus = contact.custom_fields?.conversion_status;
		console.log(`🔄 Conversion status changed to: ${newStatus}`);

		// Trigger status-specific actions
		if (newStatus === 'deposited') {
			await triggerDepositCelebration(contact.email);
		} else if (newStatus === 'trading') {
			await triggerTradingSupport(contact.email);
		}
	}

	return {
		action: 'contact_synced',
		email: contact.email,
		changes_processed: changes.length
	};
}

async function handleWorkflowEvent(payload: any) {
	const workflow = payload.workflow || payload.data;
	const contact = payload.contact;

	console.log(`⚡ Workflow event: ${workflow.name}`);

	// Track workflow completions for analytics
	if (payload.event === 'workflow.completed') {
		console.log(`✅ Workflow completed: ${workflow.name} for ${contact?.email}`);

		// Schedule next steps based on workflow type
		if (workflow.name.includes('Welcome')) {
			await scheduleFollowUp(contact.email, 'deposit_reminder', 48); // 48 hours
		} else if (workflow.name.includes('No Deposit')) {
			await prioritizeContact(contact.email, 'deposit_urgency');
		}
	}

	return {
		action: 'workflow_tracked',
		workflow: workflow.name,
		status: payload.event
	};
}

async function handleEmailOpened(payload: any) {
	const contact = payload.contact || payload.data.contact;
	const email = payload.email || payload.data.email;

	console.log(`📧 Email opened by ${contact.email}: ${email.subject}`);

	// Track engagement for lead scoring
	await updateLeadScore(contact.email, 'email_opened', 5);

	return {
		action: 'engagement_tracked',
		type: 'email_opened',
		points: 5
	};
}

async function handleEmailClicked(payload: any) {
	const contact = payload.contact || payload.data.contact;
	const link = payload.link || payload.data.link;

	console.log(`🔗 Email link clicked by ${contact.email}: ${link.url}`);

	// Higher engagement score for clicks
	await updateLeadScore(contact.email, 'email_clicked', 15);

	// Special handling for MT5/broker links
	if (link.url.includes('mt5') || link.url.includes('broker') || link.url.includes('trading')) {
		await prioritizeContact(contact.email, 'trading_interest');
	}

	return {
		action: 'engagement_tracked',
		type: 'email_clicked',
		url: link.url,
		points: 15
	};
}

async function handleEmailSent(payload: any) {
	const contact = payload.contact || payload.data.contact;
	const email = payload.email || payload.data.email;

	console.log(`📤 Email sent to ${contact.email}: ${email.subject}`);

	// Update email delivery stats
	return {
		action: 'email_delivery_tracked',
		email: contact.email,
		subject: email.subject
	};
}

async function handleFormSubmitted(payload: any) {
	const form = payload.form || payload.data.form;
	const contact = payload.contact || payload.data.contact;
	const submission = payload.submission || payload.data;

	console.log(`📋 Form submitted: ${form.name} by ${contact.email}`);

	// If it's an MT5 form, create lead and start scraping immediately
	if (form.name.includes('MT5') || form.name.includes('Investor')) {
		try {
			// Create lead in database with tracking token
			const leadResponse = await fetch(`${process.env.APP_URL || 'http://localhost:5173'}/api/leads`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: contact.email,
					firstName: contact.first_name || submission.first_name,
					lastName: contact.last_name || submission.last_name,
					phone: contact.phone || submission.phone,
					broker: submission.broker || 'Unknown',
					source: 'systeme.io',
					mt5Login: submission.mt5_login,
					mt5Password: submission.investor_password || submission.mt5_password,
					mt5Server: submission.mt5_server || submission.server,
					systemeContactId: contact.id,
					generateToken: true // Request token generation
				})
			});

			const leadResult = await leadResponse.json();

			if (leadResult.success && leadResult.lead) {
				// If MT5 credentials provided, trigger immediate scraping
				if (submission.mt5_login && (submission.investor_password || submission.mt5_password)) {
					console.log(`🤖 Triggering immediate MT5 scraping for ${contact.email}`);

					// Trigger scraping in background (don't wait for completion)
					fetch(`${process.env.APP_URL || 'http://localhost:5173'}/api/scraper/run`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							credentialId: leadResult.lead.investorCredentials?.[0]?.id
						})
					}).catch(err => console.error('Scraping trigger error:', err));
				}

				return {
					action: 'lead_created_and_scraping_started',
					leadId: leadResult.lead.id,
					email: contact.email,
					broker: submission.broker
				};
			}

			return {
				action: 'lead_creation_failed',
				error: leadResult.error
			};

		} catch (error) {
			console.error('MT5 form processing error:', error);
			return {
				action: 'error',
				details: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	return {
		action: 'form_submission_logged',
		form: form.name
	};
}

async function handleTagChange(payload: any) {
	const contact = payload.contact || payload.data.contact;
	const tag = payload.tag || payload.data.tag;
	const action = payload.event === 'tag.added' ? 'added' : 'removed';

	console.log(`🏷️ Tag ${action}: ${tag.name} for ${contact.email}`);

	// Handle special tags
	if (tag.name === 'High-Value' || tag.name === 'VIP') {
		await prioritizeContact(contact.email, 'vip_status');
	} else if (tag.name.includes('Deposit')) {
		await updateConversionStatus(contact.email, 'deposited');
	}

	return {
		action: 'tag_processed',
		tag: tag.name,
		operation: action
	};
}

async function handlePurchaseCompleted(payload: any) {
	const purchase = payload.purchase || payload.data;
	const contact = payload.contact || payload.data.contact;

	console.log(`💰 Purchase completed: ${purchase.product_name} by ${contact.email}`);

	// Handle affiliate program purchases
	await updateLeadScore(contact.email, 'purchase_completed', 100);

	return {
		action: 'purchase_tracked',
		product: purchase.product_name,
		amount: purchase.amount
	};
}

// Utility functions (mock implementations - replace with real logic)
async function triggerDepositCelebration(email: string) {
	console.log(`🎉 Triggering deposit celebration for ${email}`);
}

async function triggerTradingSupport(email: string) {
	console.log(`🚀 Triggering trading support for ${email}`);
}

async function scheduleFollowUp(email: string, type: string, delayHours: number) {
	console.log(`⏰ Scheduling ${type} for ${email} in ${delayHours}h`);
}

async function prioritizeContact(email: string, reason: string) {
	console.log(`⭐ Prioritizing ${email}: ${reason}`);
}

async function updateLeadScore(email: string, action: string, points: number) {
	console.log(`📊 Lead score: ${email} +${points} for ${action}`);
}

async function updateConversionStatus(email: string, status: string) {
	console.log(`🔄 Conversion status: ${email} → ${status}`);
}

async function logWebhookEvent(data: any) {
	console.log(`📝 Webhook event logged:`, {
		source: data.source,
		event: data.event,
		email: data.contact_email,
		processed: data.processed
	});
}

// GET endpoint to verify webhook is accessible
export const GET: RequestHandler = async () => {
	return json({
		message: 'Systeme.io webhook endpoint is active',
		timestamp: new Date().toISOString()
	});
};