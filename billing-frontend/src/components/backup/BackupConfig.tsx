'use client';

import { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  CloudArrowUpIcon,
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface BackupConfig {
  googleDrive: {
    enabled: boolean;
    folderId: string;
    credentialsPath?: string;
    autoUpload: boolean;
    encrypt: boolean;
  };
  notifications: {
    email: boolean;
    successAlerts: boolean;
    failureAlerts: boolean;
    quotaAlerts: boolean;
    recipient: string;
  };
  advanced: {
    retention: number;
    compressionLevel: number;
    maxConcurrent: number;
    timeout: number;
    encrypt: boolean;
  };
}

export default function BackupConfig() {
  const [config, setConfig] = useState<BackupConfig>({
    googleDrive: {
      enabled: false,
      folderId: '',
      credentialsPath: '',
      autoUpload: false,
      encrypt: false,
    },
    notifications: {
      email: true,
      successAlerts: true,
      failureAlerts: true,
      quotaAlerts: true,
      recipient: '',
    },
    advanced: {
      retention: 30,
      compressionLevel: 6,
      maxConcurrent: 2,
      timeout: 30,
      encrypt: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/backup/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Failed to load backup configuration:', error);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/backup/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save backup configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const testGoogleDriveConnection = async () => {
    // Check if folder ID is provided
    if (!config.googleDrive.folderId || config.googleDrive.folderId.trim() === '') {
      alert('Please enter a Google Drive folder ID before testing the connection.');
      return;
    }

    try {
      const params = new URLSearchParams({
        folderId: config.googleDrive.folderId,
      });
      
      if (config.googleDrive.credentialsPath) {
        params.append('credentialsPath', config.googleDrive.credentialsPath);
      }
      
      const response = await fetch(`/api/backup/test-google-drive?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Google Drive connection successful!');
      } else {
        alert(data.message || 'Google Drive connection failed. Please check your credentials.');
      }
    } catch (error) {
      alert('Error testing Google Drive connection.');
    }
  };

  const updateConfig = (section: keyof BackupConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Backup Configuration</h2>
        <div className="flex items-center space-x-3">
          {saveStatus === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              Save failed
            </div>
          )}
          <button
            onClick={saveConfig}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Google Drive Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <CloudArrowUpIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Google Drive Integration</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Enable Google Drive</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.googleDrive.enabled}
                onChange={(e) => updateConfig('googleDrive', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {config.googleDrive.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Account Credentials File Path
                </label>
                <input
                  type="text"
                  value={config.googleDrive.credentialsPath || ''}
                  onChange={(e) => updateConfig('googleDrive', 'credentialsPath', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="/path/to/service-account-key.json"
                />
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs font-medium text-green-700 mb-2">
                    ✅ <strong>No app approval needed!</strong> Works immediately for private use.
                  </p>
                  <p className="text-xs font-medium text-blue-900 mb-1">📖 How to get the credentials file:</p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Create a project → Enable "Google Drive API" (ignore OAuth warnings)</li>
                    <li>Create a Service Account → Download JSON key file</li>
                    <li>Upload the JSON file to your server (e.g., <code className="bg-blue-100 px-1 rounded">/etc/backup/google-credentials.json</code>)</li>
                    <li>Set permissions: <code className="bg-blue-100 px-1 rounded">chmod 600</code></li>
                    <li>Share a Google Drive folder with the service account email</li>
                    <li>Enter the file path above</li>
                  </ol>
                  <p className="text-xs text-blue-700 mt-2">
                    💡 <strong>Full guide:</strong> See <code className="bg-blue-100 px-1 rounded">GOOGLE_DRIVE_SETUP_GUIDE.md</code> in the project root for detailed instructions
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Drive Folder ID
                </label>
                <input
                  type="text"
                  value={config.googleDrive.folderId}
                  onChange={(e) => updateConfig('googleDrive', 'folderId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter Google Drive folder ID"
                />
                <button
                  onClick={testGoogleDriveConnection}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Test Connection
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-upload backups</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.googleDrive.autoUpload}
                    onChange={(e) => updateConfig('googleDrive', 'autoUpload', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Encrypt backups before upload</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.googleDrive.encrypt}
                    onChange={(e) => updateConfig('googleDrive', 'encrypt', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notification Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <BellIcon className="h-5 w-5 text-orange-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email notifications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.email}
                onChange={(e) => updateConfig('notifications', 'email', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {config.notifications.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Recipient
              </label>
              <input
                type="email"
                value={config.notifications.recipient}
                onChange={(e) => updateConfig('notifications', 'recipient', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="admin@yourdomain.com"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Backup success alerts</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.successAlerts}
                onChange={(e) => updateConfig('notifications', 'successAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Backup failure alerts</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.failureAlerts}
                onChange={(e) => updateConfig('notifications', 'failureAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Storage quota alerts</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.quotaAlerts}
                onChange={(e) => updateConfig('notifications', 'quotaAlerts', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Cog6ToothIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Retention Period (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={config.advanced.retention}
              onChange={(e) => updateConfig('advanced', 'retention', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compression Level
            </label>
            <select
              value={config.advanced.compressionLevel}
              onChange={(e) => updateConfig('advanced', 'compressionLevel', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={1}>Fast (1)</option>
              <option value={6}>Balanced (6)</option>
              <option value={9}>Best (9)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Concurrent Backups
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={config.advanced.maxConcurrent}
              onChange={(e) => updateConfig('advanced', 'maxConcurrent', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Timeout (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={config.advanced.timeout}
              onChange={(e) => updateConfig('advanced', 'timeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Encrypt local backups</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.advanced.encrypt}
                onChange={(e) => updateConfig('advanced', 'encrypt', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Ensure your Google Drive service account credentials file is securely stored and never commit it to version control. 
              The credentials file should be placed in a secure location (e.g., /etc/backup/) with restricted permissions (chmod 600).
              You can configure the path to your credentials file above, or set the GOOGLE_SERVICE_ACCOUNT_KEY_FILE environment variable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
