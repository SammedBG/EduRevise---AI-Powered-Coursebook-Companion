const express = require('express');
const axios = require('axios');
const PDF = require('../models/PDF');
const { authenticateToken } = require('./auth');
const router = express.Router();

// YouTube Data API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Get YouTube recommendations based on PDF content
router.get('/recommendations/:pdfId', authenticateToken, async (req, res) => {
  try {
    const { pdfId } = req.params;
    const { maxResults = 10, category = 'educational' } = req.query;

    // Validate PDF ID
    if (!pdfId || !pdfId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid PDF ID', 
        code: 'INVALID_PDF_ID' 
      });
    }

    // Validate maxResults
    const maxResultsNum = parseInt(maxResults);
    if (isNaN(maxResultsNum) || maxResultsNum < 1 || maxResultsNum > 50) {
      return res.status(400).json({ 
        error: 'maxResults must be between 1 and 50', 
        code: 'INVALID_MAX_RESULTS' 
      });
    }

    // Check if YouTube API key is configured
    if (!YOUTUBE_API_KEY) {
      return res.status(503).json({ 
        error: 'YouTube API not configured', 
        code: 'YOUTUBE_API_NOT_CONFIGURED' 
      });
    }

    // Get PDF and validate access
    const pdf = await PDF.findById(pdfId);
    if (!pdf) {
      return res.status(404).json({ 
        error: 'PDF not found', 
        code: 'PDF_NOT_FOUND' 
      });
    }

    if (pdf.uploadedBy.toString() !== req.userId && !pdf.isPublic) {
      return res.status(403).json({ 
        error: 'Access denied', 
        code: 'FORBIDDEN' 
      });
    }

    // Extract keywords from PDF content for search
    const keywords = extractKeywordsFromPDF(pdf);
    
    if (keywords.length === 0) {
      return res.status(400).json({ 
        error: 'Unable to extract keywords from PDF for video recommendations', 
        code: 'NO_KEYWORDS_EXTRACTED' 
      });
    }

    // Search for YouTube videos
    const recommendations = await searchYouTubeVideos(keywords, maxResultsNum, category);

    res.json({
      pdfId: pdf._id,
      pdfTitle: pdf.originalName || pdf.metadata?.title,
      keywords: keywords.slice(0, 10), // Return top 10 keywords used
      recommendations: recommendations,
      totalResults: recommendations.length
    });

  } catch (error) {
    console.error('YouTube recommendations error:', error);
    
    if (error.response?.status === 403) {
      return res.status(503).json({ 
        error: 'YouTube API quota exceeded or invalid API key', 
        code: 'YOUTUBE_API_QUOTA_EXCEEDED' 
      });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid YouTube API request', 
        code: 'YOUTUBE_API_INVALID_REQUEST' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch YouTube recommendations', 
      code: 'YOUTUBE_RECOMMENDATIONS_FAILED' 
    });
  }
});

// Get YouTube recommendations for multiple PDFs
router.post('/recommendations/batch', authenticateToken, async (req, res) => {
  try {
    const { pdfIds, maxResults = 10, category = 'educational' } = req.body || {};

    // Validate input
    if (!pdfIds || !Array.isArray(pdfIds) || pdfIds.length === 0) {
      return res.status(400).json({ 
        error: 'PDF IDs array is required', 
        code: 'MISSING_PDF_IDS' 
      });
    }

    if (pdfIds.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 PDFs allowed for batch recommendations', 
        code: 'TOO_MANY_PDFS' 
      });
    }

    const maxResultsNum = parseInt(maxResults);
    if (isNaN(maxResultsNum) || maxResultsNum < 1 || maxResultsNum > 20) {
      return res.status(400).json({ 
        error: 'maxResults must be between 1 and 20 for batch requests', 
        code: 'INVALID_MAX_RESULTS' 
      });
    }

    if (!YOUTUBE_API_KEY) {
      return res.status(503).json({ 
        error: 'YouTube API not configured', 
        code: 'YOUTUBE_API_NOT_CONFIGURED' 
      });
    }

    // Get PDFs and validate access
    const pdfs = await PDF.find({
      _id: { $in: pdfIds },
      $or: [
        { uploadedBy: req.userId },
        { isPublic: true }
      ]
    });

    if (pdfs.length === 0) {
      return res.status(404).json({ 
        error: 'No accessible PDFs found', 
        code: 'NO_ACCESSIBLE_PDFS' 
      });
    }

    // Extract combined keywords from all PDFs
    const allKeywords = [];
    pdfs.forEach(pdf => {
      const keywords = extractKeywordsFromPDF(pdf);
      allKeywords.push(...keywords);
    });

    // Remove duplicates and get most common keywords
    const keywordCounts = {};
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([keyword]) => keyword);

    if (topKeywords.length === 0) {
      return res.status(400).json({ 
        error: 'Unable to extract keywords from PDFs for video recommendations', 
        code: 'NO_KEYWORDS_EXTRACTED' 
      });
    }

    // Search for YouTube videos
    const recommendations = await searchYouTubeVideos(topKeywords, maxResultsNum, category);

    res.json({
      pdfIds: pdfs.map(pdf => pdf._id),
      pdfTitles: pdfs.map(pdf => pdf.originalName || pdf.metadata?.title),
      keywords: topKeywords,
      recommendations: recommendations,
      totalResults: recommendations.length
    });

  } catch (error) {
    console.error('Batch YouTube recommendations error:', error);
    
    if (error.response?.status === 403) {
      return res.status(503).json({ 
        error: 'YouTube API quota exceeded or invalid API key', 
        code: 'YOUTUBE_API_QUOTA_EXCEEDED' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch batch YouTube recommendations', 
      code: 'YOUTUBE_BATCH_RECOMMENDATIONS_FAILED' 
    });
  }
});

