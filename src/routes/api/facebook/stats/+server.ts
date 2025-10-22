import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';

// GET: Get user's ad spend statistics
export const GET: RequestHandler = async (event) => {
	try {
		const user = await requireAuth(event);

		// Get today's date
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Get first day of month
		const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

		// Get ad account
		const account = await prisma.facebookAdAccount.findFirst({
			where: { userId: user.id }
		});

		if (!account) {
			return json({
				success: true,
				stats: {
					today: 0,
					month: 0,
					totalLeads: 0,
					avgCpl: 0
				}
			});
		}

		// Get today's spend
		const todaySpend = await prisma.adSpendHistory.findFirst({
			where: {
				adAccountId: account.id,
				date: today
			}
		});

		// Get month's spend
		const monthSpend = await prisma.adSpendHistory.aggregate({
			where: {
				adAccountId: account.id,
				date: {
					gte: firstDayOfMonth
				}
			},
			_sum: {
				dailySpend: true,
				leads: true
			}
		});

		const totalSpend = monthSpend._sum.dailySpend || 0;
		const totalLeads = monthSpend._sum.leads || 0;
		const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

		return json({
			success: true,
			stats: {
				today: todaySpend?.dailySpend || 0,
				month: totalSpend,
				totalLeads,
				avgCpl
			}
		});
	} catch (error) {
		console.error('Error fetching stats:', error);
		return json(
			{ success: false, error: 'Failed to fetch stats' },
			{ status: 500 }
		);
	}
};
