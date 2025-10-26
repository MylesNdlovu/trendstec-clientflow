import type { Handle } from '@sveltejs/kit';
import { scrapingScheduler } from '$lib/services/scrapingScheduler';
// Temporarily disabled to fix client bundling issue
// import { MetaAdsSyncScheduler } from '$lib/services/metaAdsSyncScheduler';
import { authenticate } from '$lib/server/auth/middleware';

// Ensure DATABASE_URL is available for Prisma (fallback to POSTGRES_URL)
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
	process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

// Validate critical environment variables on startup
const validateEnvironmentVariables = () => {
	const warnings: string[] = [];
	const errors: string[] = [];

	// Critical - will prevent core functionality
	if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
		errors.push('❌ DATABASE_URL or POSTGRES_URL not set - database connections will fail');
	}

	// Important - affects specific features
	if (!process.env.SYSTEME_API_KEY) {
		warnings.push('⚠️  SYSTEME_API_KEY not set - Systeme.io tag syncing will fail');
	}

	if (!process.env.MAILGUN_API_KEY) {
		warnings.push('⚠️  MAILGUN_API_KEY not set - email sending will fail');
	}

	if (!process.env.JWT_SECRET) {
		warnings.push('⚠️  JWT_SECRET not set - authentication may be insecure');
	}

	if (!process.env.ENCRYPTION_KEY) {
		warnings.push('⚠️  ENCRYPTION_KEY not set - MT5 credential encryption will fail');
	}

	// Log all issues
	if (errors.length > 0) {
		console.error('\n🚨 CRITICAL ENVIRONMENT VARIABLE ERRORS:');
		errors.forEach(err => console.error(err));
		console.error('');
	}

	if (warnings.length > 0) {
		console.warn('\n⚠️  ENVIRONMENT VARIABLE WARNINGS:');
		warnings.forEach(warn => console.warn(warn));
		console.warn('');
	}

	if (errors.length === 0 && warnings.length === 0) {
		console.log('✅ All critical environment variables are configured');
	}
};

// Run validation on startup
validateEnvironmentVariables();

// Start schedulers when the server starts
scrapingScheduler.start();
// MetaAdsSyncScheduler.start(); // Temporarily disabled

// Cleanup on server shutdown
if (typeof process !== 'undefined') {
	process.on('SIGTERM', () => {
		scrapingScheduler.stop();
		// MetaAdsSyncScheduler.stop();
	});

	process.on('SIGINT', () => {
		scrapingScheduler.stop();
		// MetaAdsSyncScheduler.stop();
		process.exit(0);
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	// Authenticate user and set in locals
	try {
		event.locals.user = await authenticate(event);
	} catch (error) {
		console.error('Authentication error:', error);
		event.locals.user = null;
		// Clear invalid auth cookie
		event.cookies.delete('auth-token', { path: '/' });
	}

	return await resolve(event);
};
