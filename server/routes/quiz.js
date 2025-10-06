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

    // Get PDFs and their content (allow even if not processed yet)
    const pdfs = await PDF.find({ 
      _id: { $in: pdfIds }
    });

    if (pdfs.length === 0) {
      return res.status(400).json({ error: 'No PDFs found' });
    }

    // Extract content for quiz generation
    let allContent = '';
    const contentByPdf = {};

    pdfs.forEach(pdf => {
      contentByPdf[pdf._id] = pdf.content.extractedText;
      allContent += pdf.content.extractedText + '\n\n';
    });

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

    // Score the answers
    const results = scoreQuiz(quiz.questions, answers);
    
    // Record attempts
    const attempts = quiz.questions.map((question, index) => ({
      userId: req.userId,
      questionId: question._id,
      answer: answers[index] || '',
      isCorrect: results.scores[index],
      timeSpent: timeSpent / quiz.questions.length // Average time per question
    }));

    quiz.attempts.push(...attempts);
    await quiz.save();

    // Update progress
    await updateUserProgress(req.userId, quiz.pdfContext, results);

    res.json({
      results: {
        totalQuestions: quiz.questions.length,
        correctAnswers: results.correctCount,
        score: results.score,
        percentage: results.percentage,
        detailedScores: results.scores,
        timeSpent
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

// Helper function to generate questions (mock implementation)
async function generateQuestions(content, questionTypes, difficulty, numQuestions, pdfs) {
  const questions = [];
  const contentSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Mock question generation - in production, use LLM API
  for (let i = 0; i < Math.min(numQuestions, contentSentences.length); i++) {
    const sentence = contentSentences[i].trim();
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    const qDifficulty = difficulty === 'mixed' 
      ? ['easy','medium','hard'][Math.floor(Math.random()*3)] 
      : (['easy','medium','hard'].includes(difficulty) ? difficulty : 'medium');

    let question;
    
    switch (questionType) {
      case 'mcq':
        question = {
          type: 'mcq',
          question: `What is the main concept discussed in this context? (Based on: "${sentence.substring(0, 100)}...")`,
          options: [
            'Option A: Concept 1',
            'Option B: Concept 2', 
            'Option C: Concept 3',
            'Option D: Concept 4'
          ],
          correctAnswer: 'Option B: Concept 2',
          explanation: 'This is the correct answer because...',
          difficulty: qDifficulty,
          points: 1,
          source: {
            pdfId: pdfs[Math.floor(Math.random() * pdfs.length)]._id,
            pageNumber: Math.floor(Math.random() * 10) + 1,
            snippet: sentence.substring(0, 200)
          }
        };
        break;
        
      case 'saq':
        question = {
          type: 'saq',
          question: `Explain the concept mentioned in this context: "${sentence.substring(0, 100)}..."`,
          correctAnswer: 'A short answer explaining the concept',
          explanation: 'This concept is important because...',
          difficulty: qDifficulty,
          points: 2,
          source: {
            pdfId: pdfs[Math.floor(Math.random() * pdfs.length)]._id,
            pageNumber: Math.floor(Math.random() * 10) + 1,
            snippet: sentence.substring(0, 200)
          }
        };
        break;
        
      case 'laq':
        question = {
          type: 'laq',
          question: `Discuss in detail the topic covered in this context: "${sentence.substring(0, 100)}..."`,
          correctAnswer: 'A detailed explanation covering multiple aspects',
          explanation: 'This topic is comprehensive and includes...',
          difficulty: qDifficulty,
          points: 5,
          source: {
            pdfId: pdfs[Math.floor(Math.random() * pdfs.length)]._id,
            pageNumber: Math.floor(Math.random() * 10) + 1,
            snippet: sentence.substring(0, 200)
          }
        };
        break;
    }
    
    questions.push(question);
  }
  
  return questions;
}

// Helper function to score quiz
function scoreQuiz(questions, answers) {
  const scores = [];
  let correctCount = 0;
  
  questions.forEach((question, index) => {
    const userAnswer = answers[index];
    let isCorrect = false;
    
    if (userAnswer) {
      switch (question.type) {
        case 'mcq':
          isCorrect = userAnswer.trim() === question.correctAnswer.trim();
          break;
        case 'saq':
        case 'laq':
          // For SAQ and LAQ, simple keyword matching (in production, use more sophisticated scoring)
          const userWords = userAnswer.toLowerCase().split(/\s+/);
          const correctWords = question.correctAnswer.toLowerCase().split(/\s+/);
          const matches = userWords.filter(word => correctWords.includes(word)).length;
          isCorrect = matches >= Math.min(3, correctWords.length * 0.3);
          break;
      }
    }
    
    scores.push(isCorrect);
    if (isCorrect) correctCount++;
  });
  
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = questions.reduce((sum, q, i) => sum + (scores[i] ? q.points : 0), 0);
  
  return {
    scores,
    correctCount,
    totalQuestions: questions.length,
    score: earnedPoints,
    percentage: Math.round((correctCount / questions.length) * 100)
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
