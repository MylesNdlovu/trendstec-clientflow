import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/config/database';
import { verifyPassword } from '$lib/server/auth/password';
import { signJWT } from '$lib/server/auth/jwt';
import { setAuthCookie } from '$lib/server/auth/middleware';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const remember = data.get('remember') === 'on';
		const redirectTo = url.searchParams.get('redirect') || '/dashboard';

		console.log('🔐 Login attempt:', { email, redirectTo });

		// Validate input
		if (!email || !password) {
			console.log('❌ Missing credentials');
			return fail(400, { error: 'Email and password are required', email });
		}

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase() }
		});

		console.log('👤 User found:', user ? 'YES' : 'NO');

		if (!user) {
			return fail(401, { error: 'Invalid email or password', email });
		}

			// Check if account is active
			if (!user.isActive) {
				return fail(403, { error: 'Account is deactivated. Please contact support.', email });
			}

			// Check if account is locked
			if (user.lockedUntil && user.lockedUntil > new Date()) {
				const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
				return fail(403, {
					error: `Account is locked. Try again in ${minutesLeft} minutes.`,
					email
				});
			}

			// Verify password
			console.log('🔑 Verifying password...');
			console.log('Password length:', password.length);
			console.log('Hash from DB:', user.password.substring(0, 20) + '...');
			const isValidPassword = await verifyPassword(password, user.password);
			console.log('✅ Password valid:', isValidPassword);

			if (!isValidPassword) {
				// Increment failed login count
				const failedCount = user.failedLoginCount + 1;
				const shouldLock = failedCount >= 5;

				await prisma.user.update({
					where: { id: user.id },
					data: {
						failedLoginCount: failedCount,
						lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null // 15 minutes
					}
				});

				if (shouldLock) {
					return fail(403, {
						error: 'Too many failed attempts. Account locked for 15 minutes.',
						email
					});
				}

				return fail(401, {
					error: `Invalid email or password. ${5 - failedCount} attempts remaining.`,
					email
				});
			}

			// Reset failed login count and update last login
			await prisma.user.update({
				where: { id: user.id },
				data: {
					failedLoginCount: 0,
					lockedUntil: null,
					lastLoginAt: new Date()
				}
			});

			// Generate JWT token
			const token = signJWT({
				id: user.id,
				email: user.email,
				role: user.role
			});

			// Set auth cookie
			cookies.set('auth-token', token, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // Only require HTTPS in production
				sameSite: 'strict',
				maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7 // 30 days if remember, else 7 days
			});

		console.log('✅ Login successful, redirecting to:', redirectTo);

		// Redirect to original destination or dashboard
		throw redirect(303, redirectTo);
	}
};
