/**
 * Sample Template Seeder
 * Creates industry-specific templates for IB/Forex businesses
 *
 * Run with: npx tsx scripts/seed-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleTemplates = [
	{
		name: 'Forex Lead Generation - US Market',
		description: 'Proven template for generating high-quality forex trading leads in the United States. Targets adults interested in trading and financial independence.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'LEARN_MORE',
			dailyBudget: 50,
			lifetimeBudget: null,
			headline: 'Start Trading Forex Today',
			description: 'Learn to trade forex with expert guidance and proven strategies',
			adCopy: 'Want to achieve financial freedom through forex trading? Join thousands of successful traders who started with our proven system. Get your free trading guide now!',
			targeting: {
				age_min: 25,
				age_max: 55,
				genders: [1, 2],
				geo_locations: {
					countries: ['US']
				},
				interests: [
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003139266461', name: 'Investing' }
				]
			}
		}
	},
	{
		name: 'IB Recruitment Campaign',
		description: 'Attract qualified Independent Brokers to join your network. Focuses on entrepreneurs and business owners looking for partnership opportunities.',
		category: 'conversion',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'CONVERSIONS',
			callToAction: 'APPLY_NOW',
			dailyBudget: 75,
			lifetimeBudget: null,
			headline: 'Become an Independent Broker',
			description: 'Earn commissions by referring forex traders. No experience required.',
			adCopy: 'Looking for a lucrative partnership opportunity? Join our IB program and earn recurring commissions for every trader you refer. Proven support system, competitive rates, and unlimited earning potential.',
			targeting: {
				age_min: 28,
				age_max: 60,
				genders: [1, 2],
				geo_locations: {
					countries: ['US', 'CA', 'GB', 'AU']
				},
				interests: [
					{ id: '6003195797498', name: 'Entrepreneurship' },
					{ id: '6003012298983', name: 'Affiliate marketing' },
					{ id: '6003629266583', name: 'Forex' }
				]
			}
		}
	},
	{
		name: 'Free Trading Webinar',
		description: 'Drive registrations for your trading education webinar. Perfect for building your email list and demonstrating expertise.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'SIGN_UP',
			dailyBudget: 40,
			lifetimeBudget: 500,
			headline: 'Free Forex Trading Webinar',
			description: 'Master the fundamentals of forex trading in 60 minutes',
			adCopy: 'Join our FREE live webinar and discover the strategies professional traders use to profit in the forex market. Limited seats available - register now to secure your spot!',
			targeting: {
				age_min: 22,
				age_max: 50,
				genders: [1, 2],
				geo_locations: {
					countries: ['US', 'CA']
				},
				interests: [
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003241170924', name: 'Online learning' },
					{ id: '6003139266461', name: 'Investing' }
				]
			}
		}
	},
	{
		name: 'Demo Account Sign-Up',
		description: 'Convert interested prospects into demo account users. Low-pressure approach to introduce your platform.',
		category: 'conversion',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'CONVERSIONS',
			callToAction: 'SIGN_UP',
			dailyBudget: 35,
			lifetimeBudget: null,
			headline: 'Try Forex Trading Risk-Free',
			description: 'Open a free demo account with $10,000 virtual money',
			adCopy: 'Curious about forex trading but not ready to invest real money? Start with our free demo account loaded with $10,000 virtual funds. Practice strategies, test the platform, and build confidence before trading live.',
			targeting: {
				age_min: 21,
				age_max: 45,
				genders: [1, 2],
				geo_locations: {
					countries: ['US', 'CA', 'GB', 'AU', 'NZ']
				},
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Trading' }
				]
			}
		}
	},
	{
		name: 'Crypto Trading Awareness',
		description: 'Build brand awareness for your crypto trading services. Broad reach campaign targeting crypto enthusiasts.',
		category: 'awareness',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'BRAND_AWARENESS',
			callToAction: 'LEARN_MORE',
			dailyBudget: 60,
			lifetimeBudget: null,
			headline: 'Trade Crypto with Confidence',
			description: 'Access 50+ cryptocurrencies with institutional-grade security',
			adCopy: 'Looking for a trusted platform to trade Bitcoin, Ethereum, and other cryptocurrencies? Our platform offers low fees, advanced charting tools, and 24/7 customer support. Thousands of traders trust us daily.',
			targeting: {
				age_min: 21,
				age_max: 45,
				genders: [1, 2],
				geo_locations: {
					countries: ['US', 'CA', 'GB']
				},
				interests: [
					{ id: '6003629266583', name: 'Cryptocurrency' },
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003241170924', name: 'Bitcoin' }
				]
			}
		}
	},
	{
		name: 'Experienced Trader Retargeting',
		description: 'Re-engage experienced traders who showed interest but didn\'t convert. Highlights advanced platform features.',
		category: 'conversion',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'CONVERSIONS',
			callToAction: 'GET_QUOTE',
			dailyBudget: 45,
			lifetimeBudget: null,
			headline: 'Advanced Trading Tools for Pros',
			description: 'Get institutional-level features with retail accessibility',
			adCopy: 'Tired of platforms that don\'t meet your needs? Our advanced trading platform offers algorithmic trading, copy trading, and deep liquidity. Built for serious traders who demand more.',
			targeting: {
				age_min: 30,
				age_max: 60,
				genders: [1, 2],
				geo_locations: {
					countries: ['US', 'CA', 'GB', 'AU', 'SG']
				},
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Day trading' },
					{ id: '6003139266461', name: 'Technical analysis' }
				]
			}
		}
	}
];

async function seedTemplates() {
	console.log('🌱 Starting template seeding...\n');

	try {
		// Find or create an admin user to attribute templates to
		let adminUser = await prisma.user.findFirst({
			where: { role: 'ADMIN' }
		});

		if (!adminUser) {
			console.log('⚠️  No admin user found. Templates will be created without createdBy attribution.\n');
		}

		for (const template of sampleTemplates) {
			// Check if template already exists
			const existing = await prisma.adTemplate.findFirst({
				where: { name: template.name }
			});

			if (existing) {
				console.log(`⏭️  Skipped: "${template.name}" (already exists)`);
				continue;
			}

			// Create template
			const created = await prisma.adTemplate.create({
				data: {
					...template,
					createdBy: adminUser?.id || null,
					usageCount: 0
				}
			});

			console.log(`✅ Created: "${created.name}"`);
		}

		console.log(`\n🎉 Seeding complete! Created ${sampleTemplates.length} templates.\n`);
	} catch (error) {
		console.error('❌ Error seeding templates:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Run the seeder
seedTemplates()
	.then(() => {
		console.log('✨ All done!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
