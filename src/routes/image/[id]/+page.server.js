import pool from '$lib/server/db';

export async function load({ params }) {

	const [image] = await pool.execute(
		'SELECT * FROM images WHERE id = ?',
		[params.id]
	);

	const [comments] = await pool.execute(
		`SELECT comments.*, users.username
		 FROM comments
		 JOIN users ON comments.user_id = users.id
		 WHERE image_id = ?`,
		[params.id]
	);

	return {
		image: image[0],
		comments
	};
}