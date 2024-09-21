const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Update the database path to match the original file
const dbPath = path.resolve(__dirname, '../../data/database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        author TEXT,
        isbn TEXT,
        average_rating REAL,
        number_of_pages INTEGER,
        exclusive_shelf TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Check if user_id column exists
      db.all(`PRAGMA table_info(books)`, (err, rows) => {
        if (err) {
          console.error('Error checking books table schema:', err);
          reject(err);
        } else {
          const hasUserIdColumn = rows.some(row => row.name === 'user_id');
          if (!hasUserIdColumn) {
            db.run(`ALTER TABLE books ADD COLUMN user_id INTEGER`, (alterErr) => {
              if (alterErr) {
                console.error('Error adding user_id column:', alterErr);
                reject(alterErr);
              } else {
                console.log('Added user_id column to books table');
                resolve();
              }
            });
          } else {
            console.log('user_id column already exists in books table');
            resolve();
          }
        }
      });
    });
  });
};

module.exports = { db, initializeDatabase };