const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');

/**
 * Secure JWT Authentication Middleware
 * 
 * This middleware provides secure authentication using HTTP-only cookies
 * with access tokens (15 min) and refresh tokens (7 days).
 * 
 * Security Features:
 * - HTTP-only cookies prevent XSS attacks
 * - Short-lived access tokens limit exposure
 * - Refresh tokens enable secure token rotation
 * - CSRF protection through SameSite cookies
 */

/**
 * Middleware to authenticate requests using access token from HTTP-only cookie
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get access token from HTTP-only cookie
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'NO_ACCESS_TOKEN'
      });
    }

    // Verify access token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Try to refresh the token
      return await refreshAccessToken(req, res, next);
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }
};

/**
 * Middleware to refresh access token using refresh token
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    // Get refresh token from HTTP-only cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Find and validate refresh token
    const tokenDoc = await RefreshToken.findOne({ 
      token: refreshToken,
      isRevoked: false 
    });

    if (!tokenDoc || !tokenDoc.isValid()) {
      // Clear invalid cookies
      clearAuthCookies(res);
      return res.status(401).json({ 
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Get user
    const user = await User.findById(tokenDoc.userId).select('-password');
    if (!user) {
      await tokenDoc.remove();
      clearAuthCookies(res);
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    // Set new access token cookie
    setAccessTokenCookie(res, newAccessToken);

    // Add user to request
    req.user = user;
    req.userId = user._id;
    next();

  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthCookies(res);
    return res.status(401).json({ 
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
      return next(); // Continue without authentication
    }

    // Verify token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user) {
      req.user = user;
      req.userId = user._id;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without authentication
    next();
  }
};

/**
 * Generate access token (15 minutes)
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: '15m',
      issuer: 'study-buddy-api',
      audience: 'study-buddy-client'
    }
  );
};

/**
 * Generate refresh token (7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.REFRESH_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'study-buddy-api',
      audience: 'study-buddy-client'
    }
  );
};

/**
 * Set secure access token cookie
 */
const setAccessTokenCookie = (res, token) => {
  res.cookie('accessToken', token, {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  });
};

/**
 * Set secure refresh token cookie
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

/**
 * Clear all authentication cookies
 */
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

/**
 * Set both access and refresh token cookies
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie
};
