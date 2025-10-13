import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

/**
 * GET /api/stats
 * Get dashboard statistics
 */
export const GET: RequestHandler = async () => {
	try {
		// Get lead counts by status
		const totalLeads = await prisma.lead.count();
		const capturedLeads = await prisma.lead.count({ where: { status: 'captured' } });
		const depositedLeads = await prisma.lead.count({ where: { status: 'deposited' } });
		const tradingLeads = await prisma.lead.count({ where: { status: 'trading' } });
		const qualifiedLeads = await prisma.lead.count({ where: { status: 'qualified' } });

		// Get financial stats
		const credentials = await prisma.investorCredential.findMany({
			where: { isVerified: true }
		});

		const totalBalance = credentials.reduce((sum, cred) => sum + (cred.balance || 0), 0);
		const totalEquity = credentials.reduce((sum, cred) => sum + (cred.equity || 0), 0);
		const totalProfit = credentials.reduce((sum, cred) => sum + (cred.profit || 0), 0);
		const totalVolume = credentials.reduce((sum, cred) => sum + (cred.totalVolume || 0), 0);

		// Get open positions count
		const openPositionsCount = await prisma.mT5Position.count({ where: { isOpen: true } });

		// Get recent activities
		const recentActivities = await prisma.leadActivity.findMany({
			take: 10,
			orderBy: { createdAt: 'desc' },
			include: {
				lead: {
					select: {
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		// Calculate conversion rates
		const capturedToDeposited =
			totalLeads > 0 ? ((depositedLeads / totalLeads) * 100).toFixed(2) : '0';
		const depositedToTrading =
			depositedLeads > 0 ? ((tradingLeads / depositedLeads) * 100).toFixed(2) : '0';
		const tradingToQualified =
			tradingLeads > 0 ? ((qualifiedLeads / tradingLeads) * 100).toFixed(2) : '0';

		// Get leads per broker
		const leadsByBroker = await prisma.lead.groupBy({
			by: ['broker'],
			_count: { id: true }
		});

		// Calculate average time to deposit (in hours)
		const allLeadsWithTimestamps = await prisma.lead.findMany({
			select: {
				leadCapturedAt: true,
				depositedAt: true
			}
		});

		const leadsWithDeposit = allLeadsWithTimestamps.filter(
			lead => lead.depositedAt !== null && lead.leadCapturedAt !== null
		);

		let avgTimeToDeposit = 0;
		if (leadsWithDeposit.length > 0) {
			const totalHours = leadsWithDeposit.reduce((sum, lead) => {
				const hours = (lead.depositedAt!.getTime() - lead.leadCapturedAt.getTime()) / (1000 * 60 * 60);
				return sum + hours;
			}, 0);
			avgTimeToDeposit = totalHours / leadsWithDeposit.length;
		}

		// Calculate average time to trade (from deposited to trading)
		const allLeadsWithTrades = await prisma.lead.findMany({
			select: {
				depositedAt: true,
				tradingStartAt: true
			}
		});

		const leadsWithTrading = allLeadsWithTrades.filter(
			lead => lead.tradingStartAt !== null && lead.depositedAt !== null
		);

		let avgTimeToTrade = 0;
		if (leadsWithTrading.length > 0) {
			const totalHours = leadsWithTrading.reduce((sum, lead) => {
				const hours = (lead.tradingStartAt!.getTime() - lead.depositedAt!.getTime()) / (1000 * 60 * 60);
				return sum + hours;
			}, 0);
			avgTimeToTrade = totalHours / leadsWithTrading.length;
		}

		// Get top performing source
		const leadsBySource = await prisma.lead.groupBy({
			by: ['source'],
			_count: { id: true },
			orderBy: { _count: { id: 'desc' } },
			take: 1
		});

		const topPerformingSource = leadsBySource.length > 0
			? leadsBySource[0].source
			: 'N/A';

		// Get credential validation statistics
		const totalCredentials = await prisma.investorCredential.count();
		const verifiedCredentials = await prisma.investorCredential.count({ where: { isVerified: true } });
		const pendingCredentials = await prisma.investorCredential.count({ where: { scrapingStatus: 'pending' } });
		const failedCredentials = await prisma.investorCredential.count({ where: { scrapingStatus: 'failed' } });
		const successfulCredentials = await prisma.investorCredential.count({ where: { scrapingStatus: 'success' } });

		// Note: blockedCredentials temporarily set to 0 until Prisma client is regenerated
		const blockedCredentials = 0;

		return json({
			success: true,
			stats: {
				leads: {
					total: totalLeads,
					captured: capturedLeads,
					deposited: depositedLeads,
					trading: tradingLeads,
					qualified: qualifiedLeads
				},
				credentials: {
					total: totalCredentials,
					verified: verifiedCredentials,
					pending: pendingCredentials,
					failed: failedCredentials,
					successful: successfulCredentials,
					blocked: blockedCredentials,
					successRate: totalCredentials > 0 ? ((successfulCredentials / totalCredentials) * 100).toFixed(1) : 0
				},
				financial: {
					totalBalance,
					totalEquity,
					totalProfit,
					totalVolume,
					openPositions: openPositionsCount
				},
				conversion: {
					capturedToDeposited: parseFloat(capturedToDeposited),
					depositedToTrading: parseFloat(depositedToTrading),
					tradingToQualified: parseFloat(tradingToQualified)
				},
				performance: {
					avgTimeToDeposit: avgTimeToDeposit > 0 ? `${(avgTimeToDeposit / 24).toFixed(1)} days` : 'N/A',
					avgTimeToTrade: avgTimeToTrade > 0 ? `${(avgTimeToTrade / 24).toFixed(1)} days` : 'N/A',
					topPerformingSource
				},
				brokers: leadsByBroker.map((b) => ({
					name: b.broker || 'Unknown',
					count: b._count.id
				})),
				recentActivities
			}
		});
	} catch (error) {
		console.error('Error fetching stats:', error);
		return json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
	}
};
