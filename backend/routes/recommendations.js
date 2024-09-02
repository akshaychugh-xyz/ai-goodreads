const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { importGoodreadsData } = require('../importGoodreadsData');

// New route to fetch shelf counts
router.get('/shelf-counts', (req, res) => {
    db.all("SELECT exclusive_shelf, COUNT(*) as count FROM books GROUP BY exclusive_shelf", [], (err, rows) => {
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
router.get('/recommendations', (req, res) => {
    db.all("SELECT * FROM books WHERE exclusive_shelf = 'to-read' ORDER BY RANDOM() LIMIT 2", [], (err, toReadBooks) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        db.get("SELECT * FROM books WHERE exclusive_shelf != 'to-read' ORDER BY RANDOM() LIMIT 1", [], (err, luckyBook) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const recommendations = [...toReadBooks, luckyBook];
            res.json(recommendations);
        });
    });
});

// New route to fetch and display imported data
router.get('/imported-books', (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ books: rows });
    });
});

// New route to handle file uploads
router.post('/import-books', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        await importGoodreadsData(req.file.path);
        res.json({ message: 'Books imported successfully' });
    } catch (error) {
        console.error('Error importing books:', error);
        res.status(500).json({ error: 'Error importing books' });
    }
});

module.exports = router;