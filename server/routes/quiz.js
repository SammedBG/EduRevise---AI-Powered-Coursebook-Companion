const express = require('express');
const Quiz = require('../models/Quiz');
const PDF = require('../models/PDF');
const Progress = require('../models/Progress');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Generate quiz from PDFs
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { pdfIds, difficulty = 'mixed', questionTypes = ['mcq', 'saq', 'laq'], numQuestions = 10 } = req.body;

    if (!pdfIds || pdfIds.length === 0) {
      return res.status(400).json({ error: 'At least one PDF must be selected' });
    }

    // Get PDFs and their content (allow unprocessed PDFs too)
    const pdfs = await PDF.find({ _id: { $in: pdfIds } });

    if (pdfs.length === 0) {
      return res.status(400).json({ error: 'No PDFs found for the provided ids' });
    }

    // Extract content for quiz generation
    let allContent = '';
    const contentByPdf = {};

    pdfs.forEach(pdf => {
      const text = (pdf.content && pdf.content.extractedText) ? pdf.content.extractedText : '';
      contentByPdf[pdf._id] = text;
      if (text && text.trim().length > 0) {
        allContent += text + '\n\n';
      }
    });

    if (!allContent || allContent.trim().length < 50) {
      return res.status(400).json({ error: 'Not enough text content in selected PDFs to generate a quiz. Please process PDFs first or upload PDFs with selectable text.' });
    }

    // Generate questions (mock implementation)
    const questions = await generateQuestions(allContent, questionTypes, difficulty, numQuestions, pdfs);

    // Create quiz
    const quiz = new Quiz({
      title: `Quiz from ${pdfs.length} PDF${pdfs.length > 1 ? 's' : ''}`,
      description: `Generated quiz based on your selected study materials`,
      questions,
      pdfContext: pdfIds,
      createdBy: req.userId,
      difficulty,
      timeLimit: 30
    });

    await quiz.save();

    res.status(201).json({ quiz });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Get user's quizzes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })
      .populate('pdfContext', 'originalName');

    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get specific quiz
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('pdfContext', 'originalName');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Submit quiz answers
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Score the answers with detailed results
    const results = scoreQuizDetailed(quiz.questions, answers);
    
    // Debug logging
    console.log('Results type check:', {
      questionResultsType: typeof results.questionResults,
      isArray: Array.isArray(results.questionResults),
      length: results.questionResults?.length
    });
    
    // Save detailed attempt with proper data types
    const attempt = {
      userId: req.userId,
      answers: Array.isArray(answers) ? answers : [],
      timeSpent: parseInt(timeSpent) || 0,
      score: parseInt(results.earnedPoints) || 0,
      percentage: parseInt(results.percentage) || 0,
      correctAnswers: parseInt(results.correctCount) || 0,
      totalQuestions: parseInt(results.totalQuestions) || 0,
      questionResults: Array.isArray(results.questionResults) ? results.questionResults : [],
      submittedAt: new Date(),
      difficulty: String(quiz.difficulty || 'mixed'),
      questionTypes: Array.isArray(quiz.questions) ? quiz.questions.map(q => String(q.type)) : []
    };

    quiz.attempts.push(attempt);
    await quiz.save();

    // Update progress
    await updateUserProgress(req.userId, quiz.pdfContext, results);

    res.json({
      results: {
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctCount,
        percentage: results.percentage,
        earnedPoints: results.earnedPoints,
        totalPoints: results.totalPoints,
        questionResults: results.questionResults,
        timeSpent: timeSpent || 0
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz results
router.get('/:id/results', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user's attempts for this quiz
    const userAttempts = quiz.attempts.filter(attempt => 
      attempt.userId.toString() === req.userId
    );

    res.json({ attempts: userAttempts });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// Generate new questions for existing quiz
router.post('/:id/regenerate', authenticateToken, async (req, res) => {
  try {
    const { difficulty = 'mixed', questionTypes = ['mcq', 'saq', 'laq'], numQuestions = 10 } = req.body;
    
    const existingQuiz = await Quiz.findById(req.params.id);
    if (!existingQuiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    if (existingQuiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get PDFs and their content
    const pdfs = await PDF.find({ _id: { $in: existingQuiz.pdfContext } });
    if (pdfs.length === 0) {
      return res.status(400).json({ error: 'No PDFs found for this quiz' });
    }
    
    // Extract content
    let allContent = '';
    pdfs.forEach(pdf => {
      const text = (pdf.content && pdf.content.extractedText) ? pdf.content.extractedText : '';
      if (text && text.trim().length > 0) {
        allContent += text + '\n\n';
      }
    });
    
    if (!allContent || allContent.trim().length < 50) {
      return res.status(400).json({ error: 'Not enough text content to generate new questions' });
    }
    
    // Generate new questions
    const newQuestions = await generateQuestions(allContent, questionTypes, difficulty, numQuestions, pdfs);
    
    // Create new quiz with same PDF context
    const newQuiz = new Quiz({
      title: `Quiz from ${pdfs.length} PDF${pdfs.length > 1 ? 's' : ''} (New Set)`,
      description: `New quiz generated from the same study materials`,
      questions: newQuestions,
      pdfContext: existingQuiz.pdfContext,
      createdBy: req.userId,
      difficulty,
      timeLimit: 30
    });
    
    await newQuiz.save();
    
    res.status(201).json({ quiz: newQuiz });
  } catch (error) {
    console.error('Regenerate quiz error:', error);
    res.status(500).json({ error: 'Failed to regenerate quiz' });
  }
});

// Delete quiz
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Helper function to generate questions using LLM
async function generateQuestions(content, questionTypes, difficulty, numQuestions, pdfs) {
  console.log('Generating questions with content length:', content.length);
  
  try {
    // Try GROQ API first (fast and reliable)
    if (process.env.GROQ_API_KEY) {
      console.log('Trying GROQ API...');
      return await generateQuestionsWithGROQ(content, questionTypes, difficulty, numQuestions, pdfs);
    }
    
    // Try Hugging Face API
    if (process.env.HF_API_TOKEN) {
      console.log('Trying Hugging Face API...');
      return await generateQuestionsWithHuggingFace(content, questionTypes, difficulty, numQuestions, pdfs);
    }
    
    // Try Gemini API
    if (process.env.GEMINI_API_KEY) {
      console.log('Trying Gemini API...');
      return await generateQuestionsWithGemini(content, questionTypes, difficulty, numQuestions, pdfs);
    }
    
    // Try OpenAI API
    if (process.env.OPENAI_API_KEY) {
      console.log('Trying OpenAI API...');
      return await generateQuestionsWithOpenAI(content, questionTypes, difficulty, numQuestions, pdfs);
    }
    
    // Fallback to mock implementation
    console.log('No LLM APIs available, using mock questions');
    return generateMockQuestions(content, questionTypes, difficulty, numQuestions, pdfs);
  } catch (error) {
    console.error('Error generating questions:', error);
    return generateMockQuestions(content, questionTypes, difficulty, numQuestions, pdfs);
  }
}

// Generate questions using GROQ API
async function generateQuestionsWithGROQ(content, questionTypes, difficulty, numQuestions, pdfs) {
  const axios = require('axios');
  
  const prompt = `Generate ${numQuestions} quiz questions from this content: ${content.substring(0, 3000)}

Return JSON format:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Correct answer",
      "explanation": "Explanation",
      "difficulty": "easy",
      "points": 1
    }
  ]
}`;

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Generate educational quiz questions. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      const text = response.data.choices[0].message.content;
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.questions || [];
      }
    }
  } catch (error) {
    console.error('GROQ question generation failed:', error.response?.data || error.message);
  }
  
  return generateMockQuestions(content, questionTypes, difficulty, numQuestions, pdfs);
}

// Generate questions using Hugging Face API
async function generateQuestionsWithHuggingFace(content, questionTypes, difficulty, numQuestions, pdfs) {
  const axios = require('axios');
  
  const prompt = `Generate ${numQuestions} educational quiz questions from the following PDF content. 
  
  Content: ${content.substring(0, 4000)} // Limit content for API

  Requirements:
  - Question types: ${questionTypes.join(', ')}
  - Difficulty: ${difficulty}
  - Create a mix of question types
  - Each question must have detailed explanations
  - For MCQs: provide 4 options with one correct answer
  - For SAQs: ask for short explanations (2-3 sentences)
  - For LAQs: ask for detailed discussions (paragraph length)
  - Include source references to PDF content

  Return ONLY valid JSON in this exact format:
  {
    "questions": [
      {
        "type": "mcq|saq|laq",
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ
        "correctAnswer": "Correct answer text",
        "explanation": "Detailed explanation of why this is correct and what concepts are involved",
        "difficulty": "easy|medium|hard",
        "points": 1-5,
        "source": {
          "pdfId": "pdf_id_here",
          "pageNumber": 1,
          "snippet": "Relevant text snippet from source"
        }
      }
    ]
  }`;

  try {
    const response = await axios.post('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
      inputs: prompt,
      parameters: {
        max_length: 2000,
        temperature: 0.7,
        do_sample: true
      }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const text = response.data[0].generated_text;
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    }
  } catch (error) {
    console.error('Hugging Face question generation failed:', error);
  }
  
  return generateMockQuestions(content, questionTypes, difficulty, numQuestions, pdfs);
}

// Generate questions using Gemini API
async function generateQuestionsWithGemini(content, questionTypes, difficulty, numQuestions, pdfs) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const prompt = `Generate ${numQuestions} educational quiz questions from the following PDF content. 
  
Content: ${content.substring(0, 8000)} // Limit content for API

Requirements:
- Question types: ${questionTypes.join(', ')}
- Difficulty: ${difficulty}
- Create a mix of question types
- Each question must have detailed explanations
- For MCQs: provide 4 options with one correct answer
- For SAQs: ask for short explanations (2-3 sentences)
- For LAQs: ask for detailed discussions (paragraph length)
- Include source references to PDF content

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "type": "mcq|saq|laq",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ
      "correctAnswer": "Correct answer text",
      "explanation": "Detailed explanation of why this is correct and what concepts are involved",
      "difficulty": "easy|medium|hard",
      "points": 1-5,
      "source": {
        "pdfId": "pdf_id_here",
        "pageNumber": 1,
        "snippet": "Relevant text snippet from source"
      }
    }
  ]
}`;

  try {
    // Try multiple Gemini model versions
    const modelNames = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    
    let model, result, response, text;
    
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        response = await result.response;
        text = response.text();
        console.log(`Successfully used Gemini model: ${modelName}`);
        break;
      } catch (modelError) {
        console.warn(`Gemini model ${modelName} failed:`, modelError.message);
        continue;
      }
    }
    
    if (!text) {
      throw new Error('All Gemini models failed');
    }
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    }
  } catch (error) {
    console.error('Gemini question generation failed:', error);
  }
  
  return generateMockQuestions(content, questionTypes, difficulty, numQuestions, pdfs);
}

