const fs = require('fs');
const csv = require('csv-parser');
const { db } = require('./db/database');

async function importGoodreadsData(filePath, userId) {
	console.log(`Starting import for user ${userId} from file ${filePath}`);
	return new Promise((resolve, reject) => {
		const books = [];
		let processedRows = 0;
		let totalRows = 0;
		let toReadCount = 0;

		fs.createReadStream(filePath)
			.pipe(csv())
			.on('data', (row) => {
				totalRows++;
				if (row['Exclusive Shelf'] === 'to-read') {
					toReadCount++;
				}
				books.push({
					user_id: userId,
					title: row['Title'],
					author: row['Author'],
					isbn: row['ISBN13'] || row['ISBN'],
					average_rating: parseFloat(row['Average Rating']) || 0,
					number_of_pages: parseInt(row['Number of Pages']) || 0,
					exclusive_shelf: row['Exclusive Shelf']
				});
				console.log(`Processing book: ${row['Title']} - Shelf: ${row['Exclusive Shelf']}`);
			})
			.on('end', async () => {
				if (books.length > 0) {
					await insertBooks(books);
				}
				console.log(`Import completed. Total rows: ${totalRows}, To-read books: ${toReadCount}`);
				resolve({ totalRows, toReadCount });
			})
			.on('error', (error) => {
				console.error('Error reading CSV:', error);
				reject(error);
			});
	});
}

function insertBooks(books) {
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			const stmt = db.prepare(`INSERT OR REPLACE INTO books (
				user_id, title, author, isbn, average_rating, number_of_pages, exclusive_shelf
			) VALUES (?, ?, ?, ?, ?, ?, ?)`);

			db.run('BEGIN TRANSACTION');

			books.forEach(book => {
				stmt.run(
					book.user_id, book.title, book.author, book.isbn,
					book.average_rating, book.number_of_pages, book.exclusive_shelf,
					(err) => {
						if (err) {
							console.error('Error inserting book:', err);
						}
					}
				);
			});

			stmt.finalize();

			db.run('COMMIT', (err) => {
				if (err) {
					console.error('Error committing transaction:', err);
					db.run('ROLLBACK');
					reject(err);
				} else {
					console.log(`Successfully inserted ${books.length} books`);
					resolve();
				}
			});
		});
	});
}

module.exports = { importGoodreadsData };