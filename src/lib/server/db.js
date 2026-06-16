import mysql from 'mysql2/promise';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } from '$env/static/private';

// Create one shared MySQL pool for the server-side app.
const pool = mysql.createPool({
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASSWORD,
	port: DB_PORT,
	database: DB_NAME
});

// Export the pool so routes and helpers can reuse connections.
export default pool;