// Search YouTube for educational videos
async function searchYouTubeVideos(keywords, maxResults, category) {
  try {
    // Create search query from keywords
    const searchQuery = keywords.slice(0, 5).join(' ');
    
    // Build search parameters
    const searchParams = {
      part: 'snippet',
      q: `${searchQuery} tutorial lesson education`,
      type: 'video',
      maxResults: maxResults,
      order: 'relevance',
      videoDuration: 'medium', // 4-20 minutes
      videoDefinition: 'high',
      videoEmbeddable: 'true',
      key: YOUTUBE_API_KEY
    };

    // Add category filter if specified
    if (category === 'educational') {
      searchParams.videoCategoryId = '27'; // Education category
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: searchParams,
      timeout: 10000
    });

    if (!response.data || !response.data.items) {
      return [];
    }

    // Format the response
    const videos = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnail: {
        default: item.snippet.thumbnails.default?.url,
        medium: item.snippet.thumbnails.medium?.url,
        high: item.snippet.thumbnails.high?.url
      },
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
      relevanceScore: calculateRelevanceScore(item.snippet, keywords)
    }));

    // Sort by relevance score
    return videos.sort((a, b) => b.relevanceScore - a.relevanceScore);

  } catch (error) {
    console.error('YouTube search error:', error);
    throw error;
  }
}

// Extract keywords from PDF content
function extractKeywordsFromPDF(pdf) {
  try {
    let text = '';
    
    // Get text from different sources
    if (pdf.content?.extractedText) {
      text = pdf.content.extractedText;
    } else if (pdf.content?.chunks && pdf.content.chunks.length > 0) {
      text = pdf.content.chunks.map(chunk => chunk.text).join(' ');
    }

    if (!text || text.trim().length < 50) {
      // Fallback to filename analysis
      const filename = pdf.originalName || pdf.filename || '';
      return extractKeywordsFromFilename(filename);
    }

    // Clean and process text
    const cleanedText = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'from', 'into', 'onto', 'upon',
      'chapter', 'section', 'page', 'figure', 'table', 'example', 'definition', 'concept'
    ]);

    // Extract words and count frequency
    const words = cleanedText.split(' ')
      .filter(word => word.length > 3 && !stopWords.has(word))
      .filter(word => /^[a-z]+$/.test(word)); // Only alphabetic words

    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Get top keywords (most frequent, meaningful words)
    const topKeywords = Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
      .map(([word]) => word);

    return topKeywords;

  } catch (error) {
    console.error('Keyword extraction error:', error);
    return [];
  }
}

// Extract keywords from filename as fallback
function extractKeywordsFromFilename(filename) {
  try {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, ''); // Remove file extension
    const words = nameWithoutExt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 2);

    return words.slice(0, 5); // Return first 5 words
  } catch (error) {
    return [];
  }
}

// Calculate relevance score for a video based on keywords
function calculateRelevanceScore(snippet, keywords) {
  try {
    const title = (snippet.title || '').toLowerCase();
    const description = (snippet.description || '').toLowerCase();
    const channelTitle = (snippet.channelTitle || '').toLowerCase();
    
    let score = 0;
    
    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      
      // Higher weight for title matches
      if (title.includes(lowerKeyword)) {
        score += 3;
      }
      
      // Medium weight for description matches
      if (description.includes(lowerKeyword)) {
        score += 1;
      }
      
      // Lower weight for channel matches (educational channels)
      if (channelTitle.includes(lowerKeyword)) {
        score += 0.5;
      }
    });

    // Bonus for educational keywords
    const educationalKeywords = ['tutorial', 'lesson', 'course', 'learn', 'education', 'explain', 'guide'];
    educationalKeywords.forEach(keyword => {
      if (title.includes(keyword) || description.includes(keyword)) {
        score += 1;
      }
    });

    return score;
  } catch (error) {
    return 0;
  }
}

// Get YouTube video details (for additional info)
router.get('/video/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({ 
        error: 'Invalid YouTube video ID', 
        code: 'INVALID_VIDEO_ID' 
      });
    }

    if (!YOUTUBE_API_KEY) {
      return res.status(503).json({ 
        error: 'YouTube API not configured', 
        code: 'YOUTUBE_API_NOT_CONFIGURED' 
      });
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
        key: YOUTUBE_API_KEY
      },
      timeout: 10000
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      return res.status(404).json({ 
        error: 'Video not found', 
        code: 'VIDEO_NOT_FOUND' 
      });
    }

    const video = response.data.items[0];
    
    res.json({
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      thumbnail: {
        default: video.snippet.thumbnails.default?.url,
        medium: video.snippet.thumbnails.medium?.url,
        high: video.snippet.thumbnails.high?.url,
        standard: video.snippet.thumbnails.standard?.url,
        maxres: video.snippet.thumbnails.maxres?.url
      },
      url: `https://www.youtube.com/watch?v=${video.id}`,
      embedUrl: `https://www.youtube.com/embed/${video.id}`
    });

  } catch (error) {
    console.error('YouTube video details error:', error);
    
    if (error.response?.status === 403) {
      return res.status(503).json({ 
        error: 'YouTube API quota exceeded or invalid API key', 
        code: 'YOUTUBE_API_QUOTA_EXCEEDED' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch video details', 
      code: 'YOUTUBE_VIDEO_DETAILS_FAILED' 
    });
  }
});

module.exports = router;
