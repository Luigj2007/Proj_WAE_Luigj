import pool from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const actions = {
	logout: async ({ locals, cookies }) => {
		// Send guests back home because there is no session to clear.
		if (!locals.user) {
			redirect(302, '/');
		}

		// Remove the stored session token from the database.
		let connection = await pool.getConnection();
		await connection.execute(
			'UPDATE users SET session_token = NULL, session_expiration = NULL WHERE id = ?',
			[locals.user.id]
		);

		// Remove the browser session cookie.
		cookies.delete('session', { path: '/' });

		redirect(302, '/');
	}
};
