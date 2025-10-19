import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeService } from '$lib/services/systemeService';

/**
 * Auto-setup Systeme.io with all required tags, custom fields, and webhooks
 * This endpoint creates everything needed for ClientFlow to work with Systeme.io
 */
export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const results = {
			tags: { created: [] as string[], skipped: [] as string[], failed: [] as any[] },
			customFields: { created: [] as string[], skipped: [] as string[], failed: [] as any[] },
			webhooks: { created: [] as string[], skipped: [] as string[], failed: [] as any[] }
		};

		console.log('🚀 Starting Systeme.io auto-setup...');

		// Step 1: Get existing resources to avoid duplicates
		console.log('📋 Checking existing resources...');
		const existingTagsResult = await systemeService.getAllTags();
		const existingFieldsResult = await systemeService.getAllCustomFields();
		const existingWebhooksResult = await systemeService.getAllWebhooks();

		const existingTagNames = existingTagsResult.success && existingTagsResult.data
			? existingTagsResult.data.map((t: any) => t.name || t.label)
			: [];
		const existingFieldSlugs = existingFieldsResult.success && existingFieldsResult.data
			? existingFieldsResult.data.map((f: any) => f.slug)
			: [];
		const existingWebhookUrls = existingWebhooksResult.success && existingWebhooksResult.data
			? existingWebhooksResult.data.map((w: any) => w.url)
			: [];

		// Step 2: Define all required tags
		const requiredTags = [
			// Lead capture tags (manual)
			'Lead_Captured',
			'Source_Facebook',
			'Source_Google',
			'Source_Organic',
			'Optin_Complete',

			// MT5 submission tags (auto)
			'MT5_Credentials_Submitted',
			'MT5_Server_Prime_XBT',
			'MT5_Server_IC_Markets',
			'Ready_For_Verification',

			// Deposit status
			'Deposited',
			'Not_Deposited',

			// Trading status
			'Trading',
			'Not_Trading',

			// Qualification status
			'Qualified',
			'Not_Qualified',
			'Min_Volume_Met',

			// Volume tiers
			'Low_Volume_Trader',
			'Medium_Volume_Trader',
			'High_Volume_Trader'
		];

		console.log(`🏷️  Creating ${requiredTags.length} tags...`);
		for (const tagName of requiredTags) {
			if (existingTagNames.includes(tagName)) {
				results.tags.skipped.push(tagName);
				console.log(`⏭️  Tag "${tagName}" already exists, skipping...`);
				continue;
			}

			try {
				const createResult = await systemeService.createTag(tagName);
				if (createResult.success) {
					results.tags.created.push(tagName);
					console.log(`✅ Created tag: ${tagName}`);
				} else {
					results.tags.failed.push({ tag: tagName, error: createResult.error });
					console.error(`❌ Failed to create tag "${tagName}":`, createResult.error);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				results.tags.failed.push({ tag: tagName, error: errorMessage });
				console.error(`❌ Exception creating tag "${tagName}":`, errorMessage);
			}
		}

		// Step 3: Define all required custom fields
		const requiredFields = [
			{ slug: 'mt5_login', label: 'MT5 Login', type: 'text' as const },
			{ slug: 'mt5_password', label: 'MT5 Investor Password', type: 'text' as const },
			{ slug: 'mt5_server', label: 'MT5 Server', type: 'text' as const },
			{ slug: 'mt5_broker', label: 'MT5 Broker', type: 'text' as const },
			{ slug: 'mt5_balance', label: 'MT5 Balance', type: 'number' as const },
			{ slug: 'mt5_equity', label: 'MT5 Equity', type: 'number' as const },
			{ slug: 'mt5_total_volume', label: 'Total Trading Volume', type: 'number' as const },
			{ slug: 'mt5_total_trades', label: 'Total Trades', type: 'number' as const },
			{ slug: 'mt5_status', label: 'MT5 Status', type: 'text' as const },
			{ slug: 'last_scraped_at', label: 'Last Scraped At', type: 'text' as const }
		];

		console.log(`📊 Creating ${requiredFields.length} custom fields...`);
		for (const field of requiredFields) {
			if (existingFieldSlugs.includes(field.slug)) {
				results.customFields.skipped.push(field.slug);
				console.log(`⏭️  Custom field "${field.slug}" already exists, skipping...`);
				continue;
			}

			try {
				const createResult = await systemeService.createCustomField(field);
				if (createResult.success) {
					results.customFields.created.push(field.slug);
					console.log(`✅ Created custom field: ${field.slug}`);
				} else {
					results.customFields.failed.push({ field: field.slug, error: createResult.error });
					console.error(`❌ Failed to create custom field "${field.slug}":`, createResult.error);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				results.customFields.failed.push({ field: field.slug, error: errorMessage });
				console.error(`❌ Exception creating custom field "${field.slug}":`, errorMessage);
			}
		}

		// Step 4: Configure webhook
		const webhookUrl = `${url.origin}/api/webhooks/systeme`;

		console.log(`🔗 Configuring webhook: ${webhookUrl}`);
		if (existingWebhookUrls.includes(webhookUrl)) {
			results.webhooks.skipped.push(webhookUrl);
			console.log(`⏭️  Webhook already exists, skipping...`);
		} else {
			try {
				const createResult = await systemeService.createWebhook({
					url: webhookUrl,
					events: ['contact.created', 'contact.updated', 'contact.tag_added', 'contact.tag_removed'],
					active: true
				});

				if (createResult.success) {
					results.webhooks.created.push(webhookUrl);
					console.log(`✅ Created webhook: ${webhookUrl}`);
				} else {
					results.webhooks.failed.push({ webhook: webhookUrl, error: createResult.error });
					console.error(`❌ Failed to create webhook:`, createResult.error);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				results.webhooks.failed.push({ webhook: webhookUrl, error: errorMessage });
				console.error(`❌ Exception creating webhook:`, errorMessage);
			}
		}

		// Calculate summary
		const totalErrors = results.tags.failed.length +
			results.customFields.failed.length +
			results.webhooks.failed.length;

		const summary = {
			tags: {
				total: requiredTags.length,
				created: results.tags.created.length,
				skipped: results.tags.skipped.length,
				failed: results.tags.failed.length
			},
			customFields: {
				total: requiredFields.length,
				created: results.customFields.created.length,
				skipped: results.customFields.skipped.length,
				failed: results.customFields.failed.length
			},
			webhooks: {
				total: 1,
				created: results.webhooks.created.length,
				skipped: results.webhooks.skipped.length,
				failed: results.webhooks.failed.length
			},
			totalErrors,
			success: totalErrors === 0
		};

		console.log('✨ Systeme.io auto-setup complete!');
		console.log('📊 Summary:', summary);

		return json({
			success: true,
			message: totalErrors === 0
				? 'Systeme.io setup completed successfully!'
				: `Setup completed with ${totalErrors} error(s)`,
			summary,
			details: results,
			nextSteps: [
				{
					step: 1,
					title: 'Verify Setup',
					description: 'Check Systeme.io dashboard to confirm all tags and fields were created',
					url: 'https://systeme.io'
				},
				{
					step: 2,
					title: 'Create Workflows (Manual)',
					description: 'Create automation workflows in Systeme.io for deposit, trading, and qualification tags',
					url: 'https://systeme.io/automations'
				},
				{
					step: 3,
					title: 'Test Webhook',
					description: 'Create a test contact in Systeme.io to verify webhook is working',
					url: 'https://systeme.io/contacts'
				}
			]
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('❌ Auto-setup failed:', errorMessage);

		return json({
			success: false,
			error: `Auto-setup failed: ${errorMessage}`,
			message: 'Failed to complete Systeme.io setup. Please check your API key and try again.'
		}, { status: 500 });
	}
};

/**
 * Get current Systeme.io setup status
 */
export const GET: RequestHandler = async () => {
	try {
		const [tagsResult, fieldsResult, webhooksResult] = await Promise.all([
			systemeService.getAllTags(),
			systemeService.getAllCustomFields(),
			systemeService.getAllWebhooks()
		]);

		const existingTags = tagsResult.success && tagsResult.data
			? tagsResult.data.map((t: any) => t.name || t.label)
			: [];
		const existingFields = fieldsResult.success && fieldsResult.data
			? fieldsResult.data.map((f: any) => f.slug)
			: [];
		const existingWebhooks = webhooksResult.success && webhooksResult.data
			? webhooksResult.data.map((w: any) => ({ url: w.url, active: w.active }))
			: [];

		return json({
			success: true,
			current: {
				tags: existingTags,
				customFields: existingFields,
				webhooks: existingWebhooks
			},
			counts: {
				tags: existingTags.length,
				customFields: existingFields.length,
				webhooks: existingWebhooks.length
			}
		});

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({
			success: false,
			error: `Failed to get setup status: ${errorMessage}`
		}, { status: 500 });
	}
};
