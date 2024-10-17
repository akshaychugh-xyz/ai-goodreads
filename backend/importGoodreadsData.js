const fs = require('fs');
const csv = require('csv-parser');
const { pool } = require('./db/database');

async function importGoodreadsData(filePath, userId) {
	console.log(`Starting import for user ${userId} from file ${filePath}`);
	return new Promise((resolve, reject) => {
		const books = [];
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

async function insertBooks(books) {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		for (const book of books) {
			await client.query(`
				INSERT INTO books (user_id, title, author, isbn, average_rating, number_of_pages, exclusive_shelf)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				ON CONFLICT (user_id, title, author) DO UPDATE SET
				isbn = EXCLUDED.isbn,
				average_rating = EXCLUDED.average_rating,
				number_of_pages = EXCLUDED.number_of_pages,
				exclusive_shelf = EXCLUDED.exclusive_shelf
			`, [book.user_id, book.title, book.author, book.isbn, book.average_rating, book.number_of_pages, book.exclusive_shelf]);
		}
		await client.query('COMMIT');
		console.log(`Successfully inserted ${books.length} books`);
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}

module.exports = { importGoodreadsData };
