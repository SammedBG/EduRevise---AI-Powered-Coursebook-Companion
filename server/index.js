const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
// Behind proxies (Railway/Render/Heroku), enable correct client IP detection
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-buddy');

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error:', err);
});

// Routes
function resolveRouter(mod, name) {
  if (typeof mod === 'function') return mod; // module.exports = router
  if (mod && typeof mod.router === 'function') return mod.router; // { router }
  throw new TypeError(`Invalid router export for ${name}. Expected function or { router }.`);
}

const authModule = require('./routes/auth');
const pdfsModule = require('./routes/pdfs');
const chatModule = require('./routes/chat');
const quizModule = require('./routes/quiz');
const progressModule = require('./routes/progress');

app.use('/api/auth', resolveRouter(authModule, 'auth'));
app.use('/api/pdfs', resolveRouter(pdfsModule, 'pdfs'));
app.use('/api/chat', resolveRouter(chatModule, 'chat'));
app.use('/api/quiz', resolveRouter(quizModule, 'quiz'));
app.use('/api/progress', resolveRouter(progressModule, 'progress'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Study Buddy API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
