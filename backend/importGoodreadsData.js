const fs = require('fs');
const csv = require('csv-parser');
const { db, initializeDatabase } = require('./db/database');

async function importGoodreadsData(filePath) {
    try {
        await initializeDatabase();
        const books = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                books.push({
                    id: row['Book Id'],
                    title: row['Title'],
                    author: row['Author'],
                    author_lf: row['Author l-f'],
                    additional_authors: row['Additional Authors'],
                    isbn: row['ISBN'],
                    isbn13: row['ISBN13'],
                    my_rating: row['My Rating'],
                    average_rating: row['Average Rating'],
                    publisher: row['Publisher'],
                    binding: row['Binding'],
                    number_of_pages: row['Number of Pages'],
                    year_published: row['Year Published'],
                    original_publication_year: row['Original Publication Year'],
                    date_read: row['Date Read'],
                    date_added: row['Date Added'],
                    bookshelves: row['Bookshelves'],
                    bookshelves_with_positions: row['Bookshelves with positions'],
                    exclusive_shelf: row['Exclusive Shelf'],
                    my_review: row['My Review'],
                    spoiler: row['Spoiler'],
                    private_notes: row['Private Notes'],
                    read_count: row['Read Count'],
                    owned_copies: row['Owned Copies']
                });
            })
            .on('end', () => {
                db.serialize(() => {
                    const stmt = db.prepare(`INSERT INTO books (
                        id, title, author, author_lf, additional_authors, isbn, isbn13,
                        my_rating, average_rating, publisher, binding, number_of_pages,
                        year_published, original_publication_year, date_read, date_added,
                        bookshelves, bookshelves_with_positions, exclusive_shelf,
                        my_review, spoiler, private_notes, read_count, owned_copies
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                    books.forEach(book => {
                        stmt.run(
                            book.id, book.title, book.author, book.author_lf, book.additional_authors,
                            book.isbn, book.isbn13, book.my_rating, book.average_rating, book.publisher,
                            book.binding, book.number_of_pages, book.year_published,
                            book.original_publication_year, book.date_read, book.date_added,
                            book.bookshelves, book.bookshelves_with_positions, book.exclusive_shelf,
                            book.my_review, book.spoiler, book.private_notes, book.read_count,
                            book.owned_copies
                        );
                    });
                    stmt.finalize();
                });
                console.log('Goodreads data imported successfully.');
            });
    } catch (error) {
        console.error('Error importing Goodreads data:', error);
    }
}

importGoodreadsData('../data/goodreads_library_export.csv');