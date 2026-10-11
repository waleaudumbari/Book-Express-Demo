const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const bookRoutes = require('./routes/book.routes');
const errorHandler = require('./middleware/error-handler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/v1/books', bookRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found' },
  });
});

app.use(errorHandler);

module.exports = app;