const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csrf');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for secure cookie handling
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your production domain
    : ['http://localhost:3000'], // React dev server
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser middleware (must be before CSRF)
app.use(cookieParser());

// Rate limiting - disabled in development, enabled in production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);
}

// CSRF protection configuration
const csrfProtection = csrf();

// Custom CSRF middleware
const csrfMiddleware = (req, res, next) => {
  // Skip CSRF for GET requests and auth endpoints
  if (req.method === 'GET' || 
      req.path.startsWith('/api/auth/login') || 
      req.path.startsWith('/api/auth/register') ||
      req.path === '/api/csrf-token') {
    return next();
  }

  // Get CSRF token from header
  const token = req.headers['x-csrf-token'];
  const secret = req.cookies.csrfSecret;

  if (!token || !secret) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  if (!csrfProtection.verify(secret, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

// Apply CSRF protection
app.use(csrfMiddleware);

// Route to get CSRF token
app.get('/api/csrf-token', (req, res) => {
  const secret = csrfProtection.secretSync();
  const token = csrfProtection.create(secret);
  
  // Set CSRF secret as HTTP-only cookie
  res.cookie('csrfSecret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  });
  
  res.json({ csrfToken: token });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-buddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', require('./routes/authSecure').router);
app.use('/api/pdfs', require('./routes/pdfs'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/youtube', require('./routes/youtube'));

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
