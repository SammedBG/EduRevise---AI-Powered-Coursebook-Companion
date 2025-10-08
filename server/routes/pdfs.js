const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const PDF = require('../models/PDF');
const { authenticateToken } = require('./auth');
require('dotenv').config();
const router = express.Router();

// Configure AWS S3 Client v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Configure multer for S3 uploads
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
    acl: 'private',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const key = `pdfs/${req.userId}/${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
      cb(null, key);
    },
    metadata: function (req, file, cb) {
      cb(null, { 
        fieldName: file.fieldname,
        uploadedBy: req.userId,
        originalName: file.originalname
      });
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Helper: convert stream to buffer for AWS SDK v3
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

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
    // Handle multer errors
    if (req.file === undefined) {
      return res.status(400).json({ 
        error: 'No PDF file uploaded',
        code: 'NO_FILE_UPLOADED'
      });
    }

    // Check file size before processing
    if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
      // Delete from S3 if too large
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
          Key: req.file.key
        }));
      } catch (deleteError) {
        console.error('Error deleting oversized file from S3:', deleteError);
      }
      return res.status(413).json({ 
        error: 'PDF file too large. Maximum size is 10MB.',
        code: 'FILE_TOO_LARGE'
      });
    }

    // Check if file is empty
    if (req.file.size === 0) {
      // Delete from S3 if empty
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
          Key: req.file.key
        }));
      } catch (deleteError) {
        console.error('Error deleting empty file from S3:', deleteError);
      }
      return res.status(400).json({ 
        error: 'Uploaded file is empty',
        code: 'EMPTY_FILE'
      });
    }
    
    // Download file from S3 for processing
    let pdfBuffer;
    try {
      const s3Object = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
        Key: req.file.key
      }));
      pdfBuffer = await streamToBuffer(s3Object.Body);
    } catch (readError) {
      console.error('Error reading file from S3:', readError);
      return res.status(500).json({ 
        error: 'Failed to read uploaded file',
        code: 'FILE_READ_ERROR'
      });
    }
    
    try {
      const pdfData = await pdfParse(pdfBuffer, {
        max: 0, // No page limit
        version: 'v1.10.100' // Use specific version for stability
      });
      
      // Validate PDF data
      if (!pdfData || typeof pdfData !== 'object') {
        // Delete from S3 if invalid
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
            Key: req.file.key
          }));
        } catch (deleteError) {
          console.error('Error deleting invalid file from S3:', deleteError);
        }
        return res.status(400).json({ 
          error: 'Invalid PDF file format',
          code: 'INVALID_PDF_FORMAT'
        });
      }
      
      // Check if we got meaningful content
      if (!pdfData.text || pdfData.text.trim().length < 50) {
        // Delete from S3 if no text
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
            Key: req.file.key
          }));
        } catch (deleteError) {
          console.error('Error deleting file with no text from S3:', deleteError);
        }
        return res.status(400).json({ 
          error: 'PDF contains no extractable text. Please ensure the PDF has selectable text (not scanned images).',
          code: 'NO_EXTRACTABLE_TEXT'
        });
      }
      
      // Limit text size to prevent memory issues
      const maxTextLength = 50000; // 50KB limit
      const processedText = pdfData.text.length > maxTextLength 
        ? pdfData.text.substring(0, maxTextLength) + '\n\n[Content truncated due to size]'
        : pdfData.text;

      // Create PDF document with S3 information
      const pdf = new PDF({
        filename: req.file.key, // S3 key as filename
        originalName: req.file.originalname,
        path: req.file.location, // S3 URL
        s3Key: req.file.key, // Store S3 key for future reference
        s3Bucket: req.file.bucket,
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
      // Delete from S3 if parsing fails
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
          Key: req.file.key
        }));
      } catch (deleteError) {
        console.error('Error deleting file after parse error from S3:', deleteError);
      }
      return res.status(400).json({ 
        error: 'Failed to parse PDF. Please ensure it\'s a valid PDF file with extractable text.',
        code: 'PDF_PARSE_ERROR'
      });
    } finally {
      // Clear buffer from memory
      if (typeof pdfBuffer !== 'undefined') {
        pdfBuffer.fill(0);
      }
    }
    
  } catch (error) {
    console.error('PDF upload error:', error);
    
    // Clean up S3 file on error
    if (req.file && req.file.key) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || 'study-buddy-pdfs',
          Key: req.file.key
        }));
      } catch (cleanupError) {
        console.error('S3 cleanup error:', cleanupError);
      }
    }
    
    if (error.message.includes('heap') || error.message.includes('memory')) {
      return res.status(413).json({ 
        error: 'PDF too large for processing. Please use a smaller file.',
        code: 'MEMORY_ERROR'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload PDF',
      code: 'UPLOAD_ERROR'
    });
  }
});

// Helper function to generate signed URL for S3 access
async function generateSignedUrl(s3Key, bucketName, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

// Get all PDFs for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pdfs = await PDF.find({ 
      $or: [
        { uploadedBy: req.userId },
        { isPublic: true }
      ]
    }).sort({ uploadDate: -1 });

    // Generate signed URLs for S3-stored PDFs
    const pdfsWithUrls = await Promise.all(
      pdfs.map(async (pdf) => {
        const pdfObj = pdf.toObject();
        if (pdf.s3Key && pdf.s3Bucket) {
          pdfObj.signedUrl = await generateSignedUrl(pdf.s3Key, pdf.s3Bucket);
        }
        return pdfObj;
      })
    );

    res.json({ pdfs: pdfsWithUrls });
  } catch (error) {
    console.error('Get PDFs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch PDFs',
      code: 'PDFS_FETCH_FAILED'
    });
  }
});

// Get specific PDF
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid PDF ID', code: 'INVALID_PDF_ID' });
    }

    const pdf = await PDF.findById(id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found', code: 'PDF_NOT_FOUND' });
    }

    // Check if user has access
    if (pdf.uploadedBy.toString() !== req.userId && !pdf.isPublic) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    res.json({ pdf });
  } catch (error) {
    console.error('Get PDF error:', error);
    res.status(500).json({ error: 'Failed to fetch PDF', code: 'PDF_FETCH_FAILED' });
  }
});

// Delete PDF
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid PDF ID', code: 'INVALID_PDF_ID' });
    }

    const pdf = await PDF.findById(id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found', code: 'PDF_NOT_FOUND' });
    }

    // Check if user owns the PDF
    if (pdf.uploadedBy.toString() !== req.userId && !pdf.isPublic) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }

    // Delete file from S3 if it exists there
    if (pdf.s3Key && pdf.s3Bucket) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: pdf.s3Bucket,
          Key: pdf.s3Key
        }));
        console.log(`Deleted file from S3: ${pdf.s3Key}`);
      } catch (s3Error) {
        console.error('Error deleting file from S3:', s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    } else {
      // Delete file from local filesystem (legacy support)
      try {
        await fs.unlink(pdf.path);
        console.log(`Deleted local file: ${pdf.path}`);
      } catch (err) {
        console.log('File already deleted or not found');
      }
    }

    await PDF.findByIdAndDelete(id);

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Delete PDF error:', error);
    res.status(500).json({ error: 'Failed to delete PDF', code: 'PDF_DELETE_FAILED' });
  }
});

// Search PDFs
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Search query is required',
        code: 'MISSING_SEARCH_QUERY'
      });
    }

    if (query.length > 100) {
      return res.status(400).json({ 
        error: 'Search query too long (max 100 characters)',
        code: 'SEARCH_QUERY_TOO_LONG'
      });
    }
    
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
    res.status(500).json({ error: 'Failed to search PDFs', code: 'PDF_SEARCH_FAILED' });
  }
});

// Process PDF for RAG (chunking and embedding)
router.post('/:id/process', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid PDF ID', code: 'INVALID_PDF_ID' });
    }

    const pdf = await PDF.findById(id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found', code: 'PDF_NOT_FOUND' });
    }

    if (pdf.uploadedBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
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
          error: 'This PDF has little or no extractable text. Please ensure the PDF contains readable text (not scanned images).',
          code: 'INSUFFICIENT_TEXT_EXTRACTION'
        });
      }
    } else {
      extractedText = text;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'Unable to extract sufficient text from PDF. Please ensure the PDF contains readable text.',
        code: 'INSUFFICIENT_TEXT_CONTENT'
      });
    }

    // Enhanced chunking with better text processing
    const chunks = createTextChunks(extractedText, pdf._id);

    // Generate embeddings for each chunk with timeout guard
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const chunksWithEmbeddings = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      try {
        // Generate embedding for this chunk with timeout
        const embedding = await Promise.race([
          generateEmbedding(chunk.text),
          new Promise((_, reject) => setTimeout(() => reject(new Error('EMBEDDING_TIMEOUT')), 10000))
        ]);
        
        chunksWithEmbeddings.push({
          ...chunk,
          embedding: embedding && embedding.length > 0 ? embedding : undefined
        });
        
        // Add small delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${i + 1}:`, error);
        if (error.message === 'EMBEDDING_TIMEOUT') {
          console.warn(`Embedding timeout for chunk ${i + 1}, skipping...`);
          // Continue with remaining chunks
          continue;
        }
        // Still include the chunk without embedding
        chunksWithEmbeddings.push({
          ...chunk,
          embedding: undefined
        });
      }
    }

    // Update PDF with processed chunks
    pdf.content.chunks = chunksWithEmbeddings;
    pdf.content.processed = true;
    pdf.content.processedAt = new Date();
    pdf.content.processingMethod = processingMethod;
    pdf.content.totalTextLength = extractedText.length;
    pdf.content.hasEmbeddings = chunksWithEmbeddings.some(chunk => chunk.embedding && chunk.embedding.length > 0);
    
    await pdf.save();

    res.json({ 
      message: 'PDF processed successfully', 
      chunksCount: chunks.length,
      processingMethod: processingMethod,
      totalTextLength: extractedText.length,
      averageChunkSize: Math.round(extractedText.length / chunks.length),
      hasEmbeddings: pdf.content.hasEmbeddings
    });
  } catch (error) {
    console.error('Process PDF error:', error);
    if (error.message === 'EMBEDDING_TIMEOUT') {
      res.status(504).json({ 
        error: 'PDF processing timeout, please try again', 
        code: 'PDF_PROCESSING_TIMEOUT' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to process PDF', 
        code: 'PDF_PROCESSING_FAILED' 
      });
    }
  }
});

