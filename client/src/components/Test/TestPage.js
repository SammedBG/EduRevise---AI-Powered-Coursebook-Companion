import React, { useState } from 'react';
import { authAPI, pdfAPI, chatAPI, quizAPI } from '../../services/api';
import toast from 'react-hot-toast';
import AuthDebug from '../Debug/AuthDebug';

const TestPage = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    try {
      setLoading(true);
      const response = await authAPI.register({
        username: 'testuser' + Date.now(),
        email: `test${Date.now()}@test.com`,
        password: 'testpass123'
      });
      setResults(prev => ({ ...prev, auth: '✅ Auth working: ' + response.data.message }));
    } catch (error) {
      setResults(prev => ({ ...prev, auth: '❌ Auth failed: ' + error.message }));
    } finally {
      setLoading(false);
    }
  };

  const testPDFUpload = async () => {
    try {
      setLoading(true);
      const response = await pdfAPI.getAll();
      setResults(prev => ({ ...prev, pdf: '✅ PDF API working: ' + response.data.length + ' PDFs found' }));
    } catch (error) {
      setResults(prev => ({ ...prev, pdf: '❌ PDF API failed: ' + error.message }));
    } finally {
      setLoading(false);
    }
  };

  const testChat = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getAll();
      setResults(prev => ({ ...prev, chat: '✅ Chat API working: ' + response.data.length + ' chats found' }));
    } catch (error) {
      setResults(prev => ({ ...prev, chat: '❌ Chat API failed: ' + error.message }));
    } finally {
      setLoading(false);
    }
  };

  const testQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getAll();
      setResults(prev => ({ ...prev, quiz: '✅ Quiz API working: ' + response.data.length + ' quizzes found' }));
    } catch (error) {
      setResults(prev => ({ ...prev, quiz: '❌ Quiz API failed: ' + error.message }));
    } finally {
      setLoading(false);
    }
  };

  const testAll = async () => {
    await testAuth();
    await testPDFUpload();
    await testChat();
    await testQuiz();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">System Test Page</h1>
      
      {/* Auth Debug Component */}
      <AuthDebug />
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test All APIs</h2>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={testAll}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test All APIs'}
          </button>
          
          <button
            onClick={testAuth}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Auth
          </button>
          
          <button
            onClick={testPDFUpload}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test PDF
          </button>
          
          <button
            onClick={testChat}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Chat
          </button>
          
          <button
            onClick={testQuiz}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Quiz
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Test Results:</h3>
          {Object.entries(results).map(([key, result]) => (
            <div key={key} className="p-2 bg-gray-100 rounded">
              <strong>{key.toUpperCase()}:</strong> {result}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ul className="text-yellow-700 space-y-1">
          <li>1. Click "Test All APIs" to check all functionality</li>
          <li>2. Check the results below to see what's working</li>
          <li>3. If any test fails, we'll know exactly what to fix</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;
