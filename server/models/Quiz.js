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
  answers: [String], // Array of user answers
  timeSpent: {
    type: Number,
    default: 0
  },
  score: Number,
  percentage: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  questionResults: [{
    questionIndex: { type: Number },
    question: { type: String },
    userAnswer: { type: String },
    correctAnswer: { type: String },
    isCorrect: { type: Boolean },
    score: { type: Number },
    maxScore: { type: Number },
    feedback: { type: String },
    explanation: { type: String },
    type: { type: String },
    difficulty: { type: String },
    source: {
      pdfId: { type: mongoose.Schema.Types.ObjectId },
      pageNumber: { type: Number },
      snippet: { type: String }
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  difficulty: String,
  questionTypes: [String]
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
