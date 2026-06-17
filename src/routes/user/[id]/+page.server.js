import pool from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	// Load the requested profile and all images for that user.
	const connection = await pool.getConnection();

	try {
		const [users] = await connection.execute(
			'SELECT id, username, role, created_at FROM users WHERE id = ?',
			[params.id]
		);

		if (users.length === 0) {
			throw error(404, 'User not found');
		}

		const [images] = await connection.execute(
			`SELECT
				i.id,
				i.image_url,
				i.description,
				i.author_id,
				i.votes,
				u.username,
				(SELECT COUNT(*) FROM votes v WHERE v.image_id = i.id) AS vote_count,
				EXISTS(
					SELECT 1 FROM votes viewer_vote
					WHERE viewer_vote.image_id = i.id AND viewer_vote.user_id = ?
				) AS viewer_voted
			 FROM images i
			 INNER JOIN users u ON u.id = i.author_id
			 WHERE i.author_id = ?
			 ORDER BY i.id DESC`,
			[locals.user?.id ?? null, params.id]
		);

		return {
			profileUser: users[0],
			images,
			viewer: locals.user ?? null,
			isOwner: Boolean(locals.user && String(locals.user.id) === params.id)
		};
	} finally {
		connection.release();
	}
};

export const actions = {
	upvoteImage: async ({ request, locals }) => {
		// Guests must log in before voting.
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return { success: false, message: 'Missing image id' };
		}

		const connection = await pool.getConnection();

		try {
			// Toggle the viewer vote and keep the cached vote count in sync.
			const [existingVotes] = await connection.execute(
				'SELECT id FROM votes WHERE image_id = ? AND user_id = ?',
				[id, locals.user.id]
			);

			let voted = false;

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
				voted = true;
			}

			const [voteRows] = await connection.execute('SELECT votes FROM images WHERE id = ?', [id]);
			const voteCount = voteRows[0]?.votes ?? 0;

			return {
				success: true,
				imageId: Number(id),
				votes: voteCount,
				voted
			};
		} finally {
			connection.release();
		}
	},
	deleteImage: async ({ request, locals, params }) => {
		// Only logged-in owners can delete their images.
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		if (String(locals.user.id) !== params.id) {
			throw redirect(302, `/user/${locals.user.id}`);
		}

		const formData = await request.formData();
		const id = formData.get('id');
		const connection = await pool.getConnection();

		try {
			// Delete the image only when it belongs to the current owner.
			await connection.execute('DELETE FROM images WHERE id = ? AND author_id = ?', [
				id,
				locals.user.id
			]);
		} finally {
			connection.release();
		}
	}
};
