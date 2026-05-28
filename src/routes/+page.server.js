import pool from '$lib/server/db';

// runs when page loads
export async function load() {

	// get images from database
	const [images] = await pool.execute(
		'SELECT * FROM images ORDER BY created_at DESC LIMIT 25'
	);

	return { images };
}