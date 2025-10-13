import { json } from '@sveltejs/kit';
import { chromium } from 'playwright';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

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

		// Start browser validation
		const browser = await chromium.launch({
			headless: true,
			timeout: 30000
		});

		try {
			const context = await browser.newContext({
				userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			});

			const page = await context.newPage();

			// Set timeout for page operations
			page.setDefaultTimeout(15000);

			// Navigate to MT5 web terminal - get URL from settings if broker provided
			const mt5Url = await getMT5Url(server, broker);

			await page.goto(mt5Url, { waitUntil: 'networkidle' });

			// Wait for login form to load
			await page.waitForSelector('input[type="text"], input[name="login"], input[id*="login"]', { timeout: 10000 });

			// Find and fill login fields
			const loginField = await page.locator('input[type="text"], input[name="login"], input[id*="login"]').first();
			const passwordField = await page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();

			if (!loginField || !passwordField) {
				throw new Error('Login form fields not found');
			}

			// Clear and fill credentials
			await loginField.clear();
			await loginField.fill(login);
			await passwordField.clear();
			await passwordField.fill(password);

			// Look for server dropdown if needed
			const serverDropdown = page.locator('select[name*="server"], select[id*="server"]');
			if (await serverDropdown.count() > 0) {
				await serverDropdown.selectOption({ label: server });
			}

			// Submit login form
			const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
			await submitButton.click();

			// Wait for either success or error
			const result = await Promise.race([
				// Success indicators
				page.waitForSelector('[class*="account"], [class*="balance"], [id*="account"], .account-info, .balance-info, [class*="terminal"], [class*="main"], [class*="trading"]', { timeout: 8000 })
					.then(() => ({ success: true }))
					.catch(() => null),

				// More comprehensive error indicators for MT5
				page.waitForSelector([
					'[class*="error"]',
					'[class*="invalid"]',
					'[class*="wrong"]',
					'[class*="failed"]',
					'.error-message',
					'.login-error',
					'.alert',
					'[role="alert"]',
					'[class*="notification"]',
					'div:has-text("Invalid")',
					'div:has-text("Wrong")',
					'div:has-text("Failed")',
					'div:has-text("Error")',
					'div:has-text("Incorrect")',
					'span:has-text("Invalid")',
					'span:has-text("Wrong")'
				].join(', '), { timeout: 8000 })
					.then(async (errorElement) => {
						const errorText = await errorElement?.textContent();
						// Check for specific MT5 error patterns
						if (errorText) {
							if (errorText.toLowerCase().includes('invalid login') ||
								errorText.toLowerCase().includes('wrong password') ||
								errorText.toLowerCase().includes('invalid account')) {
								return { success: false, error: 'Invalid login credentials' };
							}
							if (errorText.toLowerCase().includes('server') ||
								errorText.toLowerCase().includes('connection')) {
								return { success: false, error: 'Server connection failed' };
							}
						}
						return { success: false, error: errorText || 'Login failed' };
					})
					.catch(() => null),

				// Check for URL changes that might indicate failure
				page.waitForURL(/error|invalid|failed/, { timeout: 5000 })
					.then(() => ({ success: false, error: 'Authentication failed - redirected to error page' }))
					.catch(() => null),

				// Timeout fallback
				new Promise(resolve => setTimeout(() => resolve({ success: false, error: 'Validation timeout - MT5 server may be busy' }), 12000))
			]);

			if (!result) {
				return json({
					valid: false,
					error: 'Unable to determine login status',
					errorType: 'timeout'
				} as ValidationResponse);
			}

			if ('success' in result && result.success) {
				// Try to extract account details if successful
				const details = await extractAccountDetails(page);

				return json({
					valid: true,
					details
				} as ValidationResponse);
			} else {
				// Parse error type from message
				const errorMessage = 'error' in result ? result.error : 'Unknown error';
				const errorType = parseErrorType(errorMessage);
				const friendlyError = getErrorMessage(errorType, errorMessage);

				return json({
					valid: false,
					error: friendlyError,
					errorType
				} as ValidationResponse);
			}

		} finally {
			await browser.close();
		}

	} catch (error) {
		console.error('MT5 validation error:', error);

		// Parse different types of errors
		const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
		const errorType = parseErrorType(errorMessage);
		const friendlyError = getErrorMessage(errorType, errorMessage);

		return json({
			valid: false,
			error: friendlyError,
			errorType
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

async function extractAccountDetails(page: any) {
	try {
		// Try to extract account information
		const accountNumber = await page.textContent('[class*="account-number"], [id*="account"]').catch(() => null);
		const balance = await page.textContent('[class*="balance"], [id*="balance"]').catch(() => null);
		const equity = await page.textContent('[class*="equity"], [id*="equity"]').catch(() => null);

		return {
			accountNumber: accountNumber?.replace(/[^\d]/g, '') || undefined,
			balance: balance ? parseFloat(balance.replace(/[^\d.-]/g, '')) : undefined,
			equity: equity ? parseFloat(equity.replace(/[^\d.-]/g, '')) : undefined,
			hasDeposits: (balance && parseFloat(balance.replace(/[^\d.-]/g, '')) > 0) || false,
			hasTrades: false // Would need more complex logic to detect trades
		};
	} catch {
		return {};
	}
}

function parseErrorType(errorMessage: string): 'connection' | 'credentials' | 'server' | 'timeout' | 'unknown' {
	const message = errorMessage.toLowerCase();

	if (message.includes('timeout') || message.includes('time out') || message.includes('request timeout')) {
		return 'timeout';
	}
	if (message.includes('invalid login') || message.includes('wrong password') ||
		message.includes('incorrect credentials') || message.includes('authentication failed') ||
		message.includes('invalid credentials') || message.includes('login failed') ||
		message.includes('invalid account') || message.includes('account not found')) {
		return 'credentials';
	}
	if (message.includes('server not found') || message.includes('invalid server') ||
		message.includes('server unavailable') || message.includes('connection refused') ||
		message.includes('network error') || message.includes('host not found')) {
		return 'server';
	}
	if (message.includes('cannot connect') || message.includes('connection failed') ||
		message.includes('unreachable') || message.includes('network timeout')) {
		return 'connection';
	}

	return 'unknown';
}

function getErrorMessage(errorType: string, originalError: string): string {
	switch (errorType) {
		case 'credentials':
			return 'Invalid MT5 account number or investor password. Please verify your credentials and try again.';
		case 'server':
			return 'Unable to connect to the selected trading server. Please check if the server name is correct.';
		case 'connection':
			return 'Unable to establish connection to MT5 platform. Please check your internet connection.';
		case 'timeout':
			return 'Validation request timed out. The MT5 server may be busy, please try again.';
		default:
			return originalError || 'An unexpected error occurred during validation. Please try again.';
	}
}