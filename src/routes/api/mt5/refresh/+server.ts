import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mcpClient } from '$lib/services/mcpClient';

export const POST: RequestHandler = async ({ request }) => {
	try {
		console.log('Triggering MT5 data refresh via MCP server...');

		// Check MCP server health first
		const health = await mcpClient.healthCheck();
		console.log('MCP server health:', health);

		// Trigger account data refresh
		const accountData = await mcpClient.getAccountData();

		return json({
			success: true,
			message: 'MT5 data refresh triggered',
			data: accountData,
			mcpServerStatus: health.status,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Error refreshing MT5 data:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to refresh MT5 data',
			details: 'Make sure MCP server is running and browser is initialized'
		}, { status: 500 });
	}
};