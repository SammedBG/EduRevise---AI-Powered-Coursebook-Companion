import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiFileText, 
  FiMessageSquare, 
  FiHelpCircle, 
  FiTrendingUp,
  FiBookOpen,
  FiClock,
  FiTarget,
  FiHome,
  FiUsers,
  FiAward,
  FiBarChart3,
  FiChevronRight,
  FiStar
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Study Materials',
      value: recentPDFs.length,
      icon: FiBookOpen,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Active Chats',
      value: recentChats.length,
      icon: FiMessageSquare,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Quizzes Taken',
      value: dashboardData?.totalQuizzes || 0,
      icon: FiHelpCircle,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600'
    },
    {
      title: 'Study Streak',
      value: dashboardData?.currentStreak || 0,
      icon: FiTarget,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    }
  ];

  const quickActions = [
    {
      title: 'Upload New PDF',
      description: 'Add study materials to your library',
      icon: FiFileText,
      link: '/pdfs',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Start AI Chat',
      description: 'Ask questions about your studies',
      icon: FiMessageSquare,
      link: '/chat',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge',
      icon: FiHelpCircle,
      link: '/quiz',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      title: 'View Progress',
      description: 'Track your learning journey',
      icon: FiTrendingUp,
      link: '/progress',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiHome className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome Back!
              </h1>
              <p className="text-gray-600 text-lg">
                Ready to continue your learning journey, <span className="font-semibold text-purple-600">{user?.profile?.name || user?.username}</span>?
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <FiTarget className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.link}
                    className="group p-4 rounded-xl border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center transition-colors duration-200`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      </div>
                      <FiChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-200" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <FiClock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            
            <div className="space-y-4">
              {recentPDFs.length > 0 ? (
                recentPDFs.map((pdf, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <FiFileText className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pdf.originalName}</p>
                      <p className="text-xs text-gray-500">Uploaded {new Date(pdf.uploadDate).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pdf.content?.processed ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {pdf.content?.processed ? 'Processed' : 'Processing'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FiBookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No study materials yet</p>
                  <Link to="/pdfs" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                    Upload your first PDF
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <FiAward className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiBookOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">First Upload</p>
                <p className="text-xs text-gray-600">Upload your first PDF</p>
              </div>
              <FiStar className="h-5 w-5 text-yellow-500" />
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FiMessageSquare className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">First Chat</p>
                <p className="text-xs text-gray-600">Start your first AI conversation</p>
              </div>
              <FiStar className="h-5 w-5 text-yellow-500" />
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                <FiHelpCircle className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Quiz Master</p>
                <p className="text-xs text-gray-600">Complete your first quiz</p>
              </div>
              <FiStar className="h-5 w-5 text-yellow-500" />
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-purple-50 rounded-xl">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Progress Tracker</p>
                <p className="text-xs text-gray-600">Track your learning progress</p>
              </div>
              <FiStar className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;