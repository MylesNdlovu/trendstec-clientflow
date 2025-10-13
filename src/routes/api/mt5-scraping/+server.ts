import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock MT5 scraping jobs data
let scrapingJobs = [
	{
		id: 1,
		leadId: 1,
		leadName: 'John Smith',
		leadEmail: 'john.smith@example.com',
		investorPassword: '****1234',
		brokerUrl: 'https://mt5.icmarkets.com',
		status: 'completed',
		scheduledFor: new Date('2024-01-15T10:00:00Z').toISOString(),
		lastRun: new Date('2024-01-15T10:05:00Z').toISOString(),
		isRecurring: true,
		recurringInterval: 'daily',
		data: {
			accountNumber: '123456789',
			balance: 5420.50,
			equity: 5450.30,
			totalTrades: 15,
			lastTradeDate: '2024-01-14',
			isVerified: true,
			deposits: [
				{ date: '2024-01-10', amount: 5000, method: 'Bank Transfer' },
				{ date: '2024-01-12', amount: 500, method: 'Credit Card' }
			],
			trades: [
				{ symbol: 'EURUSD', volume: 0.1, profit: 25.50, openTime: '2024-01-14T09:30:00Z' },
				{ symbol: 'GBPUSD', volume: 0.05, profit: -12.30, openTime: '2024-01-14T11:15:00Z' }
			]
		},
		createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
		updatedAt: new Date('2024-01-15T10:05:00Z').toISOString()
	},
	{
		id: 2,
		leadId: 2,
		leadName: 'Sarah Johnson',
		leadEmail: 'sarah.j@example.com',
		investorPassword: '****5678',
		brokerUrl: 'https://mt5.xm.com',
		status: 'running',
		scheduledFor: new Date('2024-01-15T11:00:00Z').toISOString(),
		lastRun: new Date('2024-01-15T11:02:00Z').toISOString(),
		isRecurring: false,
		recurringInterval: null,
		data: null,
		createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
		updatedAt: new Date('2024-01-15T11:02:00Z').toISOString()
	},
	{
		id: 3,
		leadId: 3,
		leadName: 'Mike Brown',
		leadEmail: 'mike.brown@example.com',
		investorPassword: '****9999',
		brokerUrl: 'https://mt5.fxtm.com',
		status: 'failed',
		scheduledFor: new Date('2024-01-15T08:00:00Z').toISOString(),
		lastRun: new Date('2024-01-15T08:01:00Z').toISOString(),
		isRecurring: true,
		recurringInterval: 'weekly',
		data: null,
		error: 'Invalid credentials or connection timeout',
		createdAt: new Date('2024-01-15T07:45:00Z').toISOString(),
		updatedAt: new Date('2024-01-15T08:01:00Z').toISOString()
	},
	{
		id: 4,
		leadId: 4,
		leadName: 'Lisa Wilson',
		leadEmail: 'lisa.w@example.com',
		investorPassword: '****4321',
		brokerUrl: 'https://mt5.icmarkets.com',
		status: 'scheduled',
		scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
		lastRun: null,
		isRecurring: false,
		recurringInterval: null,
		data: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
];

export const GET: RequestHandler = async () => {
	return json(scrapingJobs);
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const jobData = await request.json();

		// In a real implementation, this would validate the lead exists and schedule the job
		const newJob = {
			...jobData,
			id: Math.max(...scrapingJobs.map(j => j.id || 0)) + 1,
			status: 'scheduled',
			lastRun: null,
			data: null,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Add lead name and email from the leadId (mock lookup)
		const mockLeads = [
			{ id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com' },
			{ id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@example.com' },
			{ id: '3', firstName: 'Mike', lastName: 'Brown', email: 'mike.brown@example.com' },
			{ id: '4', firstName: 'Lisa', lastName: 'Wilson', email: 'lisa.w@example.com' }
		];

		const lead = mockLeads.find(l => l.id === jobData.leadId);
		if (lead) {
			newJob.leadName = `${lead.firstName} ${lead.lastName}`;
			newJob.leadEmail = lead.email;
		}

		scrapingJobs.push(newJob);
		return json(newJob, { status: 201 });
	} catch (error) {
		console.error('Error creating scraping job:', error);
		return json({ error: 'Failed to create scraping job' }, { status: 500 });
	}
};