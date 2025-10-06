const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const router = express.Router();

// Helper function to set secure HTTP-only cookies
const setSecureCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  };

  // Set access token cookie (short-lived: 15 minutes)
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Set refresh token cookie (long-lived: 7 days)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Helper function to clear all auth cookies
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

// Helper function to get client info for security tracking
const getClientInfo = (req) => {
  return {
    userAgent: req.get('User-Agent') || 'Unknown',
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
  };
};

// Generate access token (short-lived)
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate refresh token (long-lived)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, grade } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password with higher salt rounds for better security
    const saltRounds = 12;
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

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenValue = generateRefreshToken(user._id);

    // Store refresh token in database
    const clientInfo = getClientInfo(req);
    const refreshTokenDoc = await RefreshToken.createToken(
      user._id, 
      clientInfo.userAgent, 
      clientInfo.ipAddress
    );

    // Set secure HTTP-only cookies
    setSecureCookies(res, accessToken, refreshTokenValue);

    // Update user's last active time
    user.lastActive = new Date();
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON(),
      // Don't send tokens in response body for security
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenValue = generateRefreshToken(user._id);

    // Store refresh token in database
    const clientInfo = getClientInfo(req);
    const refreshTokenDoc = await RefreshToken.createToken(
      user._id, 
      clientInfo.userAgent, 
      clientInfo.ipAddress
    );

    // Set secure HTTP-only cookies
    setSecureCookies(res, accessToken, refreshTokenValue);

    // Update user's last active time
    user.lastActive = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      // Don't send tokens in response body for security
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not provided' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists in database and is valid
    const refreshTokenDoc = await RefreshToken.findValidToken(refreshToken);
    if (!refreshTokenDoc || refreshTokenDoc.userId.toString() !== decoded.userId) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({
      message: 'Token refreshed successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint (for checking auth status)
router.get('/verify', async (req, res) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token not provided' });
    }

    // Verify access token
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
      // If access token is expired, try to refresh
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Access token expired',
          shouldRefresh: true 
        });
      }
      return res.status(401).json({ error: 'Invalid access token' });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    // If refresh token exists, revoke it
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true }
      );
    }

    // Clear all auth cookies
    clearAuthCookies(res);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if there's an error
    clearAuthCookies(res);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout from all devices endpoint
router.post('/logout-all', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(400).json({ error: 'No refresh token provided' });
    }

    // Verify refresh token to get user ID
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Revoke all refresh tokens for this user
    await RefreshToken.revokeAllUserTokens(decoded.userId);

    // Clear all auth cookies
    clearAuthCookies(res);

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, grade, subjects, preferences } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData['profile.name'] = name;
    if (grade !== undefined) updateData['profile.grade'] = grade;
    if (subjects !== undefined) updateData['profile.subjects'] = subjects;
    if (preferences !== undefined) updateData['preferences'] = preferences;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to authenticate JWT token from cookies
function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        shouldRefresh: true 
      });
    }
    req.userId = user.userId;
    next();
  });
}

module.exports = { router, authenticateToken };
