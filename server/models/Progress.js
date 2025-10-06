const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PDF'
  },
  stats: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    lastAttempt: Date,
    streak: {
      type: Number,
      default: 0
    },
    mastery: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },
  strengths: [String],
  weaknesses: [String],
  recommendations: [String],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
progressSchema.index({ userId: 1, subject: 1, topic: 1 });
progressSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Progress', progressSchema);
