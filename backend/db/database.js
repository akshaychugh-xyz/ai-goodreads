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

// Keep the initializeDatabase function
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Drop the existing table if it exists
            db.run("DROP TABLE IF EXISTS books", (err) => {
                if (err) {
                    console.error("Error dropping table:", err);
                    reject(err);
                    return;
                }

                // Create the table with all columns
                db.run(`CREATE TABLE books (
                    id INTEGER PRIMARY KEY,
                    title TEXT,
                    author TEXT,
                    author_lf TEXT,
                    additional_authors TEXT,
                    isbn TEXT,
                    isbn13 TEXT,
                    my_rating INTEGER,
                    average_rating REAL,
                    publisher TEXT,
                    binding TEXT,
                    number_of_pages INTEGER,
                    year_published INTEGER,
                    original_publication_year INTEGER,
                    date_read TEXT,
                    date_added TEXT,
                    bookshelves TEXT,
                    bookshelves_with_positions TEXT,
                    exclusive_shelf TEXT,
                    my_review TEXT,
                    spoiler TEXT,
                    private_notes TEXT,
                    read_count INTEGER,
                    owned_copies INTEGER
                )`, (err) => {
                    if (err) {
                        console.error("Error creating table:", err);
                        reject(err);
                    } else {
                        console.log("Database schema updated successfully");
                        resolve();
                    }
                });
            });
        });
    });
}

module.exports = { db, initializeDatabase };