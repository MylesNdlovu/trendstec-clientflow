import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test Configuration
 * Supreme logic setup for comprehensive E2E testing with spec synchronization
 */
export default defineConfig({
	// Test directory structure
	testDir: './tests/e2e',

	// Test execution settings
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,

	// Reporter configuration - detailed for CI, concise for local
	reporter: process.env.CI
		? [
			['html', { outputFolder: 'test-results/html' }],
			['json', { outputFile: 'test-results/results.json' }],
			['junit', { outputFile: 'test-results/junit.xml' }],
			['github']
		]
		: [
			['html', { outputFolder: 'test-results/html' }],
			['list']
		],

	// Global test configuration
	use: {
		// Base URL for all tests
		baseURL: process.env.BASE_URL || 'http://localhost:5173',

		// Capture trace on first retry for debugging
		trace: 'on-first-retry',

		// Screenshot on failure
		screenshot: 'only-on-failure',

		// Video on first retry
		video: 'retain-on-failure',

		// Action and navigation timeouts
		actionTimeout: 10000,
		navigationTimeout: 30000,
	},

	// Test timeout settings
	timeout: 60000,
	expect: {
		timeout: 10000,
	},

	// Multi-browser testing configuration
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
		// Mobile viewports
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 12'] },
		},
	],

	// Web server configuration - start dev server before tests
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
		stdout: 'pipe',
		stderr: 'pipe',
	},

	// Output folder for test artifacts
	outputDir: 'test-results/artifacts',
});
