'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { domainProvidersAPI } from '@/lib/api';

interface ProviderType {
  value: string;
  label: string;
  description: string;
}

export default function AddDomainProviderPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    is_default: false,
    is_sandbox: true,
    api_url: '',
    api_username: '',  // Added API Username field
    api_key: '',
    api_secret: '',
    api_token: '',
    settings: {},
    pricing_config: {},
    supports_registration: true,
    supports_transfer: true,
    supports_renewal: true,
    supports_dns_management: true,
    supports_whois_privacy: true,
    rate_limit_per_minute: '60',
    rate_limit_per_hour: '1000'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsInitialized(true);
    loadProviderTypes();
  }, [isAuthenticated, router]);

  const loadProviderTypes = async () => {
    try {
      const response = await domainProvidersAPI.getTypes();
      setProviderTypes(response.data.types);
    } catch (error) {
      console.error('Failed to load provider types:', error);
      setError('Failed to load provider types');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setFormData(prev => ({
      ...prev,
      type,
      // Set default API URL based on type
      api_url: getDefaultApiUrl(type)
    }));
  };

  const getDefaultApiUrl = (type: string) => {
    const urls: { [key: string]: string } = {
      namecheap: 'https://api.sandbox.namecheap.com/xml.response',
      resellerclub: 'https://test.httpapi.com/api',
      godaddy: 'https://api.ote-godaddy.com/v1',
      cloudflare: 'https://api.cloudflare.com/client/v4',
      google_domains: 'https://domains.googleapis.com/v1',
      namecom: 'https://api.name.com/v4',
      enom: 'https://reseller.enom.com/interface.asp'
    };
    return urls[type] || '';
  };

  const getRequiredFields = (type: string) => {
    const fields: { [key: string]: string[] } = {
      namecheap: ['api_user', 'api_key', 'client_ip'],
      resellerclub: ['reseller_id', 'api_key'],
      godaddy: ['api_key', 'api_secret'],
      cloudflare: ['api_token', 'account_id'],
      google_domains: ['client_id', 'client_secret', 'refresh_token'],
      namecom: ['username', 'api_token'],
      enom: ['reseller_id', 'api_key']
    };
    return fields[type] || [];
  };

  const getApiKeyPlaceholder = (type: string) => {
    const placeholders: { [key: string]: string } = {
      namecheap: 'Your Namecheap API Key',
      resellerclub: 'Your ResellerClub API Key',
      godaddy: 'Your GoDaddy API Key',
      cloudflare: 'Your Cloudflare API Token',
      google_domains: 'Your Google OAuth Client ID',
      namecom: 'Your Name.com API Token',
      enom: 'Your eNom API Key'
    };
    return placeholders[type] || 'Your API key';
  };

  const getApiKeyHint = (type: string) => {
    const hints: { [key: string]: string } = {
      namecheap: 'This is your actual Namecheap API Key (not the username)',
      resellerclub: 'This is your ResellerClub API Key',
      godaddy: 'This is your GoDaddy API Key from the developer portal',
      cloudflare: 'This is your Cloudflare API Token with Zone:Read permissions',
      google_domains: 'This is your Google OAuth Client ID',
      namecom: 'This is your Name.com API Token',
      enom: 'This is your eNom API Key'
    };
    return hints[type] || '';
  };

  const getApiSecretHint = (type: string) => {
    const hints: { [key: string]: string } = {
      namecheap: 'This is your actual Namecheap API Key',
      resellerclub: 'This is your ResellerClub API Key',
      godaddy: 'This is your GoDaddy API Secret',
      cloudflare: 'This is your Cloudflare Account ID (optional)',
      google_domains: 'This is your Google OAuth Client Secret',
      namecom: 'This is your Name.com API Token',
      enom: 'This is your eNom API Key'
    };
    return hints[type] || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Prepare settings based on provider type
      const settings: any = {};
      const requiredFields = getRequiredFields(formData.type);
      
      // Add API username to settings for providers that need it
      if (formData.api_username) {
        settings.api_username = formData.api_username;
      }
      
      if (requiredFields.includes('api_user')) {
        settings.api_user = formData.api_username || formData.api_key; // Use api_username if available, fallback to api_key
      }
      if (requiredFields.includes('client_ip')) {
        settings.client_ip = '127.0.0.1'; // Default client IP
      }
      if (requiredFields.includes('account_id')) {
        settings.account_id = formData.api_secret; // Map api_secret to account_id for Cloudflare
      }

      const payload = {
        ...formData,
        settings
      };

      await domainProvidersAPI.create(payload);
      alert('Domain provider created successfully!');
      router.push('/admin/domain-providers');
    } catch (error: any) {
      console.error('Failed to create domain provider:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create domain provider');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Domain Provider</h1>
              <p className="mt-2 text-gray-600">
                Configure a new domain registrar API for domain registration and management
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Namecheap Production"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Provider Type *
                  </label>
                  <select
                    name="type"
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a provider type</option>
                    {providerTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_default"
                      id="is_default"
                      checked={formData.is_default}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                      Set as default provider
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_sandbox"
                      id="is_sandbox"
                      checked={formData.is_sandbox}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_sandbox" className="ml-2 block text-sm text-gray-900">
                      Sandbox/Test environment
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* API Configuration */}
            {selectedType && (
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  API Configuration
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="api_url" className="block text-sm font-medium text-gray-700">
                      API URL
                    </label>
                    <input
                      type="url"
                      name="api_url"
                      id="api_url"
                      value={formData.api_url}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="https://api.example.com"
                    />
                  </div>

                  {(selectedType === 'namecheap' || selectedType === 'resellerclub' || selectedType === 'enom') && (
                    <div>
                      <label htmlFor="api_username" className="block text-sm font-medium text-gray-700">
                        API Username
                      </label>
                      <input
                        type="text"
                        name="api_username"
                        id="api_username"
                        value={formData.api_username}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder={selectedType === 'namecheap' ? 'Your Namecheap API Username' : 'Your API Username'}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedType === 'namecheap' 
                          ? 'This is your Namecheap API Username (different from your account username)'
                          : 'Your API username or account identifier'
                        }
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                      API Key
                    </label>
                    <input
                      type="text"
                      name="api_key"
                      id="api_key"
                      value={formData.api_key}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder={getApiKeyPlaceholder(selectedType)}
                    />
                    {getApiKeyHint(selectedType) && (
                      <p className="mt-1 text-xs text-gray-500">
                        {getApiKeyHint(selectedType)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="api_secret" className="block text-sm font-medium text-gray-700">
                      API Secret / Password
                      {selectedType === 'cloudflare' && <span className="text-gray-500"> (Optional)</span>}
                    </label>
                    <input
                      type="password"
                      name="api_secret"
                      id="api_secret"
                      value={formData.api_secret}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder={selectedType === 'cloudflare' ? "Account ID (optional)" : "Your API secret or password"}
                    />
                    {getApiSecretHint(selectedType) && (
                      <p className="mt-1 text-xs text-gray-500">
                        {getApiSecretHint(selectedType)}
                      </p>
                    )}
                  </div>

                  {selectedType === 'cloudflare' && (
                    <div>
                      <label htmlFor="api_token" className="block text-sm font-medium text-gray-700">
                        API Token (for Cloudflare)
                      </label>
                      <input
                        type="text"
                        name="api_token"
                        id="api_token"
                        value={formData.api_token}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Your Cloudflare API token"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Supported Features
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'supports_registration', label: 'Domain Registration' },
                  { key: 'supports_transfer', label: 'Domain Transfer' },
                  { key: 'supports_renewal', label: 'Domain Renewal' },
                  { key: 'supports_dns_management', label: 'DNS Management' },
                  { key: 'supports_whois_privacy', label: 'WHOIS Privacy' }
                ].map((feature) => (
                  <div key={feature.key} className="flex items-center">
                    <input
                      type="checkbox"
                      name={feature.key}
                      id={feature.key}
                      checked={formData[feature.key as keyof typeof formData] as boolean}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={feature.key} className="ml-2 block text-sm text-gray-900">
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate Limiting */}
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Rate Limiting
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="rate_limit_per_minute" className="block text-sm font-medium text-gray-700">
                    Requests per minute
                  </label>
                  <input
                    type="number"
                    name="rate_limit_per_minute"
                    id="rate_limit_per_minute"
                    value={formData.rate_limit_per_minute}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="1"
                  />
                </div>

                <div>
                  <label htmlFor="rate_limit_per_hour" className="block text-sm font-medium text-gray-700">
                    Requests per hour
                  </label>
                  <input
                    type="number"
                    name="rate_limit_per_hour"
                    id="rate_limit_per_hour"
                    value={formData.rate_limit_per_hour}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Provider'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
