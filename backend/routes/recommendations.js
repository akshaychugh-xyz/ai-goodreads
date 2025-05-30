const express = require('express');
const router = express.Router();
const { pool } = require('../db/database-switcher');
const multer = require('multer');
const { importGoodreadsData } = require('../importGoodreadsData');
const axios = require('axios');
const { verifyToken} = require('../auth');
const { generateUserSummary } = require('../services/geminiService');
const fs = require('fs');

// Use /tmp directory in production (Vercel), uploads in development
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'uploads/';

// Ensure upload directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.error('Error creating upload directory:', error);
}

const upload = multer({ dest: uploadDir });

// Add simple test endpoint at the top
router.get('/test', (req, res) => {
    try {
        console.log('Simple test endpoint called');
        res.json({ 
            message: 'Test endpoint working',
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                USE_SUPABASE: process.env.USE_SUPABASE
            }
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: 'Test failed', details: error.message });
    }
});

// Add this function at the top of your file
function generatePersonalityTags(shelfCounts, readingStats, topAuthor, topRatedBooks) {
  const tags = [];
  
  // Convert shelf counts array to object
  const shelves = shelfCounts.reduce((acc, shelf) => {
    acc[shelf.exclusive_shelf] = parseInt(shelf.count);
    return acc;
  }, {});

  // Volume-based Tags
  if (shelves['to-read'] > 1000) {
    tags.push({ label: "Infinite TBR 📚", description: "1000+ books in your to-read list!" });
  } else if (shelves['to-read'] > 500) {
    tags.push({ label: "Book Collector 📚", description: "500+ books waiting to be read" });
  } else if (shelves['to-read'] > 100) {
    tags.push({ label: "Aspiring Bookworm 🐛", description: "100+ books in your reading queue" });
  }

  // Reading Achievement Tags
  if (shelves['read'] > 50) {
    tags.push({ label: "Seasoned Reader 📖", description: "50+ books conquered!" });
  } else if (shelves['read'] > 25) {
    tags.push({ label: "Book Enthusiast 📚", description: "25+ books read" });
  } else if (shelves['read'] > 10) {
    tags.push({ label: "Reading Explorer 🗺️", description: "10+ books completed" });
  }

  // Currently Reading Behavior
  if (shelves['currently-reading'] > 3) {
    tags.push({ label: "Multitasker 🎭", description: "Reading multiple books at once" });
  }

  // Reading Ratio Tags
  const readRatio = shelves['read'] / (shelves['to-read'] || 1);
  if (readRatio < 0.1) {
    tags.push({ label: "Ambitious Collector 🎯", description: "Your to-read list is 10x your read list" });
  } else if (readRatio > 0.5) {
    tags.push({ label: "Focused Reader ⭐", description: "You read more than you collect" });
  }

  // Rating Behavior
  if (topRatedBooks.length > 0) {
    const fiveStarBooks = topRatedBooks.filter(book => book.my_rating === 5).length;
    if (fiveStarBooks === 3) {
      tags.push({ label: "Enthusiastic Reviewer ⭐", description: "Multiple 5-star ratings given" });
    }
  }

  // Author Loyalty
  if (topAuthor?.book_count >= 3) {
    tags.push({ label: "Author Loyal 👑", description: `${topAuthor.author} fan with ${topAuthor.book_count} books` });
  }

  // Book Length Preferences
  if (readingStats?.avg_length > 400) {
    tags.push({ label: "Epic Explorer 📚", description: "You love lengthy reads" });
  } else if (readingStats?.avg_length < 250) {
    tags.push({ label: "Short & Sweet 🍬", description: "You prefer concise reads" });
  } else if (readingStats?.avg_length) {
    tags.push({ label: "Balanced Reader ⚖️", description: "You enjoy medium-length books" });
  }

  // Reading Pace
  if (readingStats?.books_read >= 5) {
    tags.push({ label: "Speed Reader ⚡", description: "5+ books in your most productive month" });
  } else if (readingStats?.books_read >= 3) {
    tags.push({ label: "Steady Reader 🌟", description: "3+ books in your best month" });
  }

  // Longest Book Achievement
  if (readingStats?.longest_book > 500) {
    tags.push({ label: "Marathon Reader 🏃", description: "Conquered a 500+ page book!" });
  }

  // Currently Reading Status
  if (shelves['currently-reading'] > 0) {
    tags.push({ label: "Active Reader 📖", description: "Currently immersed in books" });
  }

  return tags;
}

