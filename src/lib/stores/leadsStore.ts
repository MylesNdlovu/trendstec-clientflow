import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface LeadStats {
	totalBalance: number;
	totalEquity: number;
	totalProfit: number;
	totalVolume: number;
	openPositions: number;
	credentialsCount: number;
}

export interface Lead {
	id: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	broker?: string;
	source: string;
	status: 'captured' | 'deposited' | 'trading' | 'qualified';
	leadCapturedAt: Date;
	depositedAt?: Date;
	tradingStartAt?: Date;
	qualifiedAt?: Date;
	ftdEarned: number;
	cpaEarned: number;
	totalEarned: number;
	createdAt: Date;
	updatedAt: Date;
	stats?: LeadStats;
}

export interface DashboardStats {
	leads: {
		total: number;
		captured: number;
		deposited: number;
		trading: number;
		qualified: number;
	};
	financial: {
		totalBalance: number;
		totalEquity: number;
		totalProfit: number;
		totalVolume: number;
		openPositions: number;
	};
	conversion: {
		capturedToDeposited: number;
		depositedToTrading: number;
		tradingToQualified: number;
	};
	brokers: Array<{
		name: string;
		count: number;
	}>;
	recentActivities: Array<any>;
}

class LeadsStore {
	private _leads: Writable<Lead[]>;
	private _stats: Writable<DashboardStats | null>;
	private _loading: Writable<boolean>;
	private _error: Writable<string | null>;
	private refreshInterval: number | null = null;

	constructor() {
		this._leads = writable([]);
		this._stats = writable(null);
		this._loading = writable(false);
		this._error = writable(null);
	}

	get leads() {
		return { subscribe: this._leads.subscribe };
	}

	get stats() {
		return { subscribe: this._stats.subscribe };
	}

	get loading() {
		return { subscribe: this._loading.subscribe };
	}

	get error() {
		return { subscribe: this._error.subscribe };
	}

	/**
	 * Fetch all leads from the API
	 */
	async fetchLeads(filters?: { status?: string; broker?: string }) {
		this._loading.set(true);
		this._error.set(null);

		try {
			const params = new URLSearchParams();
			if (filters?.status) params.append('status', filters.status);
			if (filters?.broker) params.append('broker', filters.broker);

			const url = `/api/leads${params.toString() ? `?${params.toString()}` : ''}`;
			const response = await fetch(url);
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to fetch leads');
			}

			this._leads.set(result.leads);
			return result.leads;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this._error.set(errorMessage);
			throw error;
		} finally {
			this._loading.set(false);
		}
	}

	/**
	 * Fetch dashboard statistics
	 */
	async fetchStats() {
		this._loading.set(true);
		this._error.set(null);

		try {
			const response = await fetch('/api/stats');
			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to fetch stats');
			}

			this._stats.set(result.stats);
			return result.stats;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this._error.set(errorMessage);
			throw error;
		} finally {
			this._loading.set(false);
		}
	}

	/**
	 * Create a new lead
	 */
	async createLead(leadData: Partial<Lead>) {
		this._loading.set(true);
		this._error.set(null);

		try {
			const response = await fetch('/api/leads', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(leadData)
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to create lead');
			}

			// Refresh leads after creating
			await this.fetchLeads();

			return result.lead;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this._error.set(errorMessage);
			throw error;
		} finally {
			this._loading.set(false);
		}
	}

	/**
	 * Update an existing lead
	 */
	async updateLead(id: string, updates: Partial<Lead>) {
		this._loading.set(true);
		this._error.set(null);

		try {
			const response = await fetch(`/api/leads/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updates)
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Failed to update lead');
			}

			// Update lead in the store
			this._leads.update((leads) =>
				leads.map((lead) => (lead.id === id ? { ...lead, ...result.lead } : lead))
			);

			return result.lead;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this._error.set(errorMessage);
			throw error;
		} finally {
			this._loading.set(false);
		}
	}

	/**
	 * Trigger MT5 scraping for all credentials
	 */
	async triggerScraping(credentialId?: string) {
		this._loading.set(true);
		this._error.set(null);

		try {
			const response = await fetch('/api/scraper/run', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ credentialId })
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || 'Scraping failed');
			}

			// Refresh data after scraping
			await Promise.all([this.fetchLeads(), this.fetchStats()]);

			return result.result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this._error.set(errorMessage);
			throw error;
		} finally {
			this._loading.set(false);
		}
	}

	/**
	 * Start auto-refresh at specified interval (in milliseconds)
	 */
	startAutoRefresh(intervalMs: number = 60000) {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
		}

		this.refreshInterval = window.setInterval(async () => {
			try {
				await Promise.all([this.fetchLeads(), this.fetchStats()]);
			} catch (error) {
				console.error('Auto-refresh error:', error);
			}
		}, intervalMs);
	}

	/**
	 * Stop auto-refresh
	 */
	stopAutoRefresh() {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
	}

	/**
	 * Clear all data
	 */
	clear() {
		this._leads.set([]);
		this._stats.set(null);
		this._error.set(null);
		this.stopAutoRefresh();
	}
}

// Export singleton instance
export const leadsStore = new LeadsStore();
