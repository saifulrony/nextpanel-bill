'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { domainProvidersAPI } from '@/lib/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ProviderType {
  value: string;
  label: string;
  description: string;
}

interface DomainProvider {
  id: string;
  name: string;
  type: string;
  status: string;
  is_default: boolean;
  is_sandbox: boolean;
  api_url?: string;
  api_key?: string;
  api_secret?: string;
  api_token?: string;
  settings?: any;
  supports_registration: boolean;
  supports_transfer: boolean;
  supports_renewal: boolean;
  supports_dns_management: boolean;
  supports_whois_privacy: boolean;
  created_at: string;
  updated_at?: string;
}

export default function EditDomainProviderPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [provider, setProvider] = useState<DomainProvider | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    api_url: '',
    api_username: '',  // Added API Username field
    api_key: '',
    api_secret: '',
    api_token: '',
    is_default: false,
    is_sandbox: true,
    supports_registration: true,
    supports_transfer: true,
    supports_renewal: true,
    supports_dns_management: true,
    supports_whois_privacy: true,
    rate_limit_per_minute: '60',
    rate_limit_per_hour: '1000',
    settings: {} as any
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsInitialized(true);
    loadProviderTypes();
    loadProvider();
  }, [isAuthenticated, router, params.id]);

  const loadProviderTypes = async () => {
    try {
      const response = await domainProvidersAPI.getTypes();
      setProviderTypes(response.data.types);
    } catch (error) {
      console.error('Failed to load provider types:', error);
    }
  };

  const loadProvider = async () => {
    try {
      const response = await domainProvidersAPI.get(params.id as string);
      const providerData = response.data;
      setProvider(providerData);
      setSelectedType(providerData.type);
      
      setFormData({
        name: providerData.name || '',
        type: providerData.type || '',
        description: providerData.description || '',
        api_url: providerData.api_url || '',
        api_username: providerData.settings?.api_username || '',
        api_key: providerData.api_key || '',
        api_secret: providerData.api_secret || '',
        api_token: providerData.api_token || '',
        is_default: providerData.is_default || false,
        is_sandbox: providerData.is_sandbox !== false,
        supports_registration: providerData.supports_registration !== false,
        supports_transfer: providerData.supports_transfer !== false,
        supports_renewal: providerData.supports_renewal !== false,
        supports_dns_management: providerData.supports_dns_management !== false,
        supports_whois_privacy: providerData.supports_whois_privacy !== false,
        rate_limit_per_minute: providerData.rate_limit_per_minute || '60',
        rate_limit_per_hour: providerData.rate_limit_per_hour || '1000',
        settings: {
          ...providerData.settings,
          client_ip: providerData.settings?.client_ip || ''
        }
      });
    } catch (error) {
      console.error('Failed to load provider:', error);
      setError('Failed to load provider details');
    }
  };

  const getDefaultApiUrl = (type: string, isSandbox: boolean = true) => {
    const urls: { [key: string]: { sandbox: string; production: string } } = {
      namecheap: {
        sandbox: 'https://api.sandbox.namecheap.com/xml.response',
        production: 'https://api.namecheap.com/xml.response'
      },
      resellerclub: {
        sandbox: 'https://test.httpapi.com/api/',
        production: 'https://httpapi.com/api/'
      },
      godaddy: {
        sandbox: 'https://api.ote-godaddy.com/v1',
        production: 'https://api.godaddy.com/v1'
      },
      cloudflare: {
        sandbox: 'https://api.cloudflare.com/client/v4',
        production: 'https://api.cloudflare.com/client/v4'
      },
      google_domains: {
        sandbox: 'https://domains.googleapis.com/v1',
        production: 'https://domains.googleapis.com/v1'
      },
      namecom: {
        sandbox: 'https://api.name.com/v4',
        production: 'https://api.name.com/v4'
      },
      enom: {
        sandbox: 'https://reseller.enom.com/interface.asp',
        production: 'https://reseller.enom.com/interface.asp'
      }
    };
    
    const providerUrls = urls[type];
    if (!providerUrls) return '';
    
    return isSandbox ? providerUrls.sandbox : providerUrls.production;
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
      namecheap: 'Your Namecheap API Username',
      resellerclub: 'Your ResellerClub Reseller ID',
      godaddy: 'Your GoDaddy API Key',
      cloudflare: 'Your Cloudflare API Token',
      google_domains: 'Your Google OAuth Client ID',
      namecom: 'Your Name.com Username',
      enom: 'Your eNom Reseller ID'
    };
    return placeholders[type] || 'Your API key or username';
  };

  const getApiKeyHint = (type: string) => {
    const hints: { [key: string]: string } = {
      namecheap: 'This is your Namecheap API Username (not the API key)',
      resellerclub: 'This is your ResellerClub Reseller ID',
      godaddy: 'This is your GoDaddy API Key from the developer portal',
      cloudflare: 'This is your Cloudflare API Token with Zone:Read permissions',
      google_domains: 'This is your Google OAuth Client ID',
      namecom: 'This is your Name.com account username',
      enom: 'This is your eNom Reseller ID'
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      // If toggling sandbox mode, update API URL
      if (name === 'is_sandbox' && selectedType) {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          api_url: getDefaultApiUrl(selectedType, checked)
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setSelectedType(newType);
    setFormData(prev => ({
      ...prev,
      type: newType,
      api_url: getDefaultApiUrl(newType, prev.is_sandbox)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      setError('Name and type are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare settings with api_username and client_ip
      const settings = {
        ...formData.settings,
        ...(formData.api_username && { api_username: formData.api_username }),
        ...(formData.settings?.client_ip && { client_ip: formData.settings.client_ip })
      };

      const updateData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        api_url: formData.api_url,
        api_key: formData.api_key,
        api_secret: formData.api_secret,
        api_token: formData.api_token,
        is_default: formData.is_default,
        is_sandbox: formData.is_sandbox,
        supports_registration: formData.supports_registration,
        supports_transfer: formData.supports_transfer,
        supports_renewal: formData.supports_renewal,
        supports_dns_management: formData.supports_dns_management,
        supports_whois_privacy: formData.supports_whois_privacy,
        rate_limit_per_minute: formData.rate_limit_per_minute,
        rate_limit_per_hour: formData.rate_limit_per_hour,
        settings: settings
      };

      await domainProvidersAPI.update(params.id as string, updateData);
      router.push('/admin/domain-providers');
    } catch (error: any) {
      console.error('Failed to update provider:', error);
      setError(error.response?.data?.detail || 'Failed to update provider');
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

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading provider...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Domain Provider</h1>
          <p className="mt-2 text-gray-600">
            Update the configuration for {provider.name}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={handleTypeChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a provider type</option>
                    {providerTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Optional description for this provider configuration"
                />
              </div>
            </div>

            {/* API Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
              
              {selectedType === 'namecheap' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Namecheap API Configuration
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p><strong>Sandbox URL:</strong> https://api.sandbox.namecheap.com/xml.response</p>
                        <p><strong>Production URL:</strong> https://api.namecheap.com/xml.response</p>
                        <p className="mt-2">To use production API, uncheck "Use sandbox/test environment" and update the API URL above.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
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

                {selectedType === 'namecheap' && (
                  <div>
                    <label htmlFor="client_ip" className="block text-sm font-medium text-gray-700">
                      Client IP Address *
                    </label>
                    <input
                      type="text"
                      name="client_ip"
                      id="client_ip"
                      value={formData.settings?.client_ip || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, client_ip: e.target.value }
                      }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="127.0.0.1 or your server's public IP"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Your server's IP address that will be whitelisted in Namecheap's API settings
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
                      type="password"
                      name="api_token"
                      id="api_token"
                      value={formData.api_token}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Your Cloudflare API Token"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Cloudflare API Token with appropriate permissions
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
              <div className="space-y-4">
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
                    Set as default provider for this type
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
                    Use sandbox/test environment
                  </label>
                </div>
              </div>
            </div>

            {/* Supported Features */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Supported Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="supports_registration"
                    id="supports_registration"
                    checked={formData.supports_registration}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="supports_registration" className="ml-2 block text-sm text-gray-900">
                    Domain Registration
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="supports_transfer"
                    id="supports_transfer"
                    checked={formData.supports_transfer}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="supports_transfer" className="ml-2 block text-sm text-gray-900">
                    Domain Transfer
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="supports_renewal"
                    id="supports_renewal"
                    checked={formData.supports_renewal}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="supports_renewal" className="ml-2 block text-sm text-gray-900">
                    Domain Renewal
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="supports_dns_management"
                    id="supports_dns_management"
                    checked={formData.supports_dns_management}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="supports_dns_management" className="ml-2 block text-sm text-gray-900">
                    DNS Management
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="supports_whois_privacy"
                    id="supports_whois_privacy"
                    checked={formData.supports_whois_privacy}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="supports_whois_privacy" className="ml-2 block text-sm text-gray-900">
                    WHOIS Privacy
                  </label>
                </div>
              </div>
            </div>

            {/* Rate Limiting */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Limiting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rate_limit_per_minute" className="block text-sm font-medium text-gray-700">
                    Requests per Minute
                  </label>
                  <input
                    type="number"
                    name="rate_limit_per_minute"
                    id="rate_limit_per_minute"
                    value={formData.rate_limit_per_minute}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="60"
                  />
                </div>

                <div>
                  <label htmlFor="rate_limit_per_hour" className="block text-sm font-medium text-gray-700">
                    Requests per Hour
                  </label>
                  <input
                    type="number"
                    name="rate_limit_per_hour"
                    id="rate_limit_per_hour"
                    value={formData.rate_limit_per_hour}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/admin/domain-providers')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Provider'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
