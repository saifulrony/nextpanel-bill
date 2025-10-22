'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { customerProfileAPI } from '@/lib/api';
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  KeyIcon,
  Cog6ToothIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  
  const [settings, setSettings] = useState({
    profile: {
      fullName: '',
      email: '',
      phone: '',
      company: '',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      billingAlerts: true,
      securityAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
    },
    preferences: {
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      language: 'en',
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated (but wait for auth check to complete)
  useEffect(() => {
    console.log('=== AUTH CHECK DEBUG ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    console.log('localStorage access_token:', localStorage.getItem('access_token'));
    
    // Only redirect if we're sure the user is not authenticated
    // Don't redirect immediately on page load while auth is still loading
    if (isAuthenticated === false && user === null) {
      console.log('Not authenticated, redirecting to customer login');
      // Redirect to customer login page if not authenticated
      window.location.href = '/customer/login';
    } else if (isAuthenticated) {
      console.log('User is authenticated');
    } else {
      console.log('Auth state still loading...');
    }
    console.log('=== END AUTH CHECK DEBUG ===');
  }, [isAuthenticated, user]);

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        console.log('=== LOADING PROFILE DEBUG ===');
        console.log('Auth state:', { isAuthenticated, user });
        console.log('Loading profile for user:', user);
        
        const profileData = await customerProfileAPI.getProfile();
        console.log('Profile data received from API:', profileData);
        
        const updatedSettings = {
          fullName: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          company: profileData.company || '',
        };
        console.log('Updated profile settings:', updatedSettings);
        
        setSettings(prev => ({
          ...prev,
          profile: updatedSettings,
        }));
        console.log('=== END LOADING PROFILE DEBUG ===');
      } catch (error) {
        console.error('Error loading profile:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, user]);

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      if (section === 'profile') {
        await customerProfileAPI.updateProfile({
          full_name: settings.profile.fullName,
          email: settings.profile.email,
          phone: settings.profile.phone,
          company: settings.profile.company,
        });
      } else if (section === 'notifications' || section === 'security' || section === 'preferences') {
        await customerProfileAPI.updateSettings(settings[section as keyof typeof settings]);
      }
      
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaving(false);
      // You could add error state handling here
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  // Show loading screen while auth is being checked or profile is loading
  if (loading || (isAuthenticated === undefined && user === undefined)) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Show loading screen if not authenticated (while redirecting)
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <UserIcon className="h-6 w-6 text-indigo-500 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Profile Information
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={settings.profile.fullName}
                onChange={(e) => handleInputChange('profile', 'fullName', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                value={settings.profile.phone}
                onChange={(e) => handleInputChange('profile', 'phone', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <input
                type="text"
                value={settings.profile.company}
                onChange={(e) => handleInputChange('profile', 'company', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => handleSave('profile')}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="h-6 w-6 text-indigo-500 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Notification Preferences
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive important updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-500">Receive urgent alerts via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Marketing Emails</h4>
                <p className="text-sm text-gray-500">Receive promotional offers and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.marketingEmails}
                  onChange={(e) => handleInputChange('notifications', 'marketingEmails', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Billing Alerts</h4>
                <p className="text-sm text-gray-500">Get notified about billing and payment issues</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.billingAlerts}
                  onChange={(e) => handleInputChange('notifications', 'billingAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => handleSave('notifications')}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Notifications'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-500 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Security Settings
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Login Alerts</h4>
                <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.loginAlerts}
                  onChange={(e) => handleInputChange('security', 'loginAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Session Timeout (minutes)
              </label>
              <select
                value={settings.security.sessionTimeout}
                onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => handleSave('security')}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Cog6ToothIcon className="h-6 w-6 text-indigo-500 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Preferences
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                value={settings.preferences.timezone}
                onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date Format
              </label>
              <select
                value={settings.preferences.dateFormat}
                onChange={(e) => handleInputChange('preferences', 'dateFormat', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                value={settings.preferences.currency}
                onChange={(e) => handleInputChange('preferences', 'currency', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                value={settings.preferences.language}
                onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => handleSave('preferences')}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <CheckIcon className="h-5 w-5 mr-2" />
          Settings saved successfully!
        </div>
      )}
    </div>
  );
}
