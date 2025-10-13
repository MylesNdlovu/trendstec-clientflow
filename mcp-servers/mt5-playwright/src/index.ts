#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page } from 'playwright';

interface MT5LoginCredentials {
  username: string;
  password: string;
  server: string;
}

interface MT5AccountData {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  positions: Array<{
    ticket: string;
    symbol: string;
    type: 'buy' | 'sell';
    volume: number;
    openPrice: number;
    currentPrice: number;
    profit: number;
    timestamp: string;
  }>;
  orders: Array<{
    ticket: string;
    symbol: string;
    type: string;
    volume: number;
    price: number;
    timestamp: string;
  }>;
}

class MT5PlaywrightServer {
  private server: Server;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;

  constructor() {
    this.server = new Server({
      name: 'mt5-playwright',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupToolHandlers();

    // Handle cleanup on exit
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'mt5_login',
          description: 'Login to MT5 web platform with credentials',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string', description: 'MT5 account username' },
              password: { type: 'string', description: 'MT5 account password' },
              server: { type: 'string', description: 'MT5 server name' },
              url: { type: 'string', description: 'MT5 web platform URL', default: 'https://trade.mql5.com/trade' }
            },
            required: ['username', 'password', 'server']
          }
        },
        {
          name: 'mt5_get_account_data',
          description: 'Scrape current account data from MT5 web platform',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'mt5_get_positions',
          description: 'Get all open positions from MT5 web platform',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'mt5_get_orders',
          description: 'Get all pending orders from MT5 web platform',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'mt5_logout',
          description: 'Logout from MT5 web platform and cleanup',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'mt5_login':
            return await this.handleLogin(args as any);
          case 'mt5_get_account_data':
            return await this.handleGetAccountData();
          case 'mt5_get_positions':
            return await this.handleGetPositions();
          case 'mt5_get_orders':
            return await this.handleGetOrders();
          case 'mt5_logout':
            return await this.handleLogout();
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  private async initBrowser() {
    if (!this.browser) {
      const isProduction = process.env.NODE_ENV === 'production';

      this.browser = await chromium.launch({
        headless: isProduction, // Headless in production, visible in development
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();

      // Set realistic user agent
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      // Set viewport
      await this.page.setViewportSize({ width: 1920, height: 1080 });
    }
  }

  private async handleLogin(args: { username: string; password: string; server: string; url?: string }) {
    try {
      await this.initBrowser();
      if (!this.page) throw new Error('Failed to initialize browser page');

      const url = args.url || 'https://trade.mql5.com/trade';

      // Navigate to MT5 web platform
      await this.page.goto(url, { waitUntil: 'networkidle' });

      // Wait for login form
      await this.page.waitForSelector('input[name="login"], #login', { timeout: 10000 });

      // Fill login credentials
      await this.page.fill('input[name="login"], #login', args.username);
      await this.page.fill('input[name="password"], #password', args.password);

      // Select server if dropdown exists
      const serverSelector = 'select[name="server"], #server';
      if (await this.page.locator(serverSelector).count() > 0) {
        await this.page.selectOption(serverSelector, { label: args.server });
      }

      // Click login button
      await this.page.click('button[type="submit"], .login-button, #login-btn');

      // Wait for successful login (dashboard or trading interface)
      await this.page.waitForSelector('.trading-panel, .account-info, .terminal', { timeout: 30000 });

      this.isLoggedIn = true;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Successfully logged into MT5 web platform',
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`MT5 login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetAccountData() {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Not logged in to MT5. Please login first.');
    }

    try {
      // Wait for account info to load
      await this.page.waitForSelector('.account-info, .balance, .equity', { timeout: 10000 });

      // Extract account data using selectors (these may need adjustment based on actual MT5 web interface)
      const accountData = await this.page.evaluate(() => {
        const getTextContent = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim().replace(/[^0-9.-]/g, '') || '0';
        };

        return {
          balance: parseFloat(getTextContent('.balance, [data-field="balance"]')) || 0,
          equity: parseFloat(getTextContent('.equity, [data-field="equity"]')) || 0,
          margin: parseFloat(getTextContent('.margin, [data-field="margin"]')) || 0,
          freeMargin: parseFloat(getTextContent('.free-margin, [data-field="free_margin"]')) || 0,
          marginLevel: parseFloat(getTextContent('.margin-level, [data-field="margin_level"]')) || 0,
          profit: parseFloat(getTextContent('.profit, [data-field="profit"]')) || 0,
          timestamp: new Date().toISOString()
        };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: accountData
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get account data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetPositions() {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Not logged in to MT5. Please login first.');
    }

    try {
      // Navigate to positions tab if needed
      const positionsTab = '.positions-tab, [data-tab="positions"]';
      if (await this.page.locator(positionsTab).count() > 0) {
        await this.page.click(positionsTab);
        await this.page.waitForTimeout(1000);
      }

      // Extract positions data
      const positions = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('.positions-table tr, .position-row');
        const positions = [];

        for (const row of rows) {
          const cells = row.querySelectorAll('td, .cell');
          if (cells.length >= 6) {
            positions.push({
              ticket: cells[0]?.textContent?.trim() || '',
              symbol: cells[1]?.textContent?.trim() || '',
              type: cells[2]?.textContent?.trim().toLowerCase().includes('buy') ? 'buy' : 'sell',
              volume: parseFloat(cells[3]?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              openPrice: parseFloat(cells[4]?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              currentPrice: parseFloat(cells[5]?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              profit: parseFloat(cells[6]?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              timestamp: new Date().toISOString()
            });
          }
        }

        return positions;
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: positions,
              count: positions.length
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetOrders() {
    if (!this.isLoggedIn || !this.page) {
      throw new Error('Not logged in to MT5. Please login first.');
    }

    try {
      // Navigate to orders tab if needed
      const ordersTab = '.orders-tab, [data-tab="orders"]';
      if (await this.page.locator(ordersTab).count() > 0) {
        await this.page.click(ordersTab);
        await this.page.waitForTimeout(1000);
      }

      // Extract orders data
      const orders = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('.orders-table tr, .order-row');
        const orders = [];

        for (const row of rows) {
          const cells = row.querySelectorAll('td, .cell');
          if (cells.length >= 5) {
            orders.push({
              ticket: cells[0]?.textContent?.trim() || '',
              symbol: cells[1]?.textContent?.trim() || '',
              type: cells[2]?.textContent?.trim() || '',
              volume: parseFloat(cells[3]?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              price: parseFloat(cells[4]?.textContent?.replace(/[^0-9.-]/g, '') || '0'),
              timestamp: new Date().toISOString()
            });
          }
        }

        return orders;
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: orders,
              count: orders.length
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleLogout() {
    try {
      this.isLoggedIn = false;
      await this.cleanup();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Logged out and cleaned up browser resources'
            })
          }
        ]
      };
    } catch (error) {
      throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MT5 Playwright MCP server running on stdio');
  }
}

const server = new MT5PlaywrightServer();
server.run().catch(console.error);