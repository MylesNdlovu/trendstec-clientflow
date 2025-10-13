import { writable, get } from 'svelte/store';

interface FTDCPASettings {
	ftdAmount: number;
	cpaAmount: number;
	brokers: Record<string, {
		mt5Link: string;
		servers: string[];
	}>;
}

interface SettingsState {
	ftdCpaSettings: FTDCPASettings | null;
	loading: boolean;
	error: string | null;
}

function createSettingsStore() {
	const { subscribe, set, update } = writable<SettingsState>({
		ftdCpaSettings: null,
		loading: false,
		error: null
	});

	return {
		subscribe,

		/**
		 * Load settings from database
		 */
		async loadSettings() {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch('/api/settings?key=ftd_cpa_settings');
				const result = await response.json();

				if (result.success && result.setting) {
					update(state => ({
						...state,
						ftdCpaSettings: result.setting.value,
						loading: false
					}));
				} else {
					// Try to migrate from localStorage (only in browser)
					let localData = null;
					if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
						try {
							localData = localStorage.getItem('ftdCpaSettings');
						} catch (e) {
							console.warn('localStorage not available:', e);
						}
					}

					if (localData) {
						const settings = JSON.parse(localData);
						await this.saveSettings(settings);
						update(state => ({
							...state,
							ftdCpaSettings: settings,
							loading: false
						}));
					} else {
						// Use defaults (don't save to avoid blocking the page load)
						const defaults: FTDCPASettings = {
							ftdAmount: 250,
							cpaAmount: 300,
							brokers: {
								'Prime XBT': {
									mt5Link: 'https://mt5.pxbt.com',
									servers: ['PXBTTrading-1']
								}
							}
						};
						update(state => ({
							...state,
							ftdCpaSettings: defaults,
							loading: false
						}));

						// Save defaults in background (non-blocking)
						this.saveSettings(defaults).catch(err =>
							console.warn('Failed to save default settings:', err)
						);
					}
				}
			} catch (error) {
				update(state => ({
					...state,
					loading: false,
					error: error instanceof Error ? error.message : 'Failed to load settings'
				}));
			}
		},

		/**
		 * Save settings to database
		 */
		async saveSettings(settings: FTDCPASettings) {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const response = await fetch('/api/settings', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						key: 'ftd_cpa_settings',
						value: settings
					})
				});

				const result = await response.json();

				if (result.success) {
					update(state => ({
						...state,
						ftdCpaSettings: settings,
						loading: false
					}));

					// Keep localStorage in sync for backwards compatibility (only in browser)
					if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
						try {
							localStorage.setItem('ftdCpaSettings', JSON.stringify(settings));
						} catch (e) {
							console.warn('Failed to save to localStorage:', e);
						}
					}

					return true;
				} else {
					throw new Error(result.error || 'Failed to save settings');
				}
			} catch (error) {
				update(state => ({
					...state,
					loading: false,
					error: error instanceof Error ? error.message : 'Failed to save settings'
				}));
				return false;
			}
		},

		/**
		 * Update specific broker configuration
		 */
		async updateBroker(brokerName: string, config: { mt5Link: string; servers: string[] }) {
			const currentSettings = get({ subscribe }).ftdCpaSettings;
			if (!currentSettings) return false;

			const updatedSettings = {
				...currentSettings,
				brokers: {
					...currentSettings.brokers,
					[brokerName]: config
				}
			};

			return await this.saveSettings(updatedSettings);
		},

		/**
		 * Remove a broker
		 */
		async removeBroker(brokerName: string) {
			const currentSettings = get({ subscribe }).ftdCpaSettings;
			if (!currentSettings) return false;

			const { [brokerName]: removed, ...remainingBrokers } = currentSettings.brokers;

			const updatedSettings = {
				...currentSettings,
				brokers: remainingBrokers
			};

			return await this.saveSettings(updatedSettings);
		},

		/**
		 * Update FTD/CPA amounts
		 */
		async updateRates(ftdAmount: number, cpaAmount: number) {
			const currentSettings = get({ subscribe }).ftdCpaSettings;
			if (!currentSettings) return false;

			const updatedSettings = {
				...currentSettings,
				ftdAmount,
				cpaAmount
			};

			return await this.saveSettings(updatedSettings);
		}
	};
}

export const settingsStore = createSettingsStore();
