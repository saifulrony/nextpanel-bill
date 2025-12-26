'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vpsAPIKeysAPI } from '@/lib/api';
import {
  KeyIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface VPSAPIKey {
  id: string;
  customer_id: string;
  name: string;
  api_key: string; // Will be masked in list, full in create/regenerate
  vps_panel_url: string | null;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  description: string | null;
  permissions: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function VPSAPIKeysPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<VPSAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<VPSAPIKey | null>(null);
  const [showFullKey, setShowFullKey] = useState<Record<string, boolean>>({});
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    vps_panel_url: 'http://192.168.10.203:12000',
    description: '',
    expires_in_days: null as number | null,
    permissions: '["start", "stop", "restart", "status"]',
  });
  const [createdKey, setCreatedKey] = useState<VPSAPIKey | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAPIKeys();
    }
  }, [user?.id]);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vpsAPIKeysAPI.list();
      setApiKeys(response.data);
    } catch (err: any) {
      console.error('Failed to load API keys:', err);
      setError(err.response?.data?.detail || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setActionLoading('create');
      const response = await vpsAPIKeysAPI.create(newKeyData);
      setCreatedKey(response.data);
      setShowCreateModal(false);
      setNewKeyData({
        name: '',
        vps_panel_url: 'http://192.168.10.203:12000',
        description: '',
        expires_in_days: null,
        permissions: '["start", "stop", "restart", "status"]',
      });
      await loadAPIKeys();
    } catch (err: any) {
      console.error('Failed to create API key:', err);
      alert(err.response?.data?.detail || 'Failed to create API key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedKey) return;
    
    try {
      setActionLoading('delete');
      await vpsAPIKeysAPI.delete(selectedKey.id);
      setShowDeleteModal(false);
      setSelectedKey(null);
      await loadAPIKeys();
    } catch (err: any) {
      console.error('Failed to delete API key:', err);
      alert(err.response?.data?.detail || 'Failed to delete API key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (keyId: string) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will no longer work.')) {
      return;
    }

    try {
      setActionLoading(keyId);
      const response = await vpsAPIKeysAPI.regenerate(keyId);
      setCreatedKey(response.data);
      await loadAPIKeys();
    } catch (err: any) {
      console.error('Failed to regenerate API key:', err);
      alert(err.response?.data?.detail || 'Failed to regenerate API key');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (key: VPSAPIKey) => {
    try {
      setActionLoading(key.id);
      await vpsAPIKeysAPI.update(key.id, { is_active: !key.is_active });
      await loadAPIKeys();
    } catch (err: any) {
      console.error('Failed to update API key:', err);
      alert(err.response?.data?.detail || 'Failed to update API key');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return '*'.repeat(key.length);
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VPS API Keys</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage API keys to control your VPS servers programmatically
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create API Key
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message - Show created key */}
      {createdKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">API Key Created!</h3>
              </div>
              <p className="text-sm text-green-800 mb-3">
                Please copy your API key now. You won't be able to see it again.
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">API Key</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{createdKey.api_key}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdKey.api_key, 'API Key')}
                    className="ml-4 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Usage Example:</strong> Use this key in the Authorization header: <code className="bg-white px-2 py-1 rounded">Authorization: Bearer {createdKey.api_key}</code>
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-green-600 hover:text-green-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first API key to control your VPS servers.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create API Key
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your API Keys</h2>
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                        {key.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      {key.description && (
                        <p className="text-sm text-gray-600 mb-3">{key.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">API Key</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-gray-900">
                              {showFullKey[key.id] ? key.api_key : maskKey(key.api_key)}
                            </p>
                            <button
                              onClick={() => setShowFullKey({ ...showFullKey, [key.id]: !showFullKey[key.id] })}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              {showFullKey[key.id] ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(key.api_key, 'API Key')}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {key.vps_panel_url && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">VPS Panel URL</p>
                            <p className="text-sm text-gray-900 font-mono">{key.vps_panel_url}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
                          <p className="text-sm text-gray-900">{formatDate(key.created_at)}</p>
                        </div>
                        {key.last_used_at && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Last Used</p>
                            <p className="text-sm text-gray-900">{formatDate(key.last_used_at)}</p>
                          </div>
                        )}
                        {key.expires_at && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Expires</p>
                            <p className="text-sm text-gray-900">{formatDate(key.expires_at)}</p>
                          </div>
                        )}
                      </div>

                      {key.permissions && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Permissions</p>
                          <div className="flex flex-wrap gap-2">
                            {JSON.parse(key.permissions).map((perm: string) => (
                              <span
                                key={perm}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleActive(key)}
                        disabled={actionLoading === key.id}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          key.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        {key.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleRegenerate(key.id)}
                        disabled={actionLoading === key.id}
                        className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-100 text-indigo-800 hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === key.id ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowPathIcon className="h-4 w-4" />
                        )}
                        Regenerate
                      </button>
                      <button
                        onClick={() => {
                          setSelectedKey(key);
                          setShowDeleteModal(true);
                        }}
                        className="px-3 py-2 text-sm font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-2"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New API Key
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="My VPS Control Key"
                      value={newKeyData.name}
                      onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      VPS Panel URL
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="http://192.168.10.203:12000"
                      value={newKeyData.vps_panel_url}
                      onChange={(e) => setNewKeyData({ ...newKeyData, vps_panel_url: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Optional description for this API key"
                      value={newKeyData.description}
                      onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires In (Days) - Optional
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Leave empty for no expiration"
                      value={newKeyData.expires_in_days || ''}
                      onChange={(e) => setNewKeyData({ ...newKeyData, expires_in_days: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Default Permissions:</strong> start, stop, restart, status
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newKeyData.name || actionLoading === 'create'}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {actionLoading === 'create' ? 'Creating...' : 'Create API Key'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedKey && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete API Key
                  </h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete the API key <strong>{selectedKey.name}</strong>? This action cannot be undone.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Any applications using this API key will stop working immediately.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading === 'delete'}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Use API Keys</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">1. Get Server Status</h3>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs">
              <p className="text-gray-700">curl -X GET "http://192.168.10.203:12000/api/v1/server/status" \</p>
              <p className="text-gray-700 ml-4">-H "Authorization: Bearer YOUR_API_KEY"</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">2. Control Server Power</h3>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs">
              <p className="text-gray-700">curl -X POST "http://192.168.10.203:12000/api/v1/server/power" \</p>
              <p className="text-gray-700 ml-4">-H "Authorization: Bearer YOUR_API_KEY" \</p>
              <p className="text-gray-700 ml-4">-H "Content-Type: application/json" \</p>
              <p className="text-gray-700 ml-4">-d '{"action": "restart"}'</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Available Actions:</strong> start, stop, restart, shutdown, cancel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

