import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { put } from '@vercel/blob';
import { requireAuth } from '$lib/server/auth/middleware';

/**
 * POST /api/upload/image
 * Upload an image to Vercel Blob storage
 */
export const POST: RequestHandler = async (event) => {
	try {
		// Require authentication
		const user = await requireAuth(event);

		// Get the uploaded file from form data
		const formData = await event.request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ success: false, error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return json({ success: false, error: 'File must be an image' }, { status: 400 });
		}

		// Validate file size (max 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return json(
				{ success: false, error: 'Image must be smaller than 5MB' },
				{ status: 400 }
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(7);
		const extension = file.name.split('.').pop();
		const filename = `ad-images/${user.id}/${timestamp}-${randomString}.${extension}`;

		console.log('[Upload Image] Uploading:', filename, 'Size:', file.size, 'bytes');

		// Upload to Vercel Blob
		const blob = await put(filename, file, {
			access: 'public',
			addRandomSuffix: false
		});

		console.log('[Upload Image] Upload successful:', blob.url);

		return json({
			success: true,
			url: blob.url,
			filename: filename
		});
	} catch (error: any) {
		console.error('[Upload Image] Error:', error);
		return json(
			{
				success: false,
				error: 'Failed to upload image',
				details: error?.message || 'Unknown error'
			},
			{ status: 500 }
		);
	}
};