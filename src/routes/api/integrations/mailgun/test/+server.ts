import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/config/database';
import Mailgun from 'mailgun.js';
import formData from 'form-data';

const MAILGUN_SETTINGS_KEY = 'mailgun_config';

export const POST: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only admins can test email settings
		if (user.role !== 'ADMIN') {
			return json({ error: 'Forbidden - Admin access required' }, { status: 403 });
		}

		// Get Mailgun settings from database
		const settings = await prisma.settings.findFirst({
			where: {
				key: MAILGUN_SETTINGS_KEY
			}
		});

		if (!settings) {
			return json({
				success: false,
				error: 'Mailgun not configured. Please save your API credentials first.'
			}, { status: 400 });
		}

		const config = JSON.parse(settings.value);

		if (!config.enabled) {
			return json({
				success: false,
				error: 'Mailgun is disabled. Please enable it first.'
			}, { status: 400 });
		}

		if (!config.apiKey || !config.domain) {
			return json({
				success: false,
				error: 'Missing API key or domain configuration'
			}, { status: 400 });
		}

		// Initialize Mailgun client
		const mailgun = new Mailgun(formData);
		const mg = mailgun.client({ username: 'api', key: config.apiKey });

		// Send test email to the admin user
		const testEmail = {
			from: `${config.appName} <${config.fromEmail}>`,
			to: [user.email],
			subject: `Test Email from ${config.appName}`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
						.container { max-width: 600px; margin: 0 auto; padding: 20px; }
						.header { background: linear-gradient(135deg, #FF5722 0%, #FF8A65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
						.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
						.success { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; }
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h1>✅ Mailgun Test Email</h1>
						</div>
						<div class="content">
							<div class="success">
								<strong>Success!</strong> Your Mailgun integration is working correctly.
							</div>
							<h2>Configuration Details:</h2>
							<ul>
								<li><strong>Domain:</strong> ${config.domain}</li>
								<li><strong>From Email:</strong> ${config.fromEmail}</li>
								<li><strong>App Name:</strong> ${config.appName}</li>
							</ul>
							<p>This test email confirms that:</p>
							<ul>
								<li>Your API key is valid</li>
								<li>Your domain is correctly configured</li>
								<li>Emails can be sent successfully</li>
							</ul>
							<p style="margin-top: 30px; color: #666;">You can now use email verification and password reset features!</p>
						</div>
					</div>
				</body>
				</html>
			`,
			text: `Mailgun Test Email - Your Mailgun integration is working correctly! Domain: ${config.domain}, From: ${config.fromEmail}`
		};

		const result = await mg.messages.create(config.domain, testEmail);

		return json({
			success: true,
			message: `Test email sent successfully to ${user.email}`,
			messageId: result.id,
			domain: config.domain
		});

	} catch (error: any) {
		console.error('Mailgun test error:', error);

		let errorMessage = 'Failed to send test email';
		if (error.message?.includes('Forbidden')) {
			errorMessage = 'Invalid API key or unauthorized domain';
		} else if (error.message?.includes('Domain not found')) {
			errorMessage = 'Domain not found. Please check your Mailgun domain configuration.';
		} else if (error.message) {
			errorMessage = error.message;
		}

		return json({
			success: false,
			error: errorMessage,
			details: error.message
		}, { status: 500 });
	}
};
