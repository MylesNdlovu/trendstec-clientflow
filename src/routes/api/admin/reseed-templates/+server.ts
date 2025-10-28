import { json, error as svelteError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';

// Top 10 most lucrative African countries for forex trading
const africanCountries = ['ZA', 'NG', 'KE', 'GH', 'EG', 'MA', 'TZ', 'UG', 'ZM', 'BW'];

const optimizedTemplates = [
	{
		name: 'Instant $1000 Funded - Only 97 Spots Left',
		description: 'Limited time: Get instant $1000 funding. No experience needed. First-come, first-served.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'APPLY_NOW',
			dailyBudget: 65,
			lifetimeBudget: null,
			headline: 'Claim Your $1000 FREE Today',
			description: '97 spots left - Get instant funding in 5 minutes',
			adCopy: '🎯 HURRY: Only 97 spots remaining! Get $1000 instant funding with zero evaluation. Start trading immediately and keep 100% of your profits. No hidden fees, no tricks. Click to claim your spot before they are gone!',
			targeting: {
				age_min: 21,
				age_max: 55,
				genders: [1, 2],
				geo_locations: { countries: africanCountries },
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003139266461', name: 'Investing' }
				]
			}
		}
	},
	{
		name: 'Free $1000 Trading Account - No Catch',
		description: 'Get instant $1000 to trade with. No experience required. Full training included. Apply in under 2 minutes.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'SIGN_UP',
			dailyBudget: 55,
			lifetimeBudget: 750,
			headline: '$1000 FREE - No Experience Needed',
			description: 'Start trading today with instant funding + free training',
			adCopy: '✅ Never traded before? Perfect! Get $1000 instant funding + complete training package absolutely FREE. Start making money from day 1. Over 3,200 people already funded this month. Limited spots - apply now!',
			targeting: {
				age_min: 18,
				age_max: 50,
				genders: [1, 2],
				geo_locations: { countries: africanCountries },
				interests: [
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003241170924', name: 'Online learning' },
					{ id: '6003012298983', name: 'Making money online' }
				]
			}
		}
	},
	{
		name: 'Proven Trader Program - $1000 Instant',
		description: 'For serious traders: Instant $1000 funding. Scale to $100K accounts. Keep all profits. Limited availability.',
		category: 'conversion',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'CONVERSIONS',
			callToAction: 'APPLY_NOW',
			dailyBudget: 70,
			lifetimeBudget: null,
			headline: 'Get Funded in 60 Seconds',
			description: '$1000 instant → Scale to $100K. Keep 100% profits.',
			adCopy: '💰 Serious about trading? Get instant $1000 funding and keep 100% of ALL profits. Proven traders scale to $100K in under 90 days. We have funded 1,400+ traders. Only 32 spots left this month - click to apply now!',
			targeting: {
				age_min: 25,
				age_max: 60,
				genders: [1, 2],
				geo_locations: { countries: africanCountries },
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Day trading' },
					{ id: '6003139266461', name: 'Technical analysis' }
				]
			}
		}
	},
	{
		name: '48-Hour Flash Funding - $1000',
		description: '48 hours only: Instant $1000 funding. No evaluation needed. This week only, expires soon.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'SIGN_UP',
			dailyBudget: 85,
			lifetimeBudget: 450,
			headline: '48 Hours Only: $1000 FREE',
			description: 'Flash offer ends soon - Instant funding, zero fees',
			adCopy: '⚡ ENDING SOON: 48-hour flash offer! Get $1000 instant funding with ZERO fees. No evaluation, no waiting. Start trading in minutes. This offer expires in 2 days - claim your funding before time runs out!',
			targeting: {
				age_min: 21,
				age_max: 50,
				genders: [1, 2],
				geo_locations: { countries: africanCountries },
				interests: [
					{ id: '6003629266583', name: 'Forex' },
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003012298983', name: 'Making money online' }
				]
			}
		}
	},
	{
		name: 'Zero to Funded - $1000 Program',
		description: 'Start from zero: Get $1000 instant funding + mentorship. Perfect for beginners ready to start earning.',
		category: 'lead_generation',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'LEAD_GENERATION',
			callToAction: 'LEARN_MORE',
			dailyBudget: 50,
			lifetimeBudget: null,
			headline: 'Start With $0, Get $1000 FREE',
			description: 'Zero experience needed - Get funded + expert guidance',
			adCopy: '🎯 Starting from zero? Get instant $1000 trading account + expert mentorship. Learn as you earn, keep all profits. Perfect for complete beginners. Limited to 50 new traders this week - click to start now!',
			targeting: {
				age_min: 18,
				age_max: 45,
				genders: [1, 2],
				geo_locations: { countries: africanCountries },
				interests: [
					{ id: '6003107902433', name: 'Trading' },
					{ id: '6003241170924', name: 'Online learning' },
					{ id: '6003195797498', name: 'Entrepreneurship' }
				]
			}
		}
	},
	{
		name: 'Financial Freedom Fund - $1000',
		description: 'Build your income: Instant $1000 funding to start your trading journey. No job required, trade from anywhere.',
		category: 'conversion',
		isPublic: true,
		isActive: true,
		templateData: {
			objective: 'CONVERSIONS',
			callToAction: 'GET_QUOTE',
			dailyBudget: 60,
			lifetimeBudget: null,
			headline: 'Quit Your Job? Start Here.',
			description: '$1000 instant funding - Trade from anywhere, anytime',
			adCopy: '💼 Ready for financial freedom? Get instant $1000 trading account and start building real income. Trade from anywhere, work your own hours. Real traders earning $500-$8000/month. Only 45 spots available - apply today!',
			targeting: {
				age_min: 25,
				age_max: 55,
				genders: [1, 2],
				geo_locations: { countries: africanCountries },
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

/**
 * POST /api/admin/reseed-templates
 * Deletes all templates and creates optimized African-focused templates
 * ADMIN ONLY
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			throw svelteError(401, 'Unauthorized');
		}

		// Check admin role
		if (locals.user.role !== 'ADMIN') {
			throw svelteError(403, 'Admin access required');
		}

		console.log('[Reseed Templates] Starting template reseed...');

		// Delete all existing templates
		const deleted = await prisma.adTemplate.deleteMany({});
		console.log(`[Reseed Templates] Deleted ${deleted.count} old templates`);

		// Create new optimized templates
		const created = [];
		for (const template of optimizedTemplates) {
			const newTemplate = await prisma.adTemplate.create({
				data: {
					...template,
					createdBy: locals.user.id,
					usageCount: 0
				}
			});
			created.push(newTemplate);
			console.log(`[Reseed Templates] Created: ${newTemplate.name}`);
		}

		console.log(`[Reseed Templates] Successfully created ${created.length} templates`);

		return json({
			success: true,
			message: `Successfully reseeded templates. Deleted ${deleted.count} old templates, created ${created.length} new templates.`,
			templates: created.map(t => ({
				id: t.id,
				name: t.name,
				category: t.category
			})),
			targetCountries: africanCountries,
			countryNames: [
				'🇿🇦 South Africa',
				'🇳🇬 Nigeria',
				'🇰🇪 Kenya',
				'🇬🇭 Ghana',
				'🇪🇬 Egypt',
				'🇲🇦 Morocco',
				'🇹🇿 Tanzania',
				'🇺🇬 Uganda',
				'🇿🇲 Zambia',
				'🇧🇼 Botswana'
			]
		});

	} catch (error) {
		console.error('[Reseed Templates] Error:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteError(500, 'Failed to reseed templates');
	}
};
