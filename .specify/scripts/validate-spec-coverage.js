#!/usr/bin/env node

/**
 * Spec Coverage Validation Script
 *
 * Validates that all functional requirements and acceptance scenarios
 * are properly covered by tests and implementation.
 *
 * Features:
 * - Analyzes spec.md requirements
 * - Checks test coverage
 * - Validates implementation status
 * - Generates coverage reports
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const SPECS_DIR = join(REPO_ROOT, 'specs');
const TESTS_DIR = join(REPO_ROOT, 'tests/e2e');

class SpecCoverageValidator {
	constructor() {
		this.features = [];
		this.totalRequirements = 0;
		this.totalScenarios = 0;
		this.coveredScenarios = 0;
	}

	/**
	 * Main validation flow
	 */
	async validate() {
		console.log('🔍 Validating spec coverage...\n');

		const specDirs = this.findSpecDirectories();

		if (specDirs.length === 0) {
			console.log('⚠️  No specs found to validate');
			return;
		}

		for (const specDir of specDirs) {
			await this.validateSpec(specDir);
		}

		this.generateCoverageReport();
	}

	/**
	 * Find all spec directories
	 */
	findSpecDirectories() {
		if (!existsSync(SPECS_DIR)) {
			return [];
		}

		return readdirSync(SPECS_DIR, { withFileTypes: true })
			.filter(dirent => dirent.isDirectory())
			.map(dirent => join(SPECS_DIR, dirent.name));
	}

	/**
	 * Validate a single spec
	 */
	async validateSpec(specDir) {
		const specFile = join(specDir, 'spec.md');
		if (!existsSync(specFile)) return;

		const featureName = specDir.split('/').pop();
		const specContent = readFileSync(specFile, 'utf-8');

		const requirements = this.extractRequirements(specContent);
		const scenarios = this.extractScenarios(specContent);

		const testFile = join(TESTS_DIR, `${featureName}.spec.ts`);
		const hasTests = existsSync(testFile);
		let coverage = 0;

		if (hasTests) {
			const testContent = readFileSync(testFile, 'utf-8');
			coverage = this.calculateCoverage(scenarios, testContent);
		}

		this.features.push({
			name: featureName,
			requirements: requirements.length,
			scenarios: scenarios.length,
			hasTests,
			coverage
		});

		this.totalRequirements += requirements.length;
		this.totalScenarios += scenarios.length;
		this.coveredScenarios += Math.floor(scenarios.length * coverage);
	}

	/**
	 * Extract functional requirements
	 */
	extractRequirements(content) {
		const reqRegex = /^\s*-\s+\*\*FR-\d+\*\*:/gm;
		return content.match(reqRegex) || [];
	}

	/**
	 * Extract acceptance scenarios
	 */
	extractScenarios(content) {
		const scenarioRegex = /^\d+\.\s+\*\*Given\*\*/gm;
		return content.match(scenarioRegex) || [];
	}

	/**
	 * Calculate test coverage percentage
	 */
	calculateCoverage(scenarios, testContent) {
		if (scenarios.length === 0) return 0;

		// Count non-skipped tests
		const totalTests = (testContent.match(/test\(/g) || []).length;
		const skippedTests = (testContent.match(/test\.skip\(/g) || []).length;
		const implementedTests = totalTests - skippedTests;

		return implementedTests / scenarios.length;
	}

	/**
	 * Generate coverage report
	 */
	generateCoverageReport() {
		console.log('\n═══════════════════════════════════════════════════════════');
		console.log('📊 Spec Coverage Report\n');

		console.log(`Total Features: ${this.features.length}`);
		console.log(`Total Requirements: ${this.totalRequirements}`);
		console.log(`Total Scenarios: ${this.totalScenarios}`);

		const overallCoverage = this.totalScenarios > 0
			? ((this.coveredScenarios / this.totalScenarios) * 100).toFixed(1)
			: 0;
		console.log(`Overall Test Coverage: ${overallCoverage}%\n`);

		console.log('Feature Details:\n');

		this.features.forEach(feature => {
			const coveragePercent = (feature.coverage * 100).toFixed(0);
			const status = feature.coverage === 1 ? '✅' :
				feature.coverage > 0 ? '🟡' : '❌';

			console.log(`${status} ${feature.name}`);
			console.log(`   Requirements: ${feature.requirements}`);
			console.log(`   Scenarios: ${feature.scenarios}`);
			console.log(`   Tests: ${feature.hasTests ? 'Yes' : 'No'}`);
			console.log(`   Coverage: ${coveragePercent}%\n`);
		});

		console.log('═══════════════════════════════════════════════════════════\n');

		// Exit with error if coverage is below threshold
		if (overallCoverage < 80 && process.env.CI) {
			console.error('❌ Coverage below 80% threshold');
			process.exit(1);
		}
	}
}

// Execute validation
const validator = new SpecCoverageValidator();
validator.validate().catch(error => {
	console.error('❌ Validation error:', error);
	process.exit(1);
});
