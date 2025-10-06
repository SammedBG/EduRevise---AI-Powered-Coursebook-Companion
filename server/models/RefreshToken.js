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
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  userAgent: String,
  ipAddress: String
});

// Index for efficient queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

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

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = async function(token) {
  return await this.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
