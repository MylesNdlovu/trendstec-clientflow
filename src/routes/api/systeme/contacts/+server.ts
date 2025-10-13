import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { systemeApiClient } from '$lib/utils/api-client';
import { validateAndSanitize, ValidationError } from '$lib/utils/validation';

// Enhanced Systeme.io Contact Management with Error Handling
export const POST: RequestHandler = async ({ request }) => {
    try {
        const rawData = await request.json();

        // Validate and sanitize input data
        let contactData;
        try {
            contactData = validateAndSanitize(rawData, 'systemeContact');
        } catch (error) {
            if (error instanceof ValidationError) {
                return json({
                    error: 'Invalid contact data',
                    validation_errors: error.errors
                }, { status: 400 });
            }
            throw error;
        }

        const { SYSTEME_API_KEY } = process.env;
        if (!SYSTEME_API_KEY) {
            return json({ error: 'Systeme.io API key not configured' }, { status: 500 });
        }

        // Prepare API client headers
        systemeApiClient['config'].headers = {
            ...systemeApiClient['config'].headers,
            'Authorization': `Bearer ${SYSTEME_API_KEY}`
        };

        // Create Systeme.io contact with retry logic
        const response = await systemeApiClient.request({
            method: 'POST',
            endpoint: '/contacts',
            body: contactData
        });

        if (!response.success) {
            console.error('Failed to create Systeme.io contact:', {
                error: response.error,
                status: response.status,
                retries: response.retries,
                duration: response.duration
            });

            return json({
                error: 'Failed to create contact in Systeme.io',
                details: response.error,
                retries: response.retries,
                can_retry: response.retries < 3
            }, { status: response.status || 500 });
        }

        // Log successful sync
        console.log('Contact synced to Systeme.io:', {
            email: contactData.email,
            systeme_id: response.data?.id,
            status: 'created',
            retries: response.retries,
            duration: response.duration
        });

        return json({
            success: true,
            systeme_contact: response.data,
            sync_info: {
                retries: response.retries,
                duration: response.duration,
                synced_fields: Object.keys(contactData.custom_fields || {})
            },
            message: 'Contact successfully synced to Systeme.io'
        });

    } catch (error) {
        console.error('Systeme.io sync error:', error);
        return json({
            error: 'Internal server error during Systeme.io sync',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
};

// Update contact conversion status with enhanced error handling
export const PUT: RequestHandler = async ({ request }) => {
    try {
        const rawData = await request.json();

        // Validate and sanitize update data
        let updateData;
        try {
            updateData = validateAndSanitize(rawData, 'leadUpdate');
        } catch (error) {
            if (error instanceof ValidationError) {
                return json({
                    error: 'Invalid update data',
                    validation_errors: error.errors
                }, { status: 400 });
            }
            throw error;
        }

        const { SYSTEME_API_KEY } = process.env;
        if (!SYSTEME_API_KEY) {
            return json({ error: 'Systeme.io API key not configured' }, { status: 500 });
        }

        // Set API client authorization
        systemeApiClient['config'].headers = {
            ...systemeApiClient['config'].headers,
            'Authorization': `Bearer ${SYSTEME_API_KEY}`
        };

        // Search for contact by email with retry logic
        const searchResponse = await systemeApiClient.request({
            method: 'GET',
            endpoint: `/contacts?email=${encodeURIComponent(updateData.email)}`
        });

        if (!searchResponse.success) {
            return json({
                error: 'Failed to find contact in Systeme.io',
                details: searchResponse.error,
                retries: searchResponse.retries
            }, { status: 404 });
        }

        const contact = searchResponse.data?.data?.[0];
        if (!contact) {
            return json({ error: 'Contact not found in Systeme.io' }, { status: 404 });
        }

        // Prepare update payload
        const updatePayload = {
            custom_fields: {
                ...contact.custom_fields,
                conversion_status: updateData.status,
                commission_earned: updateData.commission || 0,
                last_mt5_update: new Date().toISOString(),
                mt5_balance: updateData.mt5Data?.balance || 0,
                mt5_equity: updateData.mt5Data?.equity || 0,
                mt5_positions: updateData.mt5Data?.positions?.length || 0
            },
            tags: [
                ...contact.tags.filter((tag: string) => !tag.startsWith('Status-')),
                `Status-${updateData.status}`
            ]
        };

        // Update contact with retry logic
        const updateResponse = await systemeApiClient.request({
            method: 'PUT',
            endpoint: `/contacts/${contact.id}`,
            body: updatePayload
        });

        if (!updateResponse.success) {
            return json({
                error: 'Failed to update contact in Systeme.io',
                details: updateResponse.error,
                retries: updateResponse.retries,
                can_retry: updateResponse.retries < 3
            }, { status: updateResponse.status || 400 });
        }

        // Trigger workflow (non-blocking)
        triggerStatusWorkflow(contact.id, updateData.status, updateData.commission || 0)
            .catch(error => console.error('Workflow trigger failed:', error));

        return json({
            success: true,
            updated_contact: updateResponse.data,
            sync_info: {
                retries: updateResponse.retries,
                duration: updateResponse.duration
            },
            workflow_triggered: true,
            message: `Contact status updated to ${updateData.status}`
        });

    } catch (error) {
        console.error('Systeme.io update error:', error);
        return json({
            error: 'Internal server error during contact update',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
};

async function triggerStatusWorkflow(contactId: string, status: string, commission: number) {
    const { SYSTEME_API_KEY } = process.env;

    // Map status to workflow IDs (from environment variables)
    const workflowMapping: Record<string, string | undefined> = {
        'deposited': process.env.SYSTEME_DEPOSIT_WORKFLOW_ID,
        'trading': process.env.SYSTEME_TRADING_WORKFLOW_ID,
        'profitable': process.env.SYSTEME_PROFIT_WORKFLOW_ID
    };

    const workflowId = workflowMapping[status];
    if (!workflowId) {
        console.log(`No workflow configured for status: ${status}`);
        return;
    }

    // Set API client authorization
    systemeApiClient['config'].headers = {
        ...systemeApiClient['config'].headers,
        'Authorization': `Bearer ${SYSTEME_API_KEY}`
    };

    try {
        const response = await systemeApiClient.request({
            method: 'POST',
            endpoint: `/workflows/${workflowId}/trigger`,
            body: {
                contact_id: contactId,
                trigger_data: {
                    status,
                    commission,
                    timestamp: new Date().toISOString()
                }
            }
        });

        if (response.success) {
            console.log(`Triggered workflow ${workflowId} for contact ${contactId}`, {
                retries: response.retries,
                duration: response.duration
            });
        } else {
            console.error(`Failed to trigger workflow ${workflowId}:`, {
                error: response.error,
                retries: response.retries,
                status: response.status
            });
        }
    } catch (error) {
        console.error('Workflow trigger error:', error);
    }
}