// Generate questions using OpenAI API
async function generateQuestionsWithOpenAI(content, questionTypes, difficulty, numQuestions, pdfs) {
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `Generate ${numQuestions} educational quiz questions from the following PDF content. 
  
Content: ${content.substring(0, 8000)}

Requirements:
- Question types: ${questionTypes.join(', ')}
- Difficulty: ${difficulty}
- Create a mix of question types
- Each question must have detailed explanations
- For MCQs: provide 4 options with one correct answer
- For SAQs: ask for short explanations (2-3 sentences)
- For LAQs: ask for detailed discussions (paragraph length)
- Include source references to PDF content

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "type": "mcq|saq|laq",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Correct answer text",
      "explanation": "Detailed explanation",
      "difficulty": "easy|medium|hard",
      "points": 1-5,
      "source": {
        "pdfId": "pdf_id_here",
        "pageNumber": 1,
        "snippet": "Relevant text snippet"
      }
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const response = completion.choices[0].message.content;
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    }
  } catch (error) {
    console.error('OpenAI question generation failed:', error);
  }
  
  return generateMockQuestions(content, questionTypes, difficulty, numQuestions, pdfs);
}

// Fallback mock question generation
function generateMockQuestions(content, questionTypes, difficulty, numQuestions, pdfs) {
  const questions = [];
  const contentSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // If we have actual content, use it; otherwise use generic questions
  if (contentSentences.length === 0) {
    return generateGenericQuestions(numQuestions, questionTypes, difficulty, pdfs);
  }
  
  for (let i = 0; i < Math.min(numQuestions, contentSentences.length); i++) {
    const sentence = contentSentences[i].trim();
    const questionType = questionTypes[i % questionTypes.length]; // Distribute evenly
    const allowedDifficulties = ['easy', 'medium', 'hard'];
    const questionDifficulty = allowedDifficulties.includes(difficulty)
      ? difficulty
      : allowedDifficulties[i % allowedDifficulties.length];
    
    let question;
    const pdfId = pdfs[Math.floor(Math.random() * pdfs.length)]._id;
    
    switch (questionType) {
      case 'mcq':
        question = {
          type: 'mcq',
          question: `Based on this content: "${sentence.substring(0, 80)}...", what is the main concept being discussed?`,
          options: [
            'A) Fundamental principles and basic concepts',
            'B) Advanced applications and complex theories', 
            'C) Historical background and development',
            'D) Mathematical formulas and calculations'
          ],
          correctAnswer: 'A) Fundamental principles and basic concepts',
          explanation: `This content discusses fundamental principles that are essential for understanding the topic. The text focuses on basic concepts that form the foundation for more advanced learning.`,
          difficulty: questionDifficulty,
          points: 1,
          source: {
            pdfId: pdfId,
            pageNumber: Math.floor(Math.random() * 10) + 1,
            snippet: sentence.substring(0, 150)
          }
        };
        break;
        
      case 'saq':
        question = {
          type: 'saq',
          question: `Explain the key concept mentioned in: "${sentence.substring(0, 80)}..."`,
          correctAnswer: 'This concept involves the fundamental principles and core mechanisms that are essential for understanding the broader topic.',
          explanation: `This concept is important because it establishes the foundation for understanding more complex ideas. It helps explain the basic mechanisms and relationships within the topic.`,
          difficulty: questionDifficulty,
          points: 2,
          source: {
            pdfId: pdfId,
            pageNumber: Math.floor(Math.random() * 10) + 1,
            snippet: sentence.substring(0, 150)
          }
        };
        break;
        
      case 'laq':
        question = {
          type: 'laq',
          question: `Discuss comprehensively the topic covered in: "${sentence.substring(0, 80)}...". Include key concepts, applications, and real-world significance.`,
          correctAnswer: 'This topic involves multiple interconnected concepts including theoretical foundations, practical applications, and real-world implications. It forms a comprehensive framework that helps understand complex relationships and applications in various contexts.',
          explanation: `This is a comprehensive question that tests deep understanding. A complete answer should cover: 1) Theoretical foundations and core concepts, 2) Practical applications and examples, 3) Interconnections between different aspects, 4) Real-world significance and implications. This demonstrates mastery beyond surface-level knowledge.`,
          difficulty: questionDifficulty,
          points: 5,
          source: {
            pdfId: pdfId,
            pageNumber: Math.floor(Math.random() * 10) + 1,
            snippet: sentence.substring(0, 150)
          }
        };
        break;
    }
    
    questions.push(question);
  }
  
  return questions;
}

// Generate generic questions when content is not available
function generateGenericQuestions(numQuestions, questionTypes, difficulty, pdfs) {
  const questions = [];
  const pdfId = pdfs[0]._id;
  
  const genericQuestions = [
    {
      mcq: {
        question: "What is the primary focus of this study material?",
        options: [
          'A) Fundamental concepts and principles',
          'B) Advanced theoretical frameworks', 
          'C) Historical developments',
          'D) Mathematical derivations'
        ],
        correctAnswer: 'A) Fundamental concepts and principles'
      },
      saq: {
        question: "Explain the main concept discussed in this material.",
        correctAnswer: 'The main concept involves fundamental principles that are essential for understanding the subject matter.'
      },
      laq: {
        question: "Discuss the comprehensive understanding of the topics covered in this material, including their applications and significance.",
        correctAnswer: 'The material covers multiple interconnected topics that form a comprehensive framework for understanding the subject, with practical applications and real-world significance.'
      }
    }
  ];
  
  for (let i = 0; i < numQuestions; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    const generic = genericQuestions[0][questionType];
    
    const question = {
      type: questionType,
      question: generic.question,
      options: generic.options,
      correctAnswer: generic.correctAnswer,
      explanation: `This question tests your understanding of the core concepts in this study material. It's important to grasp the fundamental principles to build a strong foundation for further learning.`,
      difficulty: difficulty === 'mixed' ? ['easy', 'medium', 'hard'][i % 3] : difficulty,
      points: questionType === 'mcq' ? 1 : questionType === 'saq' ? 2 : 5,
      source: {
        pdfId: pdfId,
        pageNumber: i + 1,
        snippet: 'Study material content'
      }
    };
    
    questions.push(question);
  }
  
  return questions;
}

