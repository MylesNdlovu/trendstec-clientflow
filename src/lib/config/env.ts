import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Private environment variables
export const DATABASE_URL = env.DATABASE_URL || '';
export const JWT_SECRET = env.JWT_SECRET || 'your-super-secret-jwt-key';
export const ENCRYPTION_KEY = env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here';

// Email configuration
export const SMTP_HOST = env.SMTP_HOST || '';
export const SMTP_PORT = parseInt(env.SMTP_PORT || '587');
export const SMTP_USER = env.SMTP_USER || '';
export const SMTP_PASS = env.SMTP_PASS || '';

// Payment processors
export const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY || '';
export const PAYPAL_CLIENT_ID = env.PAYPAL_CLIENT_ID || '';
export const PAYPAL_CLIENT_SECRET = env.PAYPAL_CLIENT_SECRET || '';

// External API keys
export const OPENAI_API_KEY = env.OPENAI_API_KEY || '';
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || '';

// Playwright MCP configuration
export const PLAYWRIGHT_MCP_ENDPOINT = env.PLAYWRIGHT_MCP_ENDPOINT || 'http://localhost:3001';
export const PLAYWRIGHT_MCP_API_KEY = env.PLAYWRIGHT_MCP_API_KEY || '';

// Public environment variables
export const PUBLIC_APP_URL = publicEnv.PUBLIC_APP_URL || 'http://localhost:5173';
export const PUBLIC_STRIPE_PUBLISHABLE_KEY = publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
export const PUBLIC_ANALYTICS_ID = publicEnv.PUBLIC_ANALYTICS_ID || '';

// Security settings
export const BCRYPT_ROUNDS = parseInt(env.BCRYPT_ROUNDS || '12');
export const SESSION_TIMEOUT = parseInt(env.SESSION_TIMEOUT || '3600'); // 1 hour
export const MAX_LOGIN_ATTEMPTS = parseInt(env.MAX_LOGIN_ATTEMPTS || '5');
export const LOCKOUT_DURATION = parseInt(env.LOCKOUT_DURATION || '900'); // 15 minutes