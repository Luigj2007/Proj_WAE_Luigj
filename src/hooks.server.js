import pool from '$lib/server/db';

export const handle = async ({ event, resolve }) => {
	// Get session from cookies
	const session = event.cookies.get('session');

	if (session) {
		// Verify session in database
		const connection = await pool.getConnection();
		const [users] = await connection.execute('SELECT * FROM users WHERE session_token = ?', [session]);
		connection.release();

		if (users.length > 0) {
			event.locals.user = users[0]; // attach user to locals
		} else {
			// Invalid session → remove cookie
			event.cookies.set('session', '', { maxAge: -1, path: '/' });
		}
	}

	return await resolve(event);
};