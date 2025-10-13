import crypto from 'crypto';

/**
 * Encryption utility for sensitive data like investor passwords
 * Uses AES-256-GCM for encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY;

	if (!key) {
		throw new Error('ENCRYPTION_KEY environment variable is not set');
	}

	// Ensure key is exactly 32 bytes for AES-256
	return crypto.scryptSync(key, 'salt', KEY_LENGTH);
}

/**
 * Encrypt a string value
 * Returns: base64 encoded string containing: iv + salt + tag + encrypted data
 */
export function encrypt(text: string): string {
	if (!text) return '';

	try {
		const key = getEncryptionKey();
		const iv = crypto.randomBytes(IV_LENGTH);
		const salt = crypto.randomBytes(SALT_LENGTH);

		const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

		let encrypted = cipher.update(text, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		const tag = cipher.getAuthTag();

		// Combine: iv + salt + tag + encrypted
		const combined = Buffer.concat([
			iv,
			salt,
			tag,
			Buffer.from(encrypted, 'hex')
		]);

		return combined.toString('base64');
	} catch (error) {
		console.error('Encryption error:', error);
		throw new Error('Failed to encrypt data');
	}
}

/**
 * Decrypt an encrypted string
 * Expects base64 encoded string from encrypt()
 */
export function decrypt(encryptedData: string): string {
	if (!encryptedData) return '';

	try {
		const key = getEncryptionKey();
		const combined = Buffer.from(encryptedData, 'base64');

		// Extract components
		const iv = combined.subarray(0, IV_LENGTH);
		const salt = combined.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
		const tag = combined.subarray(
			IV_LENGTH + SALT_LENGTH,
			IV_LENGTH + SALT_LENGTH + TAG_LENGTH
		);
		const encrypted = combined.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);

		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(tag);

		let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
		decrypted += decipher.final('utf8');

		return decrypted;
	} catch (error) {
		console.error('Decryption error:', error);
		throw new Error('Failed to decrypt data');
	}
}

/**
 * Check if a value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
	if (!value) return false;

	try {
		const buffer = Buffer.from(value, 'base64');
		// Encrypted data should be at least IV + SALT + TAG length
		return buffer.length >= IV_LENGTH + SALT_LENGTH + TAG_LENGTH;
	} catch {
		return false;
	}
}

/**
 * Generate a secure random encryption key (for setup)
 */
export function generateEncryptionKey(): string {
	return crypto.randomBytes(32).toString('base64');
}
