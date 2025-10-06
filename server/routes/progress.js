const express = require('express');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const PDF = require('../models/PDF');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user's progress dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.userId })
      .populate('pdfId', 'originalName metadata')
      .sort({ updatedAt: -1 });

    // Calculate overall stats
    const overallStats = {
      totalQuizzes: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      averageScore: 0,
      currentStreak: 0,
      subjects: {},
      masteryLevels: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0
      }
    };

    progress.forEach(p => {
      overallStats.totalQuestions += p.stats.totalQuestions;
      overallStats.correctAnswers += p.stats.correctAnswers;
      overallStats.currentStreak = Math.max(overallStats.currentStreak, p.stats.streak);
      
      // Subject-wise stats
      if (!overallStats.subjects[p.subject]) {
        overallStats.subjects[p.subject] = {
          totalQuestions: 0,
          correctAnswers: 0,
          topics: 0
        };
      }
      overallStats.subjects[p.subject].totalQuestions += p.stats.totalQuestions;
      overallStats.subjects[p.subject].correctAnswers += p.stats.correctAnswers;
      overallStats.subjects[p.subject].topics += 1;
      
      // Mastery levels
      overallStats.masteryLevels[p.stats.mastery]++;
    });

    // Calculate average score
    if (overallStats.totalQuestions > 0) {
      overallStats.averageScore = Math.round(
        (overallStats.correctAnswers / overallStats.totalQuestions) * 100
      );
    }

    // Get recent quiz attempts
    const recentQuizzes = await Quiz.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('pdfContext', 'originalName');

    // Get weak areas (topics with low scores)
    const weakAreas = progress
      .filter(p => p.stats.totalQuestions >= 5) // Only consider topics with enough data
      .map(p => ({
        subject: p.subject,
        topic: p.topic,
        accuracy: p.stats.correctAnswers / p.stats.totalQuestions,
        totalQuestions: p.stats.totalQuestions
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Get strong areas (topics with high scores)
    const strongAreas = progress
      .filter(p => p.stats.totalQuestions >= 5)
      .map(p => ({
        subject: p.subject,
        topic: p.topic,
        accuracy: p.stats.correctAnswers / p.stats.totalQuestions,
        totalQuestions: p.stats.totalQuestions
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 5);

    res.json({
      overallStats,
      recentQuizzes,
      weakAreas,
      strongAreas,
      detailedProgress: progress
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get progress for specific subject
router.get('/subject/:subject', authenticateToken, async (req, res) => {
  try {
    const { subject } = req.params;
    
    const progress = await Progress.find({ 
      userId: req.userId,
      subject: new RegExp(subject, 'i')
    }).populate('pdfId', 'originalName metadata');

    if (progress.length === 0) {
      return res.status(404).json({ error: 'No progress found for this subject' });
    }

    // Calculate subject-specific stats
    const subjectStats = {
      subject,
      totalTopics: progress.length,
      totalQuestions: progress.reduce((sum, p) => sum + p.stats.totalQuestions, 0),
      correctAnswers: progress.reduce((sum, p) => sum + p.stats.correctAnswers, 0),
      averageAccuracy: 0,
      masteryDistribution: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0
      }
    };

    subjectStats.averageAccuracy = subjectStats.totalQuestions > 0 
      ? Math.round((subjectStats.correctAnswers / subjectStats.totalQuestions) * 100)
      : 0;

    progress.forEach(p => {
      subjectStats.masteryDistribution[p.stats.mastery]++;
    });

    res.json({
      subjectStats,
      topics: progress.sort((a, b) => b.updatedAt - a.updatedAt)
    });
  } catch (error) {
    console.error('Get subject progress error:', error);
    res.status(500).json({ error: 'Failed to fetch subject progress' });
  }
});

// Get progress for specific topic
router.get('/topic/:topicId', authenticateToken, async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.topicId)
      .populate('pdfId', 'originalName metadata');

    if (!progress) {
      return res.status(404).json({ error: 'Topic progress not found' });
    }

    if (progress.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get quiz attempts for this topic
    const quizAttempts = await Quiz.find({
      createdBy: req.userId,
      pdfContext: progress.pdfId
    }).sort({ createdAt: -1 });

    res.json({
      progress,
      quizAttempts: quizAttempts.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        createdAt: quiz.createdAt,
        attempts: quiz.attempts.filter(a => a.userId.toString() === req.userId)
      }))
    });
  } catch (error) {
    console.error('Get topic progress error:', error);
    res.status(500).json({ error: 'Failed to fetch topic progress' });
  }
});

// Get learning recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.userId });
    const recommendations = [];

    // Analyze progress and generate recommendations
    progress.forEach(p => {
      const accuracy = p.stats.totalQuestions > 0 
        ? p.stats.correctAnswers / p.stats.totalQuestions 
        : 0;

      if (accuracy < 0.6 && p.stats.totalQuestions >= 3) {
        recommendations.push({
          type: 'weakness',
          priority: 'high',
          subject: p.subject,
          topic: p.topic,
          message: `You're struggling with ${p.topic} in ${p.subject}. Consider reviewing the material and taking more practice quizzes.`,
          suggestedActions: [
            'Review the PDF content',
            'Take a practice quiz',
            'Ask questions in chat'
          ]
        });
      } else if (accuracy >= 0.8 && p.stats.totalQuestions >= 5) {
        recommendations.push({
          type: 'strength',
          priority: 'medium',
          subject: p.subject,
          topic: p.topic,
          message: `Great job with ${p.topic} in ${p.subject}! You've mastered this topic well.`,
          suggestedActions: [
            'Help others learn this topic',
            'Move to more advanced topics',
            'Take challenging quizzes'
          ]
        });
      }
    });

    // Add general recommendations
    const totalQuestions = progress.reduce((sum, p) => sum + p.stats.totalQuestions, 0);
    
    if (totalQuestions < 10) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        message: 'You\'re just getting started! Take more quizzes to build your learning profile.',
        suggestedActions: [
          'Upload more study materials',
          'Take quizzes regularly',
          'Use the chat feature for questions'
        ]
      });
    }

    if (progress.length < 3) {
      recommendations.push({
        type: 'diversity',
        priority: 'medium',
        message: 'Try studying different subjects to get a well-rounded learning experience.',
        suggestedActions: [
          'Explore different subjects',
          'Upload PDFs from various topics',
          'Take quizzes on different subjects'
        ]
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    res.json({ recommendations: recommendations.slice(0, 10) });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Get progress analytics (for charts/graphs)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const progress = await Progress.find({
      userId: req.userId,
      updatedAt: { $gte: startDate }
    });

    // Daily progress data
    const dailyData = {};
    const subjects = new Set();
    
    progress.forEach(p => {
      const date = p.updatedAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          totalQuestions: 0,
          correctAnswers: 0,
          subjects: {}
        };
      }
      
      dailyData[date].totalQuestions += p.stats.totalQuestions;
      dailyData[date].correctAnswers += p.stats.correctAnswers;
      
      if (!dailyData[date].subjects[p.subject]) {
        dailyData[date].subjects[p.subject] = { questions: 0, correct: 0 };
      }
      dailyData[date].subjects[p.subject].questions += p.stats.totalQuestions;
      dailyData[date].subjects[p.subject].correct += p.stats.correctAnswers;
      
      subjects.add(p.subject);
    });

    // Convert to array format for charts
    const chartData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Subject-wise analytics
    const subjectAnalytics = {};
    Array.from(subjects).forEach(subject => {
      const subjectProgress = progress.filter(p => p.subject === subject);
      subjectAnalytics[subject] = {
        totalQuestions: subjectProgress.reduce((sum, p) => sum + p.stats.totalQuestions, 0),
        correctAnswers: subjectProgress.reduce((sum, p) => sum + p.stats.correctAnswers, 0),
        topics: subjectProgress.length,
        averageAccuracy: 0
      };
      
      if (subjectAnalytics[subject].totalQuestions > 0) {
        subjectAnalytics[subject].averageAccuracy = Math.round(
          (subjectAnalytics[subject].correctAnswers / subjectAnalytics[subject].totalQuestions) * 100
        );
      }
    });

    res.json({
      dailyProgress: chartData,
      subjectAnalytics,
      period,
      totalDays: daysBack
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
