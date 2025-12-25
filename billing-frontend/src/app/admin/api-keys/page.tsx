'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  KeyIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  permissions?: string[];
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    expires_in_days: 0, // 0 = never expires
    permissions: [] as string[],
  });

  // Get API base URL
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const port = 8001;
      return `http://${hostname}:${port}`;
    }
    return 'http://localhost:8001';
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      // Note: This endpoint would need to be implemented in the backend
      // For now, we'll create a placeholder that shows the UI structure
      // const response = await api.get('/api-keys');
      // setApiKeys(response.data);
      
      // Placeholder data for UI demonstration
      setApiKeys([]);
    } catch (error: any) {
      console.error('Failed to load API keys:', error);
      // Don't show error if endpoint doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name for the API key');
      return;
    }

    try {
      // Note: This endpoint would need to be implemented in the backend
      // const response = await api.post('/api-keys', formData);
      // const newKey = response.data;
      // setApiKeys([...apiKeys, newKey]);
      
      alert('API key creation endpoint needs to be implemented in the backend');
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to create API key:', error);
      alert(error.response?.data?.detail || 'Failed to create API key');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      // Note: This endpoint would need to be implemented in the backend
      // await api.delete(`/api-keys/${id}`);
      // setApiKeys(apiKeys.filter(k => k.id !== id));
      
      alert('API key deletion endpoint needs to be implemented in the backend');
    } catch (error: any) {
      console.error('Failed to delete API key:', error);
      alert(error.response?.data?.detail || 'Failed to delete API key');
    }
  };

  const toggleKeyVisibility = (id: string) => {
    const newSet = new Set(visibleKeys);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisibleKeys(newSet);
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      expires_in_days: 0,
      permissions: [],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const apiBaseUrl = getApiBaseUrl();

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Documentation & Keys</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage API keys and access interactive API documentation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <DocumentTextIcon className="h-5 w-5" />
            View API Docs
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5" />
            Create API Key
          </button>
        </div>
      </div>

      {/* API Documentation Section */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CodeBracketIcon className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Interactive API Documentation</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Explore all available API endpoints with interactive documentation powered by FastAPI.
          Test endpoints directly from your browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`${apiBaseUrl}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Open Swagger UI
          </a>
          <a
            href={`${apiBaseUrl}/redoc`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Open ReDoc
          </a>
          <a
            href={`${apiBaseUrl}/openapi.json`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <LinkIcon className="h-5 w-5" />
            Download OpenAPI Schema
          </a>
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Base URL:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{apiBaseUrl}/api/v1</code>
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Authentication:</strong> Include your API key in the Authorization header: 
            <code className="bg-blue-100 px-2 py-1 rounded ml-2">Authorization: Bearer YOUR_API_KEY</code>
          </p>
        </div>
      </div>

      {/* API Keys Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">API Keys</h2>
            </div>
            <span className="text-sm text-gray-500">
              {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {apiKeys.length === 0 ? (
          <div className="p-12 text-center">
            <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No API keys created yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Create an API key to authenticate requests to the API
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5" />
              Create Your First API Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{key.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-gray-100 text-gray-900 px-2 py-1 rounded">
                          {visibleKeys.has(key.id) 
                            ? `${key.key_prefix}...` 
                            : `${key.key_prefix}${'•'.repeat(20)}`}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title={visibleKeys.has(key.id) ? 'Hide' : 'Show'}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.key_prefix + '...', key.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy"
                        >
                          {copiedKey === key.id ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        key.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Examples Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CodeBracketIcon className="h-6 w-6 text-indigo-600" />
          Code Examples
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">cURL</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X GET "${apiBaseUrl}/api/v1/dashboard/stats" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">JavaScript (Fetch)</h3>
            <pre className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-x-auto text-sm">
{`fetch('${apiBaseUrl}/api/v1/dashboard/stats', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Python (requests)</h3>
            <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
{`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get(
    '${apiBaseUrl}/api/v1/dashboard/stats',
    headers=headers
)

data = response.json()
print(data)`}
            </pre>
          </div>
        </div>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create API Key</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Production API Key"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires In (days)
                  </label>
                  <input
                    type="number"
                    value={formData.expires_in_days}
                    onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0 = Never expires"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave as 0 for keys that never expire
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Important:</strong> Copy your API key immediately after creation. 
                    You won't be able to see it again!
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateApiKey}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Docs Modal */}
      {showDocs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">API Documentation</h2>
              <button
                onClick={() => setShowDocs(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <iframe
              src={`${apiBaseUrl}/docs`}
              className="flex-1 w-full border-0"
              title="API Documentation"
            />
          </div>
        </div>
      )}
    </div>
  );
}

