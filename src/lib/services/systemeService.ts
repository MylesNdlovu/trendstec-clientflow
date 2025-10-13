import { systemeApiClient } from '$lib/utils/api-client';
import { validateAndSanitize } from '$lib/utils/validation';

export interface SystemeContact {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	phone?: string;
	tags: string[];
	custom_fields: {
		mt5_login?: string;
		mt5_server?: string;
		conversion_status?: string;
		commission_earned?: number;
		[key: string]: any;
	};
	created_at: string;
	updated_at: string;
}

export interface MT5Credentials {
	email: string;
	mt5Login: string;
	mt5Server: string;
	investorPassword?: string;
}

export interface SystemeApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	retries?: number;
	duration?: number;
}

class SystemeService {
	private apiKey: string | null = null;

	constructor() {
		this.apiKey = process.env.SYSTEME_API_KEY || null;
	}

	private ensureApiKey(): void {
		if (!this.apiKey) {
			throw new Error('Systeme.io API key not configured');
		}
	}

	private setAuthHeaders(): void {
		this.ensureApiKey();
		systemeApiClient['config'].headers = {
			...systemeApiClient['config'].headers,
			'Authorization': `Bearer ${this.apiKey}`,
			'Content-Type': 'application/json'
		};
	}

	/**
	 * Find a contact by email address
	 */
	async findContactByEmail(email: string): Promise<SystemeApiResponse<SystemeContact | null>> {
		try {
			this.setAuthHeaders();

			const response = await systemeApiClient.request({
				method: 'GET',
				endpoint: `/contacts?email=${encodeURIComponent(email)}&limit=1`
			});

			if (!response.success) {
				return {
					success: false,
					error: response.error,
					retries: response.retries
				};
			}

			const contacts = response.data?.data || [];
			const contact = contacts.length > 0 ? contacts[0] : null;

			return {
				success: true,
				data: contact,
				retries: response.retries,
				duration: response.duration
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				success: false,
				error: `Failed to find contact: ${errorMessage}`
			};
		}
	}

	/**
	 * Update contact's MT5 credentials and custom fields
	 */
	async updateContactMT5Credentials(
		contactId: string,
		credentials: MT5Credentials,
		additionalFields: Record<string, any> = {}
	): Promise<SystemeApiResponse<SystemeContact>> {
		try {
			this.setAuthHeaders();

			// Validate credentials
			const validatedCredentials = validateAndSanitize({
				email: credentials.email,
				mt5Login: credentials.mt5Login,
				mt5Server: credentials.mt5Server
			}, 'mt5Credentials');

			const updatePayload = {
				custom_fields: {
					mt5_login: validatedCredentials.mt5Login,
					mt5_server: validatedCredentials.mt5Server,
					mt5_credentials_submitted_at: new Date().toISOString(),
					mt5_credentials_source: 'svelte_form',
					...additionalFields
				}
			};

			const response = await systemeApiClient.request({
				method: 'PUT',
				endpoint: `/contacts/${contactId}`,
				body: updatePayload
			});

			if (!response.success) {
				return {
					success: false,
					error: response.error,
					retries: response.retries
				};
			}

			return {
				success: true,
				data: response.data,
				retries: response.retries,
				duration: response.duration
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				success: false,
				error: `Failed to update contact: ${errorMessage}`
			};
		}
	}

	/**
	 * Add tags to a contact
	 */
	async addTagsToContact(contactId: string, tags: string[]): Promise<SystemeApiResponse<any>> {
		try {
			this.setAuthHeaders();

			const results = [];

			for (const tag of tags) {
				const response = await systemeApiClient.request({
					method: 'POST',
					endpoint: `/contacts/${contactId}/tags`,
					body: { tag_name: tag }
				});

				results.push({
					tag,
					success: response.success,
					error: response.error
				});
			}

			const successCount = results.filter(r => r.success).length;
			const allSuccessful = successCount === tags.length;

			return {
				success: allSuccessful,
				data: results,
				error: allSuccessful ? undefined : `Only ${successCount}/${tags.length} tags added successfully`
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				success: false,
				error: `Failed to add tags: ${errorMessage}`
			};
		}
	}

	/**
	 * Remove tags from a contact
	 */
	async removeTagsFromContact(contactId: string, tags: string[]): Promise<SystemeApiResponse<any>> {
		try {
			this.setAuthHeaders();

			const results = [];

			for (const tag of tags) {
				const response = await systemeApiClient.request({
					method: 'DELETE',
					endpoint: `/contacts/${contactId}/tags/${encodeURIComponent(tag)}`
				});

				results.push({
					tag,
					success: response.success,
					error: response.error
				});
			}

			const successCount = results.filter(r => r.success).length;
			const allSuccessful = successCount === tags.length;

			return {
				success: allSuccessful,
				data: results,
				error: allSuccessful ? undefined : `Only ${successCount}/${tags.length} tags removed successfully`
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				success: false,
				error: `Failed to remove tags: ${errorMessage}`
			};
		}
	}

