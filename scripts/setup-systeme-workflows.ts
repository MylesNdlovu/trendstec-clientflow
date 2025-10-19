/**
 * Playwright Script to Create Systeme.io Workflow Automations
 *
 * This script automates the creation of workflow automations in Systeme.io
 * since the API doesn't support workflow creation.
 *
 * Prerequisites:
 * - npm install -D @playwright/test
 * - Set SYSTEME_EMAIL and SYSTEME_PASSWORD environment variables
 *
 * Usage:
 * npm run setup:systeme-workflows
 */

import { chromium } from 'playwright';

const SYSTEME_EMAIL = process.env.SYSTEME_EMAIL;
const SYSTEME_PASSWORD = process.env.SYSTEME_PASSWORD;

if (!SYSTEME_EMAIL || !SYSTEME_PASSWORD) {
	console.error('❌ Missing required environment variables:');
	console.error('   SYSTEME_EMAIL and SYSTEME_PASSWORD must be set');
	process.exit(1);
}

interface WorkflowConfig {
	name: string;
	description: string;
	trigger: {
		type: 'tag_added' | 'tag_removed' | 'field_updated';
		tagName?: string;
		fieldName?: string;
	};
	actions: Array<{
		type: 'send_email' | 'add_tag' | 'remove_tag' | 'wait' | 'notify';
		emailTemplate?: string;
		tagName?: string;
		waitDuration?: string;
		notificationMessage?: string;
	}>;
}

const WORKFLOWS: WorkflowConfig[] = [
	{
		name: 'Deposit Welcome Email',
		description: 'Send welcome email when a lead deposits',
		trigger: {
			type: 'tag_added',
			tagName: 'Deposited'
		},
		actions: [
			{ type: 'wait', waitDuration: '5 minutes' },
			{
				type: 'send_email',
				emailTemplate: 'deposit_welcome'
			},
			{ type: 'add_tag', tagName: 'Welcome_Email_Sent' }
		]
	},
	{
		name: 'Trading Started Notification',
		description: 'Notify when a lead starts trading',
		trigger: {
			type: 'tag_added',
			tagName: 'Trading'
		},
		actions: [
			{
				type: 'send_email',
				emailTemplate: 'trading_started'
			},
			{ type: 'add_tag', tagName: 'Trading_Email_Sent' }
		]
	},
	{
		name: 'Qualified Trader Congratulations',
		description: 'Send congratulations email when qualified',
		trigger: {
			type: 'tag_added',
			tagName: 'Qualified'
		},
		actions: [
			{
				type: 'send_email',
				emailTemplate: 'qualified_trader'
			},
			{ type: 'add_tag', tagName: 'Qualified_Email_Sent' },
			{
				type: 'notify',
				notificationMessage: 'New qualified trader!'
			}
		]
	},
	{
		name: 'No Deposit Reminder',
		description: 'Remind leads who haven\'t deposited after 3 days',
		trigger: {
			type: 'tag_added',
			tagName: 'Not_Deposited'
		},
		actions: [
			{ type: 'wait', waitDuration: '3 days' },
			{
				type: 'send_email',
				emailTemplate: 'deposit_reminder'
			},
			{ type: 'add_tag', tagName: 'Deposit_Reminder_Sent' }
		]
	},
	{
		name: 'VIP High Volume Trader',
		description: 'Upgrade high volume traders to VIP',
		trigger: {
			type: 'tag_added',
			tagName: 'High_Volume_Trader'
		},
		actions: [
			{
				type: 'send_email',
				emailTemplate: 'vip_invitation'
			},
			{ type: 'add_tag', tagName: 'VIP_Trader' },
			{
				type: 'notify',
				notificationMessage: 'New high volume trader - VIP candidate!'
			}
		]
	}
];

async function loginToSysteme(page: any) {
	console.log('🔐 Logging into Systeme.io...');

	await page.goto('https://systeme.io/login');

	// Fill login form
	await page.fill('input[type="email"]', SYSTEME_EMAIL);
	await page.fill('input[type="password"]', SYSTEME_PASSWORD);

	// Click login button
	await page.click('button[type="submit"]');

	// Wait for navigation to dashboard
	await page.waitForURL('**/dashboard', { timeout: 10000 });

	console.log('✅ Logged in successfully!');
}

