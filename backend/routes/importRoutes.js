const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const EXPECTED_HEADERS = [
    "Book Id", "Title", "Author", "Author l-f", "Additional Authors",
    "ISBN", "ISBN13", "My Rating", "Average Rating", "Publisher",
    "Binding", "Number of Pages", "Year Published", "Original Publication Year",
    "Date Read", "Date Added", "Bookshelves", "Bookshelves with positions",
    "Exclusive Shelf", "My Review", "Spoiler", "Private Notes",
    "Read Count", "Owned Copies"
];

router.post('/verify-csv', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ isValid: false, message: 'No file uploaded' });
    }

    const results = [];
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('headers', (headers) => {
            console.log('Received headers:', headers);
            const requiredHeaders = new Set(EXPECTED_HEADERS);
            const uploadedHeaders = new Set(headers.map(h => h.trim()));
            const missingHeaders = [...requiredHeaders].filter(header => !uploadedHeaders.has(header));
            
            if (missingHeaders.length === 0) {
                res.json({ isValid: true });
            } else {
                res.status(400).json({ 
                    isValid: false, 
                    message: `Missing required headers: ${missingHeaders.join(', ')}`
                });
            }
        })
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // This is just to consume the stream
        });
});

router.post('/replace-data', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Clear existing files in the data directory
    fs.readdirSync(DATA_DIR).forEach((file) => {
        const filePath = path.join(DATA_DIR, file);
        if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
        }
    });

    // Save the new CSV file
    const newFilePath = path.join(DATA_DIR, 'goodreads_library_export.csv');
    fs.writeFileSync(newFilePath, req.file.buffer);

    res.json({ message: 'Data folder updated successfully' });
});

router.get('/test-import-route', (req, res) => {
    res.json({ message: 'Import routes are working' });
});

module.exports = router;