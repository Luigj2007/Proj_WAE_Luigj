import pool from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const actions = {
	// Logout action
	logout: async ({ locals, cookies }) => {
		if (!locals.user) {
			redirect(302, '/'); // Redirect if no user is logged in
		}

		// Clear session info from database
		let connection = await pool.getConnection();
		await connection.execute(
			'UPDATE users SET session_token = NULL, session_expiration = NULL WHERE id = ?',
			[locals.user.id]
		);

		// Remove session cookie
		cookies.delete('session', { path: '/' });

		// Redirect to home page
		redirect(302, '/');
	}
};