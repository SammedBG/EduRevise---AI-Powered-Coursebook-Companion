const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, grade } = req.body;

    // Input validation
    if (!username || !email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields: username, email, password, and name are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({ 
        error: 'Username must be at least 3 characters long',
        code: 'INVALID_USERNAME'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.email === email 
          ? 'User with this email already exists' 
          : 'Username is already taken',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      profile: { name, grade },
      preferences: {
        difficulty: 'medium',
        questionTypes: { mcq: true, saq: true, laq: true }
      }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Set secure HttpOnly cookie
    // Use 'none' for cross-origin (Vercel + Render), 'lax' for local dev
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Must be true in production for sameSite: 'none'
      sameSite: isProduction ? 'none' : 'lax', // 'none' allows cross-origin cookies
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON(),
      token: token // Send token in response as fallback
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'User with this email or username already exists',
        code: 'DUPLICATE_KEY'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error during registration',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Set secure HttpOnly cookie
    // Use 'none' for cross-origin (Vercel + Render), 'lax' for local dev
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Must be true in production for sameSite: 'none'
      sameSite: isProduction ? 'none' : 'lax', // 'none' allows cross-origin cookies
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Update last active
    user.lastActive = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token: token // Send token in response as fallback
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error during login',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ 
      message: 'Profile retrieved successfully',
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Profile error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error while retrieving profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, grade, subjects, preferences } = req.body;
    
    // Input validation
    if (!name && !grade && !subjects && !preferences) {
      return res.status(400).json({ 
        error: 'At least one field must be provided for update',
        code: 'NO_UPDATE_FIELDS'
      });
    }

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return res.status(400).json({ 
        error: 'Name must be at least 2 characters long',
        code: 'INVALID_NAME'
      });
    }

    // Validate subjects if provided
    if (subjects !== undefined && (!Array.isArray(subjects) || subjects.length === 0)) {
      return res.status(400).json({ 
        error: 'Subjects must be a non-empty array',
        code: 'INVALID_SUBJECTS'
      });
    }
    
    const updateData = {};
    if (name !== undefined) updateData['profile.name'] = name.trim();
    if (grade !== undefined) updateData['profile.grade'] = grade;
    if (subjects !== undefined) updateData['profile.subjects'] = subjects;
    if (preferences !== undefined) updateData['preferences'] = preferences;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid user ID format',
        code: 'INVALID_USER_ID'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error while updating profile',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Logout route
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Clear the HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax' // Must match cookie settings
    });

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error during logout',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  try {
    // Try cookie first (secure), then header (fallback)
    let token = req.cookies.token;
    
    if (!token) {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token is required',
        code: 'MISSING_TOKEN'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token has expired',
            code: 'TOKEN_EXPIRED'
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        }
        
        return res.status(401).json({ 
          error: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
      
      if (!user || !user.userId) {
        return res.status(401).json({ 
          error: 'Invalid token payload',
          code: 'INVALID_TOKEN_PAYLOAD'
        });
      }
      
      req.userId = user.userId;
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during authentication',
      code: 'AUTH_INTERNAL_ERROR'
    });
  }
}

module.exports = { router, authenticateToken };
