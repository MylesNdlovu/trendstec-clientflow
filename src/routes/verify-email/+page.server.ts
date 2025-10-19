import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/config/database';
import { sendWelcomeEmail } from '$lib/server/email/mailgun';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return {
			error: 'Invalid verification link. Please check your email for the correct link.'
		};
	}

	try {
		// Find user with this verification token
		const user = await prisma.user.findFirst({
			where: {
				passwordResetToken: token,
				passwordResetExpiry: {
					gt: new Date() // Token must not be expired
				},
				emailVerified: false // Only verify if not already verified
			}
		});

		if (!user) {
			return {
				error: 'Invalid or expired verification link. Please request a new verification email.'
			};
		}

		// Mark email as verified and clear the token
		await prisma.user.update({
			where: { id: user.id },
			data: {
				emailVerified: true,
				passwordResetToken: null,
				passwordResetExpiry: null
			}
		});

		// Send welcome email
		try {
			await sendWelcomeEmail(user.email, user.name || 'there');
			console.log(`Welcome email sent to ${user.email}`);
		} catch (emailError) {
			console.error('Failed to send welcome email:', emailError);
			// Don't fail verification if welcome email fails
		}

		return {
			success: true,
			email: user.email,
			name: user.name
		};
	} catch (error) {
		console.error('Email verification error:', error);
		return {
			error: 'An error occurred while verifying your email. Please try again.'
		};
	}
};
