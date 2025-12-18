'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { authenticator } from 'otplib';
import { QRCodeSVG } from 'qrcode.react';
import { securityAPI } from '@/lib/api';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  UserIcon,
  BellIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface LoginHistory {
  id: string;
  user_email: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failed';
  timestamp: string;
  location?: string;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip_address: string;
  location?: string;
  last_activity: string;
  current: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used?: string;
  created_at: string;
  permissions: string[];
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'password_change' | 'new_device';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function SecurityPage() {
  const { user } = useAuth();
  const { success, error: showError, warning } = useNotification();
  
  // Two-Factor Authentication
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQRCode, setTwoFactorQRCode] = useState('');
  const [twoFactorOTPUrl, setTwoFactorOTPUrl] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [enablingTwoFactor, setEnablingTwoFactor] = useState(false);

  // Password Policies
  const [passwordPolicies, setPasswordPolicies] = useState({
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_expiry_days: 90,
    prevent_reuse: true,
    max_failed_attempts: 5,
    lockout_duration_minutes: 30,
  });
  const [savingPolicies, setSavingPolicies] = useState(false);

  // Session Management
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Login History
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [historySearch, setHistorySearch] = useState('');

  // IP Management
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [ipBlacklist, setIpBlacklist] = useState<string[]>([]);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [ipType, setIpType] = useState<'whitelist' | 'blacklist'>('whitelist');

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>([]);
  const [showApiKeyValue, setShowApiKeyValue] = useState<Record<string, boolean>>({});

  // Security Alerts
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [alertFilter, setAlertFilter] = useState<'all' | 'unresolved'>('unresolved');

  // Security Score
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    // Load data, but don't block if backend is unavailable
    // 2FA works completely offline, so this is optional
    loadSecurityData().catch((error) => {
      // Silently handle any errors during initial load
      // Don't show errors to user - IP lists are optional
      console.warn('Security data load failed (backend may be unavailable):', error);
      // Ensure IP lists are empty arrays on error
      setIpWhitelist([]);
      setIpBlacklist([]);
    });
    calculateSecurityScore();
  }, []);

  const loadSecurityData = async () => {
    // Load sessions
    setLoadingSessions(true);
    try {
      // Mock data - replace with actual API call
      setActiveSessions([
        {
          id: '1',
          device: 'Windows 11',
          browser: 'Chrome 120.0',
          ip_address: '192.168.1.100',
          location: 'New York, US',
          last_activity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          current: true,
        },
        {
          id: '2',
          device: 'macOS 14.0',
          browser: 'Safari 17.0',
          ip_address: '192.168.1.101',
          location: 'San Francisco, US',
          last_activity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          current: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }

    // Load login history
    setLoadingHistory(true);
    try {
      // Mock data - replace with actual API call
      setLoginHistory([
        {
          id: '1',
          user_email: 'admin@example.com',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'success',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          location: 'New York, US',
        },
        {
          id: '2',
          user_email: 'admin@example.com',
          ip_address: '192.168.1.200',
          user_agent: 'Mozilla/5.0 (Unknown)',
          status: 'failed',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          location: 'Unknown',
        },
      ]);
    } catch (error) {
      console.error('Failed to load login history:', error);
    } finally {
      setLoadingHistory(false);
    }

    // Load security alerts
    try {
      setSecurityAlerts([
        {
          id: '1',
          type: 'failed_login',
          severity: 'high',
          message: 'Multiple failed login attempts from IP 192.168.1.200',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          resolved: false,
        },
        {
          id: '2',
          type: 'new_device',
          severity: 'medium',
          message: 'New device login detected from San Francisco',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          resolved: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load security alerts:', error);
    }

    // Load IP whitelist and blacklist (fail silently if backend unavailable)
    // This is optional functionality - don't block page if backend is down
    // Note: 2FA works completely offline and doesn't need the backend
    try {
      const response = await securityAPI.getIpLists();
      if (response?.data) {
        setIpWhitelist(response.data.whitelist || []);
        setIpBlacklist(response.data.blacklist || []);
      }
    } catch (error: any) {
      // Silently fail - backend might not be available
      // Only log to console, don't show error to user, don't throw, don't notify
      // This is expected behavior when backend is offline
      if (error.code !== 'ERR_NETWORK' && error.message !== 'Network Error') {
        // Only log non-network errors (might be auth issues, etc.)
        console.warn('IP lists unavailable:', error.message);
      }
      // If error, keep empty arrays - this is fine, IP lists are optional
      setIpWhitelist([]);
      setIpBlacklist([]);
      // Don't rethrow - let the page continue loading normally
      // Don't call showError() - we want this to fail silently
    }
  };

  const calculateSecurityScore = () => {
    let score = 0;
    if (twoFactorEnabled) score += 25;
    if (passwordPolicies.min_length >= 12) score += 15;
    if (passwordPolicies.require_uppercase) score += 10;
    if (passwordPolicies.require_numbers) score += 10;
    if (passwordPolicies.require_special_chars) score += 10;
    if (passwordPolicies.password_expiry_days <= 90) score += 10;
    if (ipWhitelist.length > 0) score += 10;
    if (securityAlerts.filter(a => !a.resolved).length === 0) score += 10;
    setSecurityScore(score);
  };

  const generateSecret = () => {
    // Generate a random secret using authenticator library
    return authenticator.generateSecret();
  };

  const handleEnableTwoFactor = async () => {
    setEnablingTwoFactor(true);
    setTwoFactorQRCode(''); // Clear any existing QR code
    setShowTwoFactorSetup(false); // Reset setup state
    
    try {
      // Generate a new secret
      const secret = generateSecret();
      console.log('Generated secret:', secret);
      setTwoFactorSecret(secret);
      
      // Get user email for the QR code label
      const userEmail = (user as any)?.email || 'admin@example.com';
      const serviceName = 'NextPanel Billing';
      
      // Create the OTP Auth URI
      const otpAuthUrl = authenticator.keyuri(userEmail, serviceName, secret);
      console.log('OTP Auth URL:', otpAuthUrl);
      
      // Store the OTP URL for QRCodeSVG component
      setTwoFactorOTPUrl(otpAuthUrl);
      
      // Also try to generate a data URL for fallback display
      try {
        const QRCodeModule = await import('qrcode');
        const QRCode = QRCodeModule.default;
        const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
        setTwoFactorQRCode(qrCodeDataUrl);
        console.log('QR code data URL generated successfully');
      } catch (qrError: any) {
        console.warn('QR code data URL generation failed, using SVG component instead:', qrError);
        // We'll use QRCodeSVG component directly, so this is okay
        setTwoFactorQRCode('');
      }
      setShowTwoFactorSetup(true);
      success('Two-factor authentication setup initiated. Please scan the QR code with your authenticator app.');
    } catch (error: any) {
      console.error('Failed to generate 2FA setup:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      showError('Failed to enable two-factor authentication: ' + (error.message || 'Unknown error'));
      setTwoFactorSecret('');
      setTwoFactorQRCode('');
      setTwoFactorOTPUrl('');
      setShowTwoFactorSetup(false);
    } finally {
      setEnablingTwoFactor(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will reduce your account security.')) {
      return;
    }
    try {
      // In production, call your backend API here
      // await api.post('/admin/security/2fa/disable');
      
      setTwoFactorEnabled(false);
      setTwoFactorSecret('');
      setTwoFactorQRCode('');
      setTwoFactorOTPUrl('');
      setShowTwoFactorSetup(false);
      setTwoFactorCode('');
      success('Two-factor authentication disabled');
      calculateSecurityScore();
    } catch (error: any) {
      showError('Failed to disable two-factor authentication');
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }
    
    if (!twoFactorSecret) {
      showError('No secret found. Please restart the 2FA setup process.');
      return;
    }
    
    try {
      // Verify the TOTP code against the secret
      const isValid = authenticator.check(twoFactorCode, twoFactorSecret);
      
      if (!isValid) {
        showError('Invalid verification code. Please check your authenticator app and try again.');
        setTwoFactorCode('');
        return;
      }
      
      // Code is valid - save to backend (mock for now)
      // In production, you would send the secret to your backend API here
      // await api.post('/admin/security/2fa/enable', { secret: twoFactorSecret });
      
      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setTwoFactorCode('');
      success('Two-factor authentication enabled successfully!');
      calculateSecurityScore();
    } catch (error: any) {
      console.error('2FA verification error:', error);
      showError('Failed to verify code: ' + (error.message || 'Unknown error'));
      setTwoFactorCode('');
    }
  };

  const handleSavePasswordPolicies = async () => {
    setSavingPolicies(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('Password policies updated successfully');
      calculateSecurityScore();
    } catch (error: any) {
      showError('Failed to update password policies');
    } finally {
      setSavingPolicies(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this session?')) {
      return;
    }
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setActiveSessions(sessions => sessions.filter(s => s.id !== sessionId));
      success('Session terminated successfully');
    } catch (error: any) {
      showError('Failed to terminate session');
    }
  };

  const handleAddIpAddress = async () => {
    if (!newIpAddress.trim()) {
      showError('Please enter a valid IP address');
      return;
    }
    
    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIpAddress)) {
      showError('Please enter a valid IP address format (e.g., 192.168.1.1)');
      return;
    }

    try {
      let response;
      if (ipType === 'whitelist') {
        if (ipWhitelist.includes(newIpAddress)) {
          showError('IP address already in whitelist');
          return;
        }
        response = await securityAPI.addToWhitelist(newIpAddress);
        setIpWhitelist(response.data.whitelist || []);
        success('IP address added to whitelist');
      } else {
        if (ipBlacklist.includes(newIpAddress)) {
          showError('IP address already in blacklist');
          return;
        }
        response = await securityAPI.addToBlacklist(newIpAddress);
        setIpBlacklist(response.data.blacklist || []);
        success('IP address added to blacklist');
      }
      setNewIpAddress('');
      calculateSecurityScore();
    } catch (error: any) {
      console.error('Failed to add IP address:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to add IP address';
      showError(errorMessage);
    }
  };

  const handleRemoveIpAddress = async (ip: string, type: 'whitelist' | 'blacklist') => {
    try {
      let response;
      if (type === 'whitelist') {
        response = await securityAPI.removeFromWhitelist(ip);
        setIpWhitelist(response.data.whitelist || []);
        success('IP address removed from whitelist');
      } else {
        response = await securityAPI.removeFromBlacklist(ip);
        setIpBlacklist(response.data.blacklist || []);
        success('IP address removed from blacklist');
      }
      calculateSecurityScore();
    } catch (error: any) {
      console.error('Failed to remove IP address:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to remove IP address';
      showError(errorMessage);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      showError('Please enter a name for the API key');
      return;
    }
    try {
      // Mock API call
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newApiKeyName,
        key_prefix: 'sk_live_' + Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString(),
        permissions: newApiKeyPermissions,
      };
      setApiKeys([...apiKeys, newKey]);
      setShowApiKeyModal(false);
      setNewApiKeyName('');
      setNewApiKeyPermissions([]);
      success('API key created successfully');
    } catch (error: any) {
      showError('Failed to create API key');
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    try {
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      success('API key deleted successfully');
    } catch (error: any) {
      showError('Failed to delete API key');
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setSecurityAlerts(alerts =>
      alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a)
    );
    success('Alert marked as resolved');
    calculateSecurityScore();
  };

  const filteredHistory = loginHistory.filter(entry => {
    if (historyFilter !== 'all' && entry.status !== historyFilter) return false;
    if (historySearch && !entry.user_email.toLowerCase().includes(historySearch.toLowerCase()) &&
        !entry.ip_address.includes(historySearch)) return false;
    return true;
  });

  const filteredAlerts = securityAlerts.filter(alert => {
    if (alertFilter === 'unresolved' && alert.resolved) return false;
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage security settings, authentication, and access controls
          </p>
        </div>
        <button
          onClick={loadSecurityData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Security Score Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Security Score</h2>
            <div className="flex items-center space-x-4">
              <div className="text-4xl font-bold">{securityScore}/100</div>
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white rounded-full h-3 transition-all duration-500"
                    style={{ width: `${securityScore}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-indigo-100">
              {securityScore >= 80 ? 'Excellent security configuration' :
               securityScore >= 60 ? 'Good security, but could be improved' :
               securityScore >= 40 ? 'Security needs attention' :
               'Security is weak - please review recommendations'}
            </p>
          </div>
          <ShieldCheckIcon className="h-16 w-16 text-white/50" />
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
          </div>
          <div className="flex items-center space-x-3">
            {twoFactorEnabled ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                <XCircleIcon className="h-4 w-4 mr-1" />
                Disabled
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your account by requiring a verification code from your mobile device.
          <span className="block mt-2 text-xs text-amber-600">
            ⚠️ Note: The 2FA secret is currently stored in browser memory. For production use, integrate with your backend API to securely store the secret.
          </span>
        </p>
        {!twoFactorEnabled ? (
          <button
            onClick={handleEnableTwoFactor}
            disabled={enablingTwoFactor}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {enablingTwoFactor ? 'Setting up...' : 'Enable Two-Factor Authentication'}
          </button>
        ) : (
          <div className="space-y-4">
            {showTwoFactorSetup && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-2">Scan QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex items-start space-x-4">
                  <div className="bg-white p-4 rounded border flex-shrink-0">
                    {twoFactorOTPUrl && twoFactorSecret ? (
                      <div className="flex flex-col items-center">
                        {twoFactorQRCode ? (
                          <img 
                            src={twoFactorQRCode} 
                            alt="QR Code for Two-Factor Authentication" 
                            className="w-64 h-64 border border-gray-200"
                            onError={(e) => {
                              console.error('QR code image failed to load, falling back to SVG');
                              setTwoFactorQRCode('');
                            }}
                            onLoad={() => {
                              console.log('QR code image loaded successfully');
                            }}
                          />
                        ) : (
                          <div className="w-64 h-64 border border-gray-200 bg-white p-2">
                            <QRCodeSVG
                              value={twoFactorOTPUrl}
                              size={256}
                              level="M"
                              includeMargin={true}
                              className="w-full h-full"
                            />
                          </div>
                        )}
                        {!twoFactorSecret && (
                          <p className="text-xs text-red-600 mt-2">Warning: Secret not found. Please restart setup.</p>
                        )}
                      </div>
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                        <div className="text-center text-gray-500">
                          {enablingTwoFactor ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                              <p className="text-sm">Generating QR code...</p>
                            </>
                          ) : (
                            <>
                              <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                              <p className="text-sm">QR code not available</p>
                              <p className="text-xs mt-1">Click "Enable Two-Factor Authentication" again</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Or enter this secret key manually:</p>
                    <code className="block bg-white p-3 rounded border text-sm font-mono mb-4 break-all">
                      {twoFactorSecret}
                    </code>
                    <p className="text-xs text-gray-500 mb-4">
                      If you can't scan the QR code, enter this secret key manually in your authenticator app.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter verification code from your authenticator app
                      </label>
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg font-mono tracking-widest"
                        maxLength={6}
                        autoComplete="off"
                      />
                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        Enter the 6-digit code from your authenticator app to verify setup.
                      </p>
                      <button
                        onClick={handleVerifyTwoFactor}
                        disabled={!twoFactorCode || twoFactorCode.length !== 6}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify & Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleDisableTwoFactor}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              Disable Two-Factor Authentication
            </button>
          </div>
        )}
      </div>

      {/* Password Policies */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <LockClosedIcon className="h-6 w-6 text-indigo-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Password Policies</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Password Length
              </label>
              <input
                type="number"
                value={passwordPolicies.min_length}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, min_length: parseInt(e.target.value) || 8})}
                min="6"
                max="32"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Expiry (days)
              </label>
              <input
                type="number"
                value={passwordPolicies.password_expiry_days}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, password_expiry_days: parseInt(e.target.value) || 90})}
                min="30"
                max="365"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={passwordPolicies.require_uppercase}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, require_uppercase: e.target.checked})}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Require uppercase letters</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={passwordPolicies.require_lowercase}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, require_lowercase: e.target.checked})}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Require lowercase letters</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={passwordPolicies.require_numbers}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, require_numbers: e.target.checked})}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Require numbers</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={passwordPolicies.require_special_chars}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, require_special_chars: e.target.checked})}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Require special characters</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={passwordPolicies.prevent_reuse}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, prevent_reuse: e.target.checked})}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Prevent password reuse (last 5 passwords)</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Failed Login Attempts
              </label>
              <input
                type="number"
                value={passwordPolicies.max_failed_attempts}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, max_failed_attempts: parseInt(e.target.value) || 5})}
                min="3"
                max="10"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Lockout Duration (minutes)
              </label>
              <input
                type="number"
                value={passwordPolicies.lockout_duration_minutes}
                onChange={(e) => setPasswordPolicies({...passwordPolicies, lockout_duration_minutes: parseInt(e.target.value) || 30})}
                min="5"
                max="1440"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={handleSavePasswordPolicies}
            disabled={savingPolicies}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingPolicies ? 'Saving...' : 'Save Password Policies'}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DevicePhoneMobileIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Active Sessions</h2>
          </div>
          <span className="text-sm text-gray-500">{activeSessions.length} active</span>
        </div>
        {loadingSessions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : activeSessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  {session.current ? (
                    <ComputerDesktopIcon className="h-8 w-8 text-indigo-600" />
                  ) : (
                    <DevicePhoneMobileIcon className="h-8 w-8 text-gray-400" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{session.device}</span>
                      {session.current && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.browser} • {session.ip_address}
                      {session.location && ` • ${session.location}`}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Last activity: {formatTimeAgo(session.last_activity)}
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Terminate
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login History */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Login History</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No login history found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.location || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.status === 'success' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeAgo(entry.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* IP Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IP Whitelist */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">IP Whitelist</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Only allow access from these IP addresses
          </p>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newIpAddress}
              onChange={(e) => setNewIpAddress(e.target.value)}
              placeholder="192.168.1.1"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={() => {
                setIpType('whitelist');
                handleAddIpAddress();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {ipWhitelist.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No whitelisted IPs</p>
            ) : (
              ipWhitelist.map((ip) => (
                <div key={ip} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-mono text-gray-900">{ip}</span>
                  <button
                    onClick={() => handleRemoveIpAddress(ip, 'whitelist')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* IP Blacklist */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <XCircleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">IP Blacklist</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Block access from these IP addresses
          </p>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newIpAddress}
              onChange={(e) => setNewIpAddress(e.target.value)}
              placeholder="192.168.1.1"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={() => {
                setIpType('blacklist');
                handleAddIpAddress();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {ipBlacklist.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No blacklisted IPs</p>
            ) : (
              ipBlacklist.map((ip) => (
                <div key={ip} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-mono text-gray-900">{ip}</span>
                  <button
                    onClick={() => handleRemoveIpAddress(ip, 'blacklist')}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* API Key Management */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <KeyIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          </div>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create API Key
          </button>
        </div>
        {apiKeys.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No API keys created</p>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{key.name}</div>
                  <div className="text-sm text-gray-500 font-mono mt-1">
                    {key.key_prefix}...
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Created {formatTimeAgo(key.created_at)}
                    {key.last_used && ` • Last used ${formatTimeAgo(key.last_used)}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteApiKey(key.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Alerts */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Security Alerts</h2>
          </div>
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="unresolved">Unresolved</option>
            <option value="all">All</option>
          </select>
        </div>
        {filteredAlerts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No security alerts</p>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="font-medium">{alert.message}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/50">
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {formatTimeAgo(alert.timestamp)}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="ml-4 text-sm font-medium hover:underline"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Key Creation Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create API Key</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  placeholder="My API Key"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {['read', 'write', 'delete', 'admin'].map((perm) => (
                    <label key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newApiKeyPermissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewApiKeyPermissions([...newApiKeyPermissions, perm]);
                          } else {
                            setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== perm));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateApiKey}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setNewApiKeyName('');
                    setNewApiKeyPermissions([]);
                  }}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

