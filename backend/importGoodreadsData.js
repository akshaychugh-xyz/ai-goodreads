const fs = require('fs');
const csv = require('csv-parser');
const { pool } = require('./db/database');

async function importBooks(filePath, userId) {
	console.log(`Importing books for user ${userId} from file ${filePath}`);
	return new Promise((resolve, reject) => {
		const books = [];
		let rowCount = 0;
		let skippedCount = 0;
		let missingIsbnCount = 0;
		fs.createReadStream(filePath)
			.pipe(csv())
			.on('data', (row) => {
				rowCount++;
				const numberofPages = parseInt(row['Number of Pages'], 10);
				const isbn = row['ISBN13'] || row['ISBN'] || null;
				if (!isbn) {
					skippedCount++;
					missingIsbnCount++;
					return;
				}
				books.push({
					user_id: userId,
					title: row['Title'],
					author: row['Author'],
					isbn: isbn,
					average_rating: parseFloat(row['Average Rating']) || null,
					number_of_pages: isNaN(numberofPages) ? null : numberofPages,
					exclusive_shelf: row['Exclusive Shelf']
				});
			})
			.on('end', async () => {
				console.log(`Finished reading CSV. Total rows: ${rowCount}, Skipped: ${skippedCount}, Missing ISBN: ${missingIsbnCount}, Attempting to insert: ${books.length} books.`);
				const client = await pool.connect();
				let insertedCount = 0;
				let updatedCount = 0;
				try {
					await client.query('BEGIN');
					for (const book of books) {
						const query = `
							INSERT INTO books (isbn, title, author, user_id)
							VALUES ($1, $2, $3, $4)
							ON CONFLICT DO NOTHING
						`;
						const result = await client.query(query, Object.values(book));
						if (result.rows[0].inserted) {
							insertedCount++;
						} else {
							updatedCount++;
						}
					}
					await client.query('COMMIT');
					console.log(`Import completed. Inserted: ${insertedCount}, Updated: ${updatedCount}, Total in database: ${insertedCount + updatedCount}`);
					resolve({ insertedCount, updatedCount, totalCount: insertedCount + updatedCount, skippedCount, missingIsbnCount });
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
