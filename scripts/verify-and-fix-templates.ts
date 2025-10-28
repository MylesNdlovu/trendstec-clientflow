/**
 * Verify and Fix Template Targeting
 * Ensures all templates target the correct African countries
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const correctAfricanCountries = ['ZA', 'NG', 'KE', 'GH', 'EG', 'MA', 'TZ', 'UG', 'ZM', 'BW'];

async function verifyAndFixTemplates() {
	console.log('🔍 Checking all templates...\n');

	try {
		const templates = await prisma.adTemplate.findMany({});

		console.log(`Found ${templates.length} templates\n`);

		for (const template of templates) {
			const templateData = template.templateData as any;
			const currentCountries = templateData?.targeting?.geo_locations?.countries || [];

			console.log(`📄 Template: ${template.name}`);
			console.log(`   Current countries: ${currentCountries.join(', ')}`);

			// Check if countries are correct
			const isCorrect = JSON.stringify(currentCountries.sort()) === JSON.stringify(correctAfricanCountries.sort());

			if (!isCorrect) {
				console.log(`   ❌ INCORRECT - Updating...`);

				// Update the template
				const updatedData = {
					...templateData,
					targeting: {
						...templateData.targeting,
						geo_locations: {
							countries: correctAfricanCountries
						}
					}
				};

				await prisma.adTemplate.update({
					where: { id: template.id },
					data: { templateData: updatedData }
				});

				console.log(`   ✅ FIXED - Now targets: ${correctAfricanCountries.join(', ')}`);
			} else {
				console.log(`   ✅ CORRECT`);
			}
			console.log('');
		}

		console.log('🎉 All templates verified and fixed!\n');
		console.log('Target countries: ZA, NG, KE, GH, EG, MA, TZ, UG, ZM, BW');
		console.log('Countries:');
		console.log('  🇿🇦 South Africa');
		console.log('  🇳🇬 Nigeria');
		console.log('  🇰🇪 Kenya');
		console.log('  🇬🇭 Ghana');
		console.log('  🇪🇬 Egypt');
		console.log('  🇲🇦 Morocco');
		console.log('  🇹🇿 Tanzania');
		console.log('  🇺🇬 Uganda');
		console.log('  🇿🇲 Zambia');
		console.log('  🇧🇼 Botswana\n');

	} catch (error) {
		console.error('❌ Error:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

verifyAndFixTemplates()
	.then(() => {
		console.log('✨ Done!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
