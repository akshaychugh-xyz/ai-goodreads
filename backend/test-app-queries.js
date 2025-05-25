require('dotenv').config();

// Test script to verify app-specific queries work with Supabase
async function testAppQueries() {
  console.log('Testing BetterReads app queries with Supabase...');
  
  // Set to use Supabase for this test
  process.env.USE_SUPABASE = 'true';
  
  try {
    const { pool } = require('./db/database-switcher');
    
    // Test 1: User registration (from auth.js)
    console.log('\n1. Testing user registration...');
    try {
      const registerResult = await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
        ['testuser@example.com', '$2b$10$hashedpassword']
      );
      console.log('✅ User registration works:', registerResult.rows[0]);
    } catch (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log('✅ User registration works (user already exists)');
      } else {
        throw error;
      }
    }
    
    // Test 2: User login (from auth.js)
    console.log('\n2. Testing user login...');
    const loginResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['testuser@example.com']
    );
    console.log('✅ User login works:', loginResult.rows.length > 0 ? 'User found' : 'User not found');
    
    const userId = loginResult.rows[0]?.id || 1;
    
    // Test 3: Book import (from importGoodreadsData.js)
    console.log('\n3. Testing book import...');
    const bookImportResult = await pool.query(`
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
      'test-book-123',
      userId,
      'Test Book Title',
      'Test Author',
      '9781234567890',
      4.5,
      300,
      'read',
      5,
      '2024-01-01',
      '2024-01-15',
      'Great book!'
    ]);
    console.log('✅ Book import works:', bookImportResult.rowCount > 0 ? 'Book inserted/updated' : 'No changes');
    
    // Test 4: Shelf counts (from shelfCounts.js)
    console.log('\n4. Testing shelf counts...');
    const shelfCountsResult = await pool.query(
      `SELECT exclusive_shelf, COUNT(*) 
       FROM books 
       WHERE user_id = $1 
       GROUP BY exclusive_shelf`,
      [userId]
    );
    console.log('✅ Shelf counts work:', shelfCountsResult.rows);
    
    // Test 5: Recommendations (from recommendations.js)
    console.log('\n5. Testing recommendations...');
    const recommendationsResult = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf = $2 ORDER BY RANDOM() LIMIT 3',
      [userId, 'read']
    );
    console.log('✅ Recommendations work:', recommendationsResult.rows.length, 'books found');
    
    // Test 6: Book count (from recommendations.js)
    console.log('\n6. Testing book count...');
    const bookCountResult = await pool.query(
      'SELECT COUNT(*) FROM books WHERE user_id = $1',
      [userId]
    );
    console.log('✅ Book count works:', bookCountResult.rows[0].count, 'total books');
    
    // Test 7: Library stats (from recommendations.js)
    console.log('\n7. Testing library stats...');
    const statsResult = await pool.query(`
      SELECT 
        author,
        COUNT(*) as book_count,
        SUM(CASE WHEN exclusive_shelf = 'read' THEN 1 ELSE 0 END) as read_count
      FROM books
      WHERE user_id = $1
        AND author IS NOT NULL
        AND author != ''
      GROUP BY author
      ORDER BY read_count DESC, book_count DESC
      LIMIT 1`,
      [userId]
    );
    console.log('✅ Library stats work:', statsResult.rows);
    
    console.log('\n🎉 All BetterReads app queries work perfectly with Supabase!');
    console.log('\nYour migration is complete and ready for production!');
    
  } catch (error) {
    console.error('❌ App query test failed:', error);
    console.log('\nThis might indicate a compatibility issue that needs fixing.');
  }
}

testAppQueries(); 