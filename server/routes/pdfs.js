const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
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
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload PDF
router.post('/upload', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Read and parse PDF
    const pdfBuffer = await fs.readFile(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);

    // Helper to parse PDF date strings like D:20250930163416Z safely
    const parsePdfDate = (value) => {
      if (!value) return new Date();
      if (value instanceof Date) return value;
      if (typeof value !== 'string') return new Date();
      // Strip leading 'D:' if present
      const cleaned = value.startsWith('D:') ? value.slice(2) : value;
      // Try ISO if simple
      const iso = Date.parse(value);
      if (!Number.isNaN(iso)) return new Date(iso);
      // Patterns like YYYYMMDDHHmmSSZ or without Z
      const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
      if (match) {
        const [_, y, m, d, hh, mm, ss] = match;
        return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)));
      }
      return new Date();
    };

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
        extractedText: pdfData.text,
        processed: false
      }
    });

    await pdf.save();

    res.status(201).json({
      message: 'PDF uploaded successfully',
      pdf: {
        id: String(pdf._id),
        filename: pdf.filename,
        originalName: pdf.originalName,
        size: pdf.size,
        metadata: pdf.metadata,
        uploadDate: pdf.uploadDate
      }
    });
  } catch (error) {
    console.error('PDF upload error:', error);
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

    // Normalize id field for frontend
    const normalized = pdfs.map(p => ({
      id: String(p._id),
      filename: p.filename,
      originalName: p.originalName,
      size: p.size,
      metadata: p.metadata,
      uploadDate: p.uploadDate,
      isPublic: p.isPublic
    }));

    res.json({ pdfs: normalized });
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
    if (pdf.uploadedBy.toString() !== req.userId) {
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

    // Simple chunking - split by paragraphs and limit chunk size
    const text = pdf.content.extractedText;
    const chunks = [];
    const maxChunkSize = 1000; // characters
    const overlap = 100; // characters

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + maxChunkSize, text.length);
      
      // Try to break at sentence or paragraph
      if (endIndex < text.length) {
        const lastPeriod = text.lastIndexOf('.', endIndex);
        const lastNewline = text.lastIndexOf('\n', endIndex);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > startIndex + maxChunkSize * 0.7) {
          endIndex = breakPoint + 1;
        }
      }

      const chunkText = text.substring(startIndex, endIndex).trim();
      
      if (chunkText.length > 50) { // Only keep substantial chunks
        chunks.push({
          text: chunkText,
          pageNumber: 1, // Simplified - would need more sophisticated page detection
          startIndex,
          endIndex,
          embedding: [] // Would be populated with actual embeddings
        });
        chunkIndex++;
      }

      startIndex = endIndex - overlap;
    }

    pdf.content.chunks = chunks;
    pdf.content.processed = true;
    await pdf.save();

    res.json({ 
      message: 'PDF processed successfully',
      chunksCreated: chunks.length
    });
  } catch (error) {
    console.error('Process PDF error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

module.exports = router;
