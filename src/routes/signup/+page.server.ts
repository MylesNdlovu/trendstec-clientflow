import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/config/database';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/password';
import { sendVerificationEmail } from '$lib/server/email/mailgun';
import crypto from 'crypto';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		// Validate input
		if (!name || !email || !password || !confirmPassword) {
			return fail(400, {
				error: 'All fields are required',
				name,
				email
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, {
				error: 'Invalid email address',
				name,
				email
			});
		}

		// Validate passwords match
		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				name,
				email
			});
		}

		// Validate password strength
		const passwordValidation = validatePasswordStrength(password);
		if (!passwordValidation.isValid) {
			return fail(400, {
				errors: passwordValidation.errors,
				name,
				email
			});
		}

		try {
			// Check if user already exists
			const existingUser = await prisma.user.findUnique({
				where: { email: email.toLowerCase() }
			});

			if (existingUser) {
				return fail(409, {
					error: 'An account with this email already exists',
					name,
					email
				});
			}

			// Hash password
			const hashedPassword = await hashPassword(password);

			// Generate email verification token (valid for 24 hours)
			const emailVerificationToken = crypto.randomBytes(32).toString('hex');
			const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

			// Create user (default role is IB from schema)
			const user = await prisma.user.create({
				data: {
					name,
					email: email.toLowerCase(),
					password: hashedPassword,
					emailVerified: false,
					passwordResetToken: emailVerificationToken, // Reuse this field for email verification
					passwordResetExpiry: emailVerificationExpiry
				}
			});

			// Send verification email
			try {
				await sendVerificationEmail(user.email, emailVerificationToken);
				console.log(`Verification email sent to ${user.email}`);
			} catch (emailError) {
				console.error('Failed to send verification email:', emailError);
				// Don't fail registration if email fails - user can request resend
			}

			// Redirect to login with success message
			throw redirect(303, '/login?registered=true&verify=pending');
		} catch (error) {
			console.error('Signup error:', error);
			if (error instanceof Response) throw error; // Re-throw redirects
			return fail(500, {
				error: 'An error occurred while creating your account. Please try again.',
				name,
				email
			});
		}
	}
};
