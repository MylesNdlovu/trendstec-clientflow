/**
 * Test script for MT5 Scraper
 * Usage: node scripts/test-scraper.js [credentialId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestLead() {
	console.log('Creating test lead...');

	const lead = await prisma.lead.create({
		data: {
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
			broker: 'Prime XBT',
			source: 'manual_test',
			status: 'captured'
		}
	});

	console.log('✅ Test lead created:', lead.id);
	return lead;
}

async function createTestCredential(leadId) {
	console.log('Creating test investor credential...');

	const credential = await prisma.investorCredential.create({
		data: {
			leadId: leadId,
			login: '12345678',
			password: 'investor_password',
			server: 'MT5Server-Live',
			broker: 'Prime XBT',
			isVerified: false
		}
	});

	console.log('✅ Test credential created:', credential.id);
	return credential;
}

async function testScraperAPI(credentialId) {
	console.log('\nTesting scraper API...');

	try {
		const response = await fetch('http://localhost:5173/api/scraper/run', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(
				credentialId ? { credentialId } : {}
			)
		});

		const result = await response.json();

		if (result.success) {
			console.log('✅ Scraping completed successfully');
			console.log('Result:', JSON.stringify(result.result, null, 2));
		} else {
			console.error('❌ Scraping failed:', result.error);
		}

		return result;
	} catch (error) {
		console.error('❌ API call failed:', error.message);
		return null;
	}
}

async function viewLeadData(leadId) {
	console.log('\nFetching lead data...');

	const lead = await prisma.lead.findUnique({
		where: { id: leadId },
		include: {
			investorCredentials: {
				include: {
					positions: true,
					trades: true
				}
			},
			activities: {
				orderBy: { createdAt: 'desc' },
				take: 10
			}
		}
	});

	console.log('\n📊 Lead Data:');
	console.log('Status:', lead.status);
	console.log('Credentials:', lead.investorCredentials.length);

	for (const cred of lead.investorCredentials) {
		console.log(`\nCredential ${cred.login}:`);
		console.log('  Balance:', cred.balance);
		console.log('  Equity:', cred.equity);
		console.log('  Margin:', cred.margin);
		console.log('  Total Volume:', cred.totalVolume);
		console.log('  Open Positions:', cred.positions.filter((p) => p.isOpen).length);
		console.log('  Total Trades:', cred.trades.length);
		console.log('  Last Scraped:', cred.lastScrapedAt);
		console.log('  Scraping Status:', cred.scrapingStatus);
	}

	console.log('\n📝 Recent Activities:');
	for (const activity of lead.activities) {
		console.log(`  ${activity.type}: ${activity.description} (${activity.createdAt})`);
	}

	return lead;
}

async function main() {
	const args = process.argv.slice(2);
	const credentialId = args[0];

	console.log('🚀 MT5 Scraper Test Script\n');

	if (credentialId) {
		console.log('Testing with existing credential:', credentialId);

		// Test scraping
		await testScraperAPI(credentialId);

		// View results
		const credential = await prisma.investorCredential.findUnique({
			where: { id: credentialId }
		});

		if (credential?.leadId) {
			await viewLeadData(credential.leadId);
		}
	} else {
		console.log('Creating test data...\n');

		// Create test lead and credential
		const lead = await createTestLead();
		const credential = await createTestCredential(lead.id);

		console.log('\n⚠️  NOTE: This will attempt to scrape MT5 with test credentials.');
		console.log('This will likely fail unless you provide real credentials.');
		console.log('To test with real credentials, update the login/password above.\n');

		// Test scraping
		await testScraperAPI(credential.id);

		// View results
		await viewLeadData(lead.id);

		console.log('\n✨ Test complete!');
		console.log(`Lead ID: ${lead.id}`);
		console.log(`Credential ID: ${credential.id}`);
	}

	await prisma.$disconnect();
}

main().catch((error) => {
	console.error('❌ Test failed:', error);
	process.exit(1);
});
