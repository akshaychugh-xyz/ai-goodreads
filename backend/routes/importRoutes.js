const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config');
const { verifyToken } = require('../auth');
const { pool } = require('../db/database');
const { importBooks } = require('../importGoodreadsData');
const { getShelfCounts } = require('../shelfCounts');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/verify-csv', verifyToken, upload.single('file'), (req, res) => {
    console.log('Received verify-csv request');
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ isValid: false, message: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);
    console.log('File details:', req.file);

    const filePath = req.file.path;
    
    let rowCount = 0;
    let toReadCount = 0;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            rowCount++;
            if (row['Exclusive Shelf'] === 'to-read') {
                toReadCount++;
            }
        })
        .on('end', () => {
            console.log(`CSV processing completed. Rows processed: ${rowCount}, To-read books: ${toReadCount}`);
            fs.unlinkSync(filePath); // Delete the temporary file
            res.json({ isValid: true, rowCount, toReadCount });
        })
        .on('error', (error) => {
            console.error('Error processing CSV:', error);
            fs.unlinkSync(filePath); // Delete the temporary file
            res.status(500).json({ isValid: false, message: 'Error processing CSV' });
        });
});

router.post('/import-books', verifyToken, upload.single('file'), async (req, res) => {
    console.log('Received import-books request');
    console.log('Request headers:', req.headers);
    console.log('Request file:', req.file);

    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const userId = req.user.id;

    try {
        console.log('Importing books for user:', userId);
        console.log('File path:', filePath);
        const importResult = await importBooks(filePath, userId);
        console.log('Import successful', importResult);
        
        // Get updated shelf counts
        const shelfCounts = await getShelfCounts(userId);
        console.log('Updated shelf counts:', shelfCounts);
        
        // Delete the temporary file
        fs.unlinkSync(filePath);
        
        res.json({ 
            message: 'Books imported successfully', 
            shelfCounts,
            importDetails: importResult
        });
    } catch (error) {
        console.error('Error importing books:', error);
        // Delete the temporary file in case of error
        fs.unlinkSync(filePath);
        res.status(500).json({ error: 'An error occurred while importing books' });
    }
});

router.get('/test-import-route', (req, res) => {
    res.json({ message: 'Import routes are working' });
});

router.get('/test-db', verifyToken, async (req, res) => {
  console.log('Test DB route hit');
  console.log('User from token:', req.user);
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connection successful', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Error testing database connection:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

router.get('/test-books', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books WHERE user_id = $1 LIMIT 10', [req.user.id]);
    //console.log('Test books result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test books:', error);
    res.status(500).json({ error: 'Failed to fetch test books' });
  }
});

router.get('/user-books', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 LIMIT 20',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user books:', error);
    res.status(500).json({ error: 'Failed to fetch user books' });
  }
});

router.get('/check-db', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM books WHERE user_id = $1', [req.user.id]);
    const bookCount = parseInt(result.rows[0].count);
    console.log(`User ${req.user.id} has ${bookCount} books in the database`);
    res.json({ bookCount });
  } catch (error) {
    console.error('Error checking database:', error);
    res.status(500).json({ error: 'Error checking database' });
  }
});

router.get('/check-schema', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'books'
    `);
    console.log('Books table schema:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error checking schema:', error);
    res.status(500).json({ error: 'Error checking schema' });
  }
});

router.get('/check-connection', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection check result:', result.rows[0]);
    res.json({ message: 'Database connection successful', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Error checking database connection:', error);
    res.status(500).json({ error: 'Error checking database connection' });
  }
});

// Add any other routes here
// For example:
// router.post('/some-route', verifyToken, upload.single('file'), (req, res) => {
//     // Implementation for some route
// });

module.exports = router;
