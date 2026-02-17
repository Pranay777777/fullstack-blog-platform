require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDatabase } = require('./src/config/database');
const { errorHandler } = require('./src/utils/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/comments', require('./src/routes/commentRoutes'));
app.use('/api/likes', require('./src/routes/likeRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
