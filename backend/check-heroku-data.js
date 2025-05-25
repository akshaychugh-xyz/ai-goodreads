require('dotenv').config();

// Script to check what data exists in your current Heroku Postgres database
async function checkHerokuData() {
  console.log('Checking your current Heroku Postgres data...');
  
  // Force use of PostgreSQL (not Supabase) for this check
  process.env.USE_SUPABASE = 'false';
  
  try {
    const { pool } = require('./db/database-switcher');
    
    console.log('\n📊 DATABASE OVERVIEW');
    console.log('='.repeat(50));
    
    // Check users table
    console.log('\n👥 USERS TABLE:');
    try {
      const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users');
      const userCount = parseInt(usersResult.rows[0].total_users);
      console.log(`   Total users: ${userCount}`);
      
      if (userCount > 0 && userCount <= 10) {
        // Show actual users if there aren't too many
        const usersData = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 10');
        console.log('   Recent users:');
        usersData.rows.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id}, Created: ${user.created_at?.toISOString()?.split('T')[0] || 'N/A'})`);
        });
      } else if (userCount > 10) {
        const usersData = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5');
        console.log('   Latest 5 users:');
        usersData.rows.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id}, Created: ${user.created_at?.toISOString()?.split('T')[0] || 'N/A'})`);
        });
      }
    } catch (error) {
      console.log('   ❌ Error checking users:', error.message);
    }
    
    // Check books table
    console.log('\n📚 BOOKS TABLE:');
    try {
      const booksResult = await pool.query('SELECT COUNT(*) as total_books FROM books');
      const bookCount = parseInt(booksResult.rows[0].total_books);
      console.log(`   Total books: ${bookCount}`);
      
      if (bookCount > 0) {
        // Books per user
        const booksPerUser = await pool.query(`
          SELECT user_id, COUNT(*) as book_count 
          FROM books 
          GROUP BY user_id 
          ORDER BY book_count DESC
        `);
        console.log('   Books per user:');
        booksPerUser.rows.forEach(row => {
          console.log(`   - User ${row.user_id}: ${row.book_count} books`);
        });
        
        // Books by shelf
        const booksByShelf = await pool.query(`
          SELECT exclusive_shelf, COUNT(*) as count 
          FROM books 
          GROUP BY exclusive_shelf 
          ORDER BY count DESC
        `);
        console.log('   Books by shelf:');
        booksByShelf.rows.forEach(row => {
          console.log(`   - ${row.exclusive_shelf || 'Unknown'}: ${row.count} books`);
        });
        
        // Sample books
        const sampleBooks = await pool.query(`
          SELECT title, author, exclusive_shelf, user_id 
          FROM books 
          ORDER BY id DESC 
          LIMIT 5
        `);
        console.log('   Sample books (latest 5):');
        sampleBooks.rows.forEach(book => {
          console.log(`   - "${book.title}" by ${book.author} (${book.exclusive_shelf}, User: ${book.user_id})`);
        });
      }
    } catch (error) {
      console.log('   ❌ Error checking books:', error.message);
    }
    
    // Check database size (if possible)
    console.log('\n💾 DATABASE SIZE:');
    try {
      const sizeResult = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);
      console.log('   Table sizes:');
      sizeResult.rows.forEach(row => {
        console.log(`   - ${row.tablename}: ${row.size}`);
      });
    } catch (error) {
      console.log('   ℹ️  Size info not available (limited permissions)');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 MIGRATION RECOMMENDATION:');
    
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users').then(r => parseInt(r.rows[0].count));
    const totalBooks = await pool.query('SELECT COUNT(*) FROM books').then(r => parseInt(r.rows[0].count));
    
    if (totalUsers === 0 && totalBooks === 0) {
      console.log('✅ Your database is EMPTY - no migration needed!');
      console.log('   You can skip Step 6 and go straight to production.');
    } else if (totalUsers <= 5 && totalBooks <= 100) {
      console.log('✅ Small dataset - EASY to migrate');
      console.log('   Recommendation: Manual copy via Supabase dashboard');
      console.log('   Time needed: 5-10 minutes');
    } else if (totalBooks <= 1000) {
      console.log('⚠️  Medium dataset - export recommended');
      console.log('   Recommendation: Use pg_dump and import to Supabase');
      console.log('   Time needed: 15-30 minutes');
    } else {
      console.log('🔄 Large dataset - careful migration needed');
      console.log('   Recommendation: Use Supabase backup restore feature');
      console.log('   Time needed: 30+ minutes');
    }
    
    console.log('\n💡 NEXT STEPS:');
    if (totalUsers > 0 || totalBooks > 0) {
      console.log('1. If you want to keep this data: Follow Step 6 in setup-supabase.md');
      console.log('2. If you want a fresh start: Skip Step 6, your Supabase is ready!');
      console.log('3. You can always come back and migrate later');
    } else {
      console.log('1. Skip Step 6 - no data to migrate');
      console.log('2. Your Supabase setup is complete and ready!');
    }
    
  } catch (error) {
    console.error('❌ Error checking Heroku database:', error);
    console.log('\nPossible issues:');
    console.log('- DATABASE_URL not set in .env');
    console.log('- Heroku Postgres addon not accessible');
    console.log('- Network connectivity issues');
  }
}

checkHerokuData(); 