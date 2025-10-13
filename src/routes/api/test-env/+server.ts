import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		hasDATABASE_URL: !!process.env.DATABASE_URL,
		hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
		hasPRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL,
		nodeEnv: process.env.NODE_ENV,
		// Show first few chars to verify it exists
		databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'NOT_FOUND',
		postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 20) || 'NOT_FOUND'
	});
};
