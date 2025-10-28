/**
 * African Trader Funding Templates Seeder
 * Creates templates focused on $1000 instant funding for African traders
 * Uses scarcity strategies and targets serious/beginner traders
 *
 * Run with: npx tsx scripts/seed-african-funding-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// African countries for targeting
const africanCountries = ['ZA', 'NG', 'KE', 'GH', 'EG', 'UG', 'TZ', 'ZW', 'RW', 'ET'];

const fundingTemplates = [
	{
		name: 'Instant $1000 Funded Account - Limited Spots',
		description: 'Exclusive offer for African traders: Get instant $1000 funding with no evaluation required. Limited to first 100 traders only.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'APPLY_NOW',
			dailyBudget: 60,
			lifetimeBudget: null,
			headline: 'Get $1000 to Trade - FREE Today',
			description: 'Limited spots! Instant funding for serious African traders',
			adCopy: '🎯 LAST CHANCE: Only 47 spots left! Get instant $1000 funded trading account - No evaluation needed. Perfect for serious African traders ready to prove their skills. Apply now before spots fill up!',
			targeting: {
				age_min: 21,
				age_max: 55,
				genders: [1, 2],
				geo_locations: {
					countries: africanCountries
				},
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003139266461', name: 'Investing' }
				]
			}
		}
	},
	{
		name: 'Beginner Trader Funding - $1000 Start',
		description: 'Perfect for beginners: Start your trading career with instant $1000 funding. No experience required, full training included.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'SIGN_UP',
			dailyBudget: 50,
			lifetimeBudget: 800,
			headline: 'No Experience? Get $1000 Anyway',
			description: 'Free training + instant $1000 funding for African beginners',
			adCopy: '✅ Never traded before? No problem! We give you $1000 instant funding + FREE professional training. Join 2,847 African traders who started with $0 experience. Limited to 50 new traders this week only.',
			targeting: {
				age_min: 18,
				age_max: 45,
				genders: [1, 2],
				geo_locations: {
					countries: africanCountries
				},
				interests: [
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003241170924', name: 'Online learning' },
					{ id: '6003195797498', name: 'Entrepreneurship' }
				]
			}
		}
	},
	{
		name: 'Professional Trader Challenge - $1000',
		description: 'For experienced traders: Instant $1000 funding with 80% profit split. Prove your skills and scale to $100K.',
		category: 'conversion',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'CONVERSIONS',
			callToAction: 'APPLY_NOW',
			dailyBudget: 70,
			lifetimeBudget: null,
			headline: 'Serious Traders: 80% Profit Split',
			description: '$1000 instant funding → Scale to $100K. African traders only.',
			adCopy: '💰 For serious traders only: Get instant $1000 funding + keep 80% of ALL profits. Scale to $100K account in 90 days. We have funded 1,200+ African traders. Only 25 spots available this month - apply now!',
			targeting: {
				age_min: 25,
				age_max: 60,
				genders: [1, 2],
				geo_locations: {
					countries: africanCountries
				},
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Day trading' },
					{ id: '6003139266461', name: 'Technical analysis' }
				]
			}
		}
	},
	{
		name: 'Weekend Flash Funding - $1000',
		description: '72-hour special: Instant $1000 funding for this weekend only. African traders, first-come-first-served.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'SIGN_UP',
			dailyBudget: 80,
			lifetimeBudget: 500,
			headline: '72 Hours Only: Free $1000 Account',
			description: 'Weekend flash offer - Instant funding, no strings attached',
			adCopy: '⚡ URGENT: This weekend ONLY! Get instant $1000 funded account absolutely FREE. No catch, no evaluation, instant access. For African traders serious about making money. Expires Monday midnight - claim yours now!',
			targeting: {
				age_min: 21,
				age_max: 50,
				genders: [1, 2],
				geo_locations: {
					countries: africanCountries
				},
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003012298983', name: 'Making money online' }
				]
			}
		}
	},
	{
		name: 'Student Trader Program - $1000',
		description: 'University students & young professionals: Get $1000 instant funding + mentorship. Build your trading career while studying.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'LEARN_MORE',
			dailyBudget: 45,
			lifetimeBudget: null,
			headline: 'Students: Trade With $1000 FREE',
			description: 'Study & trade - Get instant funding + expert mentorship',
			adCopy: '🎓 African students & young professionals: Get instant $1000 trading account + 1-on-1 mentorship. Trade part-time, keep 70% profits. Perfect side hustle while studying. Limited to 30 students per country!',
			targeting: {
				age_min: 18,
				age_max: 30,
				genders: [1, 2],
				geo_locations: {
					countries: africanCountries
				},
				interests: [
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003241170924', name: 'Online learning' },
					{ id: '6003195797498', name: 'Entrepreneurship' },
					{ id: '6003397425859', name: 'University' }
				]
			}
		}
	},
	{
		name: 'Recession-Proof Income - $1000 Funding',
		description: 'Build recession-proof income: Instant $1000 funding to start your trading business. For Africans tired of job uncertainty.',
		category: 'conversion',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'CONVERSIONS',
			callToAction: 'GET_QUOTE',
			dailyBudget: 55,
			lifetimeBudget: null,
			headline: 'Tired of Job Uncertainty? Trade.',
			description: '$1000 instant funding - Build recession-proof income today',
			adCopy: '💼 Economic uncertainty got you worried? Get instant $1000 trading account and build recession-proof income. Real African traders earning $500-$5000/month. No boss, no limits. Only 40 spots left - secure yours today!',
			targeting: {
				age_min: 28,
				age_max: 55,
				genders: [1, 2],
				geo_locations: {
					countries: africanCountries
				},
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003195797498', name: 'Entrepreneurship' },
					{ id: '6003012298983', name: 'Making money online' },
					{ id: '6003107902433', name: 'Trading' }
				]
			}
		}
	}
];

async function seedFundingTemplates() {
	console.log('🌍 Starting African Funding Templates seeding...\n');

	try {
		// Find admin user
		let adminUser = await prisma.user.findFirst({
			where: { role: 'ADMIN' }
		});

		if (!adminUser) {
			console.log('⚠️  No admin user found. Templates will be created without createdBy attribution.\n');
		}

		// First, delete old templates
		const deleted = await prisma.adTemplate.deleteMany({});
		console.log(`🗑️  Deleted ${deleted.count} old templates\n`);

		// Create new African funding templates
		for (const template of fundingTemplates) {
			const created = await prisma.adTemplate.create({
				data: {
					...template,
					createdBy: adminUser?.id || null,
					usageCount: 0
				}
			});

			console.log(`✅ Created: "${created.name}"`);
		}

		console.log(`\n🎉 Seeding complete! Created ${fundingTemplates.length} African funding templates.\n`);

		console.log('📊 Template Summary:');
		console.log(`   • Target: ${africanCountries.length} African countries`);
		console.log(`   • Countries: ${africanCountries.join(', ')}`);
		console.log(`   • Focus: $1000 instant funding offers`);
		console.log(`   • Strategy: Scarcity + urgency`);
		console.log(`   • Audience: Beginners + professionals\n`);

	} catch (error) {
		console.error('❌ Error seeding templates:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Run the seeder
seedFundingTemplates()
	.then(() => {
		console.log('✨ All done!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
