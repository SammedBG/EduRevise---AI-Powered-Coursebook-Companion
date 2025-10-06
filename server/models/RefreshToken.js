const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 604800 // 7 days in seconds (auto-delete expired tokens)
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient cleanup and queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create a new refresh token
refreshTokenSchema.statics.createToken = async function(userId, userAgent, ipAddress) {
  // Revoke all existing tokens for this user
  await this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );

  // Generate a cryptographically secure random token
  const crypto = require('crypto');
  const token = crypto.randomBytes(64).toString('hex');

  // Create new token
  const refreshToken = new this({
    token,
    userId,
    userAgent: userAgent || 'Unknown',
    ipAddress: ipAddress || 'Unknown',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  await refreshToken.save();
  return refreshToken;
};

// Instance method to check if token is valid
refreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && this.expiresAt > new Date();
};

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
  return await this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);