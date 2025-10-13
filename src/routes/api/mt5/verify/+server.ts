import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface MT5VerificationRequest {
	login: string;
	password: string;
	server: string;
	broker: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { login, password, server, broker }: MT5VerificationRequest = await request.json();

		if (!login || !password) {
			return json(
				{ error: 'Missing MT5 login or password' },
				{ status: 400 }
			);
		}

		console.log(`Verifying MT5 account: ${login} on ${server} (${broker})`);

		// In production, this would use the MCP MT5 Playwright server
		// For now, we'll simulate different account states based on login number

		// Simulate verification process
		await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

		// Mock different account states based on last digit of login
		const lastDigit = parseInt(login.slice(-1));
		let accountData;

		if (lastDigit === 0) {
			// Failed verification
			return json(
				{ error: 'Invalid MT5 credentials' },
				{ status: 401 }
			);
		} else if (lastDigit <= 3) {
			// Just captured, no deposit
			accountData = {
				login,
				broker,
				server,
				isActive: true,
				balance: 0,
				equity: 0,
				margin: 0,
				freeMargin: 0,
				positions: [],
				hasRecentActivity: false,
				accountType: 'investor',
				currency: 'USD',
				lastActivity: null
			};
		} else if (lastDigit <= 6) {
			// Deposited but not trading
			const balance = 1000 + (lastDigit * 500);
			accountData = {
				login,
				broker,
				server,
				isActive: true,
				balance,
				equity: balance,
				margin: 0,
				freeMargin: balance,
				positions: [],
				hasRecentActivity: false,
				accountType: 'investor',
				currency: 'USD',
				lastActivity: new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString() // Yesterday
			};
		} else {
			// Active trading account
			const balance = 2000 + (lastDigit * 1000);
			const equity = balance + (Math.random() - 0.5) * 500;
			const margin = Math.random() * 200;

			accountData = {
				login,
				broker,
				server,
				isActive: true,
				balance,
				equity,
				margin,
				freeMargin: equity - margin,
				positions: [
					{
						ticket: `${Date.now()}001`,
						symbol: 'EURUSD',
						type: 'BUY',
						volume: 0.1,
						openPrice: 1.0850,
						currentPrice: 1.0865,
						profit: 15.0
					},
					{
						ticket: `${Date.now()}002`,
						symbol: 'GBPUSD',
						type: 'SELL',
						volume: 0.05,
						openPrice: 1.2650,
						currentPrice: 1.2635,
						profit: 7.5
					}
				],
				hasRecentActivity: true,
				accountType: 'investor',
				currency: 'USD',
				lastActivity: new Date().toISOString()
			};
		}

		console.log(`MT5 verification successful for ${login}:`, {
			balance: accountData.balance,
			equity: accountData.equity,
			positions: accountData.positions.length,
			hasActivity: accountData.hasRecentActivity
		});

		return json({
			success: true,
			verified: true,
			account: accountData
		});

	} catch (error) {
		console.error('MT5 verification error:', error);
		return json(
			{ error: 'Internal server error during MT5 verification' },
			{ status: 500 }
		);
	}
};

// Helper endpoint to get current MT5 data for existing accounts
export const GET: RequestHandler = async ({ url }) => {
	const login = url.searchParams.get('login');
	const broker = url.searchParams.get('broker');

	if (!login) {
		return json(
			{ error: 'Missing login parameter' },
			{ status: 400 }
		);
	}

	// Mock current account state
	const lastDigit = parseInt(login.slice(-1));

	if (lastDigit <= 3) {
		return json({
			login,
			broker,
			balance: 0,
			equity: 0,
			positions: [],
			hasRecentActivity: false,
			status: 'no-deposit'
		});
	} else if (lastDigit <= 6) {
		const balance = 1000 + (lastDigit * 500);
		return json({
			login,
			broker,
			balance,
			equity: balance,
			positions: [],
			hasRecentActivity: false,
			status: 'deposited'
		});
	} else {
		const balance = 2000 + (lastDigit * 1000);
		const equity = balance + (Math.random() - 0.5) * 500;

		return json({
			login,
			broker,
			balance,
			equity,
			positions: [
				{
					symbol: 'EURUSD',
					type: 'BUY',
					volume: 0.1,
					profit: Math.random() * 50 - 25
				}
			],
			hasRecentActivity: true,
			status: 'trading'
		});
	}
};