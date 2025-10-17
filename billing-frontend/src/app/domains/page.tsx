'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { domainsAPI } from '@/lib/api';
import DomainRegistrationModal from '@/components/domains/DomainRegistrationModal';

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number;
  currency: string;
  registrar: string;
  registration_period: number;
}

interface DomainSearchResponse {
  results: DomainSearchResult[];
  search_term: string;
  total_found: number;
  available_count: number;
}

export default function DomainsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTlds, setSelectedTlds] = useState<string[]>(['.com', '.net', '.org', '.io']);
  const [registrationModal, setRegistrationModal] = useState<{
    isOpen: boolean;
    domain: string;
    price: number;
  }>({
    isOpen: false,
    domain: '',
    price: 0
  });

  const popularTlds = [
    { extension: '.com', price: '$12.99/yr', popular: true },
    { extension: '.net', price: '$14.99/yr', popular: true },
    { extension: '.org', price: '$15.99/yr', popular: true },
    { extension: '.io', price: '$34.99/yr', popular: true },
    { extension: '.co', price: '$24.99/yr', popular: false },
    { extension: '.dev', price: '$14.99/yr', popular: false },
    { extension: '.app', price: '$17.99/yr', popular: false },
    { extension: '.tech', price: '$19.99/yr', popular: false },
    { extension: '.online', price: '$9.99/yr', popular: false },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await domainsAPI.search({
        domain_name: searchTerm.trim(),
        tlds: selectedTlds
      });
      
      setSearchResults(response.data);
    } catch (error: any) {
      console.error('Domain search error:', error);
      setError('Failed to search domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTldToggle = (tld: string) => {
    setSelectedTlds(prev => 
      prev.includes(tld) 
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };

  const handleRegisterDomain = (domain: string, price: number) => {
    setRegistrationModal({
      isOpen: true,
      domain,
      price
    });
  };

  const handleCloseRegistrationModal = () => {
    setRegistrationModal({
      isOpen: false,
      domain: '',
      price: 0
    });
  };

  const handleRegistrationSuccess = () => {
    // Refresh the search results or show success message
    console.log('Domain registration successful!');
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Domain Search</h1>
                <p className="mt-2 text-gray-600">
                  Find and register the perfect domain for your project
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <GlobeAltIcon className="h-5 w-5" />
                <span>Powered by Namecheap</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label htmlFor="domain-search" className="block text-sm font-medium text-gray-700 mb-2">
                Search for a domain
              </label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    id="domain-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter domain name (e.g., mycompany)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchTerm.trim()}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  )}
                  <span>{isSearching ? 'Searching...' : 'Search'}</span>
                </button>
              </div>
            </div>

            {/* TLD Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select TLDs to search
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
                {popularTlds.map((tld) => (
                  <button
                    key={tld.extension}
                    type="button"
                    onClick={() => handleTldToggle(tld.extension)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      selectedTlds.includes(tld.extension)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{tld.extension}</div>
                      <div className="text-xs opacity-75">{tld.price}</div>
                      {tld.popular && (
                        <div className="text-xs text-yellow-400 mt-1">★ Popular</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            <div className="flex">
              <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results for "{searchResults.search_term}"
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Found {searchResults.available_count} available domains out of {searchResults.total_found} searched
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {searchResults.results.map((result) => (
                <div key={result.domain} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {result.available ? (
                          <CheckIcon className="h-6 w-6 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {result.domain}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.available ? 'Available' : 'Not Available'} • {result.registrar}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {result.available && result.price ? (
                        <>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              ${result.price.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              per {result.registration_period} year{result.registration_period > 1 ? 's' : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRegisterDomain(result.domain, result.price!)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            Register
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {result.available ? 'Contact for pricing' : 'Taken'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Domains Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Domains</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your registered domains
            </p>
          </div>
          <div className="px-6 py-8 text-center">
            <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-600 mb-4">
              Search and register your first domain to get started
            </p>
            <button
              onClick={() => document.getElementById('domain-search')?.focus()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Search Domains
            </button>
          </div>
        </div>
      </div>

      {/* Domain Registration Modal */}
      <DomainRegistrationModal
        isOpen={registrationModal.isOpen}
        onClose={handleCloseRegistrationModal}
        domain={registrationModal.domain}
        price={registrationModal.price}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
