import type { RequestEvent } from '@sveltejs/kit';
import { verifyJWT, type JWTPayload } from './jwt';
import prisma from '$lib/config/database';
import { error, redirect } from '@sveltejs/kit';

export interface AuthenticatedUser {
	id: string;
	email: string;
	role: string;
	name: string | null;
}

export async function authenticate(event: RequestEvent): Promise<AuthenticatedUser | null> {
	const token = event.cookies.get('auth-token') ||
		event.request.headers.get('authorization')?.replace('Bearer ', '');

	if (!token) {
		return null;
	}

	const payload = verifyJWT(token);
	if (!payload || !payload.userId) {
		return null;
	}

	// Verify user still exists and is active
	const user = await prisma.user.findUnique({
		where: { id: payload.userId },
		select: {
			id: true,
			email: true,
			role: true,
			name: true,
			isActive: true
		}
	});

	if (!user || !user.isActive) {
		return null;
	}

	return user;
}

export async function requireAuth(event: RequestEvent): Promise<AuthenticatedUser> {
	const user = await authenticate(event);
	if (!user) {
		// Redirect to login instead of showing error
		throw redirect(303, `/login?redirect=${encodeURIComponent(event.url.pathname)}`);
	}
	return user;
}

export async function requireRole(event: RequestEvent, allowedRoles: string[]): Promise<AuthenticatedUser> {
	const user = await requireAuth(event);

	if (!allowedRoles.includes(user.role)) {
		throw error(403, 'Insufficient permissions');
	}

	return user;
}

export async function requireAdmin(event: RequestEvent): Promise<AuthenticatedUser> {
	return requireRole(event, ['ADMIN']);
}

export async function requireIB(event: RequestEvent): Promise<AuthenticatedUser> {
	return requireRole(event, ['IB']);
}

export function setAuthCookie(event: RequestEvent, token: string): void {
	event.cookies.set('auth-token', token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production', // Only require HTTPS in production
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});
}

export function clearAuthCookie(event: RequestEvent): void {
	event.cookies.delete('auth-token', { path: '/' });
}