// Temporarily disabled to prevent initialization errors
// TODO: Enable when needed for actual database operations

// import { PrismaClient } from '@prisma/client';
// import { dev } from '$app/environment';

// declare global {
// 	var __prisma: PrismaClient | undefined;
// }

// export const prisma = globalThis.__prisma || new PrismaClient();

// if (dev) {
// 	globalThis.__prisma = prisma;
// }

// Mock prisma for development
export const prisma = {
	user: {
		findUnique: () => null,
		create: () => null,
		update: () => null
	}
};

export default prisma;