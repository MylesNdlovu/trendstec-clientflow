import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/credentials/{id}/retry
 * Retry validation for a failed credential
 */
export const POST: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		// Get the credential
		const credential = await prisma.investorCredential.findUnique({
			where: { id }
		});

		if (!credential) {
			return json(
				{ success: false, error: 'Credential not found' },
				{ status: 404 }
			);
		}

		// Check if retry is allowed
		if (credential.isVerified && credential.scrapingStatus === 'success') {
			return json(
				{ success: false, error: 'Credential is already verified' },
				{ status: 400 }
			);
		}

		// Reset status and attempts
		await prisma.investorCredential.update({
			where: { id },
			data: {
				scrapingStatus: 'pending',
				scrapingError: null,
				failedAttempts: 0,
				isVerified: false
			}
		});

		console.log(`🔄 Retry requested for credential ${credential.login} (${id})`);

		return json({
			success: true,
			message: 'Credential queued for re-validation'
		});
	} catch (error) {
		console.error('Error retrying credential:', error);
		return json(
			{
				success: false,
				error: 'Failed to retry: ' + (error instanceof Error ? error.message : 'Unknown error')
			},
			{ status: 500 }
		);
	}
};
