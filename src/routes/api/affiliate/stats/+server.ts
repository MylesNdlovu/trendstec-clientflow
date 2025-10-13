import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		// Mock data for now - in production this would come from database
		// and real MT5 verification through Playwright
		const mockLeads = [
			{
				id: '1',
				email: 'john.doe@email.com',
				firstName: 'John',
				lastName: 'Doe',
				broker: 'IC Markets',
				status: 'trading',
				capturedAt: new Date('2024-01-15'),
				depositedAt: new Date('2024-01-16'),
				firstTradeAt: new Date('2024-01-17'),
				mt5Login: '12345678',
				cpaCommission: 250,
				commissionPaid: true,
				lastVerified: new Date('2024-01-30'),
				mt5Data: {
					hasDeposited: true,
					depositAmount: 1000,
					hasTraded: true,
					totalLots: 15.75,
					tradesCount: 23,
					lastTradeDate: new Date('2024-01-29'),
					currentBalance: 1250,
					currentEquity: 1245
				}
			},
			{
				id: '2',
				email: 'sarah.smith@email.com',
				firstName: 'Sarah',
				lastName: 'Smith',
				broker: 'Pepperstone',
				status: 'deposited',
				capturedAt: new Date('2024-01-20'),
				depositedAt: new Date('2024-01-21'),
				firstTradeAt: null,
				mt5Login: '87654321',
				cpaCommission: 150,
				commissionPaid: false,
				lastVerified: new Date('2024-01-30'),
				mt5Data: {
					hasDeposited: true,
					depositAmount: 500,
					hasTraded: false,
					totalLots: 0,
					tradesCount: 0,
					lastTradeDate: null,
					currentBalance: 500,
					currentEquity: 500
				}
			},
			{
				id: '3',
				email: 'mike.johnson@email.com',
				firstName: 'Mike',
				lastName: 'Johnson',
				broker: 'OANDA',
				status: 'captured',
				capturedAt: new Date('2024-01-25'),
				depositedAt: null,
				firstTradeAt: null,
				mt5Login: '11223344',
				cpaCommission: 200,
				commissionPaid: false,
				lastVerified: new Date('2024-01-30'),
				mt5Data: {
					hasDeposited: false,
					depositAmount: 0,
					hasTraded: false,
					totalLots: 0,
					tradesCount: 0,
					lastTradeDate: null,
					currentBalance: 0,
					currentEquity: 0
				}
			},
			{
				id: '4',
				email: 'emily.davis@email.com',
				firstName: 'Emily',
				lastName: 'Davis',
				broker: 'IG',
				status: 'trading',
				capturedAt: new Date('2024-01-18'),
				depositedAt: new Date('2024-01-19'),
				firstTradeAt: new Date('2024-01-20'),
				mt5Login: '44332211',
				cpaCommission: 300,
				commissionPaid: true,
				lastVerified: new Date('2024-01-30'),
				mt5Data: {
					hasDeposited: true,
					depositAmount: 2000,
					hasTraded: true,
					totalLots: 45.25,
					tradesCount: 67,
					lastTradeDate: new Date('2024-01-29'),
					currentBalance: 2890,
					currentEquity: 2875
				}
			},
			{
				id: '5',
				email: 'david.wilson@email.com',
				firstName: 'David',
				lastName: 'Wilson',
				broker: 'XM',
				status: 'deposited',
				capturedAt: new Date('2024-01-22'),
				depositedAt: new Date('2024-01-23'),
				firstTradeAt: null,
				mt5Login: '55667788',
				cpaCommission: 175,
				commissionPaid: false,
				lastVerified: new Date('2024-01-30'),
				mt5Data: {
					hasDeposited: true,
					depositAmount: 750,
					hasTraded: false,
					totalLots: 0,
					tradesCount: 0,
					lastTradeDate: null,
					currentBalance: 750,
					currentEquity: 750
				}
			},
			{
				id: '6',
				email: 'lisa.brown@email.com',
				firstName: 'Lisa',
				lastName: 'Brown',
				broker: 'FXCM',
				status: 'trading',
				capturedAt: new Date('2024-01-10'),
				depositedAt: new Date('2024-01-11'),
				firstTradeAt: new Date('2024-01-12'),
				mt5Login: '99887766',
				cpaCommission: 400,
				commissionPaid: true,
				lastVerified: new Date('2024-01-30'),
				mt5Data: {
					hasDeposited: true,
					depositAmount: 3000,
					hasTraded: true,
					totalLots: 120.50,
					tradesCount: 156,
					lastTradeDate: new Date('2024-01-30'),
					currentBalance: 4250,
					currentEquity: 4230
				}
			}
		];

		// Calculate stats
		const leadsCaptured = mockLeads.length;
		const deposited = mockLeads.filter(lead => lead.status === 'deposited' || lead.status === 'trading').length;
		const tradesMade = mockLeads.filter(lead => lead.status === 'trading').length;
		const notDeposited = mockLeads.filter(lead => lead.status === 'captured').length;
		const notTraded = mockLeads.filter(lead => lead.status === 'deposited').length;
		const totalCommissions = mockLeads.reduce((sum, lead) => sum + lead.cpaCommission, 0);
		const conversionRate = leadsCaptured > 0 ? Math.round((tradesMade / leadsCaptured) * 100) : 0;
		const activeLeads = mockLeads.filter(lead =>
			lead.status === 'deposited' || lead.status === 'trading'
		).length;

		// Recent conversions for dashboard
		const recentConversions = mockLeads
			.filter(lead => lead.status !== 'captured')
			.sort((a, b) => {
				const aDate = lead => lead.firstTradeAt || lead.depositedAt || lead.capturedAt;
				const bDate = lead => lead.firstTradeAt || lead.depositedAt || lead.capturedAt;
				return bDate(b).getTime() - aDate(a).getTime();
			})
			.slice(0, 5)
			.map(lead => ({
				email: lead.email,
				broker: lead.broker,
				status: lead.status,
				timestamp: lead.firstTradeAt || lead.depositedAt || lead.capturedAt
			}));

		return json({
			stats: {
				leadsCaptured,
				deposited,
				tradesMade,
				notDeposited,
				notTraded,
				conversionRate,
				totalCommissions,
				activeLeads
			},
			recentConversions,
			leads: mockLeads
		});
	} catch (error) {
		console.error('Error fetching affiliate stats:', error);
		return json(
			{ error: 'Failed to fetch affiliate statistics' },
			{ status: 500 }
		);
	}
};