const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const recommendations = require('./routes/recommendations');
const db = require('./db/database');
const importRoutes = require('./routes/importRoutes');

const app = express();

// Add this line to enable CORS
app.use(cors());

app.use(bodyParser.json());
app.use('/api', recommendations);
app.use('/api', importRoutes);

// Add this route to handle the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Book Recommendation Service');
});

const PORT = process.env.PORT || 3001;

// Function to start the server
function startServer(port) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

// Add this line to log routes
console.log('Routes:', app._router.stack.map(r => r.route?.path).filter(Boolean));

// Start the server
startServer(PORT);