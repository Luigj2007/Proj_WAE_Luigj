import pool from '$lib/server/db';
import bcrypt from 'bcrypt';

export let login = async (username, password) => {
	let connection = await pool.getConnection();

	try {
		// Find the user record for the submitted username.
		let [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

		if (users.length === 0) {
			return null;
		}

		// Compare the submitted password with the stored hash.
		if (!(await bcrypt.compare(password, users[0].password_hash))) {
			return null;
		}

		// Generate a new session token for this login.
		const token = crypto.randomUUID();

		// Expire the session after one week.
		let expires = new Date();
		expires.setDate(expires.getDate() + 7);

		// Persist the session token on the user row.
		let [result] = await connection.execute(
			'UPDATE users SET session_token = ?, session_expiration = ? WHERE id = ?',
			[token, expires, users[0].id]
		);
		if (result.affectedRows === 0) {
			return null;
		}

		// Return the token and the public user data.
		return {
			token,
			user: {
				id: users[0].id,
				username: users[0].username,
				role: users[0].role
			}
		};
	} finally {
		connection.release();
	}
};

export let register = async (username, password) => {
	let connection = await pool.getConnection();
	let hashedPassword = await hashPassword(password);

	try {
		// Prevent duplicate usernames.
		let [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
		if (users.length > 0) {
			return { token: null, message: 'Username already in use' };
		}

		// Create the new user with a hashed password.
		let [result] = await connection.execute(
			'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
			[username, hashedPassword, 'user']
		);

		// Generate a session token so the new user is logged in.
		const token = crypto.randomUUID();

		// Expire the new session after one week.
		let expires = new Date();
		expires.setDate(expires.getDate() + 7);

		// Store the session details on the new user row.
		await connection.query(
			'UPDATE users SET session_token = ?, session_expiration = ? WHERE id = ?',
			[token, expires, result.insertId]
		);

		// Return the token and the created user data.
		return {
			token,
			user: {
				id: result.insertId,
				username,
				role: 'user'
			},
			message: 'User created'
		};
	} finally {
		connection.release();
	}
};

// Hash passwords before they are stored in the database.
let hashPassword = async (password) => {
	return await bcrypt.hash(password, 12);
};
