import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand */}
          <Link to="/" className="text-xl font-bold text-gray-900">Study Buddy</Link>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Top nav tabs */}
            <div className="hidden md:flex items-center space-x-1 mr-4">
              {[
                { name: 'Dashboard', href: '/dashboard' },
                { name: 'Study Materials', href: '/pdfs' },
                { name: 'AI Chat', href: '/chat' },
                { name: 'Practice Quiz', href: '/quiz' },
                { name: 'Videos', href: '/videos' },
                { name: 'Progress', href: '/progress' }
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location.pathname.startsWith(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
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
      </div>
    </nav>
  );
};

export default Navbar;
