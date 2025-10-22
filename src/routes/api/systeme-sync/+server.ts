import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeService } from '$lib/services/systemeService';
import { validateAndSanitize, ValidationError } from '$lib/utils/validation';
import { webhookQueue } from '$lib/utils/webhook-queue';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';

// POST: Submit MT5 credentials and sync to Systeme.io
export const POST: RequestHandler = async (event) => {
	try {
		// Require authentication to identify which IB this lead belongs to
		const user = await requireAuth(event);
		const rawData = await event.request.json();

		// Validate and sanitize the input data
		let credentials;
		try {
			credentials = validateAndSanitize(rawData, 'mt5Credentials');
		} catch (error) {
			if (error instanceof ValidationError) {
				return json({
					success: false,
					error: 'Invalid credentials data',
					validation_errors: error.errors
				}, { status: 400 });
			}
			throw error;
		}

		console.log('MT5 credentials sync initiated:', {
			email: credentials.email,
			mt5Login: credentials.mt5Login,
			mt5Server: credentials.mt5Server,
			ibUser: user.email,
			ibUserId: user.id,
			timestamp: new Date().toISOString()
		});

		// Perform the sync with Systeme.io (with IB identifier for lead segregation)
		const syncResult = await systemeService.syncMT5Credentials(
			{
				email: credentials.email,
				mt5Login: credentials.mt5Login,
				mt5Server: credentials.mt5Server,
				investorPassword: rawData.investorPassword
			},
			user.id // Pass IB user ID for multi-tenant segregation via tags
		);

		if (!syncResult.success) {
			// Add failed sync to webhook queue for retry
			const eventId = webhookQueue.addEvent('mt5_sync_failed', {
				...credentials,
				error: syncResult.error,
				timestamp: new Date().toISOString()
			});

			return json({
				success: false,
				error: syncResult.error,
				event_id: eventId,
				retry_available: true
			}, { status: 400 });
		}

		// Log successful sync
		console.log('MT5 credentials sync completed successfully:', {
			email: credentials.email,
			contactId: syncResult.data?.contact.id,
			tagsAdded: syncResult.data?.tagsAdded,
			workflowTriggered: syncResult.data?.workflowTriggered,
			retries: syncResult.retries,
			duration: syncResult.duration
		});

		// Add to webhook queue for tracking and monitoring
		webhookQueue.addEvent('mt5_sync_success', {
			...credentials,
			contact_id: syncResult.data?.contact.id,
			tags_added: syncResult.data?.tagsAdded,
			workflow_triggered: syncResult.data?.workflowTriggered,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'MT5 credentials synced successfully',
			data: {
				contact_id: syncResult.data?.contact.id,
				tags_added: syncResult.data?.tagsAdded,
				workflow_triggered: syncResult.data?.workflowTriggered,
				verification_status: 'pending'
			},
			sync_info: {
				retries: syncResult.retries,
				duration: syncResult.duration,
				timestamp: new Date().toISOString()
			}
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('MT5 sync API error:', errorMessage);

		// Add error to webhook queue for monitoring
		webhookQueue.addEvent('mt5_sync_error', {
			error: errorMessage,
			request_data: JSON.stringify(await request.json().catch(() => ({}))),
			timestamp: new Date().toISOString()
		});

		return json({
			success: false,
			error: 'Internal server error during sync',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

// GET: Check MT5 verification status
export const GET: RequestHandler = async ({ url }) => {
	try {
		const email = url.searchParams.get('email');

		if (!email) {
			return json({
				success: false,
				error: 'Email parameter is required'
			}, { status: 400 });
		}

		// Validate email format
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return json({
				success: false,
				error: 'Invalid email format'
			}, { status: 400 });
		}

		console.log('Checking MT5 verification status for:', email);

		// Get verification status from Systeme.io
		const statusResult = await systemeService.getMT5VerificationStatus(email);

		if (!statusResult.success) {
			return json({
				success: false,
				error: statusResult.error,
				contact_found: false
			}, { status: 404 });
		}

		// If contact exists, also get their current MT5 credentials
		let contactDetails = null;
		const contactResult = await systemeService.findContactByEmail(email);
		if (contactResult.success && contactResult.data) {
			contactDetails = {
				contact_id: contactResult.data.id,
				mt5_login: contactResult.data.custom_fields.mt5_login,
				mt5_server: contactResult.data.custom_fields.mt5_server,
				last_update: contactResult.data.custom_fields.mt5_credentials_submitted_at,
				tags: contactResult.data.tags
			};
		}

		return json({
			success: true,
			verification_status: statusResult.data?.verificationStatus,
			has_credentials: statusResult.data?.hasCredentials,
			last_update: statusResult.data?.lastUpdate,
			contact_details: contactDetails,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('MT5 status check error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to check verification status',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

// PUT: Update existing MT5 credentials
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const rawData = await request.json();

		// Validate input
		if (!rawData.email) {
			return json({
				success: false,
				error: 'Email is required'
			}, { status: 400 });
		}

		const { email, mt5Login, mt5Server, investorPassword } = rawData;

		// Find existing contact
		const contactResult = await systemeService.findContactByEmail(email);
		if (!contactResult.success || !contactResult.data) {
			return json({
				success: false,
				error: 'Contact not found in Systeme.io'
			}, { status: 404 });
		}

		// Update credentials
		const updateResult = await systemeService.updateContactMT5Credentials(
			contactResult.data.id,
			{
				email,
				mt5Login: mt5Login || contactResult.data.custom_fields.mt5_login,
				mt5Server: mt5Server || contactResult.data.custom_fields.mt5_server,
				investorPassword
			},
			{
				last_update_source: 'mt5_form_update',
				last_update_timestamp: new Date().toISOString()
			}
		);

		if (!updateResult.success) {
			return json({
				success: false,
				error: updateResult.error
			}, { status: 400 });
		}

		// Add updated tag
		await systemeService.addTagsToContact(contactResult.data.id, ['MT5_Credentials_Updated']);

		console.log('MT5 credentials updated:', {
			email,
			contactId: contactResult.data.id,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'MT5 credentials updated successfully',
			data: updateResult.data,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('MT5 update error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to update credentials',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

// DELETE: Remove MT5 credentials (for testing/admin purposes)
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({
				success: false,
				error: 'Email is required'
			}, { status: 400 });
		}

		// Find contact
		const contactResult = await systemeService.findContactByEmail(email);
		if (!contactResult.success || !contactResult.data) {
			return json({
				success: false,
				error: 'Contact not found'
			}, { status: 404 });
		}

		// Remove MT5-related tags
		const tagsToRemove = [
			'MT5_Credentials_Submitted',
			'MT5_Verified',
			'MT5_Verification_Failed',
			'Ready_For_Verification'
		];

		await systemeService.removeTagsFromContact(contactResult.data.id, tagsToRemove);

		// Clear MT5 custom fields
		const updateResult = await systemeService.updateContactMT5Credentials(
			contactResult.data.id,
			{
				email,
				mt5Login: '',
				mt5Server: ''
			},
			{
				mt5_credentials_removed_at: new Date().toISOString(),
				mt5_credentials_removed_by: 'api_request'
			}
		);

		if (!updateResult.success) {
			return json({
				success: false,
				error: updateResult.error
			}, { status: 400 });
		}

		console.log('MT5 credentials removed:', {
			email,
			contactId: contactResult.data.id,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'MT5 credentials removed successfully',
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('MT5 removal error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to remove credentials',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};