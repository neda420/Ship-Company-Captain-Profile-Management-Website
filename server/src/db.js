import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// IMPORTANT: MySQL database name has a space: `global shipping company`
// In SQL you must always wrap it in backticks, and in the .env we store it as-is.

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'global shipping company',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(sql, params) {
  try {
    const [result, fields] = await pool.execute(sql, params);
    
    // For INSERT/UPDATE/DELETE operations, MySQL2 returns ResultSetHeader as first element
    // ResultSetHeader has insertId, affectedRows, etc.
    // For SELECT operations, it returns array of rows
    const sqlUpper = sql.trim().toUpperCase();
    
    if (sqlUpper.startsWith('INSERT') || 
        sqlUpper.startsWith('UPDATE') || 
        sqlUpper.startsWith('DELETE')) {
      // Return the ResultSetHeader object which has insertId, affectedRows, etc.
      return result;
    }
    
    // For SELECT, return the rows array
    return result;
  } catch (err) {
    // Log the SQL and params for debugging
    console.error('[DB Query Error] SQL:', sql.substring(0, 100));
    console.error('[DB Query Error] Params:', params);
    console.error('[DB Query Error] Error:', err.message);
    throw err;
  }
}

export default pool;


