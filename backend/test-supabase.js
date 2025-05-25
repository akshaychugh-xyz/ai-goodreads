require('dotenv').config();

// Test script to verify Supabase connection
async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  // Set to use Supabase for this test
  process.env.USE_SUPABASE = 'true';
  
  try {
    const { pool, initializeDatabase } = require('./db/database-switcher');
    
    console.log('1. Testing database initialization...');
    await initializeDatabase();
    
    console.log('2. Testing simple query...');
    const timeResult = await pool.query('SELECT NOW()');
    console.log('Time query result:', timeResult.rows[0]);
    
    console.log('3. Testing user operations...');
    // Test user insertion (this might fail if user exists, that's ok)
    try {
      const userResult = await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
        ['test@example.com', 'hashedpassword']
      );
      console.log('User created:', userResult.rows[0]);
    } catch (error) {
      console.log('User creation failed (might already exist):', error.message);
    }
    
    console.log('4. Testing user lookup...');
    const lookupResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['test@example.com']
    );
    console.log('User lookup result:', lookupResult.rows);
    
    console.log('✅ Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    console.log('\nMake sure you have:');
    console.log('1. Created a Supabase project');
    console.log('2. Added SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env');
    console.log('3. Created the tables manually in Supabase dashboard');
  }
}

testSupabase(); 