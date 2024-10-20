const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { importGoodreadsData } = require('../importGoodreadsData');
const axios = require('axios');
const { verifyToken} = require('../auth');

// New route to fetch shelf counts
router.get('/shelf-counts', verifyToken, async (req, res) => {
  try {
    console.log('Fetching shelf counts for user:', req.user.id);
    
    const result = await pool.query(
      `SELECT exclusive_shelf, COUNT(*) 
       FROM books 
       WHERE user_id = $1 
       GROUP BY exclusive_shelf`,
      [req.user.id]
    );
    
    console.log('Query result:', result.rows);
    
    const shelfCounts = result.rows.reduce((acc, row) => {
      acc[row.exclusive_shelf] = parseInt(row.count);
      return acc;
    }, {});
    
    // Add default values if no books are found
    if (Object.keys(shelfCounts).length === 0) {
      shelfCounts['read'] = 0;
      shelfCounts['currently-reading'] = 0;
      shelfCounts['to-read'] = 0;
    }
    
    console.log('Shelf counts:', shelfCounts);
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
      'SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf = $2',
      [req.user.id, 'to-read']
    );
    
    //console.log('To-read books query result:', toReadBooksResult.rows);
    
    const toReadBooks = toReadBooksResult.rows;
    console.log('Number of to-read books:', toReadBooks.length);

    const luckyBookResult = await pool.query(
      "SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf != 'to-read' ORDER BY RANDOM() LIMIT 1",
      [req.user.id]
    );
    const luckyBook = luckyBookResult.rows[0];
    //console.log('Lucky book:', luckyBook);

    const recommendations = [...toReadBooks, luckyBook].filter(Boolean);

    //console.log('Final recommendations:', recommendations);
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

module.exports = router;
