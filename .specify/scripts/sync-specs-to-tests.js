#!/usr/bin/env node

/**
 * Spec-to-Test Synchronization Script
 *
 * Supreme logic for keeping Playwright tests synchronized with feature specifications.
 * This script ensures every acceptance scenario in spec.md has a corresponding E2E test.
 *
 * Features:
 * - Parses spec.md acceptance scenarios
 * - Generates/updates Playwright test files
 * - Maintains test coverage tracking
 * - Preserves custom test implementations
 * - Validates spec compliance
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const SPECS_DIR = join(REPO_ROOT, 'specs');
const TESTS_DIR = join(REPO_ROOT, 'tests/e2e');

class SpecToTestSync {
	constructor() {
		this.coverageMap = new Map();
		this.missingTests = [];
		this.generatedTests = [];
	}

	/**
	 * Main execution flow
	 */
	async run() {
		console.log('🔄 Syncing specs to Playwright tests...\n');

		// Ensure test directory exists
		this.ensureDirectoryExists(TESTS_DIR);

		// Find all spec directories
		const specDirs = this.findSpecDirectories();

		if (specDirs.length === 0) {
			console.log('⚠️  No spec directories found in', SPECS_DIR);
			return;
		}

		console.log(`📋 Found ${specDirs.length} spec(s) to process\n`);

		// Process each spec
		for (const specDir of specDirs) {
			await this.processSpec(specDir);
		}

		// Generate summary report
		this.generateReport();
	}

	/**
	 * Find all spec directories
	 */
	findSpecDirectories() {
		if (!existsSync(SPECS_DIR)) {
			console.log('⚠️  Specs directory not found, creating:', SPECS_DIR);
			mkdirSync(SPECS_DIR, { recursive: true });
			return [];
		}

		return readdirSync(SPECS_DIR, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory())
			.map(dirent => join(SPECS_DIR, dirent.name));
	}

	/**
	 * Process a single spec directory
	 */
	async processSpec(specDir) {
		const specFile = join(specDir, 'spec.md');

		if (!existsSync(specFile)) {
			console.log(`⚠️  No spec.md found in ${specDir}`);
			return;
		}

		const featureName = this.extractFeatureName(specDir);
		console.log(`📝 Processing: ${featureName}`);

		const specContent = readFileSync(specFile, 'utf-8');
		const scenarios = this.parseAcceptanceScenarios(specContent);

		if (scenarios.length === 0) {
			console.log(`   ⚠️  No acceptance scenarios found\n`);
			return;
		}

		console.log(`   Found ${scenarios.length} acceptance scenario(s)`);

		// Generate test file
		const testFile = join(TESTS_DIR, `${featureName}.spec.ts`);
		const testExists = existsSync(testFile);

		if (testExists) {
			console.log(`   ✓ Test file exists: ${featureName}.spec.ts`);
			this.validateTestCoverage(testFile, scenarios, featureName);
		} else {
			console.log(`   📝 Generating test file: ${featureName}.spec.ts`);
			this.generateTestFile(testFile, scenarios, featureName);
			this.generatedTests.push(featureName);
		}

		console.log('');
	}

	/**
	 * Extract feature name from directory path
	 */
	extractFeatureName(specDir) {
		return specDir.split('/').pop();
	}

	/**
	 * Parse acceptance scenarios from spec markdown
	 */
	parseAcceptanceScenarios(content) {
		const scenarios = [];
		const scenarioRegex = /^\d+\.\s+\*\*Given\*\*\s+(.*?)\s+\*\*When\*\*\s+(.*?)\s+\*\*Then\*\*\s+(.*?)$/gm;

		let match;
		while ((match = scenarioRegex.exec(content)) !== null) {
			scenarios.push({
				given: match[1].trim(),
				when: match[2].trim(),
				then: match[3].trim(),
				raw: match[0]
			});
		}

		return scenarios;
	}

	/**
	 * Validate that test file covers all scenarios
	 */
	validateTestCoverage(testFile, scenarios, featureName) {
		const testContent = readFileSync(testFile, 'utf-8');
		const missing = [];

		for (const scenario of scenarios) {
			// Check if scenario is referenced in test
			const scenarioSignature = this.createScenarioSignature(scenario);
			if (!testContent.includes(scenarioSignature)) {
				missing.push(scenario);
			}
		}

		if (missing.length > 0) {
			console.log(`   ⚠️  ${missing.length} scenario(s) not covered in tests`);
			this.missingTests.push({ feature: featureName, scenarios: missing });
		} else {
			console.log(`   ✓ All scenarios covered`);
		}
	}

	/**
	 * Create a unique signature for a scenario
	 */
	createScenarioSignature(scenario) {
		return `${scenario.given} → ${scenario.when} → ${scenario.then}`;
	}

	/**
	 * Generate a new test file from scenarios
	 */
	generateTestFile(testFile, scenarios, featureName) {
		const testContent = this.buildTestContent(scenarios, featureName);
		writeFileSync(testFile, testContent, 'utf-8');
	}

	/**
	 * Build complete test file content
	 */
	buildTestContent(scenarios, featureName) {
		const title = featureName.split('-').map(w =>
			w.charAt(0).toUpperCase() + w.slice(1)
		).join(' ');

		let content = `import { test, expect } from '@playwright/test';

/**
 * E2E Tests for: ${title}
 *
 * Auto-generated from spec.md acceptance scenarios
 * Customize test implementations as needed
 */

test.describe('${title}', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app before each test
		await page.goto('/');
	});

`;

		scenarios.forEach((scenario, index) => {
			const testName = this.createTestName(scenario);
			const signature = this.createScenarioSignature(scenario);

			content += `	test('${testName}', async ({ page }) => {
		// Scenario: ${signature}
		// Given: ${scenario.given}
		// When: ${scenario.when}
		// Then: ${scenario.then}

		// TODO: Implement test steps
		// Add your Playwright test implementation here

		test.skip();
	});

`;
		});

		content += `});\n`;
		return content;
	}

	/**
	 * Create readable test name from scenario
	 */
	createTestName(scenario) {
		// Use the "when" clause as primary test name
		let name = scenario.when;

		// Clean up common patterns
		name = name.replace(/^I /, '');
		name = name.charAt(0).toUpperCase() + name.slice(1);

		return name;
	}

	/**
	 * Ensure directory exists
	 */
	ensureDirectoryExists(dir) {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}

	/**
	 * Generate sync report
	 */
	generateReport() {
		console.log('═══════════════════════════════════════════════════════════');
		console.log('📊 Spec-to-Test Sync Report\n');

		if (this.generatedTests.length > 0) {
			console.log(`✅ Generated ${this.generatedTests.length} new test file(s):`);
			this.generatedTests.forEach(name => {
				console.log(`   - ${name}.spec.ts`);
			});
			console.log('');
		}

		if (this.missingTests.length > 0) {
			console.log(`⚠️  ${this.missingTests.length} feature(s) with missing test coverage:\n`);
			this.missingTests.forEach(({ feature, scenarios }) => {
				console.log(`   ${feature}:`);
				scenarios.forEach(scenario => {
					console.log(`     - ${this.createTestName(scenario)}`);
				});
				console.log('');
			});
			console.log('💡 Run tests with test.skip() removed after implementing');
		} else if (this.generatedTests.length === 0) {
			console.log('✅ All specs have corresponding tests');
		}

		console.log('═══════════════════════════════════════════════════════════\n');
	}
}

// Execute sync
const sync = new SpecToTestSync();
sync.run().catch(error => {
	console.error('❌ Error during sync:', error);
	process.exit(1);
});
