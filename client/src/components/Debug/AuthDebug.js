import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthDebug = () => {
  const { user, login, register, logout, loading } = useAuth();
  const [testCredentials, setTestCredentials] = useState({
    email: 'new@example.com',
    password: 'password123'
  });

  const handleTestLogin = async () => {
    try {
      await login(testCredentials);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(`Login failed: ${error.response?.data?.error || error.message}`);
      console.error('Login error:', error);
    }
  };

  const handleTestRegister = async () => {
    const testUser = {
      username: `testuser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      grade: '11'
    };
    
    try {
      await register(testUser);
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(`Registration failed: ${error.response?.data?.error || error.message}`);
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Auth State */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current Auth State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
            <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          </div>
        </div>

        {/* Test Login */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={testCredentials.email}
                onChange={(e) => setTestCredentials({...testCredentials, email: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={testCredentials.password}
                onChange={(e) => setTestCredentials({...testCredentials, password: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              onClick={handleTestLogin}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Test Login
            </button>
          </div>
        </div>

        {/* Test Register */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Registration</h2>
          <button
            onClick={handleTestRegister}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Create Test User
          </button>
        </div>

        {/* Logout */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Logout</h2>
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
