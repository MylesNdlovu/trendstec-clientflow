import jwt from 'jsonwebtoken';
import { JWT_SECRET, SESSION_TIMEOUT } from '$lib/config/env';
import type { User } from '@prisma/client';

export interface JWTPayload {
	userId: string;
	email: string;
	role: string;
	iat?: number;
	exp?: number;
}

export function signJWT(user: Pick<User, 'id' | 'email' | 'role'>): string {
	const payload: JWTPayload = {
		userId: user.id,
		email: user.email,
		role: user.role
	};

	return jwt.sign(payload, JWT_SECRET, {
		expiresIn: SESSION_TIMEOUT
	});
}

export function verifyJWT(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload;
	} catch (error) {
		console.error('JWT verification failed:', error);
		return null;
	}
}

export function refreshJWT(token: string): string | null {
	const payload = verifyJWT(token);
	if (!payload) return null;

	// Create new token without old timestamps
	const newPayload: JWTPayload = {
		userId: payload.userId,
		email: payload.email,
		role: payload.role
	};

	return jwt.sign(newPayload, JWT_SECRET, {
		expiresIn: SESSION_TIMEOUT
	});
}