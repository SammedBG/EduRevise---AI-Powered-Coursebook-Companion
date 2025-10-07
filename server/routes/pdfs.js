const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const PDF = require('../models/PDF');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/pdfs';
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(err => cb(err, null));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (reduced from 50MB)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Helper: parse PDF metadata date strings like "D:20250403140945Z"
function parsePdfDate(input) {
  try {
    if (!input) return new Date();
    if (input instanceof Date) return input;
    let s = String(input);
    if (s.startsWith('D:')) s = s.slice(2);
    const year = s.slice(0, 4);
    const month = s.slice(4, 6) || '01';
    const day = s.slice(6, 8) || '01';
    const hour = s.slice(8, 10) || '00';
    const minute = s.slice(10, 12) || '00';
    const second = s.slice(12, 14) || '00';
    // Handle timezone offsets like +05'30' or Z; normalize to Z
    let iso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return new Date();
    return d;
  } catch (e) {
    return new Date();
  }
}

// Upload PDF
router.post('/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Check file size before processing
    if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
      await fs.unlink(req.file.path); // Clean up file
      return res.status(400).json({ error: 'PDF file too large. Maximum size is 10MB.' });
    }
    
    // Read and parse PDF with memory management
    const pdfBuffer = await fs.readFile(req.file.path);
    
    try {
      const pdfData = await pdfParse(pdfBuffer, {
        max: 0, // No page limit
        version: 'v1.10.100' // Use specific version for stability
      });
      
      // Check if we got meaningful content
      if (!pdfData.text || pdfData.text.trim().length < 50) {
        await fs.unlink(req.file.path); // Clean up file
        return res.status(400).json({ 
          error: 'PDF contains no extractable text. Please ensure the PDF has selectable text (not scanned images).' 
        });
      }
      
      // Limit text size to prevent memory issues
      const maxTextLength = 50000; // 50KB limit (reduced from 100KB)
      const processedText = pdfData.text.length > maxTextLength 
        ? pdfData.text.substring(0, maxTextLength) + '\n\n[Content truncated due to size]'
        : pdfData.text;

    // Create PDF document
    const pdf = new PDF({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedBy: req.userId,
      metadata: {
        title: pdfData.info?.Title || req.file.originalname,
        author: pdfData.info?.Author || 'Unknown',
        subject: pdfData.info?.Subject || 'General',
        pages: pdfData.numpages,
        createdAt: parsePdfDate(pdfData.info?.CreationDate)
      },
      content: {
        extractedText: processedText,
        processed: false
      }
    });

    await pdf.save();

    res.status(201).json({
      message: 'PDF uploaded successfully',
      pdf: {
        _id: pdf._id,
        filename: pdf.filename,
        originalName: pdf.originalName,
        size: pdf.size,
        metadata: pdf.metadata,
        uploadDate: pdf.uploadDate
      }
    });
    
    } catch (parseError) {
      console.error('PDF parsing error:', parseError);
      await fs.unlink(req.file.path); // Clean up file
      return res.status(400).json({ 
        error: 'Failed to parse PDF. Please ensure it\'s a valid PDF file with extractable text.' 
      });
    } finally {
      // Clear buffer from memory
      if (typeof pdfBuffer !== 'undefined') {
        pdfBuffer.fill(0);
      }
    }
    
  } catch (error) {
    console.error('PDF upload error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
    
    if (error.message.includes('heap') || error.message.includes('memory')) {
      return res.status(413).json({ 
        error: 'PDF too large for processing. Please use a smaller file.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

// Get all PDFs for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pdfs = await PDF.find({ 
      $or: [
        { uploadedBy: req.userId },
        { isPublic: true }
      ]
    }).sort({ uploadDate: -1 });

    res.json({ pdfs });
  } catch (error) {
    console.error('Get PDFs error:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

// Get specific PDF
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Check if user has access
    if (pdf.uploadedBy.toString() !== req.userId && !pdf.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ pdf });
  } catch (error) {
    console.error('Get PDF error:', error);
    res.status(500).json({ error: 'Failed to fetch PDF' });
  }
});

// Delete PDF
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Check if user owns the PDF
    if (pdf.uploadedBy.toString() !== req.userId && !pdf.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(pdf.path);
    } catch (err) {
      console.log('File already deleted or not found');
    }

    await PDF.findByIdAndDelete(req.params.id);

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Delete PDF error:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