// Helper function to get the correct user ID
const getUserId = (req) => {
    const isDemoMode = req.query.isDemoMode === 'true';
    return isDemoMode ? 1 : req.user.id;
};

// New route to fetch shelf counts
router.get('/shelf-counts', verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('Fetching shelf counts for user:', userId);
    
    const result = await pool.query(
      `SELECT exclusive_shelf, COUNT(*) 
       FROM books 
       WHERE user_id = $1 
       GROUP BY exclusive_shelf`,
      [userId]
    );
    
    console.log('Query result:', result.rows);
    
    const shelfCounts = result.rows.reduce((acc, row) => {
      acc[row.exclusive_shelf] = parseInt(row.count);
      return acc;
    }, {});
    
    if (Object.keys(shelfCounts).length === 0) {
      shelfCounts['read'] = 0;
      shelfCounts['currently-reading'] = 0;
      shelfCounts['to-read'] = 0;
    }
    
    console.log('Sending shelf counts:', shelfCounts);
    res.json(shelfCounts);
  } catch (error) {
    console.error('Error fetching shelf counts:', error);
    res.status(500).json({ error: 'Failed to fetch shelf counts' });
  }
});

// Modify the existing recommendations route to include number of pages
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('Fetching recommendations for user:', userId);
    
    const toReadBooksResult = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf = $2 ORDER BY RANDOM() LIMIT 3',
      [userId, 'to-read']
    );
    
    const toReadBooks = toReadBooksResult.rows;
    console.log('Number of to-read books:', toReadBooks.length);

    const readBookResult = await pool.query(
      "SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf = 'read' ORDER BY RANDOM() LIMIT 1",
      [userId]
    );
    const readBook = readBookResult.rows[0];
    console.log('Read book:', readBook);

    const recommendations = [...toReadBooks, readBook].filter(Boolean);

    if (recommendations.length === 0) {
      return res.json([]);
    }

    console.log('Final recommendations:', recommendations);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// New route to fetch and display imported data
router.get('/imported-books', verifyToken, (req, res) => {
    pool.query("SELECT * FROM books WHERE user_id = $1", [req.user.id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ books: result.rows });
    });
});

// New route to handle file uploads
router.post('/import-books', verifyToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log(`User ID: ${req.user.id}`);
        console.log(`File path: ${req.file.path}`);
        await importGoodreadsData(req.file.path, req.user.id);
        
        // Get shelf counts
        const shelfCounts = await getShelfCounts(req.user.id);
        console.log('Shelf counts:', shelfCounts);

        res.json({ message: 'Books imported successfully', shelfCounts });
    } catch (error) {
        console.error('Error importing books:', error);
        res.status(500).json({ error: 'Error importing books' });
    }
});

