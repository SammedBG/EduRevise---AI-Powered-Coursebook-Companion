const express = require('express');
const OpenAI = require('openai');
const axios = require('axios');
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
    const { content, pdfContext } = req.body;
    
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

    // Get relevant context from PDFs (use pdfContext from request, fallback to chat.pdfContext)
    const selectedPdfs = pdfContext && pdfContext.length > 0 ? pdfContext : chat.pdfContext;
    console.log('Getting context for PDFs:', selectedPdfs);
    const context = await getRelevantContext(content, selectedPdfs);
    
    // Generate response using LLM
    const response = await generateResponse(content, context, chat.messages);

    // Add assistant message with citations
    chat.messages.push({
      role: 'assistant',
      content: response.content || 'I apologize, but I could not generate a response at this time. Please try again.',
      citations: response.citations || [],
      timestamp: new Date()
    });

    // Auto-generate chat title if it's still "New Chat" and this is the first exchange
    if (chat.title === 'New Chat' && chat.messages.length === 2) {
      try {
        chat.title = await generateChatTitle(content);
      } catch (error) {
        console.error('Chat title generation failed:', error.message);
        // Use fallback title generation
        const words = content.toLowerCase().split(/\s+/);
        const importantWords = words.filter(word => 
          word.length > 3 && 
          !['what', 'how', 'why', 'when', 'where', 'explain', 'tell', 'about', 'question'].includes(word)
        );
        if (importantWords.length > 0) {
          chat.title = importantWords.slice(0, 3).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        } else {
          chat.title = 'Study Chat';
        }
      }
    }

    await chat.save();

    res.json({ 
      message: {
        role: 'assistant',
        content: response.content || 'I apologize, but I could not generate a response at this time. Please try again.',
        citations: response.citations || [],
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

// Helper function to generate query embedding
async function generateQueryEmbedding(query) {
  try {
    // Try Gemini API first (FREE embeddings)
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      
      const result = await model.embedContent(query);
      const embedding = result.embedding.values;
      
      if (embedding && embedding.length > 0) {
        console.log('Query embedding generated: Yes (Gemini)');
        return embedding;
      }
    }
    
    // Try OpenAI API
    if (process.env.OPENAI_API_KEY) {
      const response = await axios.post('https://api.openai.com/v1/embeddings', {
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.data && response.data.data[0]) {
        console.log('Query embedding generated: Yes (OpenAI)');
        return response.data.data[0].embedding;
      }
    }
    
    console.warn('No embedding API configured - using keyword search only');
    return null;
  } catch (error) {
    console.error('Query embedding generation failed:', error);
    return null;
  }
}

// Auto-generate chat title from user's first message
async function generateChatTitle(userMessage) {
  try {
    // Try GROQ API first
    if (process.env.GROQ_API_KEY) {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, descriptive title (max 40 characters) for a study chat based on the user\'s question. Focus on the main topic or subject. Examples: "Physics - Laws of Motion", "Math - Algebra", "Biology - Cell Structure"'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content.trim().replace(/['"]/g, '');
      }
    }
    
    // Fallback: simple keyword extraction
    const words = userMessage.toLowerCase().split(/\s+/);
    const importantWords = words.filter(word => 
      word.length > 3 && 
      !['what', 'how', 'why', 'when', 'where', 'explain', 'tell', 'about', 'question'].includes(word)
    );
    
    if (importantWords.length > 0) {
      return importantWords.slice(0, 3).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    return 'Study Chat';
  } catch (error) {
    console.error('Chat title generation failed:', error.message);
    return 'Study Chat';
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
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

// Helper function to get relevant context from PDFs with hybrid search
async function getRelevantContext(query, pdfIds) {
  try {
    console.log('Getting context for PDFs:', pdfIds);
    
    // First try to find PDFs with processed chunks
    const processedPdfs = await PDF.find({ 
      _id: { $in: pdfIds },
      'content.processed': true,
      'content.chunks': { $exists: true, $not: { $size: 0 } }
    });

    let relevantChunks = [];
    
    // Generate query embedding for semantic search
    const queryEmbedding = await generateQueryEmbedding(query);
    console.log('Query embedding generated:', queryEmbedding ? 'Yes' : 'No');

    // Process chunks from processed PDFs with hybrid search
    for (const pdf of processedPdfs) {
      if (pdf.content.chunks && pdf.content.chunks.length > 0) {
        for (const chunk of pdf.content.chunks) {
          let score = 0;
          
          // 1. Keyword-based scoring (existing logic)
          const queryWords = query.toLowerCase().split(/\s+/);
          const chunkWords = chunk.text.toLowerCase();
          
          let keywordScore = 0;
          queryWords.forEach(word => {
            if (chunkWords.includes(word) && word.length > 2) {
              keywordScore += 1;
            }
          });
          
          // 2. Semantic similarity scoring (new)
          let semanticScore = 0;
          if (queryEmbedding && chunk.embedding && chunk.embedding.length > 0) {
            semanticScore = cosineSimilarity(queryEmbedding, chunk.embedding);
          }
          
          // 3. Hybrid scoring (weighted combination)
          // Give more weight to semantic similarity when available
          if (semanticScore > 0) {
            score = (semanticScore * 0.7) + (keywordScore * 0.3);
          } else {
            score = keywordScore;
          }

          if (score > 0.1) { // Lower threshold to catch more relevant content
            relevantChunks.push({
              text: chunk.text,
              pageNumber: chunk.pageNumber,
              chunkIndex: chunk.chunkIndex,
              pdfId: pdf._id,
              relevanceScore: score,
              keywordScore: keywordScore,
              semanticScore: semanticScore
            });
          }
        }
      }
    }

    // If no processed chunks found, use raw extracted text
    if (relevantChunks.length === 0) {
      console.log('No processed chunks found, using raw extracted text');
      
      const allPdfs = await PDF.find({ 
        _id: { $in: pdfIds },
        'content.extractedText': { $exists: true, $ne: '' }
      });

      for (const pdf of allPdfs) {
        if (pdf.content.extractedText && pdf.content.extractedText.length > 50) {
          const queryWords = query.toLowerCase().split(/\s+/);
          const text = pdf.content.extractedText.toLowerCase();
          
          let score = 0;
          queryWords.forEach(word => {
            if (text.includes(word) && word.length > 2) {
              score += 1;
            }
          });

          if (score > 0) {
            // Create chunks from the raw text
            const textChunks = createTextChunks(pdf.content.extractedText, pdf._id);
            
            // Add the most relevant chunks
            relevantChunks.push({
              text: textChunks[0]?.text || pdf.content.extractedText.substring(0, 1000),
              pdfId: pdf._id,
              pageNumber: 1,
              relevanceScore: score,
              chunkIndex: 0
            });
          }
        }
      }
    }

    console.log(`Found ${relevantChunks.length} relevant chunks`);

    // Sort by relevance and return top 3 chunks, with truncation to keep context small
    const topChunks = relevantChunks
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(c => ({
        ...c,
        text: (c.text || '').slice(0, 900) // keep each chunk under ~900 chars
      }));

    return topChunks;
  } catch (error) {
    console.error('Error getting relevant context:', error);
    return [];
  }
}

// Helper function to create text chunks (same as in pdfs.js)
function createTextChunks(text, pdfId) {
  const chunks = [];
  const maxChunkSize = 1000;
  const overlap = 150;
  const minChunkSize = 100;

  let startIndex = 0;
  let chunkIndex = 0;

  const cleanedText = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  while (startIndex < cleanedText.length) {
    let endIndex = Math.min(startIndex + maxChunkSize, cleanedText.length);
    
    if (endIndex < cleanedText.length) {
      const lastPeriod = cleanedText.lastIndexOf('.', endIndex);
      const lastExclamation = cleanedText.lastIndexOf('!', endIndex);
      const lastQuestion = cleanedText.lastIndexOf('?', endIndex);
      const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      const lastNewline = cleanedText.lastIndexOf('\n', endIndex);
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
        pageNumber: Math.floor(startIndex / (cleanedText.length / 10)) + 1,
        startIndex,
        endIndex,
        chunkIndex: chunkIndex++,
        wordCount: chunkText.split(/\s+/).length,
        relevanceScore: 0.5
      });
    }

    startIndex = Math.max(endIndex - overlap, startIndex + minChunkSize);
  }

  return chunks;
}

// Helper function to generate LLM response
async function generateResponse(userMessage, context, messageHistory) {
  try {
    // Build context string with proper citation format
    let contextString = '';
    const citations = [];

    context.forEach((chunk, index) => {
      const pageNumber = typeof chunk.pageNumber === 'number' ? chunk.pageNumber : 1;
      const sourceLabel = `Source ${index + 1} (Page ${pageNumber})`;
      const chunkText = chunk.text || '';
      contextString += `${sourceLabel}:\n${chunkText}\n\n`;
      
      // Create citation with proper format
      citations.push({
        pdfId: chunk.pdfId,
        pageNumber: pageNumber,
        snippet: chunkText.substring(0, 200) + (chunkText.length > 200 ? '...' : ''),
        relevanceScore: chunk.relevanceScore || 0,
        sourceLabel: sourceLabel,
        fullText: chunkText
      });
    });

    // Cap total context length to avoid LLM 400s
    const MAX_CONTEXT_LEN = 2000;
    if (contextString.length > MAX_CONTEXT_LEN) {
      contextString = contextString.slice(0, MAX_CONTEXT_LEN);
    }

    // Build conversation history
    let conversationHistory = '';
    messageHistory.slice(-6).forEach(msg => {
      conversationHistory += `${msg.role}: ${msg.content}\n`;
    });

    // Try GROQ API first (fast and reliable)
    if (process.env.GROQ_API_KEY) {
      const response = await generateResponseWithGROQ(userMessage, contextString, conversationHistory, citations);
      
      // Refine the response for accuracy (only if main response is short)
      if (response && response.content && citations.length > 0 && response.content.length < 300) {
        const refinedResponse = await refineResponseWithGROQ(response.content, userMessage, contextString, citations);
        if (refinedResponse && refinedResponse.content) {
          return refinedResponse;
        }
      }
      
      return response;
    }
    
    // Try Hugging Face API
    if (process.env.HF_API_TOKEN) {
      return await generateResponseWithHuggingFace(userMessage, contextString, conversationHistory, citations);
    }

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

// Generate response using GROQ API
// Refine response for better accuracy
async function refineResponseWithGROQ(initialResponse, userMessage, contextString, citations) {
  try {
    // Reduce context size for refinement to avoid 400 errors
    const shortContext = contextString.slice(0, 800);
    const shortResponse = initialResponse.slice(0, 200);
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Improve this answer for accuracy and completeness. Keep citations. Be concise.`
        },
        {
          role: 'user',
          content: `Context: ${shortContext}\n\nQuestion: ${userMessage}\n\nAnswer to improve: ${shortResponse}\n\nBetter answer:`
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      return {
        content: response.data.choices[0].message.content.trim(),
        citations: citations
      };
    }
  } catch (error) {
    console.error('Response refinement failed:', error.message);
    // Return original response if refinement fails
    return {
      content: initialResponse,
      citations: citations
    };
  }
}

async function generateResponseWithGROQ(userMessage, contextString, conversationHistory, citations) {
  const axios = require('axios');
  
  // Enhanced prompt with proper citation formatting
  const systemPrompt = `You are a precise study assistant. Answer questions based ONLY on the provided PDF content.

CITATION RULES:
1. Always cite sources using the format: "According to Source X (Page Y): 'exact quote from the source'"
2. Include 2-3 line quotes when citing specific information
3. If the answer is NOT in the context, say "I don't find this information in the provided PDF content"
4. Be accurate and always provide page numbers
5. Keep answers informative but concise
6. Use inline citations within your response, not just at the end`;

  const userPrompt = `PDF Content:
${contextString}

Question: ${userMessage}

Answer based on the PDF content above. Use proper citations like "According to Source 1 (Page 5): 'exact quote here'." If the information is not available in the content, clearly state that.`;

  try {
    console.log('Sending to GROQ with context length:', contextString.length);
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content;
      console.log('GROQ response received, length:', content.length);
      return { content, citations: citations.slice(0, 3) };
    } else {
      throw new Error('Invalid response format from GROQ');
    }
  } catch (error) {
    console.error('GROQ response generation failed:', error.response?.data || error.message);
    return generateMockResponse(userMessage, citations);
  }
}

// Generate response using Hugging Face API
async function generateResponseWithHuggingFace(userMessage, contextString, conversationHistory, citations) {
  const axios = require('axios');
  
  const prompt = `Context from PDFs:\n${contextString}\n\nQuestion: ${userMessage}\n\nAnswer based only on the context provided. Be concise and cite sources.`;

  try {
    const response = await axios.post('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
      inputs: prompt,
      parameters: {
        max_length: 500,
        temperature: 0.3,
        do_sample: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data[0].generated_text;
    return { content, citations: citations.slice(0, 3) };
  } catch (error) {
    console.error('Hugging Face response generation failed:', error);
    return generateMockResponse(userMessage, citations);
  }
}

// Mock response generator for demo purposes
async function generateMockResponse(userMessage, context) {
  let response = '';
  
  if (context && context.length > 0) {
    // Use actual PDF content if available
    const contextText = context[0].text || context[0];
    response = `Based on the PDF content you've uploaded, here's what I found:

"${contextText.substring(0, 300)}..."

This appears to be relevant to your question: "${userMessage}"

Note: This is a mock response. To get AI-powered answers based on your PDF content, please configure a GROQ, Hugging Face, Gemini, or OpenAI API key.`;
  } else {
    response = `I don't see any PDF content to answer your question "${userMessage}". 

Please make sure you:
1. Have uploaded a PDF
2. Selected it in the chat interface
3. The PDF has been processed successfully

Note: This is a mock response. To get AI-powered answers, please configure an LLM API key (GROQ, Hugging Face, Gemini, or OpenAI).`;
  }
  
  return { 
    content: response, 
    citations: context.slice(0, 2) 
  };
}

module.exports = router;