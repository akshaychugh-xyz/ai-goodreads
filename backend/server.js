const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Wrap database imports in try-catch to prevent startup crashes
let initializeDatabase;
let authRoutes;
let protectedRoutes;
let importRoutes;
let recommendationsRouter;
let verifyToken;
let importBooks;
let getShelfCounts;

try {
  console.log('Loading database modules...');
  const dbModule = require('./db/database-switcher');
  initializeDatabase = dbModule.initializeDatabase;
  
  console.log('Loading route modules...');
  authRoutes = require('./routes/auth');
  protectedRoutes = require('./routes/protectedRoutes');
  importRoutes = require('./routes/importRoutes');
  recommendationsRouter = require('./routes/recommendations');
  
  console.log('Loading auth module...');
  const authModule = require('./auth');
  verifyToken = authModule.verifyToken;
  
  console.log('Loading import modules...');
  const importModule = require('./importGoodreadsData');
  importBooks = importModule.importBooks;
  
  const shelfModule = require('./shelfCounts');
  getShelfCounts = shelfModule.getShelfCounts;
  
  console.log('All modules loaded successfully');
} catch (error) {
  console.error('Error loading modules:', error);
  console.error('Environment check:', {
    USE_SUPABASE: process.env.USE_SUPABASE,
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
  });
  
  // Create dummy functions to prevent crashes
  initializeDatabase = () => console.log('Database initialization skipped due to module load error');
  verifyToken = (req, res, next) => {
    res.status(500).json({ error: 'Server configuration error', details: 'Database modules failed to load' });
  };
}

const app = express();
const PORT = process.env.PORT || 3001;

// Use /tmp directory in production (Vercel), local directory in development
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp/data' 
  : path.join(__dirname, 'data');

// Safely create DATA_DIR
try {
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
} catch (error) {
  console.error('Error creating DATA_DIR:', error);
  console.log('Continuing without DATA_DIR - file uploads may not work');
}

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://better-reads.akshaychugh.xyz',
            'http://localhost:3000'
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
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Demo-Mode'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(cookieParser());

// Configure multer for file uploads - use /tmp in production
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'uploads/';
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (error) {
  console.error('Error creating upload directory:', error);
}
const upload = multer({ dest: uploadDir });

// Log all incoming requests to debug routing
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Use the auth routes
if (authRoutes) {
  app.use('/auth', authRoutes);
}

if (protectedRoutes && verifyToken) {
  app.use('/api', verifyToken, protectedRoutes);
}

if (importRoutes && verifyToken) {
  app.use('/api', verifyToken, importRoutes);
}

if (recommendationsRouter && verifyToken) {
  app.use('/api', verifyToken, recommendationsRouter);
}

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

if (initializeDatabase) {
  initializeDatabase();
}