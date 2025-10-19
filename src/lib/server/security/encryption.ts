import crypto from 'crypto';
import { ENCRYPTION_KEY } from '$lib/config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export interface EncryptedData {
	encrypted: string;
	iv: string;
	tag: string;
}

export function encrypt(text: string): EncryptedData {
	const iv = crypto.randomBytes(IV_LENGTH);
	// Create a 32-byte key from the encryption key
	const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	cipher.setAAD(Buffer.from('additional-auth-data'));

	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	const tag = cipher.getAuthTag();

	return {
		encrypted,
		iv: iv.toString('hex'),
		tag: tag.toString('hex')
	};
}

export function decrypt(data: EncryptedData): string {
	// Create a 32-byte key from the encryption key
	const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
	const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(data.iv, 'hex'));
	decipher.setAAD(Buffer.from('additional-auth-data'));
	decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

	let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}

export function encryptCredentials(credentials: Record<string, string>): string {
	const jsonString = JSON.stringify(credentials);
	const encrypted = encrypt(jsonString);
	return JSON.stringify(encrypted);
}

export function decryptCredentials(encryptedString: string): Record<string, string> {
	const encryptedData: EncryptedData = JSON.parse(encryptedString);
	const decryptedString = decrypt(encryptedData);
	return JSON.parse(decryptedString);
}