const express = require('express');
const OpenAI = require('openai');
const Chat = require('../models/Chat');
const PDF = require('../models/PDF');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Initialize OpenAI client (enabled only if key is provided)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Helper function to list available Gemini models
async function listAvailableGeminiModels(apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`,
      { method: 'GET' }
    );
    const data = await response.json();
    return data.models
      .filter(model => model.supportedGenerationMethods.includes('generateContent'))
      .map(model => model.name);
  } catch (error) {
    console.error('Error fetching available Gemini models:', error.message);
    return [];
  }
}

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

    // If OpenAI is configured, use it
    if (openai) {
      const messages = [
        {
          role: 'system',
          content:
            'You are a precise study assistant. Answer strictly from the provided context. If the answer is not present in the context, say you do not find it. Cite sources as "According to Source X:" and include a short quote.'
        },
        {
          role: 'user',
          content:
            `Context from PDFs (with Source numbers):\n${contextString}\n\nConversation so far:\n${conversationHistory}\n\nCurrent question:\n${userMessage}\n\nInstructions:\n- Be concise and accurate.\n- Include 1-2 citations like: According to Source 2: "...".`
        }
      ];

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages
      });

      const content = completion.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      return { content, citations: citations.slice(0, 3) };
    }

    // If Gemini is configured, use it
    if (gemini) {
      const prompt = [
        'You are a precise study assistant. Answer strictly from the provided context. If the answer is not present in the context, say you do not find it. Cite sources as "According to Source X:" and include a short quote.',
        '',
        'Context from PDFs (with Source numbers):',
        contextString,
        '',
        'Conversation so far:',
        conversationHistory,
        '',
        'Current question:',
        userMessage,
        '',
        'Instructions:',
        '- Be concise and accurate.',
        '- Include 1-2 citations like: According to Source 2: "...".'
      ].join('\n');

      // Dynamically fetch available models
      const candidates = await listAvailableGeminiModels(process.env.GEMINI_API_KEY);
      if (candidates.length === 0) {
        console.warn('No Gemini models available for generateContent');
        throw new Error('No valid Gemini models found');
      }

      let lastErr;
      for (const modelName of candidates) {
        try {
          const model = gemini.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const content = result.response?.text();
          if (content) return { content, citations: citations.slice(0, 3) };
        } catch (e) {
          lastErr = e;
          console.warn(`Gemini model ${modelName} failed:`, e.message);
          continue;
        }
      }
      console.error('All Gemini models failed:', lastErr?.message || lastErr);
      throw new Error('Failed to generate response with Gemini');
    }

    // Fallback to mock if no LLM is configured
    console.error('No LLM configured: Missing both OpenAI and Gemini API keys');
    const response = await generateMockResponse(userMessage, contextString);
    return { content: response, citations: citations.slice(0, 3) };
  } catch (error) {
    console.error('Error generating response:', error.message);
    return {
      content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
      citations: []
    };
  }
}

// Mock response generator for demo purposes
async function generateMockResponse(userMessage, context) {
  const responses = [
    `Based on the content you've uploaded, I can help you understand the concepts. ${userMessage.includes('what') ? 'Let me explain what I found in your study materials.' : 'Here\'s what I can tell you about this topic.'}`,
    `According to your study materials, ${userMessage.toLowerCase().includes('physics') ? 'this physics concept involves fundamental principles that are important to understand.' : 'this topic covers several key areas that you should focus on.'}`,
    `I found relevant information in your PDFs that can help answer your question. The material suggests focusing on the core concepts and understanding the underlying principles.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = router;