import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import prisma from '$lib/config/database';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/password';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		// Validate input
		if (!token || !password || !confirmPassword) {
			return fail(400, { error: 'All fields are required' });
		}

		// Validate passwords match
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		// Validate password strength
		const passwordValidation = validatePasswordStrength(password);
		if (!passwordValidation.isValid) {
			return fail(400, { errors: passwordValidation.errors });
		}

		try {
			// Find user by reset token
			const user = await prisma.user.findFirst({
				where: {
					passwordResetToken: token
				}
			});

			if (!user) {
				return fail(400, { error: 'Invalid or expired reset token' });
			}

			// Check if token is expired
			if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
				return fail(400, { error: 'Reset token has expired. Please request a new one.' });
			}

			// Hash new password
			const hashedPassword = await hashPassword(password);

			// Update user password and clear reset token
			await prisma.user.update({
				where: { id: user.id },
				data: {
					password: hashedPassword,
					passwordResetToken: null,
					passwordResetExpiry: null,
					failedLoginCount: 0,
					lockedUntil: null
				}
			});

			// Redirect to login with success message
			throw redirect(303, '/login?reset=success');
		} catch (error) {
			console.error('Reset password error:', error);
			if (error instanceof Response) throw error; // Re-throw redirects
			return fail(500, { error: 'An error occurred. Please try again.' });
		}
	}
};
