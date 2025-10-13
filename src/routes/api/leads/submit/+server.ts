import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '$lib/utils/encryption';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.json();

		// Validate required MT5 credentials
		if (!formData.login || !formData.password || !formData.server || !formData.broker) {
			return json(
				{ error: 'Missing required MT5 fields: login, password, server, and broker' },
				{ status: 400 }
			);
		}

		// Find lead by tracking token (from Systeme.io webhook)
		let lead = null;

		if (formData.leadToken) {
			lead = await prisma.lead.findFirst({
				where: { trackingToken: formData.leadToken }
			});

			if (!lead) {
				return json(
					{ error: 'Invalid or expired tracking link. Please use the link sent to your email.' },
					{ status: 404 }
				);
			}

			console.log('📝 Processing MT5 credential submission:', {
				login: formData.login,
				server: formData.server,
				broker: formData.broker,
				lead: `${lead.firstName} ${lead.lastName} (${lead.email})`,
				leadId: lead.id
			});
		} else {
			// Fallback: allow direct submission without token (for testing)
			console.log('⚠️ No tracking token provided - direct submission');

			if (!formData.email) {
				return json(
					{ error: 'Either tracking token or email is required' },
					{ status: 400 }
				);
			}

			lead = await prisma.lead.findFirst({
				where: { email: formData.email }
			});

			if (!lead) {
				return json(
					{ error: 'Lead not found. Please submit your information through Systeme.io first.' },
					{ status: 404 }
				);
			}

			console.log('📝 Processing MT5 credential submission (no token):', {
				login: formData.login,
				leadEmail: lead.email
			});
		}

		// Check if credential already exists
		const existingCredential = await prisma.investorCredential.findFirst({
			where: {
				login: formData.login,
				server: formData.server,
				broker: formData.broker
			}
		});

		// Encrypt the password before storing
		const encryptedPassword = encrypt(formData.password);

		let credential;
		let isUpdate = false;

		if (existingCredential) {
			// Allow re-submission in these cases:
			// 1. Failed validation (give another chance)
			// 2. Blocked due to max failed attempts (user may have fixed their password)
			// 3. Password update (different password than stored)

			const shouldAllowUpdate =
				existingCredential.scrapingStatus === 'failed' ||
				existingCredential.failedAttempts >= existingCredential.maxFailedAttempts ||
				!existingCredential.isVerified;

			if (shouldAllowUpdate) {
				console.log('🔄 Updating existing credential:', {
					id: existingCredential.id,
					reason: existingCredential.scrapingStatus === 'failed' ? 'Previously failed' :
					        existingCredential.failedAttempts >= existingCredential.maxFailedAttempts ? 'Was blocked' :
					        'Not verified yet'
				});

				// Update the credential with new password and reset status
				credential = await prisma.investorCredential.update({
					where: { id: existingCredential.id },
					data: {
						leadId: lead.id,
						password: encryptedPassword,
						scrapingStatus: 'pending',
						scrapingError: null,
						failedAttempts: 0, // Reset failed attempts
						isVerified: false,
						lastScrapedAt: null
					}
				});

				isUpdate = true;
			} else {
				// Credential exists and is verified/successful
				console.log('⚠️  Credential already verified:', existingCredential.id);
				return json({
					success: false,
					error: 'This MT5 account is already registered and verified',
					credentialId: existingCredential.id
				}, { status: 409 });
			}
		} else {
			// Create new investor credential in database
			credential = await prisma.investorCredential.create({
				data: {
					leadId: lead.id,
					login: formData.login,
					password: encryptedPassword,
					server: formData.server,
					broker: formData.broker,
					isVerified: false,
					scrapingStatus: 'pending'
				}
			});
		}

		console.log(`✅ Credential ${isUpdate ? 'updated' : 'saved'} to database:`, {
			id: credential.id,
			login: credential.login,
			broker: credential.broker,
			server: credential.server,
			leadId: lead.id,
			action: isUpdate ? 'UPDATED' : 'CREATED'
		});

		// Create activity record
		await prisma.leadActivity.create({
			data: {
				leadId: lead.id,
				type: isUpdate ? 'credential_updated' : 'credential_submitted',
				description: `MT5 credentials ${isUpdate ? 'updated' : 'submitted'} for ${formData.broker} (${formData.login})`,
				metadata: JSON.stringify({
					login: formData.login,
					server: formData.server,
					broker: formData.broker,
					credentialId: credential.id
				})
			}
		});

		// TODO: Trigger immediate validation with MCP Playwright for updated credentials
		// This will be handled by the MT5 scraping scheduler

		return json({
			success: true,
			credentialId: credential.id,
			isUpdate,
			message: isUpdate
				? 'MT5 credentials updated successfully. Re-validating...'
				: 'MT5 credentials saved successfully. Validation in progress...'
		});

	} catch (error) {
		console.error('❌ Lead submission error:', error);
		return json(
			{ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
			{ status: 500 }
		);
	}
};