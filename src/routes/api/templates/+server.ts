import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock templates data
let templates = [
	{
		id: 1,
		name: 'Welcome Email Sequence',
		type: 'email',
		category: 'welcome',
		subject: 'Welcome to our platform, {firstName}!',
		content: `Hi {firstName},

Welcome to MarketingPro! We're excited to have you on board.

Here's what you can expect:
- Automated lead capture
- Smart workflow automation
- MT5 integration for trading verification
- Advanced analytics and reporting

Let's get started! Click the link below to complete your setup:
{setupLink}

Best regards,
The MarketingPro Team`,
		variables: [
			{ name: 'firstName', defaultValue: 'there' },
			{ name: 'setupLink', defaultValue: 'https://example.com/setup' }
		],
		isActive: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 2,
		name: 'MT5 Verification Follow-up',
		type: 'email',
		category: 'mt5-verification',
		subject: 'Complete your MT5 verification - {firstName}',
		content: `Hi {firstName},

We noticed you haven't completed your MT5 verification yet.

To get the most out of our platform, please:
1. Open your MT5 account
2. Make your first deposit
3. Start trading

Need help? Reply to this email or contact our support team.

Verify Now: {verificationLink}

Best regards,
Trading Support Team`,
		variables: [
			{ name: 'firstName', defaultValue: 'Trader' },
			{ name: 'verificationLink', defaultValue: 'https://example.com/verify' }
		],
		isActive: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 3,
		name: 'SMS Follow-up Reminder',
		type: 'sms',
		category: 'follow-up',
		subject: '',
		content: 'Hi {firstName}! Don\'t miss out on your trading opportunity. Complete your MT5 setup now: {link}',
		variables: [
			{ name: 'firstName', defaultValue: 'there' },
			{ name: 'link', defaultValue: 'https://short.link/mt5' }
		],
		isActive: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	},
	{
		id: 4,
		name: 'DM Engagement Message',
		type: 'dm',
		category: 'nurture',
		subject: '',
		content: `Hey {firstName}! 👋

I saw you signed up for our trading platform. Have you had a chance to explore the MT5 features yet?

I'm here to help if you have any questions about:
- Setting up your account
- Making your first deposit
- Understanding the trading interface

Just reply to this message and I'll get back to you!

Cheers,
{senderName}`,
		variables: [
			{ name: 'firstName', defaultValue: 'there' },
			{ name: 'senderName', defaultValue: 'Support Team' }
		],
		isActive: true,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

export const GET: RequestHandler = async () => {
	return json(templates);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const templateData = await request.json();

		const newTemplate = {
			...templateData,
			id: Math.max(...templates.map(t => t.id || 0)) + 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		templates.push(newTemplate);
		return json(newTemplate, { status: 201 });
	} catch (error) {
		console.error('Error creating template:', error);
		return json({ error: 'Failed to create template' }, { status: 500 });
	}
};