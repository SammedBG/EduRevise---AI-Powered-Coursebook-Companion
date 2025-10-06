const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT tokens from HTTP-only cookies
 * This middleware checks for access tokens in cookies and verifies them
 */
const authenticateToken = (req, res, next) => {
  // Get access token from HTTP-only cookie
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      shouldRefresh: true 
    });
  }

  // Verify the token
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
};

/**
 * Optional authentication middleware - doesn't fail if no token
 * Useful for routes that can work with or without authentication
 */
const optionalAuth = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    req.userId = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.userId = null;
    } else {
      req.userId = user.userId;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
};
