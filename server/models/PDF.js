const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: false // Optional for backward compatibility
  },
  s3Bucket: {
    type: String,
    required: false // Optional for backward compatibility
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    title: String,
    author: String,
    subject: String,
    pages: Number,
    createdAt: Date
  },
  content: {
    extractedText: String,
    chunks: [{
      text: String,
      pageNumber: Number,
      startIndex: Number,
      endIndex: Number,
      embedding: [Number],
      chunkIndex: Number,
      wordCount: Number,
      relevanceScore: Number
    }],
    processed: {
      type: Boolean,
      default: false
    },
    processedAt: Date,
    processingMethod: String,
    totalTextLength: Number,
    hasEmbeddings: {
      type: Boolean,
      default: false
    }
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

// Index for text search
pdfSchema.index({ 'content.extractedText': 'text' });
pdfSchema.index({ tags: 1 });
pdfSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('PDF', pdfSchema);
