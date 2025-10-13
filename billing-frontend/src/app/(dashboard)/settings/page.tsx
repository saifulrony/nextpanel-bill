'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { settingsAPI } from '@/lib/api';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    company_name: user?.company_name || '',
  });
  
  // System settings
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});
  const [timeSettings, setTimeSettings] = useState({
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  useEffect(() => {
    if (user?.is_admin) {
      loadSystemSettings();
    }
  }, [user]);

  const loadSystemSettings = async () => {
    try {
      const response = await settingsAPI.list({ category: 'time' });
      const settings = response.data;
      
      const timeSettingsData: any = {};
      settings.forEach((setting: any) => {
        if (setting.key === 'system_timezone') timeSettingsData.timezone = setting.value;
        if (setting.key === 'date_format') timeSettingsData.date_format = setting.value;
        if (setting.key === 'time_format') timeSettingsData.time_format = setting.value;
      });
      
      setTimeSettings(timeSettingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile update functionality to be implemented');
  };

  const handleSystemSettingsSave = async () => {
    try {
      setSavingSettings(true);
      setSettingsMessage('');
      
      await settingsAPI.bulkUpdate({
        'system_timezone': timeSettings.timezone,
        'date_format': timeSettings.date_format,
        'time_format': timeSettings.time_format,
      });
      
      setSettingsMessage('Settings saved successfully!');
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSettingsMessage('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const initializeSettings = async () => {
    try {
      await settingsAPI.initialize();
      await loadSystemSettings();
      alert('Default settings initialized!');
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      alert('Failed to initialize settings');
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account and system settings
        </p>
      </div>

      {/* System Settings (Admin Only) */}
      {user?.is_admin && (
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  System Time Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure system-wide time and date preferences
                </p>
              </div>
              <button
                onClick={initializeSettings}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Initialize Defaults
              </button>
            </div>
            
            {settingsMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                settingsMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <p className="text-sm flex items-center">
                  {settingsMessage.includes('success') && <CheckCircleIcon className="h-4 w-4 mr-2" />}
                  {settingsMessage}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    System Timezone
                  </label>
                  <select
                    id="timezone"
                    value={timeSettings.timezone}
                    onChange={(e) => setTimeSettings({ ...timeSettings, timezone: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Chicago">Central Time (US)</option>
                    <option value="America/Denver">Mountain Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format
                  </label>
                  <select
                    id="date_format"
                    value={timeSettings.date_format}
                    onChange={(e) => setTimeSettings({ ...timeSettings, date_format: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2025-10-13)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (10/13/2025)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (13/10/2025)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (13-10-2025)</option>
                    <option value="MMMM DD, YYYY">MMMM DD, YYYY (October 13, 2025)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="time_format" className="block text-sm font-medium text-gray-700 mb-1">
                    Time Format
                  </label>
                  <select
                    id="time_format"
                    value={timeSettings.time_format}
                    onChange={(e) => setTimeSettings({ ...timeSettings, time_format: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="24h">24-hour (13:30)</option>
                    <option value="12h">12-hour (1:30 PM)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <button
                  onClick={handleSystemSettingsSave}
                  disabled={savingSettings}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Save System Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Profile Information
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Change Password
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Notification Preferences
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email_notifications"
                defaultChecked
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="email_notifications" className="ml-3 text-sm text-gray-700">
                Email notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="payment_receipts"
                defaultChecked
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="payment_receipts" className="ml-3 text-sm text-gray-700">
                Payment receipts
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="expiry_reminders"
                defaultChecked
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="expiry_reminders" className="ml-3 text-sm text-gray-700">
                License and domain expiry reminders
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="quota_alerts"
                defaultChecked
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="quota_alerts" className="ml-3 text-sm text-gray-700">
                Quota usage alerts
              </label>
            </div>

            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Account Status
          </h3>
          
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Account Status</dt>
              <dd className="text-sm text-gray-900">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Member Since</dt>
              <dd className="text-sm text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="text-sm text-gray-900 font-mono">{user?.id || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

