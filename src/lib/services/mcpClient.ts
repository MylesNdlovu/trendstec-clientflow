/**
 * MCP Client Service
 * Calls the remote Playwright MCP server for MT5 scraping
 */

interface MCPServerConfig {
  baseUrl: string;
  apiKey?: string;
}

class MCPClient {
  private config: MCPServerConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.MCP_SERVER_URL || 'http://localhost:3001',
      apiKey: process.env.MCP_API_KEY
    };
  }

  private async request(endpoint: string, method: string = 'POST', body?: any) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`MCP Client error (${endpoint}):`, error);
      throw error;
    }
  }

  async healthCheck() {
    return this.request('/health', 'GET');
  }

  async initBrowser() {
    return this.request('/browser/init');
  }

  async loginToMT5(credentials: {
    username: string;
    password: string;
    server: string;
    brokerUrl?: string;
  }) {
    return this.request('/mt5/login', 'POST', credentials);
  }

  async getAccountData() {
    return this.request('/mt5/account-data');
  }

  async logout() {
    return this.request('/mt5/logout');
  }

  async closeBrowser() {
    return this.request('/browser/close');
  }

  /**
   * Complete MT5 scraping workflow
   */
  async scrapeMT5Account(credentials: {
    username: string;
    password: string;
    server: string;
    brokerUrl?: string;
  }) {
    try {
      // Initialize browser
      await this.initBrowser();

      // Login
      await this.loginToMT5(credentials);

      // Get account data
      const accountData = await this.getAccountData();

      // Logout and cleanup
      await this.logout();
      await this.closeBrowser();

      return {
        success: true,
        data: accountData.data
      };
    } catch (error) {
      // Cleanup on error
      try {
        await this.closeBrowser();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed'
      };
    }
  }
}

export const mcpClient = new MCPClient();