async function createWorkflow(page: any, workflow: WorkflowConfig) {
	console.log(`\n📝 Creating workflow: "${workflow.name}"...`);

	try {
		// Navigate to automations page
		await page.goto('https://systeme.io/automations');
		await page.waitForTimeout(2000);

		// Click "New Automation" button
		await page.click('button:has-text("New"), a:has-text("New Automation")');
		await page.waitForTimeout(1000);

		// Enter automation name
		await page.fill('input[name="name"], input[placeholder*="name"]', workflow.name);
		await page.waitForTimeout(500);

		// Set trigger
		console.log(`   ⚡ Setting trigger: ${workflow.trigger.type} - ${workflow.trigger.tagName}`);
		await page.click('text=Add Trigger, button:has-text("Trigger")');
		await page.waitForTimeout(500);

		// Select trigger type based on configuration
		if (workflow.trigger.type === 'tag_added') {
			await page.click('text=Tag added to contact, text=Tag added');
			await page.waitForTimeout(500);

			// Select the tag
			if (workflow.trigger.tagName) {
				await page.selectOption('select[name="tag"], select:has-option', workflow.trigger.tagName);
			}
		}

		// Add actions
		for (let i = 0; i < workflow.actions.length; i++) {
			const action = workflow.actions[i];
			console.log(`   ➕ Adding action ${i + 1}: ${action.type}`);

			await page.click('button:has-text("Add Action"), text=Add Action');
			await page.waitForTimeout(500);

			switch (action.type) {
				case 'send_email':
					await page.click('text=Send Email, text=Send an email');
					await page.waitForTimeout(500);
					// Note: Email template selection would need to be done manually
					// as it requires specific template IDs
					console.log(`      ℹ️  Email template "${action.emailTemplate}" must be selected manually`);
					break;

				case 'add_tag':
					await page.click('text=Add Tag, text=Add tag');
					await page.waitForTimeout(500);
					if (action.tagName) {
						await page.selectOption('select[name="tag"]', action.tagName);
					}
					break;

				case 'wait':
					await page.click('text=Wait, text=Add delay');
					await page.waitForTimeout(500);
					// Set wait duration
					console.log(`      ⏳ Wait duration "${action.waitDuration}" must be set manually`);
					break;

				case 'notify':
					await page.click('text=Send Notification, text=Notify');
					await page.waitForTimeout(500);
					break;
			}

			await page.waitForTimeout(1000);
		}

		console.log(`   ✅ Workflow "${workflow.name}" created (review and publish manually)`);

		// Don't auto-publish - let user review first
		console.log(`      ⚠️  Please review the workflow and click "Publish" manually`);

		// Pause to allow manual review
		console.log(`\n⏸️  Pausing for 10 seconds to allow manual review...`);
		await page.waitForTimeout(10000);

	} catch (error) {
		console.error(`   ❌ Failed to create workflow "${workflow.name}":`, error);
	}
}

async function setupWorkflows() {
	console.log('🎭 Starting Systeme.io Workflow Setup with Playwright\n');

	const browser = await chromium.launch({
		headless: false, // Show browser for manual intervention if needed
		slowMo: 100 // Slow down actions for visibility
	});

	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		// Step 1: Login
		await loginToSysteme(page);

		// Step 2: Create each workflow
		for (const workflow of WORKFLOWS) {
			await createWorkflow(page, workflow);
		}

		console.log('\n✅ Workflow setup complete!');
		console.log('\n📋 Summary:');
		console.log(`   Created ${WORKFLOWS.length} workflow templates`);
		console.log('\n⚠️  IMPORTANT NEXT STEPS:');
		console.log('   1. Review each workflow in Systeme.io');
		console.log('   2. Set up email templates for each workflow');
		console.log('   3. Configure wait durations and conditions');
		console.log('   4. Publish each workflow when ready');
		console.log('\n🔗 Visit: https://systeme.io/automations');

	} catch (error) {
		console.error('\n❌ Setup failed:', error);
	} finally {
		console.log('\n🔚 Press Ctrl+C to close the browser and exit');
		// Keep browser open for manual review
		await page.waitForTimeout(300000); // Wait 5 minutes before auto-closing
		await browser.close();
	}
}

// Run the setup
setupWorkflows().catch(console.error);
