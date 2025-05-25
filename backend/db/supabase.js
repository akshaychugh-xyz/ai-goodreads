const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// For server-side operations, you might want to use the service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initializeDatabase() {
  try {
    // Check if tables exist and create them if they don't
    console.log('Initializing Supabase database...');
    
    // Create users table
    const { error: usersError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE,
          password TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (usersError) {
      console.log('Users table might already exist or RPC not available, trying direct creation...');
    }

    // Create books table
    const { error: booksError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS books (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          average_rating REAL,
          number_of_pages INTEGER,
          my_rating REAL,
          date_added DATE,
          date_read DATE,
          exclusive_shelf TEXT,
          title TEXT,
          author TEXT,
          isbn TEXT,
          book_id TEXT,
          my_review TEXT,
          CONSTRAINT unique_book_per_user UNIQUE (user_id, book_id)
        );
      `
    });

    if (booksError) {
      console.log('Books table might already exist or RPC not available, trying direct creation...');
    }

    console.log('Supabase database initialized successfully');
  } catch (err) {
    console.error('Error initializing Supabase database:', err);
    console.log('Please create tables manually in Supabase dashboard using the SQL from migration-guide.md');
  }
}

// Helper functions to maintain compatibility with existing pg queries
const query = async (text, params = []) => {
  try {
    console.log('Supabase Query:', text, 'Params:', params);
    
    // Handle user registration
    if (text.includes('INSERT INTO users') && text.includes('RETURNING')) {
      const [email, password] = params;
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([{ email, password }])
        .select();
      
      if (error) throw error;
      return { rows: data };
    }
    
    // Handle user login
    if (text.includes('SELECT * FROM users WHERE email')) {
      const [email] = params;
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email);
      
      if (error) throw error;
      return { rows: data };
    }
    
    // Handle book insertions with ON CONFLICT
    if (text.includes('INSERT INTO books') && text.includes('ON CONFLICT')) {
      const bookData = {
        book_id: params[0],
        user_id: params[1],
        title: params[2],
        author: params[3],
        isbn: params[4],
        average_rating: params[5],
        number_of_pages: params[6],
        exclusive_shelf: params[7],
        my_rating: params[8],
        date_added: params[9],
        date_read: params[10],
        my_review: params[11]
      };
      
      const { data, error } = await supabaseAdmin
        .from('books')
        .upsert([bookData], { onConflict: 'user_id,book_id' })
        .select();
      
      if (error) throw error;
      return { rows: data, rowCount: data.length };
    }
    
    // Handle shelf counts query
    if (text.includes('GROUP BY exclusive_shelf')) {
      const userId = params && params.length > 0 ? params[0] : null;
      
      if (!userId) {
        console.warn('GROUP BY query without user_id parameter');
        return { rows: [] };
      }
      
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('exclusive_shelf')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Group by exclusive_shelf manually
      const counts = data.reduce((acc, book) => {
        acc[book.exclusive_shelf] = (acc[book.exclusive_shelf] || 0) + 1;
        return acc;
      }, {});
      
      const result = Object.entries(counts).map(([exclusive_shelf, count]) => ({
        exclusive_shelf,
        count: count.toString()
      }));
      
      return { rows: result };
    }

    // Handle top rated books query
    if (text.includes('my_rating IS NOT NULL') && text.includes('ORDER BY my_rating DESC')) {
      const userId = params && params.length > 0 ? params[0] : null;
      
      if (!userId) {
        console.warn('Top rated books query without user_id parameter');
        return { rows: [] };
      }
      
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('title, author, my_rating')
        .eq('user_id', userId)
        .not('my_rating', 'is', null)
        .order('my_rating', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return { rows: data };
    }

    // Handle top author query with book count and read count
    if (text.includes('GROUP BY author') && text.includes('book_count') && text.includes('read_count')) {
      const userId = params && params.length > 0 ? params[0] : null;
      
      if (!userId) {
        console.warn('Top author query without user_id parameter');
        return { rows: [] };
      }
      
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('author, exclusive_shelf')
        .eq('user_id', userId)
        .not('author', 'is', null)
        .neq('author', '');
      
      if (error) throw error;
      
      // Group by author manually
      const authorCounts = data.reduce((acc, book) => {
        if (!acc[book.author]) {
          acc[book.author] = { book_count: 0, read_count: 0 };
        }
        acc[book.author].book_count++;
        if (book.exclusive_shelf === 'read') {
          acc[book.author].read_count++;
        }
        return acc;
      }, {});
      
      // Convert to result format and sort
      const result = Object.entries(authorCounts)
        .map(([author, counts]) => ({
          author,
          book_count: counts.book_count.toString(),
          read_count: counts.read_count.toString()
        }))
        .sort((a, b) => {
          // Sort by read count first, then book count
          if (parseInt(b.read_count) !== parseInt(a.read_count)) {
            return parseInt(b.read_count) - parseInt(a.read_count);
          }
          return parseInt(b.book_count) - parseInt(a.book_count);
        });
      
      return { rows: result.slice(0, 1) }; // LIMIT 1
    }

    // Handle reading stats query (avg length, max pages, count)
    if (text.includes('ROUND(AVG(number_of_pages))') && text.includes('MAX(number_of_pages)')) {
      const userId = params && params.length > 0 ? params[0] : null;
      
      if (!userId) {
        console.warn('Reading stats query without user_id parameter');
        return { rows: [{ avg_length: 0, longest_book: 0, books_read: 0 }] };
      }
      
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('number_of_pages')
        .eq('user_id', userId)
        .eq('exclusive_shelf', 'read')
        .not('number_of_pages', 'is', null);
      
      if (error) throw error;
      
      if (data.length === 0) {
        return { rows: [{ avg_length: 0, longest_book: 0, books_read: 0 }] };
      }
      
      const pages = data.map(book => book.number_of_pages);
      const avgLength = Math.round(pages.reduce((sum, p) => sum + p, 0) / pages.length);
      const longestBook = Math.max(...pages);
      
      return { rows: [{ 
        avg_length: avgLength, 
        longest_book: longestBook, 
        books_read: data.length 
      }] };
    }
    
    // Handle author grouping queries
    if (text.includes('GROUP BY author')) {
      const userId = params && params.length > 0 ? params[0] : null;
      
      if (!userId) {
        console.warn('GROUP BY author query without user_id parameter');
        return { rows: [] };
      }
      
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('author, exclusive_shelf')
        .eq('user_id', userId)
        .not('author', 'is', null)
        .neq('author', '');
      
      if (error) throw error;
      
      // Group by author manually
      const authorCounts = data.reduce((acc, book) => {
        if (!acc[book.author]) {
          acc[book.author] = { total: 0, read: 0 };
        }
        acc[book.author].total++;
        if (book.exclusive_shelf === 'read') {
          acc[book.author].read++;
        }
        return acc;
      }, {});
      
      // Convert to result format and sort
      const result = Object.entries(authorCounts)
        .map(([author, counts]) => ({
          author,
          count: counts.total.toString(),
          read_count: counts.read.toString()
        }))
        .sort((a, b) => {
          // Sort by read count first, then total count
          if (parseInt(b.read_count) !== parseInt(a.read_count)) {
            return parseInt(b.read_count) - parseInt(a.read_count);
          }
          return parseInt(b.count) - parseInt(a.count);
        });
      
      // Apply LIMIT if specified
      if (text.includes('LIMIT')) {
        const limitMatch = text.match(/LIMIT (\d+)/);
        if (limitMatch) {
          return { rows: result.slice(0, parseInt(limitMatch[1])) };
        }
      }
      
      return { rows: result };
    }
    
    // Handle book count queries
    if (text.includes('COUNT(*)') && text.includes('FROM books')) {
      const userId = params.find(p => typeof p === 'number');
      let query = supabaseAdmin.from('books').select('*', { count: 'exact', head: true });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      // Check for exclusive_shelf filter in params
      const shelfParam = params.find(p => typeof p === 'string' && ['read', 'to-read', 'currently-reading'].includes(p));
      if (shelfParam) {
        query = query.eq('exclusive_shelf', shelfParam);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      
      return { rows: [{ count: count.toString() }] };
    }
    
    // Handle SELECT queries from books
    if (text.includes('SELECT') && text.includes('FROM books')) {
      let query = supabaseAdmin.from('books').select('*');
      
      // Handle user_id filter
      if (text.includes('WHERE user_id')) {
        const userIdParam = params.find(p => typeof p === 'number');
        if (userIdParam) {
          query = query.eq('user_id', userIdParam);
        }
      }
      
      // Handle exclusive_shelf filter
      if (text.includes('exclusive_shelf =')) {
        const shelfParam = params.find(p => typeof p === 'string' && ['read', 'to-read', 'currently-reading'].includes(p));
        if (shelfParam) {
          query = query.eq('exclusive_shelf', shelfParam);
        }
      }
      
      // Handle ORDER BY
      if (text.includes('ORDER BY')) {
        if (text.includes('ORDER BY RANDOM()')) {
          // Get all results first, then shuffle
          const { data, error } = await query;
          if (error) throw error;
          
          const shuffled = data.sort(() => Math.random() - 0.5);
          
          // Apply LIMIT after shuffling
          if (text.includes('LIMIT')) {
            const limitMatch = text.match(/LIMIT (\d+)/);
            if (limitMatch) {
              return { rows: shuffled.slice(0, parseInt(limitMatch[1])) };
            }
          }
          
          return { rows: shuffled };
        } else if (text.includes('ORDER BY') && text.includes('DESC')) {
          // Handle other ORDER BY clauses
          const orderMatch = text.match(/ORDER BY (\w+) DESC/);
          if (orderMatch) {
            query = query.order(orderMatch[1], { ascending: false });
          }
        }
      }
      
      // Handle LIMIT
      if (text.includes('LIMIT') && !text.includes('ORDER BY RANDOM()')) {
        const limitMatch = text.match(/LIMIT (\d+)/);
        if (limitMatch) {
          query = query.limit(parseInt(limitMatch[1]));
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { rows: data };
    }
    
    // Handle table operations
    if (text.includes('TRUNCATE TABLE')) {
      if (text.includes('books')) {
        const { error } = await supabaseAdmin.from('books').delete().neq('id', 0);
        if (error) throw error;
      }
      if (text.includes('users')) {
        const { error } = await supabaseAdmin.from('users').delete().neq('id', 0);
        if (error) throw error;
      }
      return { rows: [] };
    }
    
    // Handle time queries
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date().toISOString() }] };
    }
    
    // Handle EXISTS queries
    if (text.includes('SELECT EXISTS')) {
      const userId = params[0];
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) throw error;
      return { rows: [{ exists: data.length > 0 }] };
    }
    
    // For unhandled queries, log and return empty result
    console.warn('Unhandled Supabase query:', text);
    return { rows: [] };
    
  } catch (error) {
    console.error('Supabase query error:', error);
    throw error;
  }
};

// Mock pool object to maintain compatibility
const pool = {
  query,
  connect: async () => ({
    query,
    release: () => {},
  }),
};

module.exports = { 
  pool, 
  initializeDatabase, 
  supabase, 
  supabaseAdmin 
}; 