async function fetchOpenLibraryData(isbn) {
    try {
        console.log('Fetching data for ISBN:', isbn);
        const response = await axios.get(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`);
        console.log('OpenLibrary response:', response.data);
        const bookData = response.data[`ISBN:${isbn}`];
        return {
            cover_url: bookData?.cover?.medium || null,
            subjects: bookData?.subjects?.slice(0, 5) || []
        };
    } catch (error) {
        console.error('Error fetching Open Library data:', error);
        return { cover_url: null, subjects: [] };
    }
}

router.get('/book-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT COUNT(*) FROM books WHERE user_id = $1',
      [userId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching book count:', error);
    res.status(500).json({ error: 'Failed to fetch book count' });
  }
});

router.get('/user-summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user's reading data
    const userData = await getUserReadingData(userId);
    
    // Generate summary using Gemini API
    const summary = await generateUserSummary(userData);
    
    res.json({ summary });
  } catch (error) {
    console.error('Error generating user summary:', error);
    res.status(500).json({ error: 'Error generating user summary' });
  }
});

async function getUserReadingData(userId) {
  try {
    console.log('Connected to database');
    
    // Fetch total books read
    console.log('Fetching total books read');
    const totalBooksResult = await pool.query(
      'SELECT COUNT(*) FROM books WHERE user_id = $1 AND exclusive_shelf = $2',
      [userId, 'read']
    );
    const totalBooks = parseInt(totalBooksResult.rows[0].count);
    console.log('Total books result:', totalBooks);

    // Fetch top 3 authors
    console.log('Fetching top authors');
    const topAuthorsResult = await pool.query(
      'SELECT author, COUNT(*) FROM books WHERE user_id = $1 AND author IS NOT NULL AND author != \'\' GROUP BY author ORDER BY COUNT(*) DESC LIMIT 3',
      [userId]
    );
    const topAuthors = topAuthorsResult.rows.map(row => row.author);
    console.log('Top authors:', topAuthors);

    // Fetch longest book read
    console.log('Fetching longest book');
    const longestBookResult = await pool.query(
      'SELECT title, number_of_pages FROM books WHERE user_id = $1 AND exclusive_shelf = $2 ORDER BY number_of_pages DESC NULLS LAST LIMIT 1',
      [userId, 'read']
    );
    const longestBook = longestBookResult.rows[0] || { title: 'N/A', number_of_pages: 0 };
    console.log('Longest book:', longestBook);

    // Fetch most read author
    console.log('Fetching most read author');
    const mostReadAuthor = await getMostReadAuthor(userId);
    console.log('Most read author:', mostReadAuthor);

    return {
      totalBooks,
      topAuthors,
      longestBook,
      mostReadAuthor
    };
  } catch (error) {
    console.error('Error in getUserReadingData:', error);
    throw error;
  }
}

const getMostReadAuthor = async (userId) => {
  const result = await pool.query(`
    SELECT 
      author,
      COUNT(*) as read_count
    FROM books 
    WHERE user_id = $1
      AND exclusive_shelf = 'read'
      AND author IS NOT NULL 
      AND author != ''
    GROUP BY author
    ORDER BY read_count DESC
    LIMIT 1
  `, [userId]);
  
  return {
    name: result.rows[0]?.author || 'None',
    count: parseInt(result.rows[0]?.read_count) || 0
  };
};

// Add this new endpoint alongside existing routes
router.get('/library-stats', verifyToken, async (req, res) => {
    try {
        const userId = getUserId(req);
        console.log('Fetching library stats for user:', userId, 'Demo mode:', req.query.isDemoMode);
        console.log('Environment check:', {
            USE_SUPABASE: process.env.USE_SUPABASE,
            SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
        });

        // Get shelf distribution
        console.log('Starting shelf distribution query...');
        const shelfResult = await pool.query(`
            SELECT exclusive_shelf, COUNT(*) 
            FROM books 
            WHERE user_id = $1 
            GROUP BY exclusive_shelf`,
            [userId]
        );
        console.log('Shelf result:', shelfResult.rows);

        // Get top rated books
        console.log('Starting top rated books query...');
        const topBooksResult = await pool.query(`
            SELECT title, author, my_rating 
            FROM books 
            WHERE user_id = $1 
                AND my_rating IS NOT NULL 
            ORDER BY my_rating DESC 
            LIMIT 3`,
            [userId]
        );
        console.log('Top books result:', topBooksResult.rows);

        // Get top author
        console.log('Starting top author query...');
        const topAuthorResult = await pool.query(`
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
        console.log('Top author result:', topAuthorResult.rows);

        // Get reading stats
        console.log('Starting reading stats query...');
        const readingStatsResult = await pool.query(`
            SELECT 
                ROUND(AVG(number_of_pages)) as avg_length,
                MAX(number_of_pages) as longest_book,
                COUNT(*) as books_read
            FROM books
            WHERE user_id = $1 AND exclusive_shelf = 'read'`,
            [userId]
        );
        console.log('Reading stats result:', readingStatsResult.rows);

        const stats = {
            shelfDistribution: shelfResult.rows,
            topRatedBooks: topBooksResult.rows,
            topAuthor: topAuthorResult.rows[0] || null,
            readingStats: readingStatsResult.rows[0] || {
                avg_length: 0,
                longest_book: 0,
                books_read: 0
            }
        };

        // Generate personality tags
        const personalityTags = generatePersonalityTags(
            shelfResult.rows,
            stats.readingStats,
            stats.topAuthor,
            stats.topRatedBooks
        );

        // Include personality tags in the response
        stats.personalityTags = personalityTags;

        console.log('Sending library stats:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching library stats:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch library stats',
            details: error.message,
            stack: error.stack
        });
    }
});

