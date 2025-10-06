import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthContext from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import PDFManager from './components/PDF/PDFManager';
import Chat from './components/Chat/Chat';
import Quiz from './components/Quiz/Quiz';
import Progress from './components/Progress/Progress';
import { authAPI } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getProfile();
        setUser(response.data.user);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Study Buddy...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="/register" element={<Register onLogin={login} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          
          {/* Navbar */}
          <Navbar />

          {/* Main Content - full width pages */}
          <main className="pt-20 min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pdfs" element={<PDFManager />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:chatId" element={<Chat />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz/:quizId" element={<Quiz />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
