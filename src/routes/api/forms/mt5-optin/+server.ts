import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock MT5 opt-in forms data
let mt5OptinForms = [
	{
		id: 1,
		name: 'Standard MT5 Verification',
		title: 'Complete Your MT5 Verification',
		description: 'To personalize your trading experience and verify your account, please provide your MT5 trading details below.',
		fields: [
			{ name: 'broker_name', label: 'Broker Name', type: 'select', required: true, options: ['IC Markets', 'XM', 'FXTM', 'MetaQuotes', 'Other'] },
			{ name: 'account_number', label: 'MT5 Account Number', type: 'text', required: true },
			{ name: 'investor_password', label: 'Investor Password (Read-only)', type: 'password', required: true },
			{ name: 'server', label: 'Server', type: 'text', required: true, placeholder: 'e.g., ICMarkets-Live01' }
		],
		styling: {
			theme: 'modern',
			primaryColor: '#4F46E5'
		},
		automationTrigger: 'mt5-verification-submitted',
		isActive: true,
		embedCode: '<script>window.MT5VerificationFormId = 1;</script>',
		submissions: 45,
		conversionRate: 78.2,
		createdAt: new Date('2024-01-10T10:00:00Z').toISOString(),
		updatedAt: new Date('2024-01-14T15:30:00Z').toISOString()
	},
	{
		id: 2,
		name: 'Advanced Trader Verification',
		title: 'Advanced Trading Account Verification',
		description: 'As an advanced trader, help us verify your trading experience and account details to unlock premium features.',
		fields: [
			{ name: 'broker_name', label: 'Primary Broker', type: 'select', required: true, options: ['IC Markets', 'XM', 'FXTM', 'Pepperstone', 'Other'] },
			{ name: 'account_number', label: 'MT5 Account Number', type: 'text', required: true },
			{ name: 'investor_password', label: 'Investor Password', type: 'password', required: true },
			{ name: 'server', label: 'Trading Server', type: 'text', required: true },
			{ name: 'trading_experience', label: 'Trading Experience', type: 'select', required: true, options: ['< 1 year', '1-3 years', '3-5 years', '5+ years'] },
			{ name: 'account_type', label: 'Account Type', type: 'select', required: true, options: ['Standard', 'Raw Spread', 'Pro', 'VIP'] }
		],
		styling: {
			theme: 'modern',
			primaryColor: '#7C3AED'
		},
		automationTrigger: 'advanced-mt5-verification-submitted',
		isActive: true,
		embedCode: '<script>window.MT5VerificationFormId = 2;</script>',
		submissions: 23,
		conversionRate: 85.7,
		createdAt: new Date('2024-01-12T14:00:00Z').toISOString(),
		updatedAt: new Date('2024-01-15T09:20:00Z').toISOString()
	}
];

export const GET: RequestHandler = async () => {
	return json(mt5OptinForms);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.json();

		const newForm = {
			...formData,
			id: Math.max(...mt5OptinForms.map(f => f.id || 0)) + 1,
			isActive: true,
			embedCode: `<script>window.MT5VerificationFormId = ${Math.max(...mt5OptinForms.map(f => f.id || 0)) + 1};</script>`,
			submissions: 0,
			conversionRate: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		mt5OptinForms.push(newForm);
		return json(newForm, { status: 201 });
	} catch (error) {
		console.error('Error creating MT5 opt-in form:', error);
		return json({ error: 'Failed to create MT5 opt-in form' }, { status: 500 });
	}
};