// Helper function to score quiz with detailed results
function scoreQuizDetailed(questions, answers) {
  const questionResults = [];
  let correctCount = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  
  questions.forEach((question, index) => {
    const userAnswer = answers[index] || '';
    let isCorrect = false;
    let score = 0;
    let feedback = '';
    
    totalPoints += question.points || 1;
    
    if (userAnswer.trim()) {
      switch (question.type) {
        case 'mcq':
          isCorrect = userAnswer.trim() === question.correctAnswer.trim();
          score = isCorrect ? (question.points || 1) : 0;
          feedback = isCorrect ? 'Correct! Well done.' : `Incorrect. The correct answer is: ${question.correctAnswer}`;
          break;
        case 'saq':
        case 'laq':
          // Enhanced scoring for text answers
          const userWords = userAnswer.toLowerCase().split(/\s+/);
          const correctWords = question.correctAnswer.toLowerCase().split(/\s+/);
          const matches = userWords.filter(word => correctWords.includes(word) && word.length > 3).length;
          const similarity = matches / Math.max(correctWords.length, 1);
          
          // More sophisticated scoring
          if (similarity >= 0.7) {
            isCorrect = true;
            score = question.points || (question.type === 'saq' ? 2 : 5);
            feedback = 'Excellent answer! You demonstrated good understanding.';
          } else if (similarity >= 0.4) {
            isCorrect = false;
            score = Math.floor((question.points || (question.type === 'saq' ? 2 : 5)) * 0.5);
            feedback = 'Partial credit. Your answer shows some understanding but could be more comprehensive.';
          } else {
            isCorrect = false;
            score = 0;
            feedback = 'Your answer needs more detail and accuracy. Review the source material.';
          }
          break;
      }
    } else {
      feedback = 'No answer provided.';
    }
    
    earnedPoints += score;
    if (isCorrect) correctCount++;
    
    questionResults.push({
      questionIndex: index,
      question: question.question,
      userAnswer: userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect,
      score: score,
      maxScore: question.points || 1,
      feedback: feedback,
      explanation: question.explanation,
      type: question.type,
      difficulty: question.difficulty,
      source: question.source
    });
  });
  
  const percentage = Math.round((earnedPoints / totalPoints) * 100);
  
  return { 
    questionResults, 
    correctCount, 
    totalQuestions: questions.length,
    percentage, 
    totalPoints,
    earnedPoints
  };
}

