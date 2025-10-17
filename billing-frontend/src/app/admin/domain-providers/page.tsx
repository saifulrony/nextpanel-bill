'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { domainProvidersAPI } from '@/lib/api';

interface DomainProvider {
  id: string;
  name: string;
  type: string;
  status: string;
  is_default: boolean;
  is_sandbox: boolean;
  api_url?: string;
  supports_registration: boolean;
  supports_transfer: boolean;
  supports_renewal: boolean;
  supports_dns_management: boolean;
  supports_whois_privacy: boolean;
  created_at: string;
  updated_at?: string;
  last_tested_at?: string;
}

interface ProviderType {
  value: string;
  label: string;
  description: string;
}

export default function DomainProvidersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [providers, setProviders] = useState<DomainProvider[]>([]);
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsInitialized(true);
    loadProviders();
    loadProviderTypes();
  }, [isAuthenticated, router]);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const response = await domainProvidersAPI.list();
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to load domain providers:', error);
      setError('Failed to load domain providers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviderTypes = async () => {
    try {
      const response = await domainProvidersAPI.getTypes();
      setProviderTypes(response.data.types);
    } catch (error) {
      console.error('Failed to load provider types:', error);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      setTestingProvider(providerId);
      const response = await domainProvidersAPI.test(providerId, {
        test_domain: 'example.com',
        test_type: 'connection'
      });
      
      if (response.data.success) {
        alert('Provider test successful!');
        await loadProviders(); // Refresh the list
      } else {
        alert(`Provider test failed: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Provider test failed:', error);
      alert(`Provider test failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const handleActivateProvider = async (providerId: string) => {
    try {
      await domainProvidersAPI.activate(providerId);
      alert('Provider activated successfully!');
      await loadProviders();
    } catch (error: any) {
      console.error('Failed to activate provider:', error);
      alert(`Failed to activate provider: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeactivateProvider = async (providerId: string) => {
    try {
      await domainProvidersAPI.deactivate(providerId);
      alert('Provider deactivated successfully!');
      await loadProviders();
    } catch (error: any) {
      console.error('Failed to deactivate provider:', error);
      alert(`Failed to deactivate provider: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this domain provider?')) {
      return;
    }

    try {
      await domainProvidersAPI.delete(providerId);
      alert('Provider deleted successfully!');
      await loadProviders();
    } catch (error: any) {
      console.error('Failed to delete provider:', error);
      alert(`Failed to delete provider: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Domain Providers</h1>
              <p className="mt-2 text-gray-600">
                Configure domain registrar APIs for domain registration and management
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/domain-providers/add')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Provider
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Providers List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No domain providers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a domain provider configuration.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/admin/domain-providers/add')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Provider
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {providers.map((provider) => (
                <li key={provider.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getStatusIcon(provider.status)}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {provider.name}
                          </h3>
                          {provider.is_default && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                          {provider.is_sandbox && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Sandbox
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-500">
                            {providerTypes.find(t => t.value === provider.type)?.label || provider.type}
                          </p>
                          <div className="mt-1 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                              {provider.status}
                            </span>
                            {provider.last_tested_at && (
                              <span className="text-xs text-gray-500">
                                Last tested: {new Date(provider.last_tested_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {provider.supports_registration && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Registration
                            </span>
                          )}
                          {provider.supports_transfer && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Transfer
                            </span>
                          )}
                          {provider.supports_renewal && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Renewal
                            </span>
                          )}
                          {provider.supports_dns_management && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              DNS
                            </span>
                          )}
                          {provider.supports_whois_privacy && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Privacy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={testingProvider === provider.id}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {testingProvider === provider.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        ) : (
                          <PlayIcon className="h-4 w-4 mr-1" />
                        )}
                        Test
                      </button>
                      
                      <button
                        onClick={() => router.push(`/admin/domain-providers/${provider.id}/edit`)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>

                      {provider.status === 'active' ? (
                        <button
                          onClick={() => handleDeactivateProvider(provider.id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateProvider(provider.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Activate
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
