const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if books table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'books'
      )
    `);

    if (!tableExists.rows[0].exists) {
      // Create books table if it doesn't exist
      await client.query(`
        CREATE TABLE books (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          average_rating REAL,
          number_of_pages INTEGER,
          my_rating REAL,
          date_added DATE,
          date_read DATE,
          exclusive_shelf TEXT,
          title TEXT,
          author TEXT,
          isbn TEXT,
          book_id TEXT,
          my_review TEXT
        )
      `);
    } else {
      // Alter existing books table to add missing columns
      await client.query(`
        ALTER TABLE books
        ADD COLUMN IF NOT EXISTS average_rating REAL,
        ADD COLUMN IF NOT EXISTS number_of_pages INTEGER,
        ADD COLUMN IF NOT EXISTS my_rating REAL,
        ADD COLUMN IF NOT EXISTS date_added DATE,
        ADD COLUMN IF NOT EXISTS date_read DATE,
        ADD COLUMN IF NOT EXISTS exclusive_shelf TEXT,
        ADD COLUMN IF NOT EXISTS title TEXT,
        ADD COLUMN IF NOT EXISTS author TEXT,
        ADD COLUMN IF NOT EXISTS isbn TEXT,
        ADD COLUMN IF NOT EXISTS book_id TEXT,
        ADD COLUMN IF NOT EXISTS my_review TEXT
      `);
    }

    // Add unique constraint if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_book_per_user'
        ) THEN
          ALTER TABLE books
          ADD CONSTRAINT unique_book_per_user UNIQUE (user_id, book_id);
        END IF;
      END $$;
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

module.exports = { pool, initializeDatabase };
