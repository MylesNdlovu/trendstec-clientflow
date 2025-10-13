import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

/**
 * GET /api/leads/[id]
 * Get a single lead with all related data
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const lead = await prisma.lead.findUnique({
			where: { id: params.id },
			include: {
				investorCredentials: {
					include: {
						positions: {
							where: { isOpen: true },
							orderBy: { openTime: 'desc' }
						},
						trades: {
							orderBy: { closeTime: 'desc' },
							take: 20
						}
					}
				},
				activities: {
					orderBy: { createdAt: 'desc' },
					take: 50
				}
			}
		});

		if (!lead) {
			return json({ success: false, error: 'Lead not found' }, { status: 404 });
		}

		// Calculate aggregated stats
		const totalBalance = lead.investorCredentials.reduce(
			(sum, cred) => sum + (cred.balance || 0),
			0
		);
		const totalEquity = lead.investorCredentials.reduce(
			(sum, cred) => sum + (cred.equity || 0),
			0
		);
		const totalProfit = lead.investorCredentials.reduce(
			(sum, cred) => sum + (cred.profit || 0),
			0
		);
		const totalVolume = lead.investorCredentials.reduce(
			(sum, cred) => sum + (cred.totalVolume || 0),
			0
		);
		const openPositionsCount = lead.investorCredentials.reduce(
			(sum, cred) => sum + cred.positions.length,
			0
		);
		const totalTrades = lead.investorCredentials.reduce(
			(sum, cred) => sum + cred.trades.length,
			0
		);

		return json({
			success: true,
			lead: {
				...lead,
				stats: {
					totalBalance,
					totalEquity,
					totalProfit,
					totalVolume,
					openPositionsCount,
					totalTrades,
					credentialsCount: lead.investorCredentials.length
				}
			}
		});
	} catch (error) {
		console.error('Error fetching lead:', error);
		return json({ success: false, error: 'Failed to fetch lead' }, { status: 500 });
	}
};
