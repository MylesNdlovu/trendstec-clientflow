import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';
import { mcpClient } from '$lib/services/mcpClient';

const prisma = new PrismaClient();

interface ValidationRequest {
	login: string;
	password: string;
	server: string;
	broker?: string;
}

interface ValidationResponse {
	valid: boolean;
	error?: string;
	errorType?: 'connection' | 'credentials' | 'server' | 'timeout' | 'unknown';
	details?: {
		accountNumber?: string;
		balance?: number;
		equity?: number;
		hasDeposits?: boolean;
		hasTrades?: boolean;
		note?: string;
	};
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: ValidationRequest = await request.json();
		const { login, password, server, broker } = body;

		// Validate required fields
		if (!login || !password || !server) {
			return json({
				valid: false,
				error: 'Missing required fields: login, password, and server are required',
				errorType: 'credentials'
			} as ValidationResponse, { status: 400 });
		}

		// Get MT5 URL from settings
		const mt5Url = await getMT5Url(server, broker);

		// Use MCP server for validation (works on both local and production)
		try {
			console.log(`Validating MT5 credentials via MCP server for account: ${login}`);

			const result = await mcpClient.scrapeMT5Account({
				username: login,
				password: password,
				server: server,
				brokerUrl: mt5Url
			});

			if (result.success && result.data) {
				console.log('MT5 validation successful:', { login, balance: result.data.balance });

				return json({
					valid: true,
					details: {
						accountNumber: login,
						balance: result.data.balance || 0,
						equity: result.data.equity || 0,
						hasDeposits: (result.data.balance && result.data.balance > 0) || false,
						hasTrades: false
					}
				} as ValidationResponse);
			} else {
				console.log('MT5 validation failed:', result.error);

				return json({
					valid: false,
					error: result.error || 'Invalid MT5 credentials or unable to connect',
					errorType: 'credentials'
				} as ValidationResponse);
			}
		} catch (mcpError: any) {
			console.error('MCP validation error:', mcpError);

			return json({
				valid: false,
				error: 'Unable to validate credentials. Please verify your MT5 account number, investor password, and server.',
				errorType: 'connection',
				details: {
					note: mcpError.message || 'Connection to validation service failed'
				}
			} as ValidationResponse);
		}

	} catch (error) {
		console.error('MT5 validation error:', error);

		const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';

		return json({
			valid: false,
			error: 'An unexpected error occurred during validation. Please try again.',
			errorType: 'unknown'
		} as ValidationResponse, { status: 500 });
	}
};

async function getMT5Url(server: string, broker?: string): Promise<string> {
	// If broker is provided, try to get URL from settings
	if (broker) {
		try {
			const settings = await prisma.settings.findFirst({
				where: { key: 'ftd_cpa_settings' }
			});

			if (settings && settings.value) {
				const ftdCpaSettings = JSON.parse(settings.value);
				if (ftdCpaSettings.brokers && ftdCpaSettings.brokers[broker]) {
					const brokerUrl = ftdCpaSettings.brokers[broker].mt5Link;
					console.log(`Using MT5 URL from settings for ${broker}: ${brokerUrl}`);
					return brokerUrl;
				}
			}
		} catch (error) {
			console.warn('Failed to load broker URL from settings:', error);
		}
	}

	// Fallback to hardcoded URLs
	const serverUrls: Record<string, string> = {
		'PXBTTrading-1': 'https://mt5.pxbt.com'
	};

	return serverUrls[server] || 'https://mt5.pxbt.com'; // Default fallback
}
