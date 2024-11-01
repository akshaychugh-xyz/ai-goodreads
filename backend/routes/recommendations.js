const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { importGoodreadsData } = require('../importGoodreadsData');
const axios = require('axios');
const { verifyToken} = require('../auth');
const { generateUserSummary } = require('../services/geminiService');

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

// New route to fetch shelf counts
router.get('/shelf-counts', verifyToken, async (req, res) => {
  try {
    console.log('Fetching shelf counts for user:', req.user.id);
    const userId = req.user.id;
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
      // If no books found, return default values
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
    console.log('Fetching recommendations for user:', req.user.id);
    
    const toReadBooksResult = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf = $2 ORDER BY RANDOM() LIMIT 3',
      [req.user.id, 'to-read']
    );
    
    const toReadBooks = toReadBooksResult.rows;
    console.log('Number of to-read books:', toReadBooks.length);

    const readBookResult = await pool.query(
      "SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf = 'read' ORDER BY RANDOM() LIMIT 1",
      [req.user.id]
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
  const client = await pool.connect();
  try {
    console.log('Connected to database');
    
    // Fetch total books read
    console.log('Fetching total books read');
    const totalBooksResult = await client.query(
      'SELECT COUNT(*) FROM books WHERE user_id = $1 AND exclusive_shelf = $2',
      [userId, 'read']
    );
    const totalBooks = parseInt(totalBooksResult.rows[0].count);
    console.log('Total books result:', totalBooks);

    // Fetch top 3 authors
    console.log('Fetching top authors');
    const topAuthorsResult = await client.query(
      'SELECT author, COUNT(*) FROM books WHERE user_id = $1 GROUP BY author ORDER BY COUNT(*) DESC LIMIT 3',
      [userId]
    );
    const topAuthors = topAuthorsResult.rows.map(row => row.author);
    console.log('Top authors:', topAuthors);

    // Fetch longest book read
    console.log('Fetching longest book');
    const longestBookResult = await client.query(
      'SELECT title, number_of_pages FROM books WHERE user_id = $1 AND exclusive_shelf = $2 ORDER BY number_of_pages DESC NULLS LAST LIMIT 1',
      [userId, 'read']
    );
    const longestBook = longestBookResult.rows[0] || { title: 'N/A', number_of_pages: 0 };
    console.log('Longest book:', longestBook);

    // Fetch most read author
    console.log('Fetching most read author');
    const mostReadAuthorResult = await client.query(
      'SELECT author, COUNT(*) FROM books WHERE user_id = $1 GROUP BY author ORDER BY COUNT(*) DESC LIMIT 1',
      [userId]
    );
    const mostReadAuthor = mostReadAuthorResult.rows[0]?.author || 'N/A';
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
  } finally {
    client.release();
  }
}

// Add this new endpoint alongside existing routes
router.get('/library-stats', verifyToken, async (req, res) => {
  console.log('Library stats endpoint hit');
  console.log('User ID:', req.user.id);
  
  const userId = req.user.id;
  
  try {
    // 1. Get shelf distribution
    const shelfCounts = await pool.query(`
      SELECT exclusive_shelf, COUNT(*) as count
      FROM books 
      WHERE user_id = $1 AND exclusive_shelf IS NOT NULL
      GROUP BY exclusive_shelf
    `, [userId]);

    // 2. Get most read author
    const topAuthor = await pool.query(`
      SELECT author, COUNT(*) as book_count
      FROM books
      WHERE user_id = $1 
        AND author IS NOT NULL
        AND exclusive_shelf = 'read'
      GROUP BY author
      ORDER BY book_count DESC
      LIMIT 1
    `, [userId]);

    // 3. Get top rated books
    const topRatedBooks = await pool.query(`
      SELECT title, author, my_rating, number_of_pages
      FROM books
      WHERE user_id = $1 
        AND my_rating IS NOT NULL 
        AND title IS NOT NULL
      ORDER BY my_rating DESC, date_read DESC
      LIMIT 3
    `, [userId]);

    // 4. Get reading statistics
    const readingStats = await pool.query(`
      SELECT 
        ROUND(AVG(number_of_pages)) as avg_length,
        MAX(number_of_pages) as longest_book,
        TO_CHAR(date_read, 'YYYY-MM') as month,
        COUNT(*) as books_read
      FROM books
      WHERE user_id = $1 
        AND date_read IS NOT NULL 
        AND number_of_pages IS NOT NULL
        AND exclusive_shelf = 'read'
      GROUP BY TO_CHAR(date_read, 'YYYY-MM')
      ORDER BY books_read DESC
      LIMIT 1
    `, [userId]);

    // Add personality tags to the response
    const personalityTags = generatePersonalityTags(
      shelfCounts.rows, 
      readingStats.rows[0],
      topAuthor.rows[0],
      topRatedBooks.rows
    );

    res.json({
      shelfDistribution: shelfCounts.rows,
      topAuthor: topAuthor.rows[0],
      topRatedBooks: topRatedBooks.rows,
      readingStats: readingStats.rows[0],
      personalityTags
    });

  } catch (error) {
    console.error('Error fetching library stats:', error);
    res.status(500).json({ error: 'Failed to fetch library stats' });
  }
});

router.post('/generate-summary', verifyToken, async (req, res) => {
  console.log('Generate summary endpoint hit');
  try {
    const userId = req.user.id;
    console.log('User ID:', userId);

    // Get user's reading data
    const readingData = await pool.query(`
      SELECT 
        title,
        author,
        number_of_pages,
        exclusive_shelf
      FROM books 
      WHERE user_id = $1
    `, [userId]);

    // Get most read author
    const authorQuery = await pool.query(`
      SELECT author, COUNT(*) as book_count
      FROM books
      WHERE user_id = $1 AND author IS NOT NULL
      GROUP BY author
      ORDER BY book_count DESC
      LIMIT 3
    `, [userId]);

    // Prepare data for Gemini
    const userData = {
      totalBooks: readingData.rows.length,
      topAuthors: authorQuery.rows.map(a => a.author),
      mostReadAuthor: authorQuery.rows[0]?.author || 'None',
      longestBook: readingData.rows.reduce((max, book) => 
        (!max || book.number_of_pages > max.number_of_pages) ? book : max
      , null) || { title: 'None', number_of_pages: 0 }
    };

    const summary = await generateUserSummary(userData);
    console.log('Generated summary:', summary);
    
    res.json({ summary });

  } catch (error) {
    console.error('Backend error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary, please try again' });
  }
});

module.exports = router;
