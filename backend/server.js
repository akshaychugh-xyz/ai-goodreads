const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const recommendations = require('./routes/recommendations');
const db = require('./db/database');
const importRoutes = require('./routes/importRoutes');
const authRoutes = require('./routes/auth');
const { initializeDatabase } = require('./db/database');

const app = express();

// Add this line to enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use('/api', recommendations);
app.use('/api', importRoutes);
app.use('/api/auth', authRoutes);

// Add this route to handle the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Book Recommendation Service');
});

const PORT = process.env.PORT || 3001;

async function startServer(port) {
    try {
        await initializeDatabase();
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
