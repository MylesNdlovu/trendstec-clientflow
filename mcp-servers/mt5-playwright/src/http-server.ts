#!/usr/bin/env node
/**
 * HTTP wrapper for MT5 Playwright MCP Server
 * Exposes MCP tools as REST API endpoints for remote calling from Vercel
 */

import express from 'express';
import { chromium, Browser, Page } from 'playwright';

const app = express();
app.use(express.json());

let browser: Browser | null = null;
let page: Page | null = null;
let isLoggedIn = false;

interface MT5LoginCredentials {
  username: string;
  password: string;
  server: string;
  brokerUrl?: string;
}

interface MT5AccountData {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  positions: Array<any>;
  orders: Array<any>;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    browser: browser ? 'initialized' : 'not initialized',
    loggedIn: isLoggedIn,
    timestamp: new Date().toISOString()
  });
});

// Initialize browser
app.post('/browser/init', async (req, res) => {
  try {
    if (browser) {
      await browser.close();
    }

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();

    res.json({
      success: true,
      message: 'Browser initialized'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Login to MT5
app.post('/mt5/login', async (req, res) => {
  try {
    const { username, password, server, brokerUrl }: MT5LoginCredentials = req.body;

    if (!browser || !page) {
      return res.status(400).json({
        success: false,
        error: 'Browser not initialized. Call /browser/init first'
      });
    }

    const url = brokerUrl || 'https://mt5.pxbt.com';
    await page.goto(url, { waitUntil: 'networkidle' });

    // Login logic (simplified - adapt to actual MT5 web interface)
    await page.fill('input[name="login"]', username);
    await page.fill('input[name="password"]', password);
    await page.selectOption('select[name="server"]', server);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ timeout: 30000 });

    isLoggedIn = true;

    res.json({
      success: true,
      message: 'Logged in successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    });
  }
});

// Get account data
app.post('/mt5/account-data', async (req, res) => {
  try {
    if (!isLoggedIn || !page) {
      return res.status(400).json({
        success: false,
        error: 'Not logged in. Call /mt5/login first'
      });
    }

    // Scrape account data (simplified - adapt to actual MT5 interface)
    const accountData: MT5AccountData = {
      balance: await page.locator('.account-balance').textContent().then(t => parseFloat(t || '0')),
      equity: await page.locator('.account-equity').textContent().then(t => parseFloat(t || '0')),
      margin: await page.locator('.account-margin').textContent().then(t => parseFloat(t || '0')),
      freeMargin: await page.locator('.account-free-margin').textContent().then(t => parseFloat(t || '0')),
      marginLevel: await page.locator('.margin-level').textContent().then(t => parseFloat(t || '0')),
      profit: await page.locator('.account-profit').textContent().then(t => parseFloat(t || '0')),
      positions: [],
      orders: []
    };

    res.json({
      success: true,
      data: accountData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get account data'
    });
  }
});

// Logout
app.post('/mt5/logout', async (req, res) => {
  try {
    if (page) {
      await page.click('.logout-button');
      isLoggedIn = false;
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed'
    });
  }
});

// Close browser
app.post('/browser/close', async (req, res) => {
  try {
    if (browser) {
      await browser.close();
      browser = null;
      page = null;
      isLoggedIn = false;
    }

    res.json({
      success: true,
      message: 'Browser closed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to close browser'
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 MT5 Playwright HTTP Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});
