const express = require('express');
const { google } = require('googleapis');
const PDF = require('../models/PDF');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Initialize YouTube Data API
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Get YouTube recommendations based on PDF content
router.get('/recommendations/:pdfId', authenticateToken, async (req, res) => {
  try {
    const { pdfId } = req.params;
    const { maxResults = 5 } = req.query;

    // Get PDF details
    const pdf = await PDF.findById(pdfId);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Check if user has access to the PDF
    if (pdf.uploadedBy.toString() !== req.userId && !pdf.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Extract keywords from PDF content for search
    const keywords = extractKeywordsFromPDF(pdf);
    
    // Generate search queries
    const searchQueries = generateSearchQueries(pdf, keywords);
    
    // Get YouTube recommendations
    const recommendations = await getYouTubeRecommendations(searchQueries, maxResults);

    res.json({
      pdfId,
      pdfTitle: pdf.originalName,
      recommendations,
      searchQueries
    });
  } catch (error) {
    console.error('YouTube recommendations error:', error);
    
    // Return mock recommendations if YouTube API fails
    const mockRecommendations = getMockYouTubeRecommendations(req.params.pdfId);
    res.json({
      pdfId: req.params.pdfId,
      recommendations: mockRecommendations,
      note: 'Mock recommendations (YouTube API not configured)'
    });
  }
});

// Get YouTube recommendations for multiple PDFs
router.post('/recommendations/batch', authenticateToken, async (req, res) => {
  try {
    const { pdfIds, maxResults = 5 } = req.body;

    if (!pdfIds || !Array.isArray(pdfIds)) {
      return res.status(400).json({ error: 'PDF IDs array is required' });
    }

    // Get PDFs
    const pdfs = await PDF.find({
      _id: { $in: pdfIds },
      $or: [
        { uploadedBy: req.userId },
        { isPublic: true }
      ]
    });

    if (pdfs.length === 0) {
      return res.status(404).json({ error: 'No accessible PDFs found' });
    }

    // Combine content from all PDFs
    const combinedContent = pdfs.map(pdf => ({
      id: pdf._id,
      title: pdf.originalName,
      content: pdf.content.extractedText
    }));

    // Extract combined keywords
    const keywords = extractKeywordsFromMultiplePDFs(combinedContent);
    
    // Generate comprehensive search queries
    const searchQueries = generateComprehensiveSearchQueries(combinedContent, keywords);
    
    // Get YouTube recommendations
    const recommendations = await getYouTubeRecommendations(searchQueries, maxResults);

    res.json({
      pdfIds,
      pdfCount: pdfs.length,
      recommendations,
      searchQueries
    });
  } catch (error) {
    console.error('Batch YouTube recommendations error:', error);
    
    // Return mock recommendations
    const mockRecommendations = getMockYouTubeRecommendations('batch');
    res.json({
      pdfIds: req.body.pdfIds,
      recommendations: mockRecommendations,
      note: 'Mock recommendations (YouTube API not configured)'
    });
  }
});

// Helper function to extract keywords from PDF content
function extractKeywordsFromPDF(pdf) {
  const text = pdf.content.extractedText || '';
  const title = pdf.originalName || '';
  const subject = pdf.metadata?.subject || '';
  
  // Extract key terms (simplified keyword extraction)
  const keywords = [];
  
  // Add subject-related terms
  if (subject) {
    keywords.push(subject.toLowerCase());
  }
  
  // Extract important words from title
  const titleWords = title.toLowerCase()
    .split(/[\s\-_]+/)
    .filter(word => word.length > 3 && !isCommonWord(word));
  keywords.push(...titleWords);
  
  // Extract key concepts from content (simplified)
  const contentWords = text.toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 4 && 
      !isCommonWord(word) && 
      !/^\d+$/.test(word)
    );
  
  // Get most frequent words
  const wordFreq = {};
  contentWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  const topWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
  
  keywords.push(...topWords);
  
  return [...new Set(keywords)].slice(0, 15);
}

// Helper function to extract keywords from multiple PDFs
function extractKeywordsFromMultiplePDFs(pdfs) {
  const allKeywords = [];
  
  pdfs.forEach(pdf => {
    const keywords = extractKeywordsFromText(pdf.content);
    allKeywords.push(...keywords);
  });
  
  // Combine and deduplicate
  const combinedFreq = {};
  allKeywords.forEach(keyword => {
    combinedFreq[keyword] = (combinedFreq[keyword] || 0) + 1;
  });
  
  return Object.entries(combinedFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([keyword]) => keyword);
}

// Helper function to extract keywords from text
function extractKeywordsFromText(text) {
  return text.toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 4 && 
      !isCommonWord(word) && 
      !/^\d+$/.test(word)
    )
    .slice(0, 10);
}

// Helper function to check if word is common
function isCommonWord(word) {
  const commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
    'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ];
  return commonWords.includes(word);
}

