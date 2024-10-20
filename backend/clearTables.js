const { pool } = require('./db/database');

async function clearTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE books RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    // Add any other tables you need to clear
    await client.query('COMMIT');
    console.log('All tables have been cleared successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error clearing tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

clearTables();