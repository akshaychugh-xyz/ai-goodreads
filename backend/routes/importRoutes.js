const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config');
const { verifyToken } = require('../auth');

const router = express.Router();

const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const userUploadDir = path.join(DATA_DIR, req.user.id.toString());
      fs.mkdirSync(userUploadDir, { recursive: true });
      cb(null, userUploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, 'temp_goodreads_library_export.csv');
    }
  })
});

const EXPECTED_HEADERS = [
    "Book Id", "Title", "Author", "Author l-f", "Additional Authors",
    "ISBN", "ISBN13", "My Rating", "Average Rating", "Publisher",
    "Binding", "Number of Pages", "Year Published", "Original Publication Year",
    "Date Read", "Date Added", "Bookshelves", "Bookshelves with positions",
    "Exclusive Shelf", "My Review", "Spoiler", "Private Notes",
    "Read Count", "Owned Copies"
];

router.post('/verify-csv', verifyToken, upload.single('file'), (req, res) => {
    console.log('Received verify-csv request');
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ isValid: false, message: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);
    console.log('File details:', req.file);
    console.log('File path:', req.file.path);

    let rowCount = 0;
    let toReadCount = 0;

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
            rowCount++;
            if (row['Exclusive Shelf'] === 'to-read') {
                toReadCount++;
            }
        })
        .on('end', () => {
            console.log(`CSV processing completed. Rows processed: ${rowCount}, To-read books: ${toReadCount}`);
            res.json({ isValid: true, rowCount, toReadCount });
        })
        .on('error', (error) => {
            console.error('Error processing CSV:', error);
            res.status(500).json({ isValid: false, message: 'Error processing CSV' });
        });
});

router.post('/replace-data', verifyToken, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const tempFilePath = req.file.path;
    const newFilePath = path.join(DATA_DIR, req.user.id.toString(), 'goodreads_library_export.csv');

    try {
        // Move the temp file to the final destination
        fs.renameSync(tempFilePath, newFilePath);
        res.json({ message: 'Data folder updated successfully' });
    } catch (error) {
        console.error('Error replacing data folder:', error);
        res.status(500).json({ 
            message: 'Failed to replace data folder', 
            error: error.message,
            stack: error.stack
        });
    }
});

router.get('/test-import-route', (req, res) => {
    res.json({ message: 'Import routes are working' });
});

router.post('/import-books', verifyToken, upload.single('file'), async (req, res) => {
    console.log('Received import-books request');
    if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    try {
        console.log('Starting importGoodreadsData');
        const result = await importGoodreadsData(filePath, req.user.id);
        console.log('importGoodreadsData completed successfully', result);
        res.json({ message: 'Books imported successfully', ...result });
    } catch (error) {
        console.error('Error importing books:', error);
        res.status(500).json({ error: 'Error importing books' });
    }
});

// Add any other routes here
// For example:
// router.post('/some-route', verifyToken, upload.single('file'), (req, res) => {
//     // Implementation for some route
// });

module.exports = router;
