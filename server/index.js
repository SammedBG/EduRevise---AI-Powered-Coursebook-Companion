const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
// Behind proxies (Railway/Render/Heroku), enable correct client IP detection
app.set('trust proxy', 1);
app.use(helmet());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true // Allow cookies to be sent
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 requests in dev, 100 in production
  message: {
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// Development route to reset rate limit (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/reset-rate-limit', (req, res) => {
    // This doesn't actually reset the rate limit, but provides info
    res.json({
      message: 'Rate limit reset info',
      note: 'Rate limit will reset automatically after 15 minutes',
      currentLimit: 1000,
      windowMs: '15 minutes'
    });
  });
}

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
const youtubeModule = require('./routes/youtube');

app.use('/api/auth', resolveRouter(authModule, 'auth'));
app.use('/api/pdfs', resolveRouter(pdfsModule, 'pdfs'));
app.use('/api/chat', resolveRouter(chatModule, 'chat'));
app.use('/api/quiz', resolveRouter(quizModule, 'quiz'));
app.use('/api/progress', resolveRouter(progressModule, 'progress'));
app.use('/api/youtube', resolveRouter(youtubeModule, 'youtube'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Study Buddy API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      code: 'VALIDATION_ERROR',
      details: err.message 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format', 
      code: 'INVALID_ID_FORMAT' 
    });
  }
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ 
      error: 'Duplicate entry', 
      code: 'DUPLICATE_ENTRY' 
    });
  }
  
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File too large', 
        code: 'FILE_TOO_LARGE' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: 'Unexpected file field', 
        code: 'UNEXPECTED_FILE_FIELD' 
      });
    }
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
