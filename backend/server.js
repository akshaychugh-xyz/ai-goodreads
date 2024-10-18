const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const recommendations = require('./routes/recommendations');
const db = require('./db/database');
const importRoutes = require('./routes/importRoutes');
const authRoutes = require('./routes/auth');
const { pool, initializeDatabase } = require('./db/database');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3001;

const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://ai-goodreads.vercel.app'],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use('/api', recommendations);
app.use('/api', importRoutes);
app.use('/api/auth', authRoutes);
app.use(cookieParser());

// Add this route to handle the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Book Recommendation Service');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Database initialization and server start
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Add this line to log routes
console.log('Routes:', app._router.stack.map(r => r.route?.path).filter(Boolean));

// Start the server
startServer();
