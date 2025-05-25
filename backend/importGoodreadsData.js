const fs = require('fs');
const csv = require('csv-parser');
const { pool } = require('./db/database-switcher');

async function importBooks(filePath, userId) {
	console.log(`Importing books for user ${userId} from file ${filePath}`);
	return new Promise((resolve, reject) => {
		const books = [];
		let rowCount = 0;
		let skippedCount = 0;
		fs.createReadStream(filePath)
			.pipe(csv())
			.on('data', (row) => {
				rowCount++;
				const numberofPages = parseInt(row['Number of Pages'], 10);
				const bookId = row['Book Id'] || null;
				if (!bookId) {
					skippedCount++;
					return;
				}
				books.push({
					user_id: userId,
					book_id: bookId,
					title: row['Title'],
					author: row['Author'],
					isbn: row['ISBN13'] || row['ISBN'] || null,
					average_rating: parseFloat(row['Average Rating']) || null,
					number_of_pages: isNaN(numberofPages) ? null : numberofPages,
					exclusive_shelf: row['Exclusive Shelf'],
					my_rating: parseFloat(row['My Rating']) || null,
					date_added: row['Date Added'] || null,
					date_read: row['Date Read'] || null,
					my_review: row['My Review'] || null
				});
			})
			.on('end', async () => {
				console.log(`Finished reading CSV. Total rows: ${rowCount}, Skipped: ${skippedCount}, Attempting to insert: ${books.length} books.`);
				const client = await pool.connect();
				let insertedCount = 0;
				let updatedCount = 0;
				try {
					await client.query('BEGIN');
					for (const book of books) {
						const query = `
							INSERT INTO books (book_id, user_id, title, author, isbn, average_rating, number_of_pages, exclusive_shelf, my_rating, date_added, date_read, my_review)
							VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
							ON CONFLICT (user_id, book_id) DO UPDATE SET
							title = EXCLUDED.title,
							author = EXCLUDED.author,
							isbn = EXCLUDED.isbn,
							average_rating = EXCLUDED.average_rating,
							number_of_pages = EXCLUDED.number_of_pages,
							exclusive_shelf = EXCLUDED.exclusive_shelf,
							my_rating = EXCLUDED.my_rating,
							date_added = EXCLUDED.date_added,
							date_read = EXCLUDED.date_read,
							my_review = EXCLUDED.my_review
						`;
						try {
							const result = await client.query(query, [
								book.book_id,
								book.user_id,
								book.title,
								book.author,
								book.isbn,
								book.average_rating,
								book.number_of_pages,
								book.exclusive_shelf,
								book.my_rating,
								book.date_added,
								book.date_read,
								book.my_review
							]);

							if (result.rowCount > 0) {
								insertedCount++;
							} else {
								updatedCount++;
							}
						} catch (error) {
							console.error('Error inserting book:', error);
							console.error('Failed book details:', { book_id: book.book_id, title: book.title, author: book.author });
						}
					}
					await client.query('COMMIT');
					console.log(`Import completed. Inserted: ${insertedCount}, Updated: ${updatedCount}, Total in database: ${insertedCount + updatedCount}`);
					resolve({ insertedCount, updatedCount, totalCount: insertedCount + updatedCount, skippedCount });
				} catch (error) {
					await client.query('ROLLBACK');
					console.error('Error importing books:', error);
					reject(error);
				} finally {
					client.release();
				}
			})
			.on('error', (error) => {
				console.error('Error reading CSV:', error);
				reject(error);
			});
	});
}

module.exports = { importBooks };
