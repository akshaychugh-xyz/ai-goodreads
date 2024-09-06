const express = require('express');
const bookRoutes = require('./routes/bookRoutes');
const importRoutes = require('./routes/importRoutes');

const app = express();

app.use('/api', bookRoutes);
app.use('/api', importRoutes);

// ... other middleware and configurations

module.exports = app;