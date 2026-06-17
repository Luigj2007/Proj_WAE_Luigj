import pool from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// Load the most liked images for the public homepage.
	const connection = await pool.getConnection();

	try {
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
			 JOIN users u ON u.id = i.author_id
			 ORDER BY vote_count DESC, i.id DESC
			 LIMIT 25`,
			[locals.user?.id ?? null]
		);

		return {
			images,
			user: locals.user ?? null
		};
	} finally {
		connection.release();
	}
}

export const actions = {
	upvoteImage: async ({ request, locals }) => {
		// Guests must log in before they can vote.
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
			// Toggle an existing vote off, or add a new one.
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

			throw redirect(303, request.headers.get('referer') || '/');
		} finally {
			connection.release();
		}
	}
};
