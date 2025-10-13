import { chromium, type Browser, type Page } from 'playwright';

export interface MT5Credentials {
	login: string;
	password: string;
	server: string;
}

export interface MT5AccountData {
	accountNumber: string;
	balance: number;
	equity: number;
	margin: number;
	freeMargin: number;
	marginLevel: number;
	totalDeposits: number;
	totalWithdrawals: number;
	totalTrades: number;
	totalLots: number;
	profit: number;
	isConnected: boolean;
}

export class MT5AutomationService {
	private browser: Browser | null = null;
	private page: Page | null = null;

	async init(): Promise<void> {
		this.browser = await chromium.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});
		this.page = await this.browser.newPage();
	}

	async loginToMT5(brokerUrl: string, credentials: MT5Credentials): Promise<boolean> {
		if (!this.page) {
			throw new Error('Browser not initialized. Call init() first.');
		}

		try {
			// Navigate to broker MT5 web terminal
			await this.page.goto(brokerUrl, { waitUntil: 'networkidle' });

			// Wait for login form to be visible
			await this.page.waitForSelector('input[type="text"], input[name="login"], input[id*="login"]', {
				timeout: 10000
			});

			// Fill login credentials
			const loginInput = await this.page.locator('input[type="text"], input[name="login"], input[id*="login"]').first();
			await loginInput.fill(credentials.login);

			const passwordInput = await this.page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
			await passwordInput.fill(credentials.password);

			// Handle server selection if present
			if (credentials.server) {
				const serverSelect = await this.page.locator('select[name="server"], select[id*="server"], input[name="server"]').first();
				if (await serverSelect.isVisible()) {
					await serverSelect.fill(credentials.server);
				}
			}

			// Submit login form
			const loginButton = await this.page.locator('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
			await loginButton.click();

			// Wait for login to complete
			await this.page.waitForTimeout(5000);

			// Check if login was successful (look for account info or dashboard)
			const accountInfo = await this.page.locator('[data-testid="account"], .account-info, #account-info, .balance, .equity').first();
			const isLoggedIn = await accountInfo.isVisible().catch(() => false);

			return isLoggedIn;
		} catch (error) {
			console.error('MT5 login failed:', error);
			return false;
		}
	}

	async scrapeAccountData(): Promise<MT5AccountData | null> {
		if (!this.page) {
			throw new Error('Browser not initialized. Call init() first.');
		}

		try {
			// Wait for account data to load
			await this.page.waitForTimeout(3000);

			// Extract account data using common selectors
			const accountData: Partial<MT5AccountData> = {};

			// Account number
			try {
				const accountNumber = await this.page.locator('.account-number, [data-testid="account-number"], #account-number').first().textContent();
				accountData.accountNumber = accountNumber?.trim() || '';
			} catch {}

			// Balance
			try {
				const balance = await this.page.locator('.balance, [data-testid="balance"], #balance, .account-balance').first().textContent();
				accountData.balance = this.parseNumber(balance);
			} catch {}

			// Equity
			try {
				const equity = await this.page.locator('.equity, [data-testid="equity"], #equity').first().textContent();
				accountData.equity = this.parseNumber(equity);
			} catch {}

			// Margin
			try {
				const margin = await this.page.locator('.margin, [data-testid="margin"], #margin').first().textContent();
				accountData.margin = this.parseNumber(margin);
			} catch {}

			// Free Margin
			try {
				const freeMargin = await this.page.locator('.free-margin, [data-testid="free-margin"], #free-margin').first().textContent();
				accountData.freeMargin = this.parseNumber(freeMargin);
			} catch {}

			// Total trades and lots from history/statistics
			try {
				// Navigate to history or statistics tab if available
				const historyTab = this.page.locator('a:has-text("History"), button:has-text("History"), .tab-history').first();
				if (await historyTab.isVisible()) {
					await historyTab.click();
					await this.page.waitForTimeout(2000);
				}

				// Extract trade statistics
				const trades = await this.page.locator('.total-trades, [data-testid="total-trades"]').first().textContent();
				accountData.totalTrades = this.parseNumber(trades);

				const lots = await this.page.locator('.total-lots, [data-testid="total-lots"]').first().textContent();
				accountData.totalLots = this.parseNumber(lots);

				const profit = await this.page.locator('.total-profit, [data-testid="total-profit"]').first().textContent();
				accountData.profit = this.parseNumber(profit);
			} catch {}

			// Mark as connected
			accountData.isConnected = true;

			return {
				accountNumber: accountData.accountNumber || '',
				balance: accountData.balance || 0,
				equity: accountData.equity || accountData.balance || 0,
				margin: accountData.margin || 0,
				freeMargin: accountData.freeMargin || 0,
				marginLevel: accountData.margin ? (accountData.equity || 0) / accountData.margin * 100 : 0,
				totalDeposits: accountData.balance || 0, // Approximate
				totalWithdrawals: 0, // Would need specific scraping
				totalTrades: accountData.totalTrades || 0,
				totalLots: accountData.totalLots || 0,
				profit: accountData.profit || 0,
				isConnected: true
			};
		} catch (error) {
			console.error('Failed to scrape account data:', error);
			return null;
		}
	}

	private parseNumber(text: string | null): number {
		if (!text) return 0;
		// Remove currency symbols, commas, and extract number
		const cleaned = text.replace(/[^\d.-]/g, '');
		const number = parseFloat(cleaned);
		return isNaN(number) ? 0 : number;
	}

	async close(): Promise<void> {
		if (this.page) {
			await this.page.close();
			this.page = null;
		}
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}

	async scrapeAllBrokers(brokerConfig: Record<string, { url: string; credentials: MT5Credentials }>): Promise<Record<string, MT5AccountData | null>> {
		const results: Record<string, MT5AccountData | null> = {};

		for (const [brokerName, config] of Object.entries(brokerConfig)) {
			try {
				console.log(`Scraping MT5 data for ${brokerName}...`);

				await this.init();
				const loginSuccess = await this.loginToMT5(config.url, config.credentials);

				if (loginSuccess) {
					const accountData = await this.scrapeAccountData();
					results[brokerName] = accountData;
					console.log(`✓ Successfully scraped data for ${brokerName}`);
				} else {
					console.log(`✗ Failed to login to ${brokerName}`);
					results[brokerName] = null;
				}

				await this.close();

				// Wait between brokers to avoid rate limiting
				await new Promise(resolve => setTimeout(resolve, 2000));
			} catch (error) {
				console.error(`Error scraping ${brokerName}:`, error);
				results[brokerName] = null;
				await this.close();
			}
		}

		return results;
	}
}

// Utility function to create automation service
export async function createMT5Automation(): Promise<MT5AutomationService> {
	const service = new MT5AutomationService();
	await service.init();
	return service;
}

// API endpoint helper
export async function scrapeMT5Data(commissionSettings: any): Promise<Record<string, MT5AccountData | null>> {
	const automation = new MT5AutomationService();

	try {
		// Build broker config from settings
		const brokerConfig: Record<string, { url: string; credentials: MT5Credentials }> = {};

		for (const [brokerName, credentials] of Object.entries(commissionSettings.brokerCredentials)) {
			const creds = credentials as MT5Credentials;
			const url = commissionSettings.brokerMT5Links[brokerName];

			if (url && creds.login && creds.password) {
				brokerConfig[brokerName] = {
					url,
					credentials: creds
				};
			}
		}

		return await automation.scrapeAllBrokers(brokerConfig);
	} finally {
		await automation.close();
	}
}