	/**
	 * Complete MT5 credentials sync process
	 */
	async syncMT5Credentials(credentials: MT5Credentials): Promise<SystemeApiResponse<{
		contact: SystemeContact;
		tagsAdded: boolean;
		workflowTriggered: boolean;
	}>> {
		try {
			// Step 1: Find contact by email
			const findResult = await this.findContactByEmail(credentials.email);
			if (!findResult.success) {
				return {
					success: false,
					error: `Contact lookup failed: ${findResult.error}`
				};
			}

			if (!findResult.data) {
				return {
					success: false,
					error: `No contact found with email: ${credentials.email}`
				};
			}

			const contact = findResult.data;

			// Step 2: Update MT5 credentials
			const updateResult = await this.updateContactMT5Credentials(
				contact.id,
				credentials,
				{
					last_sync_source: 'mt5_form',
					last_sync_timestamp: new Date().toISOString()
				}
			);

			if (!updateResult.success) {
				return {
					success: false,
					error: `Credentials update failed: ${updateResult.error}`
				};
			}

			// Step 3: Add MT5 credential tags
			const tagsToAdd = [
				'MT5_Credentials_Submitted',
				`MT5_Server_${credentials.mt5Server.replace(/[^a-zA-Z0-9]/g, '_')}`,
				'Ready_For_Verification'
			];

			const tagResult = await this.addTagsToContact(contact.id, tagsToAdd);

			// Step 4: Log the sync for monitoring
			console.log('MT5 credentials sync completed:', {
				email: credentials.email,
				contactId: contact.id,
				mt5Login: credentials.mt5Login,
				mt5Server: credentials.mt5Server,
				tagsAdded: tagResult.success,
				timestamp: new Date().toISOString()
			});

			return {
				success: true,
				data: {
					contact: updateResult.data,
					tagsAdded: tagResult.success,
					workflowTriggered: true // Systeme.io workflows trigger automatically on tag changes
				},
				retries: updateResult.retries,
				duration: updateResult.duration
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				success: false,
				error: `MT5 sync failed: ${errorMessage}`
			};
		}
	}

	/**
	 * Get contact's MT5 verification status
	 */
	async getMT5VerificationStatus(email: string): Promise<SystemeApiResponse<{
		hasCredentials: boolean;
		verificationStatus: 'pending' | 'verified' | 'failed' | 'not_started';
		lastUpdate?: string;
	}>> {
		try {
			const findResult = await this.findContactByEmail(email);
			if (!findResult.success || !findResult.data) {
				return {
					success: false,
					error: 'Contact not found'
				};
			}

			const contact = findResult.data;
			const hasCredentials = !!(contact.custom_fields.mt5_login && contact.custom_fields.mt5_server);

			let verificationStatus: 'pending' | 'verified' | 'failed' | 'not_started' = 'not_started';

			if (hasCredentials) {
				if (contact.tags.includes('MT5_Verified')) {
					verificationStatus = 'verified';
				} else if (contact.tags.includes('MT5_Verification_Failed')) {
					verificationStatus = 'failed';
				} else if (contact.tags.includes('MT5_Credentials_Submitted')) {
					verificationStatus = 'pending';
				}
			}

			return {
				success: true,
				data: {
					hasCredentials,
					verificationStatus,
					lastUpdate: contact.custom_fields.mt5_credentials_submitted_at
				}
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				success: false,
				error: `Status check failed: ${errorMessage}`
			};
		}
	}

	/**
	 * Test API connection and credentials
	 */
	async testConnection(): Promise<SystemeApiResponse<{
		connected: boolean;
		accountInfo?: any;
	}>> {
		try {
			this.setAuthHeaders();

			// Test with a simple API call
			const response = await systemeApiClient.request({
				method: 'GET',
				endpoint: '/contacts?limit=1'
			});

			return {
				success: response.success,
				data: {
					connected: response.success,
					accountInfo: response.success ? 'API connection successful' : undefined
				},
				error: response.error,
				retries: response.retries,
				duration: response.duration
			};

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				success: false,
				data: { connected: false },
				error: `Connection test failed: ${errorMessage}`
			};
		}
	}

	/**
	 * Get API usage statistics
	 */
	getApiStats() {
		return systemeApiClient.getStats();
	}

	/**
	 * Get failed API requests for retry
	 */
	getFailedRequests() {
		return systemeApiClient.getFailedRequests();
	}

	/**
	 * Retry failed API requests
	 */
	async retryFailedRequests(queueKey?: string) {
		return await systemeApiClient.retryFailedRequests(queueKey);
	}
}

// Export singleton instance
export const systemeService = new SystemeService();