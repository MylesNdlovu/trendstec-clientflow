import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mcpClient } from '$lib/services/mcpClient';

export const GET: RequestHandler = async ({ url }) => {
	try {
		console.log('Fetching MT5 stats from MCP server...');

		// Get account data from MCP server
		const accountData = await mcpClient.getAccountData();

		// Format the response
		const stats = {
			balance: accountData.data?.balance || 0,
			equity: accountData.data?.equity || 0,
			profit: accountData.data?.profit || 0,
			positions: accountData.data?.positions?.length || 0,
			orders: accountData.data?.orders?.length || 0,
			timestamp: new Date().toISOString(),
			source: 'mcp-server'
		};

		return json(stats);
	} catch (error) {
		console.error('Error fetching MT5 stats:', error);

		// Return error with fallback mock data for development
		return json({
			error: 'MCP server unavailable',
			message: error instanceof Error ? error.message : 'Failed to fetch MT5 stats',
			fallback: true,
			balance: 0,
			equity: 0,
			profit: 0,
			positions: 0,
			orders: 0,
			timestamp: new Date().toISOString()
		}, { status: 503 });
	}
};