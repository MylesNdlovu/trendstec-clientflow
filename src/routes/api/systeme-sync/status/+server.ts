import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeService } from '$lib/services/systemeService';

// GET: Check detailed MT5 verification status
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

		console.log('Detailed status check for:', email);

		// Get contact information
		const contactResult = await systemeService.findContactByEmail(email);

		if (!contactResult.success) {
			return json({
				success: false,
				error: 'Contact not found in Systeme.io',
				has_credentials: false,
				verification_status: 'not_started'
			}, { status: 404 });
		}

		const contact = contactResult.data;
		if (!contact) {
			return json({
				success: false,
				error: 'Contact not found',
				has_credentials: false,
				verification_status: 'not_started'
			}, { status: 404 });
		}

		// Analyze contact data
		const hasCredentials = !!(contact.custom_fields.mt5_login && contact.custom_fields.mt5_server);

		// Determine verification status from tags
		let verificationStatus: 'not_started' | 'pending' | 'verified' | 'failed' = 'not_started';
		let statusDetails = '';

		if (contact.tags.includes('MT5_Verified')) {
			verificationStatus = 'verified';
			statusDetails = 'MT5 credentials have been verified successfully';
		} else if (contact.tags.includes('MT5_Verification_Failed')) {
			verificationStatus = 'failed';
			statusDetails = 'MT5 credential verification failed - please check your details';
		} else if (contact.tags.includes('MT5_Credentials_Submitted') || contact.tags.includes('Ready_For_Verification')) {
			verificationStatus = 'pending';
			statusDetails = 'MT5 credentials are being verified';
		} else if (hasCredentials) {
			verificationStatus = 'pending';
			statusDetails = 'MT5 credentials found but verification status unclear';
		}

		// Extract MT5 details
		const mt5Details = hasCredentials ? {
			mt5_login: contact.custom_fields.mt5_login,
			mt5_server: contact.custom_fields.mt5_server,
			submitted_at: contact.custom_fields.mt5_credentials_submitted_at,
			last_update: contact.custom_fields.last_mt5_update || contact.updated_at
		} : null;

		// Get related tags
		const mt5Tags = contact.tags.filter(tag =>
			tag.includes('MT5') ||
			tag.includes('Trading') ||
			tag.includes('Verification') ||
			tag.includes('Ready_For')
		);

		// Calculate time since submission
		let timeSinceSubmission = null;
		if (contact.custom_fields.mt5_credentials_submitted_at) {
			const submittedTime = new Date(contact.custom_fields.mt5_credentials_submitted_at);
			const now = new Date();
			const diffMinutes = Math.floor((now.getTime() - submittedTime.getTime()) / (1000 * 60));
			timeSinceSubmission = {
				minutes: diffMinutes,
				formatted: diffMinutes < 60
					? `${diffMinutes} minutes ago`
					: diffMinutes < 1440
					? `${Math.floor(diffMinutes / 60)} hours ago`
					: `${Math.floor(diffMinutes / 1440)} days ago`
			};
		}

		return json({
			success: true,
			contact_id: contact.id,
			email: contact.email,
			has_credentials: hasCredentials,
			verification_status: verificationStatus,
			status_details: statusDetails,
			mt5_details: mt5Details,
			related_tags: mt5Tags,
			time_since_submission: timeSinceSubmission,
			workflow_info: {
				can_trigger_verification: verificationStatus === 'pending',
				next_steps: getNextSteps(verificationStatus, hasCredentials)
			},
			contact_info: {
				first_name: contact.first_name,
				last_name: contact.last_name,
				created_at: contact.created_at,
				updated_at: contact.updated_at
			},
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Detailed status check error:', errorMessage);

		return json({
			success: false,
			error: 'Failed to check detailed status',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

function getNextSteps(status: string, hasCredentials: boolean): string[] {
	switch (status) {
		case 'not_started':
			return [
				'Submit MT5 credentials via the form',
				'Ensure MT5 login and server details are correct',
				'Wait for automatic verification'
			];
		case 'pending':
			return [
				'Verification is in progress',
				'Check your MT5 account is accessible',
				'Wait for email confirmation',
				'Estimated time: 5-10 minutes'
			];
		case 'verified':
			return [
				'MT5 credentials verified successfully',
				'Account monitoring is now active',
				'You will receive automated follow-ups based on trading activity'
			];
		case 'failed':
			return [
				'Please check your MT5 login number',
				'Verify the MT5 server name is correct',
				'Ensure your MT5 account is active',
				'Contact support if issues persist'
			];
		default:
			return ['Unknown status - contact support'];
	}
}