'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { settingsAPI, authAPI } from '@/lib/api';
import { ClockIcon, CheckCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { success, error: showError, warning } = useNotification();
  const { theme, setTheme } = useTheme();
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
  const [currencySettings, setCurrencySettings] = useState({
    default_currency: 'USD',
    currency_symbol: '$',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if ((user as any)?.is_admin) {
      loadSystemSettings();
    }
  }, [user]);

  const loadSystemSettings = async () => {
    try {
      const response = await settingsAPI.list({ category: 'time' });
      const settings = response.data;
      
      const timeSettingsData: any = {};
      const currencySettingsData: any = {};
      settings.forEach((setting: any) => {
        if (setting.key === 'system_timezone') timeSettingsData.timezone = setting.value;
        if (setting.key === 'date_format') timeSettingsData.date_format = setting.value;
        if (setting.key === 'time_format') timeSettingsData.time_format = setting.value;
        if (setting.key === 'default_currency') currencySettingsData.default_currency = setting.value;
        if (setting.key === 'currency_symbol') currencySettingsData.currency_symbol = setting.value;
      });
      
      setTimeSettings(timeSettingsData);
      setCurrencySettings(currencySettingsData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('User not found');
      return;
    }
    
    try {
      await authAPI.updateProfile({
        full_name: formData.full_name,
        company_name: formData.company_name,
      });
      
      // Refresh user data
      await refreshUser();
      
      success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showError(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  // Password validation helper
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber
    };
  };

  const handlePasswordChange = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      warning('Please fill in all password fields');
      return;
    }
    
    const passwordValidation = validatePassword(passwordData.new_password);
    if (!passwordValidation.isValid) {
      warning('New password does not meet the requirements');
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      warning('New password and confirm password do not match');
      return;
    }
    
    setUpdatingPassword(true);
    
    try {
      console.log('Sending password update request:', {
        current_password: passwordData.current_password ? '***' : 'empty',
        new_password: passwordData.new_password ? '***' : 'empty',
      });
      
      await authAPI.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      // Clear password fields
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      success('Password updated successfully!');
    } catch (error: any) {
      console.error('Failed to update password:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
      showError(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSystemSettingsSave = async () => {
    try {
      setSavingSettings(true);
      setSettingsMessage('');
      
      await settingsAPI.bulkUpdate({
        'system_timezone': timeSettings.timezone,
        'date_format': timeSettings.date_format,
        'time_format': timeSettings.time_format,
        'default_currency': currencySettings.default_currency,
        'currency_symbol': currencySettings.currency_symbol,
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

  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'CHF',
      'INR': '₹',
      'BRL': 'R$',
      'MXN': '$',
      'SGD': 'S$',
      'AED': 'د.إ',
      'ZAR': 'R',
    };
    return symbols[currency] || currency;
  };

  return (
    <div className="px-4 py-8 sm:px-0 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account and system settings
        </p>
      </div>

      {/* System Settings (Admin Only) */}
      {(user as any)?.is_admin && (
        <>
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                    System Time Settings
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      System Timezone
                    </label>
                    <select
                      id="timezone"
                      value={timeSettings.timezone}
                      onChange={(e) => setTimeSettings({ ...timeSettings, timezone: e.target.value })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    <label htmlFor="date_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Format
                    </label>
                    <select
                      id="date_format"
                      value={timeSettings.date_format}
                      onChange={(e) => setTimeSettings({ ...timeSettings, date_format: e.target.value })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2025-10-13)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (10/13/2025)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (13/10/2025)</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY (13-10-2025)</option>
                      <option value="MMMM DD, YYYY">MMMM DD, YYYY (October 13, 2025)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="time_format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time Format
                    </label>
                    <select
                      id="time_format"
                      value={timeSettings.time_format}
                      onChange={(e) => setTimeSettings({ ...timeSettings, time_format: e.target.value })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="24h">24-hour (13:30)</option>
                      <option value="12h">12-hour (1:30 PM)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Currency Settings */}
          <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                  <svg className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Currency Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Set default currency for all transactions and invoices
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="default_currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Currency
                    </label>
                    <select
                      id="default_currency"
                      value={currencySettings.default_currency}
                      onChange={(e) => {
                        const currency = e.target.value;
                        const symbol = getCurrencySymbol(currency);
                        setCurrencySettings({ ...currencySettings, default_currency: currency, currency_symbol: symbol });
                      }}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="CNY">CNY - Chinese Yuan</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="CHF">CHF - Swiss Franc</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="BRL">BRL - Brazilian Real</option>
                      <option value="MXN">MXN - Mexican Peso</option>
                      <option value="SGD">SGD - Singapore Dollar</option>
                      <option value="AED">AED - UAE Dirham</option>
                      <option value="ZAR">ZAR - South African Rand</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="currency_symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      id="currency_symbol"
                      value={currencySettings.currency_symbol}
                      onChange={(e) => setCurrencySettings({ ...currencySettings, currency_symbol: e.target.value })}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="$"
                    />
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
        </>
      )}

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Profile Information
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Change Password
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {passwordData.new_password && (
                <div className="mt-2 text-xs space-y-1">
                  <div className={validatePassword(passwordData.new_password).hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                    {validatePassword(passwordData.new_password).hasMinLength ? '✓' : '✗'} At least 6 characters
                  </div>
                  <div className={validatePassword(passwordData.new_password).hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                    {validatePassword(passwordData.new_password).hasUppercase ? '✓' : '✗'} At least one uppercase letter (A-Z)
                  </div>
                  <div className={validatePassword(passwordData.new_password).hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                    {validatePassword(passwordData.new_password).hasLowercase ? '✓' : '✗'} At least one lowercase letter (a-z)
                  </div>
                  <div className={validatePassword(passwordData.new_password).hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                    {validatePassword(passwordData.new_password).hasNumber ? '✓' : '✗'} At least one number (0-9)
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <button 
              onClick={handlePasswordChange}
              disabled={updatingPassword}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Appearance Preferences */}
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <SunIcon className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Appearance Preferences
          </h3>
          <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
            Customize the appearance of your panel interface
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {theme === 'dark' ? (
                    <MoonIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <SunIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="ml-3">
                  <label htmlFor="theme-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Theme Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose between light and dark mode
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    theme === 'light' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  role="switch"
                  aria-checked={theme === 'light'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      theme === 'light' ? 'translate-x-0' : 'translate-x-5'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  {theme === 'light' ? 'Light' : 'Dark'}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your theme preference is saved automatically and will be applied across all pages.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
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
              <label htmlFor="email_notifications" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
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
              <label htmlFor="payment_receipts" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
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
              <label htmlFor="expiry_reminders" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
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
              <label htmlFor="quota_alerts" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
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
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Account Status
          </h3>
          
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Active
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
              <dd className="text-sm text-gray-900 dark:text-white font-mono">{user?.id || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

