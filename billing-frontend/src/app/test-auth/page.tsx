'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo12345');
  const [status, setStatus] = useState('');

  useEffect(() => {
    setStatus(`Loading: ${isLoading}, Authenticated: ${isAuthenticated}, User: ${user?.email || 'none'}`);
  }, [isLoading, isAuthenticated, user]);

  const handleLogin = async () => {
    try {
      setStatus('Logging in...');
      await login(email, password);
      setStatus('Login successful!');
    } catch (error: any) {
      setStatus(`Login failed: ${error.message}`);
    }
  };

  const handleLogout = () => {
    logout();
    setStatus('Logged out');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Auth System Test Page</h1>
        
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h2 className="font-bold mb-2">Current Status:</h2>
          <p className="text-sm font-mono">{status}</p>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded">
              <p className="font-bold text-green-800">✓ Authenticated</p>
              <p className="text-sm mt-2">User: {user?.full_name}</p>
              <p className="text-sm">Email: {user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
            <div className="space-y-2 mt-4">
              <a href="/dashboard" className="block w-full bg-indigo-600 text-white py-2 rounded text-center hover:bg-indigo-700">
                Go to Dashboard
              </a>
              <a href="/login" className="block w-full bg-gray-600 text-white py-2 rounded text-center hover:bg-gray-700">
                Go to Login Page
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