// Legacy scoring function for backward compatibility
function scoreQuiz(questions, answers) {
  const detailed = scoreQuizDetailed(questions, answers);
  return {
    scores: detailed.questionResults.map(r => r.isCorrect),
    correctCount: detailed.correctCount,
    totalQuestions: detailed.totalQuestions,
    score: detailed.earnedPoints,
    percentage: detailed.percentage
  };
}

// Helper function to update user progress
async function updateUserProgress(userId, pdfIds, results) {
  try {
    const pdfs = await PDF.find({ _id: { $in: pdfIds } });
    
    for (const pdf of pdfs) {
      const subject = pdf.metadata.subject || 'General';
      const topic = pdf.metadata.title || 'Unknown Topic';
      
      let progress = await Progress.findOne({
        userId,
        subject,
        topic,
        pdfId: pdf._id
      });
      
      if (!progress) {
        progress = new Progress({
          userId,
          subject,
          topic,
          pdfId: pdf._id,
          stats: {
            totalQuestions: 0,
            correctAnswers: 0,
            totalTimeSpent: 0,
            streak: 0
          }
        });
      }
      
      // Update stats
      progress.stats.totalQuestions += results.totalQuestions;
      progress.stats.correctAnswers += results.correctCount;
      
      if (results.percentage >= 70) {
        progress.stats.streak += 1;
      } else {
        progress.stats.streak = 0;
      }
      
      // Update mastery level
      const accuracy = progress.stats.correctAnswers / progress.stats.totalQuestions;
      if (accuracy >= 0.9) {
        progress.stats.mastery = 'expert';
      } else if (accuracy >= 0.7) {
        progress.stats.mastery = 'advanced';
      } else if (accuracy >= 0.5) {
        progress.stats.mastery = 'intermediate';
      } else {
        progress.stats.mastery = 'beginner';
      }
      
      progress.stats.lastAttempt = new Date();
      await progress.save();
    }
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

module.exports = router;
