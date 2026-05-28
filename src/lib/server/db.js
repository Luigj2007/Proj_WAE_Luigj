// MySQL connection
import mysql from 'mysql2/promise';

// connect to database
const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'luisha19_image_blog'
});

// export so we can use it everywhere
export default pool;