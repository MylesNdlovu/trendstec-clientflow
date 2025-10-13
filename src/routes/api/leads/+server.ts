import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';
import { encrypt } from '$lib/utils/encryption';

const prisma = new PrismaClient();

/**
 * GET /api/leads
 * Get all leads with their stats, or single lead by token
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const token = url.searchParams.get('token');

		// If token provided, return single lead info (for form personalization)
		if (token) {
			const lead = await prisma.lead.findFirst({
				where: { trackingToken: token },
				select: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					phone: true,
					broker: true
				}
			});

			if (!lead) {
				return json({ error: 'Invalid or expired tracking link' }, { status: 404 });
			}

			return json({ lead });
		}

		const status = url.searchParams.get('status');
		const broker = url.searchParams.get('broker');

		const where: any = {};
		if (status) where.status = status;
		if (broker) where.broker = broker;

		const leads = await prisma.lead.findMany({
			where,
			include: {
				investorCredentials: {
					include: {
						positions: {
							where: { isOpen: true }
						}
					}
				},
				activities: {
					orderBy: { createdAt: 'desc' },
					take: 5
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		// Calculate aggregated stats for each lead
		const leadsWithStats = leads.map((lead) => {
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
			const openPositions = lead.investorCredentials.reduce(
				(sum, cred) => sum + cred.positions.length,
				0
			);

			return {
				...lead,
				stats: {
					totalBalance,
					totalEquity,
					totalProfit,
					totalVolume,
					openPositions,
					credentialsCount: lead.investorCredentials.length
				},
				// Include commission fields from schema
				ftdEarned: lead.ftdEarned,
				cpaEarned: lead.cpaEarned,
				totalEarned: lead.totalEarned
			};
		});

		return json({ success: true, leads: leadsWithStats });
	} catch (error) {
		console.error('Error fetching leads:', error);
		return json({ success: false, error: 'Failed to fetch leads' }, { status: 500 });
	}
};

/**
 * POST /api/leads
 * Create a new lead
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const lead = await prisma.lead.create({
			data: {
				email: body.email,
				firstName: body.firstName,
				lastName: body.lastName,
				phone: body.phone,
				broker: body.broker || 'unknown',
				source: body.source || 'unknown',
				status: 'captured'
			}
		});

		// Create activity record
		await prisma.leadActivity.create({
			data: {
				leadId: lead.id,
				type: 'status_change',
				description: 'Lead captured',
				newValue: 'captured'
			}
		});

		// If MT5 credentials provided, create investor credential with encrypted password
		if (body.mt5Login && body.mt5Password) {
			await prisma.investorCredential.create({
				data: {
					leadId: lead.id,
					login: body.mt5Login,
					password: encrypt(body.mt5Password), // Encrypt password
					server: body.mt5Server || 'unknown',
					broker: body.broker || 'unknown',
					isVerified: false
				}
			});
		}

		// Fetch complete lead with credentials
		const completeLead = await prisma.lead.findUnique({
			where: { id: lead.id },
			include: {
				investorCredentials: true
			}
		});

		return json({ success: true, lead: completeLead });
	} catch (error) {
		console.error('Error creating lead:', error);
		return json({ success: false, error: 'Failed to create lead' }, { status: 500 });
	}
};
