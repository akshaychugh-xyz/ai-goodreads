const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { importGoodreadsData } = require('../importGoodreadsData');
const axios = require('axios');
const { verifyToken} = require('../auth');
const { generateUserSummary } = require('../services/geminiService');

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

module.exports = router;
