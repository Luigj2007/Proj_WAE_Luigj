import pool from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';

export const load = async ({ locals, params }) => {
	// Only logged-in users can open the upload page.
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Keep users inside their own upload page.
	if (String(locals.user.id) !== params.id) {
		throw redirect(302, `/user/${locals.user.id}`);
	}

	return {
		user: locals.user
	};
};

export const actions = {
	createArticle: async ({ request, locals, params }) => {
		// Require a logged-in user before accepting uploads.
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		// Prevent users from posting to another profile.
		if (String(locals.user.id) !== params.id) {
			throw redirect(302, `/user/${locals.user.id}`);
		}

		const formData = await request.formData();
		const uploadedImage = formData.get('uploadedImage');
		const description = formData.get('description');

		// Upload the file to the Image Blog blob folder.
		const { url } = await put(`image-blog/${uploadedImage.name}`, uploadedImage, {
			access: 'public',
			addRandomSuffix: true,
			token: BLOB_READ_WRITE_TOKEN
		});

		const connection = await pool.getConnection();

		try {
			// Save the image metadata in the database.
			const [result] = await connection.execute(
				'INSERT INTO images (image_url, description, author_id) VALUES (?, ?, ?)',
				[url, description, locals.user.id]
			);

			if (result.affectedRows) {
				throw redirect(303, `/user/${locals.user.id}`);
			}
		} finally {
			connection.release();
		}
	}
};
