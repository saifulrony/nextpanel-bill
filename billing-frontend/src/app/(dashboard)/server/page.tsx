'use client';

import { useState, useEffect } from 'react';
import {
  ServerIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface NextPanelServer {
  id: number;
  name: string;
  description: string | null;
  base_url: string;
  is_active: boolean;
  is_online: boolean;
  capacity: number;
  current_accounts: number;
  utilization_percent: number;
  available_slots: number;
  location: string | null;
  created_at: string;
}

interface ServerStatus {
  server_id: string;
  name: string;
  url: string;
  is_active: boolean;
  is_online: boolean;
  current_accounts: number;
  capacity: number;
  utilization: number;
}

export default function ServerPage() {
  const [servers, setServers] = useState<NextPanelServer[]>([]);
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_url: '',
    api_key: '',
    api_secret: '',
    capacity: 100,
    location: '',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchServers();
    fetchServerStatuses();
    
    // Refresh statuses every 30 seconds
    const interval = setInterval(fetchServerStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/v1/nextpanel/servers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServers(data);
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/v1/nextpanel/servers/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServerStatuses(data);
      }
    } catch (error) {
      console.error('Failed to fetch server statuses:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value,
    }));
  };

  const testConnection = async () => {
    if (!formData.base_url || !formData.api_key || !formData.api_secret) {
      setFormError('Please fill in URL, API Key, and API Secret to test connection');
      return;
    }

    setTestingConnection(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      
      // Test connection through backend API (avoids CORS issues)
      const response = await fetch(`${API_BASE}/api/v1/nextpanel/servers/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || 'Test Server',
          base_url: formData.base_url,
          api_key: formData.api_key,
          api_secret: formData.api_secret,
          capacity: formData.capacity,
          description: formData.description,
          location: formData.location,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormSuccess('✓ Connection successful! Server is online.');
        setTimeout(() => setFormSuccess(''), 5000);
      } else {
        setFormError(data.message || 'Connection failed. Please check your credentials and URL.');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setFormError('Connection test failed. Please check if the backend server is accessible.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validation
    if (!formData.name || !formData.base_url || !formData.api_key || !formData.api_secret) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/v1/nextpanel/servers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormSuccess('Server added successfully!');
        setFormData({
          name: '',
          description: '',
          base_url: '',
          api_key: '',
          api_secret: '',
          capacity: 100,
          location: '',
        });
        setTimeout(() => {
          setShowAddForm(false);
          setFormSuccess('');
          fetchServers();
          fetchServerStatuses();
        }, 2000);
      } else {
        setFormError(data.detail || 'Failed to add server');
      }
    } catch (error) {
      setFormError('Network error. Please try again.');
    }
  };

  const getStatusBadge = (server: NextPanelServer, status?: ServerStatus) => {
    const isOnline = status?.is_online ?? server.is_online;
    const isActive = status?.is_active ?? server.is_active;

    if (!isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircleIcon className="w-4 h-4 mr-1" />
          Inactive
        </span>
      );
    }

    if (isOnline) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Online
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="w-4 h-4 mr-1" />
        Offline
      </span>
    );
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NextPanel Servers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your NextPanel server connections and monitor their status
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Server
        </button>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New NextPanel Server</h2>
          
          {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{formError}</p>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{formSuccess}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Server Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Production Server 1"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., US-East, EU-West"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label htmlFor="base_url" className="block text-sm font-medium text-gray-700">
                Base URL *
              </label>
              <input
                type="url"
                id="base_url"
                name="base_url"
                value={formData.base_url}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://panel.example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                  API Key *
                </label>
                <input
                  type="text"
                  id="api_key"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
                  placeholder="npk_xxxxxxxxxxxxx"
                  required
                />
              </div>

              <div>
                <label htmlFor="api_secret" className="block text-sm font-medium text-gray-700">
                  API Secret *
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showApiSecret ? 'text' : 'password'}
                    id="api_secret"
                    name="api_secret"
                    value={formData.api_secret}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs pr-10"
                    placeholder="nps_xxxxxxxxxxxxx"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showApiSecret ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacity (Max Accounts)
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={testConnection}
                disabled={testingConnection}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {testingConnection ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                  setFormSuccess('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Server
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Server List */}
      {servers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No servers configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first NextPanel server.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Server
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servers.map((server) => {
            const status = serverStatuses.find(s => s.server_id === server.id.toString());
            const utilization = status?.utilization ?? server.utilization_percent;

            return (
              <div
                key={server.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <ServerIcon className="w-8 h-8 text-indigo-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{server.name}</h3>
                      {server.location && (
                        <p className="text-sm text-gray-500">{server.location}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(server, status)}
                </div>

                {server.description && (
                  <p className="text-sm text-gray-600 mb-4">{server.description}</p>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Utilization</span>
                      <span className="font-medium">{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getUtilizationColor(utilization)}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Accounts</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {status?.current_accounts ?? server.current_accounts}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Capacity</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {server.capacity}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Server URL</p>
                    <a
                      href={server.base_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-800 break-all"
                    >
                      {server.base_url}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 How to get API credentials</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Login to your NextPanel admin dashboard</li>
          <li>Navigate to Settings → API Keys</li>
          <li>Click "Create New API Key"</li>
          <li>Set permission level to "BILLING"</li>
          <li>Copy the API Key (npk_...) and API Secret (nps_...)</li>
          <li>Paste them in the form above</li>
        </ol>
      </div>
    </div>
  );
}

