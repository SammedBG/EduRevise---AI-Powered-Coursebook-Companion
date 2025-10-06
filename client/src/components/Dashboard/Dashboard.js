import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiFileText, 
  FiMessageSquare, 
  FiHelpCircle, 
  FiTrendingUp,
  FiBookOpen,
  FiClock,
  FiTarget
} from 'react-icons/fi';
import AuthContext from '../../contexts/AuthContext';
import { progressAPI, pdfAPI, chatAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = React.useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentPDFs, setRecentPDFs] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [progressResponse, pdfsResponse, chatsResponse] = await Promise.all([
        progressAPI.getDashboard(),
        pdfAPI.getAll(),
        chatAPI.getAll()
      ]);

      setDashboardData(progressResponse.data);
      setRecentPDFs(pdfsResponse.data.pdfs.slice(0, 3));
      setRecentChats(chatsResponse.data.chats.slice(0, 3));
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.overallStats || {
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    currentStreak: 0
  };

  const quickActions = [
    {
      title: 'Upload Study Material',
      description: 'Add new PDFs to your library',
      icon: FiFileText,
      href: '/pdfs',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Start New Chat',
      description: 'Ask questions about your studies',
      icon: FiMessageSquare,
      href: '/chat',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Take Practice Quiz',
      description: 'Test your knowledge',
      icon: FiHelpCircle,
      href: '/quiz',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'View Progress',
      description: 'Track your learning journey',
      icon: FiTrendingUp,
      href: '/progress',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 mb-8">
        <div className="max-w-6xl">
          <p className="text-sm uppercase tracking-wider opacity-80 mb-2">Your AI Study Companion</p>
          <h1 className="text-3xl md:text-4xl font-extrabold">
            Welcome back, {user?.profile?.name || user?.username}!
          </h1>
          <p className="mt-3 text-blue-100 max-w-2xl">
            Revise faster, practice smarter, and track your progress with AI-powered tools designed for students.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/quiz" className="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">Take a Quiz</Link>
            <Link to="/pdfs" className="bg-blue-500/20 border border-white/30 px-4 py-2 rounded-lg font-semibold hover:bg-blue-500/30 transition">Upload PDFs</Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiTarget className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiBookOpen className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Study Materials</p>
              <p className="text-2xl font-bold text-gray-900">{recentPDFs.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200 group"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${action.color} transition-colors duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {action.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          {/* Recent PDFs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Materials</h3>
              <Link
                to="/pdfs"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentPDFs.length > 0 ? (
                recentPDFs.map((pdf) => (
                  <div key={pdf.id} className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FiFileText className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pdf.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(pdf.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FiFileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No study materials yet</p>
                  <Link
                    to="/pdfs"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Upload your first PDF
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Chats</h3>
              <Link
                to="/chat"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentChats.length > 0 ? (
                recentChats.map((chat) => (
                  <div key={chat._id} className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiMessageSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {chat.messages?.length || 0} messages
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FiMessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No chats yet</p>
                  <Link
                    to="/chat"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Start your first chat
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Recommendations</h3>
          <div className="space-y-3">
            {dashboardData.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-1 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100' : 
                  rec.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  <div className={`h-2 w-2 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-500' : 
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                </div>
                <div>
                  <p className="text-sm text-gray-900">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
