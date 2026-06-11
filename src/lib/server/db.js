// MySQL connection
import mysql from 'mysql2/promise';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } from '$env/static/private';

// connect to database
const pool = mysql.createPool({
	host: DB_HOST,
	user: DB_USER,
	password: DB_PASSWORD,
	port: DB_PORT,
	database: DB_NAME
});

// export so we can use it everywhere
export default pool;