import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiLogOut, FiUser, FiBell, FiBookOpen, FiMessageSquare, FiBarChart, FiHome, FiHelpCircle } from 'react-icons/fi';
import AuthContext from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigationItems = [
    { label: 'Dashboard', href: '/dashboard', icon: FiHome },
    { label: 'Study Materials', href: '/pdfs', icon: FiBookOpen },
    { label: 'AI Chat', href: '/chat', icon: FiMessageSquare },
    { label: 'Practice Quiz', href: '/quiz', icon: FiHelpCircle },
    { label: 'Progress', href: '/progress', icon: FiBarChart },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FiBookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Study Buddy
              </h1>
              <p className="text-xs text-gray-500 -mt-1">AI Learning Companion</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200">
              <FiBell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.profile?.name || user?.username}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.profile?.grade && `Grade ${user.profile.grade}`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                  <FiUser className="h-5 w-5 text-white" />
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                  title="Logout"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 h-12 border-t border-gray-100">
          {navigationItems.map(tab => {
            const isActive = location.pathname === tab.href || (tab.href === '/dashboard' && location.pathname === '/');
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:block">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
