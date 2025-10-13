import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scrapeMT5Data } from '$lib/services/mt5-automation';
import { TradingVolumeValidator } from '$lib/services/trading-volume-validator';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { commissionSettings, leadData } = await request.json();

		if (!commissionSettings) {
			return json({ error: 'Commission settings required' }, { status: 400 });
		}

		// Start MT5 data scraping
		const scrapingResults = await scrapeMT5Data(commissionSettings);

		// Process trading volume and validate conversions for each lead
		const processedResults = [];

		if (scrapingResults && Array.isArray(scrapingResults)) {
			for (const result of scrapingResults) {
				// Create mock lead for processing if leadData provided
				if (leadData) {
					const mockLead = {
						id: leadData.id || 'mock-lead',
						email: leadData.email || 'unknown',
						broker: leadData.broker || 'Prime XBT',
						mt5Login: leadData.mt5Login || result.accountNumber,
						status: 'captured',
						tradingData: {
							hasDeposited: false,
							totalLotSize: 0,
							tradeCount: 0,
							qualifiesForConversion: false,
							lastScrapedAt: null,
							trades: []
						},
						depositedAt: null,
						firstTradeAt: null
					};

					// Update trading data based on scraping results
					const updatedLead = TradingVolumeValidator.updateLeadTradingData(mockLead, result);

					// Get conversion summary
					const conversionSummary = TradingVolumeValidator.getConversionSummary(updatedLead);

					processedResults.push({
						...result,
						leadId: updatedLead.id,
						conversionStatus: conversionSummary,
						qualifiesForConversion: conversionSummary.qualifiesForConversion,
						tradingVolume: {
							totalLotSize: conversionSummary.totalLotSize,
							remainingLotSize: conversionSummary.lotSizeRemaining,
							tradeCount: conversionSummary.tradeCount,
							progressPercentage: conversionSummary.progressPercentage
						}
					});
				} else {
					processedResults.push(result);
				}
			}
		}

		return json({
			success: true,
			data: processedResults,
			conversionRequirements: {
				minimumLotSize: 0.2,
				mustHaveDeposited: true,
				description: 'Lead must deposit AND trade at least 0.2 lot size total to qualify for conversion'
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('MT5 scraping error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	// Return the last scraping status or trigger a new scrape
	return json({
		message: 'MT5 scraping endpoint. Use POST to trigger scraping with commission settings.',
		endpoints: {
			POST: 'Trigger MT5 data scraping',
			body: {
				commissionSettings: {
					brokerMT5Links: 'object with broker URLs',
					brokerCredentials: 'object with MT5 credentials'
				}
			}
		}
	});
};