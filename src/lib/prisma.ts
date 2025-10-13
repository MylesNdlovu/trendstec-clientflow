// CRITICAL: Set DATABASE_URL before importing PrismaClient
// Vercel Postgres provides POSTGRES_URL, but Prisma expects DATABASE_URL
if (!process.env.DATABASE_URL) {
	if (process.env.POSTGRES_URL) {
		process.env.DATABASE_URL = process.env.POSTGRES_URL;
	} else if (process.env.PRISMA_DATABASE_URL) {
		process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL;
	} else {
		throw new Error('DATABASE_URL, POSTGRES_URL, or PRISMA_DATABASE_URL must be set');
	}
}

import { PrismaClient } from '@prisma/client';

declare global {
	// eslint-disable-next-line no-var
	var __prisma: PrismaClient | undefined;
}

// Create singleton Prisma Client
export const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalThis.__prisma = prisma;
}

export default prisma;
