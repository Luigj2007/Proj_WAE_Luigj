import pool from '$lib/server/db';
import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
	// Load one image with its author and viewer vote state.
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

		// Load newest comments first for the detail sidebar.
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
		// Guests must log in before voting.
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
			// Confirm the image belongs to the route owner.
			const [imageRows] = await connection.execute(
				'SELECT id FROM images WHERE id = ? AND author_id = ?',
				[id, params.id]
			);

			if (imageRows.length === 0) {
				return fail(404, { message: 'Image not found' });
			}

			// Toggle the viewer vote and update the cached vote count.
			const [existingVotes] = await connection.execute(
				'SELECT id FROM votes WHERE image_id = ? AND user_id = ?',
				[id, locals.user.id]
			);

			if (existingVotes.length > 0) {
				await connection.execute('DELETE FROM votes WHERE image_id = ? AND user_id = ?', [
					id,
					locals.user.id
				]);
				await connection.execute('UPDATE images SET votes = GREATEST(votes - 1, 0) WHERE id = ?', [
					id
				]);
			} else {
				await connection.execute('INSERT INTO votes (image_id, user_id) VALUES (?, ?)', [
					id,
					locals.user.id
				]);
				await connection.execute('UPDATE images SET votes = votes + 1 WHERE id = ?', [id]);
			}

			throw redirect(
				303,
				request.headers.get('referer') || `/user/${params.id}/images/${params.imageId}`
			);
		} finally {
			connection.release();
		}
	},
	addComment: async ({ request, locals, params }) => {
		// Require login before writing comments.
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
			// Ensure the target image still exists before inserting the comment.
			const [images] = await connection.execute(
				'SELECT id FROM images WHERE id = ? AND author_id = ?',
				[params.imageId, params.id]
			);

			if (images.length === 0) {
				throw error(404, 'Image not found');
			}

			await connection.execute('INSERT INTO comments (image_id, user_id, text) VALUES (?, ?, ?)', [
				params.imageId,
				locals.user.id,
				text
			]);

			throw redirect(
				303,
				request.headers.get('referer') || `/user/${params.id}/images/${params.imageId}`
			);
		} finally {
			connection.release();
		}
	},
	deleteComment: async ({ request, locals, params }) => {
		// Comment authors can delete their own comments; image owners can delete any comment on their image.
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const formData = await request.formData();
		const commentId = Number(formData.get('commentId'));

		if (!commentId) {
			return fail(400, { message: 'Missing comment ID' });
		}

		const connection = await pool.getConnection();

		try {
			// Allow deletion when the viewer owns the comment or owns the image.
			const [deletableComments] = await connection.execute(
				`SELECT comments.id
				 FROM comments
				 INNER JOIN images ON images.id = comments.image_id
				 WHERE comments.id = ?
					AND comments.image_id = ?
					AND images.author_id = ?
					AND (comments.user_id = ? OR images.author_id = ?)`,
				[commentId, params.imageId, params.id, locals.user.id, locals.user.id]
			);

			if (deletableComments.length === 0) {
				return fail(403, { message: 'Not authorized' });
			}

			await connection.execute('DELETE FROM comments WHERE id = ? AND image_id = ?', [
				commentId,
				params.imageId
			]);

			throw redirect(
				303,
				request.headers.get('referer') || `/user/${params.id}/images/${params.imageId}`
			);
		} finally {
			connection.release();
		}
	}
};
