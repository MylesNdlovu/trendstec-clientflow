import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import prisma from '$lib/config/database';
import { generateResetToken, generateResetExpiry } from '$lib/server/auth/password';
import { sendPasswordResetEmail } from '$lib/server/email/mailgun';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		if (!email) {
			return fail(400, { error: 'Email is required', email });
		}

		try {
			// Find user by email
			const user = await prisma.user.findUnique({
				where: { email: email.toLowerCase() }
			});

			// Always return success (security: don't reveal if email exists)
			// But only actually send email if user exists
			if (user) {
				const resetToken = generateResetToken();
				const resetExpiry = generateResetExpiry();

				// Save reset token to database
				await prisma.user.update({
					where: { id: user.id },
					data: {
						passwordResetToken: resetToken,
						passwordResetExpiry: resetExpiry
					}
				});

				// Send password reset email
				try {
					await sendPasswordResetEmail(user.email, resetToken);
					console.log(`Password reset email sent to ${user.email}`);
				} catch (emailError) {
					console.error('Failed to send password reset email:', emailError);
					// Still return success - user won't know if email failed (security)
				}
			}

			return {
				success: true,
				email
			};
		} catch (error) {
			console.error('Forgot password error:', error);
			return fail(500, { error: 'An error occurred. Please try again.', email });
		}
	}
};