// Helper function to generate embeddings for text
async function generateEmbedding(text) {
  try {
    // Try Gemini API first (FREE embeddings)
    if (process.env.GEMINI_API_KEY) {
      return await generateEmbeddingWithGemini(text);
    }
    
    // Try OpenAI API
    if (process.env.OPENAI_API_KEY) {
      return await generateEmbeddingWithOpenAI(text);
    }
    
    // Fallback: return empty array (will use keyword search only)
    console.warn('No embedding API configured, using keyword search only');
    return [];
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return [];
  }
}

// Generate embedding using Gemini API (FREE)
async function generateEmbeddingWithGemini(text) {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    if (embedding && embedding.length > 0) {
      return embedding;
    } else {
      throw new Error('Invalid embedding response from Gemini');
    }
  } catch (error) {
    console.error('Gemini embedding generation failed:', error.message);
    throw error;
  }
}

// Generate embedding using OpenAI API
async function generateEmbeddingWithOpenAI(text) {
  try {
    const response = await axios.post('https://api.openai.com/v1/embeddings', {
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.data && response.data.data[0]) {
      return response.data.data[0].embedding;
    } else {
      throw new Error('Invalid embedding response from OpenAI');
    }
  } catch (error) {
    console.error('OpenAI embedding generation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

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
