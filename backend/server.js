const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { pool } = require('./db/database');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protectedRoutes');
const importRoutes = require('./routes/importRoutes');
const recommendations = require('./routes/recommendations');
const { verifyToken } = require('./auth');
const PORT = process.env.PORT || 3001;

const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://ai-goodreads.vercel.app'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api', verifyToken, protectedRoutes);
app.use('/api', verifyToken, importRoutes);
app.use('/api', verifyToken, recommendations);

app.get('/', (req, res) => {
  res.send('Welcome to the Book Recommendation Service');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

async function startServer() {
  try {
    await pool.connect();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
