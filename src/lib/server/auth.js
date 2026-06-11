import pool from '$lib/server/db';
import bcrypt from 'bcrypt';

export let login = async (username, password) => {
	let connection = await pool.getConnection();

	try {
		// Find user with username
		let [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);

		if (users.length === 0) {
			return null;
		}

		// Check password
		if (!(await bcrypt.compare(password, users[0].password_hash))) {
			return null;
		}

		// Create token
		const token = crypto.randomUUID();

		// Create expiration date (1 week)
		let expires = new Date();
		expires.setDate(expires.getDate() + 7);

		// Save token
		let [result] = await connection.execute(
			'UPDATE users SET session_token = ?, session_expiration = ? WHERE id = ?',
			[token, expires, users[0].id]
		);
		if (result.affectedRows === 0) {
			return null;
		}

		// Return session and user data
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
		// Check if username is already in use
		let [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
		if (users.length > 0) {
			return { token: null, message: 'Username already in use' };
		}

		// Create user
		let [result] = await connection.execute(
			'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
			[username, hashedPassword, 'user']
		);

		// Create token
		const token = crypto.randomUUID();

		// Create expiration date (1 week)
		let expires = new Date();
		expires.setDate(expires.getDate() + 7);

		// Save token
		await connection.query(
			'UPDATE users SET session_token = ?, session_expiration = ? WHERE id = ?',
			[token, expires, result.insertId]
		);

		// Return token and created user
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

let hashPassword = async (password) => {
	return await bcrypt.hash(password, 12);
};