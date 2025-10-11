'use client';

import { useState } from 'react';
import axios from 'axios';

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    const tests = [];

    // Test 1: Health check
    try {
      const response = await axios.get('http://192.168.10.203:8001/health');
      tests.push({
        name: 'Health Check',
        status: 'success',
        data: response.data,
        url: 'http://192.168.10.203:8001/health'
      });
    } catch (error: any) {
      tests.push({
        name: 'Health Check',
        status: 'error',
        error: error.message,
        url: 'http://192.168.10.203:8001/health'
      });
    }

    // Test 2: Login
    try {
      const response = await axios.post('http://192.168.10.203:8001/api/v1/auth/login', {
        email: 'testuser999@example.com',
        password: 'testpass123'
      });
      tests.push({
        name: 'Login API',
        status: 'success',
        data: response.data,
        url: 'http://192.168.10.203:8001/api/v1/auth/login'
      });
    } catch (error: any) {
      tests.push({
        name: 'Login API',
        status: 'error',
        error: error.message,
        code: error.code,
        response: error.response?.data,
        url: 'http://192.168.10.203:8001/api/v1/auth/login'
      });
    }

    // Test 3: Check API URL from env
    tests.push({
      name: 'Environment Variable',
      status: 'info',
      data: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
        detectedURL: typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'N/A'
      }
    });

    setResult(tests);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Connection Test</h1>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 mb-8"
        >
          {loading ? 'Testing...' : 'Run Connection Tests'}
        </button>

        {result && (
          <div className="space-y-4">
            {result.map((test: any, index: number) => (
              <div
                key={index}
                className={`p-6 rounded-lg ${
                  test.status === 'success' ? 'bg-green-50 border-green-200' :
                  test.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                } border-2`}
              >
                <h3 className="font-bold text-lg mb-2">
                  {test.status === 'success' ? '✅' : test.status === 'error' ? '❌' : 'ℹ️'} {test.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">URL: {test.url}</p>
                {test.data && (
                  <pre className="bg-white p-4 rounded overflow-auto text-xs">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                )}
                {test.error && (
                  <div className="text-red-700">
                    <p className="font-medium">Error: {test.error}</p>
                    {test.code && <p className="text-sm">Code: {test.code}</p>}
                    {test.response && (
                      <pre className="bg-white p-4 rounded overflow-auto text-xs mt-2">
                        {JSON.stringify(test.response, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

