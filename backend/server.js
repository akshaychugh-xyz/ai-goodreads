const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protectedRoutes');
const importRoutes = require('./routes/importRoutes');
const recommendations = require('./routes/recommendations');
const { verifyToken } = require('./auth');
const { importBooks } = require('./importGoodreadsData');
const { getShelfCounts } = require('./shelfCounts');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure DATA_DIR exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const corsOptions = {
  origin: ['http://localhost:3000', 'https://ai-goodreads.vercel.app'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use('/api/auth', authRoutes);
app.use('/api', verifyToken, protectedRoutes);
app.use('/api', verifyToken, importRoutes);
app.use('/api', verifyToken, recommendations);

app.get('/', (req, res) => {
  res.send('Welcome to the Book Recommendation Service');
});

app.post('/api/import-books', verifyToken, async (req, res) => {
  console.log('Received import-books request');
  console.log('Request headers:', req.headers);

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.files.file;
  const userId = req.user.id;
  const filePath = path.join(DATA_DIR, `${userId}_${file.name}`);

  file.mv(filePath, async (err) => {
    if (err) {
      console.error('Error saving file:', err);
      return res.status(500).json({ error: 'Error saving file' });
    }

    try {
      console.log('Importing books');
      await importBooks(filePath, userId);
      console.log('Import successful');
      
      // Get updated shelf counts
      const shelfCounts = await getShelfCounts(userId);
      
      // Delete the temporary file
      fs.unlinkSync(filePath);
      
      res.json({ message: 'Books imported successfully', shelfCounts });
    } catch (error) {
      console.error('Error importing books:', error);
      res.status(500).json({ error: 'An error occurred while importing books' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

initializeDatabase();
