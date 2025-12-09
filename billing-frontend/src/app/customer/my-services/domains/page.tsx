'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { customerDomainsAPI, domainsAPI } from '@/lib/api';
import DomainManagementModal from '@/components/domains/DomainManagementModal';
import {
  GlobeAltIcon,
  CheckCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Domain {
  id: string;
  domain_name: string;
  registrar?: string;
  registration_date?: string;
  expiry_date?: string;
  auto_renew: boolean;
  nameservers?: string[];
  status: 'active' | 'expired' | 'expiring' | 'pending' | 'transferred';
  created_at: string;
}

interface DomainStats {
  total_domains: number;
  active_domains: number;
  expiring_soon: number;
  expired_domains: number;
  auto_renew_enabled: number;
}

export default function MyDomainsPage() {
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainStats, setDomainStats] = useState<DomainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [showDomainSearch, setShowDomainSearch] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [showDomainManagement, setShowDomainManagement] = useState(false);

  // Domain search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);
  const [domainSearchResults, setDomainSearchResults] = useState<any[]>([]);
  const [showDomainResults, setShowDomainResults] = useState(false);
  const [domainSearchError, setDomainSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('results');

  const popularTlds = [
    { extension: '.com', price: '$8.99/yr' },
    { extension: '.net', price: '$10.99/yr' },
    { extension: '.org', price: '$11.99/yr' },
    { extension: '.io', price: '$34.99/yr' },
    { extension: '.dev', price: '$14.99/yr' },
    { extension: '.app', price: '$17.99/yr' },
    { extension: '.xyz', price: '$12.99/yr' },
    { extension: '.store', price: '$15.99/yr' },
    { extension: '.online', price: '$9.99/yr' },
    { extension: '.tech', price: '$13.99/yr' },
    { extension: '.co', price: '$12.99/yr' },
    { extension: '.me', price: '$15.99/yr' },
    { extension: '.pro', price: '$19.99/yr' },
    { extension: '.biz', price: '$13.99/yr' },
    { extension: '.info', price: '$9.99/yr' },
    { extension: '.name', price: '$11.99/yr' },
    { extension: '.us', price: '$8.99/yr' },
    { extension: '.ca', price: '$12.99/yr' },
    { extension: '.uk', price: '$9.99/yr' },
    { extension: '.de', price: '$8.99/yr' },
    { extension: '.fr', price: '$8.99/yr' },
    { extension: '.es', price: '$8.99/yr' },
    { extension: '.it', price: '$8.99/yr' },
    { extension: '.nl', price: '$8.99/yr' },
  ];

  const loadDomains = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching domains for user:', user.id);
      const [domainsResponse, statsResponse] = await Promise.all([
        customerDomainsAPI.list(),
        customerDomainsAPI.getStats(),
      ]);

      console.log('Domains response:', domainsResponse);
      console.log('Stats response:', statsResponse);

      // Ensure domainsResponse is an array
      const domainsArray = Array.isArray(domainsResponse) ? domainsResponse : [];
      setDomains(domainsArray);
      setDomainStats(statsResponse || null);
    } catch (err) {
      console.error('Error fetching domains:', err);
      setError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadDomains();
    }
  }, [user?.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setDomainSearchError(null);
    setDomainSearchResults([]);
    setShowDomainResults(false);

    try {
      const response = await domainsAPI.search({
        domain_name: searchQuery,
        tlds: [selectedTld]
      });
      console.log('Domain search response:', response);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        setDomainSearchResults(response.data.results);
        setShowDomainResults(true);
      } else {
        setDomainSearchError('No domains found for your search');
      }
    } catch (err) {
      console.error('Domain search error:', err);
      setDomainSearchError('Failed to search domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDomainSelect = async (domain: string, price: number) => {
    try {
      console.log('Registering domain:', domain, 'Price:', price);
      const response = await customerDomainsAPI.register({
        domain_name: domain,
        years: 1,
        auto_renew: true,
        nameservers: ['ns1.example.com', 'ns2.example.com'],
      });

      console.log('Domain registration response:', response);
      
      if (response.success) {
        // Refresh the domains list
        const domainsResponse = await customerDomainsAPI.list();
        setDomains(domainsResponse.data || []);
        setShowDomainResults(false);
        setSearchQuery('');
        alert('Domain registered successfully!');
      } else {
        alert('Failed to register domain. Please try again.');
      }
    } catch (err) {
      console.error('Domain registration error:', err);
      alert('Failed to register domain. Please try again.');
    }
  };

  const handleAddToCart = (domain: string, price: number) => {
    addItem({
      id: `domain-${domain}`,
      name: `Domain: ${domain}`,
      type: 'domain',
      price: price,
      description: `Domain registration for ${domain}`,
      billing_cycle: 'yearly',
      category: 'domains'
    });
  }; 

  const handleUpdateAutoRenew = async (domainId: string, autoRenew: boolean) => {
    try {
      const response = await customerDomainsAPI.updateAutoRenew(domainId, autoRenew);
      if (response.success) {
        setDomains(domains.map(d => d.id === domainId ? { ...d, auto_renew: autoRenew } : d));
      }
    } catch (err) {
      console.error('Error updating auto-renew:', err);
    }
  };

  const handleCloseDomainManagement = () => {
    setShowDomainManagement(false);
    setSelectedDomain(null);
  };

  const handleDomainUpdated = (updatedDomain: Domain) => {
    setDomains(domains.map(d => d.id === updatedDomain.id ? updatedDomain : d));
  }; 

  const filteredDomains = domains.filter(domain => {
    if (selectedStatus !== 'all' && domain.status !== selectedStatus) {
      return false;
    }
    if (showExpiringOnly && domain.status !== 'expiring') {
      return false;
    }
    return true;
  });


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain Search Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your domain name..."
                  className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                />
              </div>
              <select
                value={selectedTld}
                onChange={(e) => setSelectedTld(e.target.value)}
                className="px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-w-[120px]"
              >
                {popularTlds.map((tld) => (
                  <option key={tld.extension} value={tld.extension}>
                    {tld.extension}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tab Navigation - Only show when there are search results */}
      {showDomainResults && domainSearchResults.length > 0 && (
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'results'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <span>Results</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('generator')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'generator'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                <span>Generator</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('auctions')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'auctions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                </svg>
                <span>Auctions</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('premium')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'premium'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
                <span>Premium</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('beast')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'beast'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
                <span>Beast Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('favorites')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'favorites'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span>Favorites (0)</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Domain Search Results Container */}
      <div>
        {domainSearchError && (
          <div className="mt-6">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {domainSearchError}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && showDomainResults && domainSearchResults.length > 0 && (
          <div className="mt-6">
            <div className="space-y-2">
              {domainSearchResults.map((result) => (
                <div key={result.domain} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-medium text-gray-900">{result.domain}</div>
                    <div className="text-sm text-gray-500">
                      {result.available ? 'Available' : 'Not Available'}
                    </div>
                    {result.available && result.price && result.price > 0 && (
                      <div className="text-sm font-semibold text-gray-900">
                        ${result.price.toFixed(2)}/yr
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddToCart(result.domain, result.price || 0)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                      title="Add to favorites"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                    </button>
                    {result.available && result.price && result.price > 0 ? (
                      <button
                        onClick={() => handleAddToCart(result.domain, result.price)}
                        className="px-4 py-2 text-white rounded-lg text-sm bg-green-600 hover:bg-green-700"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDomainSelect(result.domain, result.price || 0)}
                        className="px-4 py-2 text-white rounded-lg text-sm bg-blue-600 hover:bg-blue-700"
                      >
                        Register Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs content */}
        {activeTab === 'generator' && (
          <div className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Domain Generator</h3>
              <p className="mt-2 text-gray-500">Coming soon - Generate domain suggestions based on keywords</p>
            </div>
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Domain Auctions</h3>
              <p className="mt-2 text-gray-500">Coming soon - Browse expiring and auction domains</p>
            </div>
          </div>
        )}

        {activeTab === 'premium' && (
          <div className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Premium Domains</h3>
              <p className="mt-2 text-gray-500">Coming soon - Browse premium domain names</p>
            </div>
          </div>
        )}

        {activeTab === 'beast' && (
          <div className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Beast Mode</h3>
              <p className="mt-2 text-gray-500">Coming soon - Advanced domain search with bulk operations</p>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="mt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">Favorites</h3>
              <p className="mt-2 text-gray-500">No favorite domains yet. Add domains to your favorites to see them here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Domains</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  id="expiring-filter"
                  type="checkbox"
                  checked={showExpiringOnly}
                  onChange={(e) => setShowExpiringOnly(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="expiring-filter" className="ml-2 text-sm text-gray-700">
                  Show expiring only
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Domains List */}
      {filteredDomains.length === 0 ? (
        <div className="text-center py-12">
          <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No domains found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any domains registered yet. Use the search above to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredDomains.map((domain) => (
              <li key={domain.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <GlobeAltIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {domain.domain_name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          domain.status === 'active' ? 'bg-green-100 text-green-800' :
                          domain.status === 'expired' ? 'bg-red-100 text-red-800' :
                          domain.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                          domain.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {domain.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p>
                          {domain.registrar && `Registrar: ${domain.registrar}`}
                          {domain.expiry_date && ` • Expires: ${new Date(domain.expiry_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      {domain.nameservers && domain.nameservers.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-500 mb-1">Nameservers:</p>
                          <div className="flex flex-wrap gap-1">
                            {domain.nameservers.map((ns, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                                onClick={() => {
                                  setSelectedDomain(domain);
                                  setShowDomainManagement(true);
                                }}
                                title="Click to edit nameservers"
                              >
                                {ns}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDomain(domain);
                        setShowDomainManagement(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Domain Management Modal */}
      <DomainManagementModal
        domain={selectedDomain}
        isOpen={showDomainManagement}
        onClose={handleCloseDomainManagement}
        onDomainUpdated={() => {
          // Refresh domains list when domain is updated
          if (user?.id) {
            loadDomains();
          }
        }}
      />
    </div>
  );
}