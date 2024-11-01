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
const recommendationsRouter = require('./routes/recommendations');
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

console.log('DATA_DIR:', DATA_DIR);
fs.access(DATA_DIR, fs.constants.W_OK, (err) => {
  if (err) {
    console.error('DATA_DIR is not writable:', err);
  } else {
    console.log('DATA_DIR is writable');
  }
});

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://better-reads.akshaychugh.xyz',
            'http://localhost:3000',
            'https://betterreads-backend-23631affce1d.herokuapp.com'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Log all incoming requests to debug routing
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Use the auth routes
app.use('/auth', authRoutes);

app.use('/api', verifyToken, protectedRoutes);
app.use('/api', verifyToken, importRoutes);
app.use('/api', verifyToken, recommendationsRouter);

app.get('/', (req, res) => {
  res.send('Hello from BetterReads backend!');
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
      res.status(500).json({ error: 'An error occurred while importing books', details: error.message });
    }
  });
});

app.get('/api/test-db', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connection successful', time: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

initializeDatabase();