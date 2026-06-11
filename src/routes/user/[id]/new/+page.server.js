import pool from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	if (String(locals.user.id) !== params.id) {
		throw redirect(302, `/user/${locals.user.id}`);
	}

	return {
		user: locals.user
	};
};

export const actions = {
	createArticle: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		if (String(locals.user.id) !== params.id) {
			throw redirect(302, `/user/${locals.user.id}`);
		}

		const formData = await request.formData();
		const uploadedImage = formData.get('uploadedImage');
		const description = formData.get('description');

		const { url } = await put(`InstaClone/${uploadedImage.name}`, uploadedImage, {
			access: 'public',
			addRandomSuffix: true,
			token: BLOB_READ_WRITE_TOKEN
		});

		const connection = await pool.getConnection();

		try {
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