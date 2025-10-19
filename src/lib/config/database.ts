import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

declare global {
	var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient();

if (dev) {
	globalThis.__prisma = prisma;
}

export default prisma;