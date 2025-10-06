import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText, 
  FiMessageSquare, 
  FiHelpCircle, 
  FiTrendingUp,
  FiX,
  FiBookOpen,
  FiYoutube
} from 'react-icons/fi';

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Study Materials', href: '/pdfs', icon: FiFileText },
    { name: 'AI Chat', href: '/chat', icon: FiMessageSquare },
    { name: 'Practice Quiz', href: '/quiz', icon: FiHelpCircle },
    { name: 'Video Learning', href: '/videos', icon: FiYoutube },
    { name: 'Progress', href: '/progress', icon: FiTrendingUp },
  ];

  const handleNavClick = (href) => {
    navigate(href);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 lg:hidden">
          <div className="flex items-center">
            <FiBookOpen className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Study Buddy</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        {/* Body: make column so footer sits at bottom without overlapping */}
        <div className="h-[calc(100%-4rem)] flex flex-col">
          <nav className="mt-6 px-4 flex-1 overflow-y-auto">
            <div className="space-y-2 pb-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className={`
                      w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                      ${window.location.pathname === item.href
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer (no absolute to avoid overlay) */}
          <div className="mt-auto w-full p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Study Buddy v1.0</p>
              <p>AI-Powered Learning</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
