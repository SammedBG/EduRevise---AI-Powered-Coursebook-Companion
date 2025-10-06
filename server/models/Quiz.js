const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'saq', 'laq'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [String], // For MCQ
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1
  },
  source: {
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PDF'
    },
    pageNumber: Number,
    snippet: String
  }
});

const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answer: String,
  isCorrect: Boolean,
  timeSpent: Number, // in seconds
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  questions: [questionSchema],
  pdfContext: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PDF'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  },
  attempts: [attemptSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
quizSchema.index({ createdBy: 1, createdAt: -1 });
quizSchema.index({ 'pdfContext': 1 });

module.exports = mongoose.model('Quiz', quizSchema);
