import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTarget, FiClock, FiBookOpen, FiAward, FiBarChart } from 'react-icons/fi';
import { progressAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Progress = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchProgressData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fetchProgressData = async () => {
    try {
      const [dashboardResponse, analyticsResponse] = await Promise.all([
        progressAPI.getDashboard(),
        progressAPI.getAnalytics(selectedPeriod)
      ]);
      
      setDashboardData({
        ...dashboardResponse.data,
        analytics: analyticsResponse.data
      });
    } catch (error) {
      toast.error('Failed to load progress data');
      console.error('Progress error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.overallStats || {};
  const recommendations = dashboardData?.recommendations || [];
  // const analytics = dashboardData?.analytics || {};

  const masteryColors = {
    beginner: 'bg-red-100 text-red-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-blue-100 text-blue-800',
    expert: 'bg-green-100 text-green-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <FiBarChart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Your Progress</h1>
            <p className="text-gray-600 text-lg">
              Track your learning journey and see how you're improving
            </p>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                selectedPeriod === period.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiTarget className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiClock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak || 0} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiAward className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mastery Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.masteryLevels?.expert > 0 ? 'Expert' : 
                 stats.masteryLevels?.advanced > 0 ? 'Advanced' : 
                 stats.masteryLevels?.intermediate > 0 ? 'Intermediate' : 'Beginner'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          {stats.subjects && Object.keys(stats.subjects).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.subjects).map(([subject, data]) => {
                const accuracy = data.totalQuestions > 0 
                  ? Math.round((data.correctAnswers / data.totalQuestions) * 100)
                  : 0;
                
                return (
                  <div key={subject} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{subject}</p>
                      <p className="text-sm text-gray-500">
                        {data.topics} topics • {data.totalQuestions} questions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{accuracy}%</p>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiBookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No subject data available</p>
              <p className="text-sm text-gray-400 mt-2">
                Take some quizzes to see your progress
              </p>
            </div>
          )}
        </div>

        {/* Mastery Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mastery Distribution</h3>
          {stats.masteryLevels && Object.values(stats.masteryLevels).some(count => count > 0) ? (
            <div className="space-y-4">
              {Object.entries(stats.masteryLevels).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${masteryColors[level]}`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FiAward className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No mastery data available</p>
              <p className="text-sm text-gray-400 mt-2">
                Complete more quizzes to unlock mastery levels
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Recommendations</h3>
          <div className="space-y-4">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className={`p-1 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100' : 
                  rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-500' : 
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{rec.message}</p>
                  {rec.suggestedActions && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Suggested actions:</p>
                      <ul className="text-sm text-gray-500 list-disc list-inside">
                        {rec.suggestedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Quiz Performance */}
      {dashboardData?.recentQuizzes && dashboardData.recentQuizzes.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Quiz Performance</h3>
          <div className="space-y-3">
            {dashboardData.recentQuizzes.map((quiz, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{quiz.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {quiz.attempts?.length || 0} attempts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Progress;
