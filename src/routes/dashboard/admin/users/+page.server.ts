import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/auth/middleware';
import prisma from '$lib/config/database';
import { hashPassword, validatePasswordStrength } from '$lib/server/auth/password';

export const load: PageServerLoad = async (event) => {
	// Only ADMIN can access user management
	const currentUser = await requireRole(event, ['ADMIN']);

	// Fetch all users
	const users = await prisma.user.findMany({
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			isActive: true,
			lastLoginAt: true,
			createdAt: true
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		users,
		currentUserId: currentUser.id,
		currentUserRole: currentUser.role
	};
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		const currentUser = locals.user;
		if (!currentUser || currentUser.role !== 'ADMIN') {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		let role = data.get('role')?.toString() as 'IB' | 'ADMIN';

		if (!name || !email || !password || !role) {
			return fail(400, { error: 'All fields are required' });
		}

		// Validate password
		const passwordValidation = validatePasswordStrength(password);
		if (!passwordValidation.isValid) {
			return fail(400, { errors: passwordValidation.errors });
		}

		try {
			// Check if user already exists
			const existingUser = await prisma.user.findUnique({
				where: { email: email.toLowerCase() }
			});

			if (existingUser) {
				return fail(409, { error: 'User with this email already exists' });
			}

			// Hash password
			const hashedPassword = await hashPassword(password);

			// Create user
			await prisma.user.create({
				data: {
					name,
					email: email.toLowerCase(),
					password: hashedPassword,
					role,
					emailVerified: true // Admin-created users are auto-verified
				}
			});

			return { success: true };
		} catch (error) {
			console.error('Create user error:', error);
			return fail(500, { error: 'Failed to create user' });
		}
	},

	updateUser: async ({ request, locals }) => {
		const currentUser = locals.user;
		if (!currentUser || currentUser.role !== 'ADMIN') {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		let role = data.get('role')?.toString() as 'IB' | 'ADMIN';

		if (!userId || !name || !email || !role) {
			return fail(400, { error: 'All fields are required' });
		}

		try {
			// Update user
			await prisma.user.update({
				where: { id: userId },
				data: {
					name,
					email: email.toLowerCase(),
					role
				}
			});

			return { success: true };
		} catch (error) {
			console.error('Update user error:', error);
			return fail(500, { error: 'Failed to update user' });
		}
	},

	toggleStatus: async ({ request, locals }) => {
		const currentUser = locals.user;
		if (!currentUser || currentUser.role !== 'ADMIN') {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Prevent self-deactivation
		if (userId === currentUser.id) {
			return fail(400, { error: 'Cannot deactivate your own account' });
		}

		try {
			const user = await prisma.user.findUnique({
				where: { id: userId }
			});

			if (!user) {
				return fail(404, { error: 'User not found' });
			}

			await prisma.user.update({
				where: { id: userId },
				data: {
					isActive: !user.isActive
				}
			});

			return { success: true };
		} catch (error) {
			console.error('Toggle status error:', error);
			return fail(500, { error: 'Failed to update user status' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		const currentUser = locals.user;
		if (!currentUser || currentUser.role !== 'ADMIN') {
			return fail(403, { error: 'Insufficient permissions' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Prevent self-deletion
		if (userId === currentUser.id) {
			return fail(400, { error: 'Cannot delete your own account' });
		}

		try {
			await prisma.user.delete({
				where: { id: userId }
			});

			return { success: true };
		} catch (error) {
			console.error('Delete user error:', error);
			return fail(500, { error: 'Failed to delete user' });
		}
	}
};
