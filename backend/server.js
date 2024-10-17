const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const recommendations = require('./routes/recommendations');
const db = require('./db/database');
const importRoutes = require('./routes/importRoutes');
const authRoutes = require('./routes/auth');
const { initializeDatabase } = require('./db/database');
const cookieParser = require('cookie-parser');
const { pool } = require('./db/database');
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

async function startServer(port) {
    try {
        await initializeDatabase();
        
        app.get('/test-db', async (req, res) => {
            try {
                const client = await pool.connect();
                const result = await client.query('SELECT NOW()');
                client.release();
                res.send(`Database connected. Current time: ${result.rows[0].now}`);
            } catch (err) {
                res.status(500).send(`Database connection error: ${err.message}`);
            }
        });

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Add this line to log routes
console.log('Routes:', app._router.stack.map(r => r.route?.path).filter(Boolean));

// Start the server
startServer(PORT);

module.exports = app;
