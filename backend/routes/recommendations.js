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
      "SELECT exclusive_shelf, COUNT(DISTINCT title) as count FROM books WHERE user_id = $1 GROUP BY exclusive_shelf",
      [req.user.id]
    );
    console.log('Query result:', result.rows);
    const counts = {};
    result.rows.forEach(row => {
      counts[row.exclusive_shelf] = parseInt(row.count);
    });
    console.log('Shelf counts:', counts);
    res.json(counts);
  } catch (err) {
    console.error('Error fetching shelf counts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Modify the existing recommendations route to include number of pages
router.get('/recommendations', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching recommendations for user:', userId);
        
        // Fetch 'to-read' books for the current user
        const toReadBooks = await new Promise((resolve, reject) => {
            pool.query("SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf = 'to-read' ORDER BY RANDOM() LIMIT 2", [userId], (err, result) => {
                if (err) {
                    console.error('Error fetching to-read books:', err);
                    reject(err);
                } else {
                    console.log('To-read books query result:', result.rows);
                    resolve(result.rows);
                }
            });
        });

        console.log(`Number of 'to-read' books found: ${toReadBooks.length}`);
        console.log('To-read books:', toReadBooks);

        // Fetch a 'lucky' book for the current user
        const luckyBook = await new Promise((resolve, reject) => {
            pool.query("SELECT * FROM books WHERE user_id = $1 AND exclusive_shelf != 'to-read' ORDER BY RANDOM() LIMIT 1", [userId], (err, result) => {
                if (err) {
                    console.error('Error fetching lucky book:', err);
                    reject(err);
                } else {
                    console.log('Lucky book query result:', result.rows);
                    resolve(result.rows[0]);
                }
            });
        });

        console.log('Lucky book:', luckyBook);

        // Combine the recommendations
        const recommendations = [...toReadBooks, luckyBook].filter(Boolean);

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
        res.json({ message: 'Books imported successfully' });
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
