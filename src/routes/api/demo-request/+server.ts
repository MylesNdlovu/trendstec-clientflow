import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const contentType = request.headers.get('content-type');
		let leadData;

		// Handle both JSON and FormData requests
		if (contentType?.includes('application/json')) {
			leadData = await request.json();
		} else {
			const formData = await request.formData();
			leadData = {
				name: formData.get('name')?.toString() || '',
				email: formData.get('email')?.toString() || '',
				phone: formData.get('phone')?.toString() || '',
				ib_type: formData.get('ib_type')?.toString() || '',
				monthly_leads: formData.get('monthly_leads')?.toString() || '',
				broker_network: formData.get('broker_network')?.toString() || '',
				message: formData.get('message')?.toString() || ''
			};
		}

		// Validate required fields
		if (!leadData.name || !leadData.email || !leadData.ib_type || !leadData.monthly_leads || !leadData.broker_network) {
			return json({ error: 'Please fill in all required fields' }, { status: 400 });
		}

		// Send to Systeme.io
		const systemeApiUrl = 'https://api.systeme.io/api/contacts';
		const systemeApiKey = process.env.SYSTEME_API_KEY || '';

		if (systemeApiKey) {
			try {
				const response = await fetch(systemeApiUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-API-Key': systemeApiKey
					},
					body: JSON.stringify({
						email: leadData.email,
						locale: 'en',
						tags: ['demo-request', 'ib-prospect', leadData.ib_type, `leads-${leadData.monthly_leads}`],
						fields: [
							{
								slug: 'full_name',
								value: leadData.name
							},
							{
								slug: 'phone_number',
								value: leadData.phone || ''
							},
							{
								slug: 'ib_type',
								value: leadData.ib_type
							},
							{
								slug: 'monthly_leads',
								value: leadData.monthly_leads
							},
							{
								slug: 'broker_network',
								value: leadData.broker_network
							},
							{
								slug: 'message',
								value: leadData.message || ''
							},
							{
								slug: 'source',
								value: 'ClientFlow Landing Page'
							}
						]
					})
				});

				if (!response.ok) {
					console.error('Systeme.io API error:', await response.text());
				} else {
					console.log('✅ Lead sent to Systeme.io successfully');
				}
			} catch (error) {
				console.error('Error sending to Systeme.io:', error);
				// Continue even if Systeme.io fails
			}
		}

		// Also store in local database for backup
		try {
			// You can uncomment this when you want to store leads in your database
			/*
			await prisma.demoRequest.create({
				data: leadData
			});
			*/
		} catch (dbError) {
			console.error('Database error:', dbError);
		}

		// Log the lead (for debugging)
		console.log('🎯 New demo request:', {
			email: leadData.email,
			name: leadData.name,
			ib_type: leadData.ib_type,
			monthly_leads: leadData.monthly_leads
		});

		// Redirect to thank you page
		throw redirect(303, '/demo-thank-you');

	} catch (error) {
		// If it's a redirect, re-throw it
		if (error instanceof Response) {
			throw error;
		}

		console.error('Demo request error:', error);
		return json(
			{ error: 'An error occurred. Please try again.' },
			{ status: 500 }
		);
	}
};
