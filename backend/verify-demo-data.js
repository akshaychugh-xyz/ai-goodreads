require('dotenv').config();

// Force use of Supabase
process.env.USE_SUPABASE = 'true';

async function verifyDemoData() {
  console.log('🔍 Verifying demo data in Supabase...');
  
  try {
    const { pool } = require('./db/database-switcher');
    
    console.log('Environment check:', {
      USE_SUPABASE: process.env.USE_SUPABASE,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
    });
    
    // Test basic connection
    console.log('1. Testing database connection...');
    const timeResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', timeResult.rows[0]);
    
    // Check if demo user exists
    console.log('2. Checking demo user...');
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
    if (userResult.rows.length === 0) {
      console.log('❌ Demo user not found, creating...');
      await pool.query(
        'INSERT INTO users (id, email, password, created_at) VALUES ($1, $2, $3, $4)',
        [1, 'demo@betterreads.com', 'demo-password', new Date()]
      );
      console.log('✅ Demo user created');
    } else {
      console.log('✅ Demo user exists:', userResult.rows[0]);
    }
    
    // Check demo books count
    console.log('3. Checking demo books...');
    const booksResult = await pool.query('SELECT COUNT(*) FROM books WHERE user_id = $1', [1]);
    const bookCount = parseInt(booksResult.rows[0].count);
    console.log(`📚 Demo user has ${bookCount} books`);
    
    if (bookCount === 0) {
      console.log('❌ No demo books found. Running setup...');
      // Add a few essential demo books
      const demoBooks = [
        {
          book_id: 'demo-1',
          title: 'The Midnight Library',
          author: 'Matt Haig',
          isbn: '9781786892737',
          average_rating: 4.2,
          number_of_pages: 288,
          exclusive_shelf: 'read',
          my_rating: 5,
          date_added: '2024-01-01',
          date_read: '2024-01-15',
          my_review: 'Absolutely loved this philosophical journey!'
        },
        {
          book_id: 'demo-2',
          title: 'Atomic Habits',
          author: 'James Clear',
          isbn: '9780735211292',
          average_rating: 4.4,
          number_of_pages: 320,
          exclusive_shelf: 'read',
          my_rating: 4,
          date_added: '2024-02-01',
          date_read: '2024-02-20',
          my_review: 'Great practical advice for building better habits.'
        },
        {
          book_id: 'demo-3',
          title: 'Dune',
          author: 'Frank Herbert',
          isbn: '9780441172719',
          average_rating: 4.3,
          number_of_pages: 688,
          exclusive_shelf: 'currently-reading',
          my_rating: null,
          date_added: '2024-03-01',
          date_read: null,
          my_review: null
        },
        {
          book_id: 'demo-4',
          title: 'The Seven Husbands of Evelyn Hugo',
          author: 'Taylor Jenkins Reid',
          isbn: '9781501161933',
          average_rating: 4.3,
          number_of_pages: 400,
          exclusive_shelf: 'to-read',
          my_rating: null,
          date_added: '2024-03-15',
          date_read: null,
          my_review: null
        }
      ];
      
      for (const book of demoBooks) {
        await pool.query(`
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
        `, [
          book.book_id, 1, book.title, book.author, book.isbn,
          book.average_rating, book.number_of_pages, book.exclusive_shelf,
          book.my_rating, book.date_added, book.date_read, book.my_review
        ]);
        console.log(`✅ Added: "${book.title}" by ${book.author}`);
      }
    }
    
    // Test the queries that are failing
    console.log('4. Testing library-stats queries...');
    
    // Test shelf distribution
    const shelfResult = await pool.query(`
      SELECT exclusive_shelf, COUNT(*) 
      FROM books 
      WHERE user_id = $1 
      GROUP BY exclusive_shelf
    `, [1]);
    console.log('✅ Shelf distribution:', shelfResult.rows);
    
    // Test top rated books
    const topBooksResult = await pool.query(`
      SELECT title, author, my_rating 
      FROM books 
      WHERE user_id = $1 
        AND my_rating IS NOT NULL 
      ORDER BY my_rating DESC 
      LIMIT 3
    `, [1]);
    console.log('✅ Top rated books:', topBooksResult.rows);
    
    console.log('🎉 Demo data verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying demo data:', error);
    console.error('Stack:', error.stack);
  }
}

verifyDemoData(); 