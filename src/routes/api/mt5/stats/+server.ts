import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This would connect to your MCP server for MT5 data
// For now, returning mock data
export const GET: RequestHandler = async ({ url }) => {
	try {
		// In production, this would use the MCP MT5 Playwright server
		// const mcpResponse = await mcpClient.call('mt5_get_account_data');

		// Mock data for demonstration
		const mockData = {
			balance: Math.floor(Math.random() * 50000) + 10000,
			equity: Math.floor(Math.random() * 55000) + 10000,
			profit: Math.floor(Math.random() * 4000) - 2000,
			positions: Math.floor(Math.random() * 10),
			orders: Math.floor(Math.random() * 5),
			timestamp: new Date().toISOString()
		};

		return json(mockData);
	} catch (error) {
		console.error('Error fetching MT5 stats:', error);
		return json({ error: 'Failed to fetch MT5 stats' }, { status: 500 });
	}
};