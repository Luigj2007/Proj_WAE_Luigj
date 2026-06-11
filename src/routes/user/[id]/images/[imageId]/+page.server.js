import pool from '$lib/server/db';
import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	const connection = await pool.getConnection();

	try {
		const [images] = await connection.execute(
			`SELECT
				i.id,
				i.image_url,
				i.description,
				i.author_id,
				i.votes,
				u.username AS author_username,
				(SELECT COUNT(*) FROM votes v WHERE v.image_id = i.id) AS vote_count,
				EXISTS(
					SELECT 1 FROM votes viewer_vote
					WHERE viewer_vote.image_id = i.id AND viewer_vote.user_id = ?
				) AS viewer_voted
			 FROM images i
			 INNER JOIN users u ON u.id = i.author_id
			 WHERE i.id = ? AND i.author_id = ?`,
			[locals.user?.id ?? null, params.imageId, params.id]
		);

		if (images.length === 0) {
			throw error(404, 'Image not found');
		}

		const [comments] = await connection.execute(
			`SELECT
				comments.id,
				comments.image_id,
				comments.user_id,
				comments.text,
				comments.created_at,
				users.username
			 FROM comments
			 INNER JOIN users ON users.id = comments.user_id
			 WHERE comments.image_id = ?
			 ORDER BY comments.created_at DESC`,
			[params.imageId]
		);

		return {
			image: images[0],
			comments,
			viewer: locals.user ?? null,
			isOwner: Boolean(locals.user && String(locals.user.id) === String(params.id))
		};
	} finally {
		connection.release();
	}
};

export const actions = {
	upvoteImage: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) {
			return fail(400, { message: 'Missing image ID' });
		}

		const connection = await pool.getConnection();

		try {
			const [imageRows] = await connection.execute('SELECT id FROM images WHERE id = ? AND author_id = ?', [
				id,
				params.id
			]);

			if (imageRows.length === 0) {
				return fail(404, { message: 'Image not found' });
			}

			const [existingVotes] = await connection.execute(
				'SELECT id FROM votes WHERE image_id = ? AND user_id = ?',
				[id, locals.user.id]
			);

			if (existingVotes.length > 0) {
				await connection.execute('DELETE FROM votes WHERE image_id = ? AND user_id = ?', [id, locals.user.id]);
				await connection.execute('UPDATE images SET votes = GREATEST(votes - 1, 0) WHERE id = ?', [id]);
			} else {
				await connection.execute('INSERT INTO votes (image_id, user_id) VALUES (?, ?)', [
					id,
					locals.user.id
				]);
				await connection.execute('UPDATE images SET votes = votes + 1 WHERE id = ?', [id]);
			}

			throw redirect(303, request.headers.get('referer') || `/user/${params.id}/images/${params.imageId}`);
		} finally {
			connection.release();
		}
	},
	addComment: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const formData = await request.formData();
		const text = String(formData.get('text') ?? '').trim();

		if (!text) {
			return { success: false, message: 'Comment cannot be empty' };
		}

		const connection = await pool.getConnection();

		try {
			const [images] = await connection.execute(
				'SELECT id FROM images WHERE id = ? AND author_id = ?',
				[params.imageId, params.id]
			);

			if (images.length === 0) {
				throw error(404, 'Image not found');
			}

			await connection.execute(
				'INSERT INTO comments (image_id, user_id, text) VALUES (?, ?, ?)',
				[params.imageId, locals.user.id, text]
			);

			throw redirect(303, request.headers.get('referer') || `/user/${params.id}/images/${params.imageId}`);
		} finally {
			connection.release();
		}
	},
	deleteComment: async ({ request, locals, params }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		if (String(locals.user.id) !== String(params.id)) {
			throw redirect(302, `/user/${locals.user.id}`);
		}

		const formData = await request.formData();
		const commentId = Number(formData.get('commentId'));

		if (!commentId) {
			return fail(400, { message: 'Missing comment ID' });
		}

		const connection = await pool.getConnection();

		try {
			const [ownedImage] = await connection.execute(
				'SELECT id FROM images WHERE id = ? AND author_id = ?',
				[params.imageId, params.id]
			);

			if (ownedImage.length === 0) {
				return fail(403, { message: 'Not authorized' });
			}

			await connection.execute('DELETE FROM comments WHERE id = ? AND image_id = ?', [
				commentId,
				params.imageId
			]);

			throw redirect(303, request.headers.get('referer') || `/user/${params.id}/images/${params.imageId}`);
		} finally {
			connection.release();
		}
	}
};