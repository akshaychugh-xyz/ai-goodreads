const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { importGoodreadsData } = require('../importGoodreadsData');
const axios = require('axios');
const { verifyToken } = require('../auth');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
}

// New route to fetch shelf counts
router.get('/shelf-counts', authenticateToken, (req, res) => {
    db.all("SELECT exclusive_shelf, COUNT(DISTINCT title) as count FROM books WHERE user_id = ? GROUP BY exclusive_shelf", [req.user.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const counts = {};
        rows.forEach(row => {
            counts[row.exclusive_shelf] = row.count;
        });
        res.json(counts);
    });
});

// Modify the existing recommendations route to include number of pages
router.get('/recommendations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch 'to-read' books for the current user
        const toReadBooks = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM books WHERE user_id = ? AND exclusive_shelf = 'to-read' ORDER BY RANDOM() LIMIT 2", [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log(`Number of 'to-read' books found: ${toReadBooks.length}`);

        console.log(`User ID: ${userId}`);
        console.log(`Total books in database: ${await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM books WHERE user_id = ?", [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        })}`);

        // Fetch a 'lucky' book for the current user
        const luckyBook = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM books WHERE user_id = ? AND exclusive_shelf != 'to-read' ORDER BY RANDOM() LIMIT 1", [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Combine the recommendations
        const recommendations = [...toReadBooks, luckyBook].filter(Boolean);

        res.json(recommendations);
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// New route to fetch and display imported data
router.get('/imported-books', authenticateToken, (req, res) => {
    db.all("SELECT * FROM books WHERE user_id = ?", [req.user.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ books: rows });
    });
});

// New route to handle file uploads
router.post('/import-books', authenticateToken, upload.single('file'), async (req, res) => {
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