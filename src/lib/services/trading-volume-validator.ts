// Trading Volume Validation Service
// Validates if a lead qualifies for conversion based on deposit and trading volume

export interface Trade {
	symbol: string;
	lotSize: number;
	openTime: Date;
	closeTime?: Date;
	profit?: number;
	type: 'buy' | 'sell';
}

export interface TradingData {
	hasDeposited: boolean;
	totalLotSize: number;
	tradeCount: number;
	qualifiesForConversion: boolean;
	lastScrapedAt: Date | null;
	trades: Trade[];
}

export interface Lead {
	id: string;
	email: string;
	broker: string;
	mt5Login: string;
	status: string;
	tradingData: TradingData;
	depositedAt: Date | null;
	firstTradeAt: Date | null;
}

export class TradingVolumeValidator {
	// Minimum lot size required for conversion qualification
	private static readonly MIN_LOT_SIZE = 0.2;

	/**
	 * Validates if a lead qualifies for conversion based on deposit and trading volume
	 * Requirements:
	 * 1. Must have deposited
	 * 2. Must have traded at least 0.2 lot size total (can be multiple trades like 0.01 x 20)
	 */
	static validateConversion(lead: Lead): boolean {
		if (!lead.tradingData.hasDeposited) {
			return false;
		}

		return lead.tradingData.totalLotSize >= this.MIN_LOT_SIZE;
	}

	/**
	 * Processes MT5 trading data from Playwright scraping
	 */
	static processTradingData(scrapedData: any): { trades: Trade[], totalLotSize: number } {
		const trades: Trade[] = [];
		let totalLotSize = 0;

		if (scrapedData.trades && Array.isArray(scrapedData.trades)) {
			for (const tradeData of scrapedData.trades) {
				try {
					const trade: Trade = {
						symbol: tradeData.symbol || 'UNKNOWN',
						lotSize: parseFloat(tradeData.lotSize) || 0,
						openTime: new Date(tradeData.openTime),
						closeTime: tradeData.closeTime ? new Date(tradeData.closeTime) : undefined,
						profit: tradeData.profit ? parseFloat(tradeData.profit) : undefined,
						type: tradeData.type === 'sell' ? 'sell' : 'buy'
					};

					if (trade.lotSize > 0) {
						trades.push(trade);
						totalLotSize += trade.lotSize;
					}
				} catch (error) {
					console.warn('Failed to process trade data:', tradeData, error);
				}
			}
		}

		return { trades, totalLotSize };
	}

	/**
	 * Updates lead trading data based on MT5 scraping results
	 */
	static updateLeadTradingData(lead: Lead, scrapedData: any): Lead {
		const { trades, totalLotSize } = this.processTradingData(scrapedData);

		// Check if deposit was made based on account balance or deposit history
		const hasDeposited = scrapedData.balance > 0 ||
						   scrapedData.deposits?.length > 0 ||
						   lead.tradingData.hasDeposited; // Keep existing deposit status

		// Update trading data
		lead.tradingData = {
			...lead.tradingData,
			hasDeposited,
			totalLotSize,
			tradeCount: trades.length,
			qualifiesForConversion: hasDeposited && totalLotSize >= this.MIN_LOT_SIZE,
			lastScrapedAt: new Date(),
			trades
		};

		// Update timestamps
		if (hasDeposited && !lead.depositedAt) {
			lead.depositedAt = new Date();
		}

		if (trades.length > 0 && !lead.firstTradeAt) {
			lead.firstTradeAt = trades[0].openTime;
		}

		// Update lead status based on conversion qualification
		if (lead.tradingData.qualifiesForConversion) {
			lead.status = 'converted';
		} else if (hasDeposited) {
			lead.status = 'deposited';
		} else {
			lead.status = 'captured';
		}

		return lead;
	}

	/**
	 * Gets conversion summary for a lead
	 */
	static getConversionSummary(lead: Lead) {
		return {
			qualifiesForConversion: lead.tradingData.qualifiesForConversion,
			hasDeposited: lead.tradingData.hasDeposited,
			totalLotSize: lead.tradingData.totalLotSize,
			lotSizeRemaining: Math.max(0, this.MIN_LOT_SIZE - lead.tradingData.totalLotSize),
			tradeCount: lead.tradingData.tradeCount,
			status: lead.status,
			progressPercentage: Math.min(100, (lead.tradingData.totalLotSize / this.MIN_LOT_SIZE) * 100)
		};
	}

	/**
	 * Calculates commission based on conversion qualification
	 */
	static calculateCommission(lead: Lead, ftdAmount: number, cpaAmount: number): number {
		if (!lead.tradingData.qualifiesForConversion) {
			return 0;
		}

		// Both FTD (first deposit) and CPA (qualified conversion) earned
		return ftdAmount + cpaAmount;
	}
}