import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiLogOut, FiUser, FiBell } from 'react-icons/fi';
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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur shadow-sm border-b border-gray-200 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <div className="ml-0">
              <h1 className="text-xl font-bold text-gray-900">Study Buddy</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <FiBell className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.name || user?.username}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.profile?.grade && `Grade ${user.profile.grade}`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <FiUser className="h-4 w-4 text-white" />
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  title="Logout"
                >
                  <FiLogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex items-center space-x-2 h-10">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Study Materials', href: '/pdfs' },
            { label: 'AI Chat', href: '/chat' },
            { label: 'Practice Quiz', href: '/quiz' },
            { label: 'Progress', href: '/progress' },
            { label: '🧪 Test', href: '/test' }
          ].map(tab => {
            const isActive = location.pathname === tab.href || (tab.href === '/dashboard' && location.pathname === '/');
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
