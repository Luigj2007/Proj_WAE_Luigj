import { put } from '@vercel/blob';
import pool from '$lib/server/db';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';

export const actions = {
	default: async ({ request }) => {

		const data = await request.formData();

		const file = data.get('image');
		const description = data.get('description');

		// upload image to Vercel Blob
		const blob = await put(file.name, file, {
			access: 'public',
			token: BLOB_READ_WRITE_TOKEN
		});

		// save image to database
		await pool.execute(
			'INSERT INTO images (image, description, author_id, votes) VALUES (?, ?, ?, 0)',
			[blob.url, description, 1]
		);

		return { success: true };
	}
};