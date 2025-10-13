import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeApiClient } from '$lib/utils/api-client';
import { validateAndSanitize, ValidationError } from '$lib/utils/validation';

// Critical: Detect sync discrepancies between systems with enhanced error handling
export const GET: RequestHandler = async ({ url }) => {
	try {
		const { SYSTEME_API_KEY } = process.env;
		const detailed = url.searchParams.get('detailed') === 'true';
		const autoFix = url.searchParams.get('autoFix') === 'true';

		if (!SYSTEME_API_KEY) {
			return json({
				status: 'error',
				message: 'Systeme.io API key not configured',
				critical: true,
				timestamp: new Date().toISOString()
			}, { status: 500 });
		}

		// Set API client authorization
		systemeApiClient['config'].headers = {
			...systemeApiClient['config'].headers,
			'Authorization': `Bearer ${SYSTEME_API_KEY}`
		};

		// Get contacts from Systeme.io with retry logic
		const systemeResponse = await systemeApiClient.request({
			method: 'GET',
			endpoint: '/contacts?limit=500&tags=MT5-Lead'
		});

		if (!systemeResponse.success) {
			return json({
				status: 'error',
				message: 'Failed to fetch Systeme.io contacts',
				error_details: systemeResponse.error,
				retries: systemeResponse.retries,
				can_retry: systemeResponse.retries < 3
			}, { status: 400 });
		}

		const systemeContacts = systemeResponse.data?.data || [];

		// Get local leads with retry logic
		const localResponse = await systemeApiClient.request({
			method: 'GET',
			endpoint: '/affiliate/stats'
		});

		let localLeads = [];
		if (localResponse.success) {
			localLeads = localResponse.data?.leads || [];
		} else {
			console.warn('Failed to fetch local leads, using empty array for comparison');
		}

		// Enhanced discrepancy analysis
		const analysis = await analyzeDiscrepancies(localLeads, systemeContacts, detailed);

		// Calculate health score
		const totalItems = Math.max(localLeads.length, systemeContacts.length);
		const totalDiscrepancies = analysis.summary.missing_in_systeme +
								   analysis.summary.missing_in_local +
								   analysis.summary.status_mismatches;
		const healthScore = totalItems > 0 ? Math.max(0, (1 - totalDiscrepancies / totalItems) * 100) : 100;

		// Auto-fix critical issues if requested
		let autoFixResults = null;
		if (autoFix && totalDiscrepancies > 0) {
			autoFixResults = await performAutoFix(analysis, systemeApiClient);
		}

		const response = {
			status: healthScore > 90 ? 'healthy' : healthScore > 70 ? 'warning' : 'critical',
			health_score: Math.round(healthScore),
			sync_health: {
				total_local_leads: localLeads.length,
				total_systeme_contacts: systemeContacts.length,
				mt5_tagged_in_systeme: systemeContacts.length,
				api_performance: {
					systeme_response_time: systemeResponse.duration,
					local_response_time: localResponse.duration || 0,
					systeme_retries: systemeResponse.retries,
					local_retries: localResponse.retries || 0
				},
				discrepancies: analysis.summary
			},
			...(detailed && { detailed_issues: analysis.details }),
			recommendations: generateRecommendations(analysis),
			...(autoFixResults && { auto_fix_results: autoFixResults }),
			last_check: new Date().toISOString(),
			next_recommended_check: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
		};

		return json(response);

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('Sync status check error:', errorMessage);
		return json({
			status: 'error',
			message: 'Failed to check sync status',
			details: errorMessage,
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

async function analyzeDiscrepancies(localLeads: any[], systemeContacts: any[], detailed: boolean) {
	const systemeEmails = new Set(systemeContacts.map((c: any) => c.email));
	const localEmails = new Set(localLeads.map((l: any) => l.email));

	// Find missing items
	const missingInSysteme = localLeads.filter(lead => !systemeEmails.has(lead.email));
	const missingInLocal = systemeContacts.filter(contact => !localEmails.has(contact.email));

	// Find status mismatches
	const statusMismatches = [];
	const dataInconsistencies = [];

	for (const lead of localLeads) {
		const systemeContact = systemeContacts.find((c: any) => c.email === lead.email);
		if (systemeContact) {
			const localStatus = lead.status;
			const systemeStatus = systemeContact.custom_fields?.conversion_status;

			if (localStatus !== systemeStatus) {
				statusMismatches.push({
					email: lead.email,
					local_status: localStatus,
					systeme_status: systemeStatus,
					last_local_update: lead.lastVerified,
					last_systeme_update: systemeContact.updated_at,
					priority: determinePriority(localStatus, systemeStatus)
				});
			}

			// Check for data inconsistencies
			if (detailed) {
				const inconsistencies = findDataInconsistencies(lead, systemeContact);
				if (inconsistencies.length > 0) {
					dataInconsistencies.push({
						email: lead.email,
						inconsistencies
					});
				}
			}
		}
	}

	return {
		summary: {
			missing_in_systeme: missingInSysteme.length,
			missing_in_local: missingInLocal.length,
			status_mismatches: statusMismatches.length,
			data_inconsistencies: dataInconsistencies.length
		},
		details: {
			missing_in_systeme: missingInSysteme.map(l => ({
				email: l.email,
				status: l.status,
				last_activity: l.lastVerified,
				commission: l.commission
			})),
			missing_in_local: missingInLocal.map(c => ({
				email: c.email,
				tags: c.tags,
				status: c.custom_fields?.conversion_status,
				systeme_id: c.id
			})),
			status_mismatches: statusMismatches,
			...(detailed && { data_inconsistencies: dataInconsistencies })
		}
	};
}

function determinePriority(localStatus: string, systemeStatus: string): 'high' | 'medium' | 'low' {
	// High priority: Converting statuses (deposited, trading)
	if ((localStatus === 'deposited' || localStatus === 'trading') && systemeStatus !== localStatus) {
		return 'high';
	}
	// Medium priority: Status regression
	if (localStatus === 'captured' && (systemeStatus === 'deposited' || systemeStatus === 'trading')) {
		return 'medium';
	}
	return 'low';
}

function findDataInconsistencies(lead: any, contact: any): string[] {
	const inconsistencies = [];

	// Check MT5 login mismatch
	if (lead.mt5Login && contact.custom_fields?.mt5_login &&
		lead.mt5Login !== contact.custom_fields.mt5_login) {
		inconsistencies.push('MT5 login mismatch');
	}

	// Check broker mismatch
	if (lead.broker && contact.custom_fields?.broker &&
		lead.broker !== contact.custom_fields.broker) {
		inconsistencies.push('Broker mismatch');
	}

	// Check commission mismatch
	if (lead.commission !== contact.custom_fields?.commission_earned) {
		inconsistencies.push('Commission amount mismatch');
	}

	return inconsistencies;
}

function generateRecommendations(analysis: any): string[] {
	const recommendations = [];

	if (analysis.summary.missing_in_systeme > 0) {
		recommendations.push(`Sync ${analysis.summary.missing_in_systeme} local leads to Systeme.io`);
	}

	if (analysis.summary.missing_in_local > 0) {
		recommendations.push(`Import ${analysis.summary.missing_in_local} Systeme.io contacts to local database`);
	}

	if (analysis.summary.status_mismatches > 0) {
		const highPriority = analysis.details.status_mismatches.filter((m: any) => m.priority === 'high').length;
		if (highPriority > 0) {
			recommendations.push(`URGENT: Reconcile ${highPriority} high-priority status differences`);
		}
		recommendations.push(`Reconcile ${analysis.summary.status_mismatches} status differences`);
	}

	if (analysis.summary.data_inconsistencies > 0) {
		recommendations.push(`Review ${analysis.summary.data_inconsistencies} data inconsistencies`);
	}

	if (recommendations.length === 0) {
		recommendations.push('Systems are in sync - no action required');
	}

	return recommendations;
}

async function performAutoFix(analysis: any, apiClient: any): Promise<any> {
	const results = {
		attempted: 0,
		successful: 0,
		failed: 0,
		errors: []
	};

	// Auto-sync critical status mismatches (high priority only)
	const criticalMismatches = analysis.details.status_mismatches
		.filter((m: any) => m.priority === 'high')
		.slice(0, 5); // Limit to 5 auto-fixes per run

	for (const mismatch of criticalMismatches) {
		results.attempted++;
		try {
			const response = await apiClient.request({
				method: 'PUT',
				endpoint: '/systeme/contacts',
				body: {
					email: mismatch.email,
					status: mismatch.local_status,
					source: 'auto_fix'
				}
			});

			if (response.success) {
				results.successful++;
			} else {
				results.failed++;
				results.errors.push(`Failed to fix ${mismatch.email}: ${response.error}`);
			}
		} catch (error) {
			results.failed++;
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			results.errors.push(`Error fixing ${mismatch.email}: ${errorMessage}`);
		}
	}

	return results;
}

// Auto-fix sync discrepancies
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { action, emails } = await request.json();

		let results = [];

		switch (action) {
			case 'sync_to_systeme':
				// Sync missing local leads to Systeme.io
				for (const email of emails) {
					try {
						const response = await fetch('/api/systeme/contacts', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ email, source: 'sync_fix' })
						});

						results.push({
							email,
							action: 'synced_to_systeme',
							success: response.ok,
							status: response.status
						});
					} catch (error) {
						results.push({
							email,
							action: 'sync_failed',
							success: false,
							error: error.message
						});
					}
				}
				break;

			case 'update_status':
				// Update status mismatches
				for (const email of emails) {
					try {
						const response = await fetch('/api/conversion/track', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								email,
								forceUpdate: true,
								source: 'sync_reconciliation'
							})
						});

						results.push({
							email,
							action: 'status_updated',
							success: response.ok,
							status: response.status
						});
					} catch (error) {
						results.push({
							email,
							action: 'update_failed',
							success: false,
							error: error.message
						});
					}
				}
				break;

			default:
				return json({ error: 'Unknown action' }, { status: 400 });
		}

		return json({
			success: true,
			action,
			processed: results.length,
			results
		});

	} catch (error) {
		console.error('Sync fix error:', error);
		return json({
			error: 'Failed to fix sync issues',
			details: error.message
		}, { status: 500 });
	}
};