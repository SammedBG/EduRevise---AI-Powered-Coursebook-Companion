const express = require('express');
const OpenAI = require('openai');
const Chat = require('../models/Chat');
const PDF = require('../models/PDF');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Initialize OpenAI (using free tier or alternative)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Get all chats for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({ 
      userId: req.userId,
      isActive: true 
    }).sort({ updatedAt: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create new chat
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, pdfContext } = req.body;

    const chat = new Chat({
      userId: req.userId,
      title: title || 'New Chat',
      pdfContext: pdfContext || [],
      messages: []
    });

    await chat.save();

    res.status(201).json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get specific chat
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Send message
router.post('/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    });

    // Get relevant context from PDFs
    const context = await getRelevantContext(content, chat.pdfContext);
    
    // Generate response using LLM
    const response = await generateResponse(content, context, chat.messages);

    // Add assistant message with citations
    chat.messages.push({
      role: 'assistant',
      content: response.content,
      citations: response.citations,
      timestamp: new Date()
    });

    await chat.save();

    res.json({ 
      message: {
        role: 'assistant',
        content: response.content,
        citations: response.citations,
        timestamp: chat.messages[chat.messages.length - 1].timestamp
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete chat
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Chat.findByIdAndDelete(req.params.id);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Helper function to get relevant context from PDFs
async function getRelevantContext(query, pdfIds) {
  try {
    const pdfs = await PDF.find({ 
      _id: { $in: pdfIds },
      'content.processed': true 
    });

    let relevantChunks = [];

    for (const pdf of pdfs) {
      if (pdf.content.chunks) {
        for (const chunk of pdf.content.chunks) {
          // Simple relevance scoring based on keyword matching
          const queryWords = query.toLowerCase().split(/\s+/);
          const chunkWords = chunk.text.toLowerCase();
          
          let score = 0;
          queryWords.forEach(word => {
            if (chunkWords.includes(word)) {
              score += 1;
            }
          });

          if (score > 0) {
            relevantChunks.push({
              ...chunk,
              pdfId: pdf._id,
              relevanceScore: score
            });
          }
        }
      }
    }

    // Sort by relevance and return top chunks
    return relevantChunks
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  } catch (error) {
    console.error('Error getting relevant context:', error);
    return [];
  }
}

// Helper function to generate LLM response
async function generateResponse(userMessage, context, messageHistory) {
  try {
    // Build context string
    let contextString = '';
    const citations = [];

    context.forEach((chunk, index) => {
      contextString += `Source ${index + 1}:\n${chunk.text}\n\n`;
      citations.push({
        pdfId: chunk.pdfId,
        pageNumber: chunk.pageNumber,
        snippet: chunk.text.substring(0, 200) + '...',
        relevanceScore: chunk.relevanceScore
      });
    });

    // Build conversation history
    let conversationHistory = '';
    messageHistory.slice(-6).forEach(msg => {
      conversationHistory += `${msg.role}: ${msg.content}\n`;
    });

    // Create prompt
    const systemPrompt = `You are a helpful study assistant for school students. Use the provided context from PDFs to answer questions accurately. Always cite your sources by referencing the source numbers in your response.

Context from PDFs:
${contextString}

Conversation History:
${conversationHistory}

Instructions:
1. Answer the user's question based on the provided context
2. If the context doesn't contain relevant information, say so politely
3. Always cite sources using format: "According to Source X: [quote]"
4. Keep responses clear and educational
5. Be encouraging and supportive`;

    // For demo purposes, we'll use a simple response since we don't have actual LLM API
    // In production, you would call the actual LLM API here
    const response = await generateMockResponse(userMessage, contextString);

    return {
      content: response,
      citations: citations.slice(0, 3) // Limit to top 3 citations
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
      citations: []
    };
  }
}

// Mock response generator for demo purposes
async function generateMockResponse(userMessage, context) {
  // This is a simple mock - in production, replace with actual LLM API call
  const responses = [
    `Based on the content you've uploaded, I can help you understand the concepts. ${userMessage.includes('what') ? 'Let me explain what I found in your study materials.' : 'Here\'s what I can tell you about this topic.'}`,
    `According to your study materials, ${userMessage.toLowerCase().includes('physics') ? 'this physics concept involves fundamental principles that are important to understand.' : 'this topic covers several key areas that you should focus on.'}`,
    `I found relevant information in your PDFs that can help answer your question. The material suggests focusing on the core concepts and understanding the underlying principles.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = router;