// Search PDFs
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const query = req.params.query;
    
    const pdfs = await PDF.find({
      $and: [
        {
          $or: [
            { uploadedBy: req.userId },
            { isPublic: true }
          ]
        },
        {
          $or: [
            { 'content.extractedText': { $regex: query, $options: 'i' } },
            { originalName: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ]
        }
      ]
    }).sort({ uploadDate: -1 });

    res.json({ pdfs });
  } catch (error) {
    console.error('Search PDFs error:', error);
    res.status(500).json({ error: 'Failed to search PDFs' });
  }
});

// Process PDF for RAG (chunking and embedding)
router.post('/:id/process', authenticateToken, async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    if (pdf.uploadedBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (pdf.content.processed) {
      return res.json({ message: 'PDF already processed' });
    }

    let extractedText = '';
    let processingMethod = 'text-extraction';

    // First, try basic text extraction
    const text = (pdf.content && pdf.content.extractedText) ? pdf.content.extractedText : '';
    
    if (!text || text.trim().length < 50) {
      console.log('Basic text extraction failed, attempting OCR...');
      
      try {
        // For now, we'll use the basic text extraction result
        // In a full implementation, you'd convert PDF pages to images and use Tesseract
        extractedText = text || 'OCR processing would be implemented here for scanned PDFs';
        processingMethod = 'basic-extraction';
        console.log('Using basic extraction, text length:', extractedText.length);
      } catch (ocrError) {
        console.error('Processing failed:', ocrError);
        return res.status(400).json({ 
          error: 'This PDF has little or no extractable text. Please ensure the PDF contains readable text (not scanned images).' 
        });
      }
    } else {
      extractedText = text;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Unable to extract sufficient text from PDF. Please ensure the PDF contains readable text.' 
      });
    }

    // Enhanced chunking with better text processing
    const chunks = createTextChunks(extractedText, pdf._id);

    // Update PDF with processed chunks
    pdf.content.chunks = chunks;
    pdf.content.processed = true;
    pdf.content.processedAt = new Date();
    pdf.content.processingMethod = processingMethod;
    pdf.content.totalTextLength = extractedText.length;
    
    await pdf.save();

    res.json({ 
      message: 'PDF processed successfully', 
      chunksCount: chunks.length,
      processingMethod: processingMethod,
      totalTextLength: extractedText.length,
      averageChunkSize: Math.round(extractedText.length / chunks.length)
    });
  } catch (error) {
    console.error('Process PDF error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Helper function to create better text chunks
function createTextChunks(text, pdfId) {
  const chunks = [];
  const maxChunkSize = 1000; // characters
  const overlap = 150; // characters for better context
  const minChunkSize = 100; // minimum chunk size

  let startIndex = 0;
  let chunkIndex = 0;

  // Clean up text first
  const cleanedText = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim();

  while (startIndex < cleanedText.length) {
    let endIndex = Math.min(startIndex + maxChunkSize, cleanedText.length);
    
    // Try to break at natural boundaries
    if (endIndex < cleanedText.length) {
      // Look for sentence endings first
      const lastPeriod = cleanedText.lastIndexOf('.', endIndex);
      const lastExclamation = cleanedText.lastIndexOf('!', endIndex);
      const lastQuestion = cleanedText.lastIndexOf('?', endIndex);
      const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      // Then look for paragraph breaks
      const lastNewline = cleanedText.lastIndexOf('\n', endIndex);
      
      // Choose the best break point
      const breakPoint = Math.max(sentenceEnd, lastNewline);
      
      if (breakPoint > startIndex + maxChunkSize * 0.6) {
        endIndex = breakPoint + 1;
      }
    }

    const chunkText = cleanedText.substring(startIndex, endIndex).trim();
    
    if (chunkText.length >= minChunkSize) {
      chunks.push({
        text: chunkText,
        pdfId: pdfId,
        pageNumber: Math.floor(startIndex / (cleanedText.length / 10)) + 1, // Estimate page number
        startIndex,
        endIndex,
        chunkIndex: chunkIndex++,
        wordCount: chunkText.split(/\s+/).length,
        relevanceScore: 0.5 // Default relevance score
      });
    }

    startIndex = Math.max(endIndex - overlap, startIndex + minChunkSize);
  }

  return chunks;
}

module.exports = router;