// Helper function to generate search queries
function generateSearchQueries(pdf, keywords) {
  const queries = [];
  const subject = pdf.metadata?.subject || 'Physics';
  const grade = 'Class 11'; // Could be extracted from PDF metadata
  
  // Basic subject + grade queries
  queries.push(`${subject} ${grade} tutorial`);
  queries.push(`${subject} ${grade} explanation`);
  queries.push(`${subject} ${grade} concepts`);
  
  // Topic-specific queries
  const topKeywords = keywords.slice(0, 5);
  topKeywords.forEach(keyword => {
    queries.push(`${keyword} ${subject} tutorial`);
    queries.push(`${keyword} explanation`);
  });
  
  return [...new Set(queries)].slice(0, 5);
}

// Helper function to generate comprehensive search queries
function generateComprehensiveSearchQueries(pdfs, keywords) {
  const queries = [];
  const subjects = [...new Set(pdfs.map(pdf => pdf.title.split(' ')[0]))];
  
  subjects.forEach(subject => {
    queries.push(`${subject} Class 11 complete tutorial`);
    queries.push(`${subject} concepts explained`);
    queries.push(`${subject} study guide`);
  });
  
  // Add keyword-based queries
  keywords.slice(0, 10).forEach(keyword => {
    queries.push(`${keyword} tutorial`);
    queries.push(`${keyword} explained`);
  });
  
  return [...new Set(queries)].slice(0, 8);
}

// Helper function to get YouTube recommendations
async function getYouTubeRecommendations(searchQueries, maxResults) {
  const recommendations = [];
  
  for (const query of searchQueries.slice(0, 3)) {
    try {
      const response = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: Math.ceil(maxResults / 3),
        order: 'relevance',
        videoDuration: 'medium', // 4-20 minutes
        videoDefinition: 'high',
        relevanceLanguage: 'en'
      });
      
      if (response.data.items) {
        response.data.items.forEach(item => {
          recommendations.push({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            searchQuery: query,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          });
        });
      }
    } catch (error) {
      console.error(`YouTube API error for query "${query}":`, error.message);
    }
  }
  
  return recommendations.slice(0, maxResults);
}

// Mock YouTube recommendations for when API is not configured
function getMockYouTubeRecommendations(pdfId) {
  const mockVideos = [
    {
      videoId: 'dQw4w9WgXcQ',
      title: 'Physics Class 11 - Complete Tutorial Series',
      description: 'Comprehensive physics tutorial covering all Class 11 concepts with detailed explanations and examples.',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      channelTitle: 'Physics Made Easy',
      publishedAt: '2023-01-15T10:00:00Z',
      searchQuery: 'physics class 11 tutorial',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      videoId: 'jNQXAC9IVRw',
      title: 'NCERT Physics - Units and Measurements Explained',
      description: 'Detailed explanation of units and measurements chapter from NCERT Class 11 Physics textbook.',
      thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg',
      channelTitle: 'NCERT Solutions',
      publishedAt: '2023-02-01T14:30:00Z',
      searchQuery: 'ncert physics units measurements',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
    },
    {
      videoId: 'kJzIud2XFSQ',
      title: 'Motion in Straight Line - Physics Concepts',
      description: 'Learn about motion in straight line with examples, formulas, and practice problems.',
      thumbnail: 'https://img.youtube.com/vi/kJzIud2XFSQ/mqdefault.jpg',
      channelTitle: 'Physics Concepts',
      publishedAt: '2023-02-15T09:15:00Z',
      searchQuery: 'motion straight line physics',
      url: 'https://www.youtube.com/watch?v=kJzIud2XFSQ'
    },
    {
      videoId: 'fJse7eBktv8',
      title: 'Physics Problem Solving Techniques',
      description: 'Master physics problem solving with step-by-step techniques and common mistakes to avoid.',
      thumbnail: 'https://img.youtube.com/vi/fJse7eBktv8/mqdefault.jpg',
      channelTitle: 'Physics Pro',
      publishedAt: '2023-03-01T16:45:00Z',
      searchQuery: 'physics problem solving',
      url: 'https://www.youtube.com/watch?v=fJse7eBktv8'
    },
    {
      videoId: 'tgbNymZ7vqY',
      title: 'Class 11 Physics - Quick Revision',
      description: 'Quick revision of important physics concepts for Class 11 students with mnemonics and tricks.',
      thumbnail: 'https://img.youtube.com/vi/tgbNymZ7vqY/mqdefault.jpg',
      channelTitle: 'Quick Learn Physics',
      publishedAt: '2023-03-10T11:20:00Z',
      searchQuery: 'physics class 11 revision',
      url: 'https://www.youtube.com/watch?v=tgbNymZ7vqY'
    }
  ];
  
  return mockVideos;
}

module.exports = router;
