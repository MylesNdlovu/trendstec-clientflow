import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { PrismaClient } from '@prisma/client';

/**
 * Mailgun Email Service
 * Handles all email sending operations using Mailgun API
 * Reads configuration from database settings or environment variables
 */

const prisma = new PrismaClient();
const mailgun = new Mailgun(formData);
const APP_URL = process.env.PUBLIC_APP_URL || 'http://localhost:5173';

interface MailgunConfig {
	apiKey: string;
	domain: string;
	fromEmail: string;
	appName: string;
	enabled: boolean;
}

/**
 * Get Mailgun configuration from database or environment variables
 */
async function getMailgunConfig(): Promise<MailgunConfig | null> {
	try {
		// Try to get config from database first
		const settings = await prisma.settings.findFirst({
			where: { key: 'mailgun_config' }
		});

		if (settings) {
			const config = JSON.parse(settings.value);
			if (config.enabled && config.apiKey && config.domain) {
				return config;
			}
		}
	} catch (error) {
		console.error('Error loading Mailgun config from database:', error);
	}

	// Fallback to environment variables
	const envApiKey = process.env.MAILGUN_API_KEY;
	const envDomain = process.env.MAILGUN_DOMAIN;
	const envFromEmail = process.env.MAILGUN_FROM_EMAIL;
	const envAppName = process.env.MAILGUN_APP_NAME || 'ClientFlow';

	if (envApiKey && envDomain) {
		return {
			apiKey: envApiKey,
			domain: envDomain,
			fromEmail: envFromEmail || `noreply@${envDomain}`,
			appName: envAppName,
			enabled: true
		};
	}

	return null;
}

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * Send email using Mailgun
 */
async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
	const config = await getMailgunConfig();

	if (!config) {
		console.error('Mailgun not configured. Please configure via Integrations page or .env file.');
		return false;
	}

	try {
		const mg = mailgun.client({ username: 'api', key: config.apiKey });

		const result = await mg.messages.create(config.domain, {
			from: `${config.appName} <${config.fromEmail}>`,
			to: [to],
			subject,
			html,
			text: text || stripHtml(html)
		});

		console.log('Email sent successfully:', result.id);
		return true;
	} catch (error) {
		console.error('Failed to send email:', error);
		return false;
	}
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
	const config = await getMailgunConfig();
	const appName = config?.appName || 'ClientFlow';
	const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: linear-gradient(135deg, #FF5722 0%, #FF8A65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
				.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
				.button { display: inline-block; background: #FF5722; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
				.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Welcome to ${appName}!</h1>
				</div>
				<div class="content">
					<h2>Verify Your Email Address</h2>
					<p>Thank you for signing up! Please verify your email address to activate your account.</p>
					<p>Click the button below to verify your email:</p>
					<p style="text-align: center;">
						<a href="${verifyUrl}" class="button">Verify Email Address</a>
					</p>
					<p>Or copy and paste this link into your browser:</p>
					<p style="word-break: break-all; color: #666;">${verifyUrl}</p>
					<p style="margin-top: 30px; color: #666;">This verification link will expire in 24 hours.</p>
				</div>
				<div class="footer">
					<p>If you didn't create an account with ${appName}, you can safely ignore this email.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	return sendEmail({
		to: email,
		subject: `Verify your ${appName} account`,
		html
	});
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
	const config = await getMailgunConfig();
	const appName = config?.appName || 'ClientFlow';
	const resetUrl = `${APP_URL}/reset-password?token=${token}`;

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: linear-gradient(135deg, #FF5722 0%, #FF8A65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
				.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
				.button { display: inline-block; background: #FF5722; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
				.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
				.warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Password Reset Request</h1>
				</div>
				<div class="content">
					<h2>Reset Your Password</h2>
					<p>We received a request to reset your password for your ${appName} account.</p>
					<p>Click the button below to reset your password:</p>
					<p style="text-align: center;">
						<a href="${resetUrl}" class="button">Reset Password</a>
					</p>
					<p>Or copy and paste this link into your browser:</p>
					<p style="word-break: break-all; color: #666;">${resetUrl}</p>
					<div class="warning">
						<strong>Security Notice:</strong> This password reset link will expire in 1 hour for security reasons.
					</div>
					<p style="margin-top: 30px; color: #666;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
				</div>
				<div class="footer">
					<p>For security reasons, never share this link with anyone.</p>
				</div>
			</div>
		</body>
		</html>
	`;

	return sendEmail({
		to: email,
		subject: `Reset your ${appName} password`,
		html
	});
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
	const config = await getMailgunConfig();
	const appName = config?.appName || 'ClientFlow';
	const dashboardUrl = `${APP_URL}/dashboard`;

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: linear-gradient(135deg, #FF5722 0%, #FF8A65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
				.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
				.button { display: inline-block; background: #FF5722; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
				.features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
				.feature { margin: 15px 0; padding-left: 25px; position: relative; }
				.feature:before { content: "✓"; position: absolute; left: 0; color: #FF5722; font-weight: bold; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>Welcome to ${appName}!</h1>
				</div>
				<div class="content">
					<h2>Hi ${name},</h2>
					<p>Your account is now verified and ready to use! 🎉</p>
					<div class="features">
						<h3>What you can do now:</h3>
						<div class="feature">Track and manage your leads</div>
						<div class="feature">Connect MT5 investor accounts</div>
						<div class="feature">Monitor trading volumes and commissions</div>
						<div class="feature">Integrate with Systeme.io</div>
						<div class="feature">Set up automated workflows</div>
					</div>
					<p style="text-align: center;">
						<a href="${dashboardUrl}" class="button">Go to Dashboard</a>
					</p>
				</div>
			</div>
		</body>
		</html>
	`;

	return sendEmail({
		to: email,
		subject: `Welcome to ${appName}!`,
		html
	});
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
	return html
		.replace(/<style[^>]*>.*?<\/style>/gi, '')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}