router.post('/generate-summary', verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    console.log('Generate summary called for user:', userId);
    
    // Use the existing comprehensive function to get user data
    console.log('About to call getUserReadingData...');
    const userData = await getUserReadingData(userId);
    console.log('getUserReadingData completed successfully:', userData);
    
    let summary;
    try {
      // Try to generate summary using OpenAI API
      console.log('Attempting OpenAI API summary generation...');
      summary = await generateUserSummary(userData);
      console.log('Generated summary with OpenAI API');
    } catch (openaiError) {
      console.log('OpenAI API failed, using fallback summary generator:', openaiError.message);
      // Fallback to static summary generation
      console.log('Generating fallback summary...');
      summary = generateFallbackSummary(userData);
      console.log('Generated fallback summary successfully');
    }
    
    console.log('Sending summary response...');
    res.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Fallback summary generator when OpenAI API is unavailable
function generateFallbackSummary(userData) {
  const { totalBooks, topAuthors, longestBook, mostReadAuthor } = userData;
  
  let summary = "📚 **Your Reading Journey**\n\n";
  
  // Reading volume
  if (totalBooks === 0) {
    summary += "You're just getting started on your reading adventure! Every great reader begins with their first book.\n\n";
  } else if (totalBooks < 5) {
    summary += `You've read ${totalBooks} book${totalBooks > 1 ? 's' : ''} - a solid start to your reading journey! `;
  } else if (totalBooks < 15) {
    summary += `With ${totalBooks} books under your belt, you're developing a nice reading habit! `;
  } else if (totalBooks < 30) {
    summary += `${totalBooks} books read - you're becoming quite the bookworm! `;
  } else if (totalBooks < 50) {
    summary += `Impressive! ${totalBooks} books shows serious dedication to reading. `;
  } else {
    summary += `Wow! ${totalBooks} books read - you're a true bibliophile! `;
  }
  
  // Author preferences
  if (mostReadAuthor.name !== 'None' && mostReadAuthor.count > 1) {
    summary += `You seem to have found a favorite in ${mostReadAuthor.name}, having read ${mostReadAuthor.count} of their works. `;
  }
  
  if (topAuthors.length > 0 && topAuthors[0]) {
    const uniqueAuthors = [...new Set(topAuthors.filter(author => author))];
    if (uniqueAuthors.length > 1) {
      summary += `Your reading spans diverse voices including ${uniqueAuthors.slice(0, 3).join(', ')}. `;
    }
  }
  
  // Book length preferences
  if (longestBook.title !== 'N/A' && longestBook.number_of_pages > 0) {
    if (longestBook.number_of_pages > 600) {
      summary += `You're not afraid of epic reads - tackling "${longestBook.title}" at ${longestBook.number_of_pages} pages shows real commitment! `;
    } else if (longestBook.number_of_pages > 400) {
      summary += `"${longestBook.title}" (${longestBook.number_of_pages} pages) shows you enjoy substantial stories. `;
    }
  }
  
  // Motivational ending
  summary += "\n\n";
  if (totalBooks < 10) {
    summary += "🌟 Keep exploring new worlds through books - your reading adventure is just beginning!";
  } else if (totalBooks < 25) {
    summary += "🌟 You're building an impressive reading foundation. Consider exploring new genres to broaden your literary horizons!";
  } else {
    summary += "🌟 Your reading journey reflects a true love of literature. You're an inspiration to fellow book lovers!";
  }
  
  return summary;
}

// Add debug endpoint
router.get('/debug', async (req, res) => {
    try {
        console.log('Debug endpoint called');
        
        const envCheck = {
            NODE_ENV: process.env.NODE_ENV,
            USE_SUPABASE: process.env.USE_SUPABASE,
            SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
        };
        
        console.log('Environment variables:', envCheck);
        
        // Try to import the database module
        let dbStatus = 'NOT_TESTED';
        let dbError = null;
        
        try {
            console.log('Attempting to import database module...');
            const { pool } = require('../db/database-switcher');
            dbStatus = 'IMPORTED';
            
            console.log('Attempting database connection...');
            const testResult = await pool.query('SELECT NOW()');
            console.log('Database test result:', testResult.rows);
            dbStatus = 'CONNECTED';
            
            // Test demo user exists
            console.log('Checking demo user...');
            const demoUserResult = await pool.query('SELECT COUNT(*) FROM books WHERE user_id = $1', [1]);
            console.log('Demo user books count:', demoUserResult.rows);
            dbStatus = 'QUERY_SUCCESS';
            
            res.json({
                environment: envCheck,
                databaseStatus: dbStatus,
                databaseConnection: 'OK',
                databaseTime: testResult.rows[0],
                demoUserBooksCount: demoUserResult.rows[0]
            });
        } catch (dbErr) {
            console.error('Database error:', dbErr);
            dbError = dbErr.message;
            dbStatus = 'ERROR';
            
            res.json({
                environment: envCheck,
                databaseStatus: dbStatus,
                databaseError: dbError,
                databaseStack: dbErr.stack
            });
        }
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            error: 'Debug failed',
            details: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
