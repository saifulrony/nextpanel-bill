'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { domainsAPI } from '@/lib/api';

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number;
  registration_period?: number;
  registrar?: string;
  currency?: string;
}

interface DomainSearchComponentProps {
  onDomainSelect?: (domain: string, price?: number) => void;
  showResults?: boolean;
  className?: string;
}

const popularTlds = [
  { extension: '.com', price: '$8.99/yr' },
  { extension: '.net', price: '$10.99/yr' },
  { extension: '.org', price: '$11.99/yr' },
  { extension: '.io', price: '$34.99/yr' },
  { extension: '.dev', price: '$14.99/yr' },
  { extension: '.app', price: '$17.99/yr' },
  { extension: '.co', price: '$12.99/yr' },
  { extension: '.me', price: '$15.99/yr' },
  { extension: '.info', price: '$9.99/yr' },
  { extension: '.biz', price: '$13.99/yr' },
];

export default function DomainSearchComponent({ 
  onDomainSelect, 
  showResults = true, 
  className = '' 
}: DomainSearchComponentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'register' | 'transfer'>('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setShowSearchResults(false);
    
    try {
      const baseName = searchQuery.includes('.') ? searchQuery.split('.')[0] : searchQuery;
      const response = await domainsAPI.search({
        domain_name: baseName,
        tlds: popularTlds.map(tld => tld.extension)
      });
      
      setSearchResults(response.data.results);
      setShowSearchResults(true);
    } catch (error: any) {
      console.error('Domain search error:', error);
      setSearchError('Failed to search domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDomainSelect = (domain: string, price?: number) => {
    if (onDomainSelect) {
      onDomainSelect(domain, price);
    } else {
      // Default behavior - redirect to registration
      router.push(`/customer/services?register=${domain}&price=${price || 0}`);
    }
  };

  const handleTldSelect = (tld: string) => {
    setSelectedTld(tld);
    // Auto-search if there's already a search query
    if (searchQuery.trim()) {
      const baseName = searchQuery.includes('.') ? searchQuery.split('.')[0] : searchQuery;
      setSearchQuery(baseName);
      // Trigger search
      setTimeout(() => {
        const form = document.getElementById('domain-search-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }, 100);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Search Form */}
      <div className="p-6">
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setShowSearchResults(false);
              setSearchResults([]);
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Register Domain
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('transfer');
              setShowSearchResults(false);
              setSearchResults([]);
            }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'transfer'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transfer Domain
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {activeTab === 'register' ? 'Search for a Domain to Register' : 'Transfer Your Domain'}
        </h3>
        
        <form id="domain-search-form" onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'register' ? 'Enter domain name to register...' : 'Enter domain name to transfer...'}
                className="block w-full pl-10 pr-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            <select
              value={selectedTld}
              onChange={(e) => setSelectedTld(e.target.value)}
              className="px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Popular TLDs - Only show for Register tab */}
          {activeTab === 'register' && (
            <div>
              <p className="text-sm text-gray-600 mb-2 font-medium">
                Popular Extensions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {popularTlds.map((tld) => (
                  <button
                    key={tld.extension}
                    type="button"
                    onClick={() => handleTldSelect(tld.extension)}
                    className={`p-2 rounded-lg border-2 transition-all text-center ${
                      selectedTld === tld.extension
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {tld.extension}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tld.price}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Transfer Info */}
          {activeTab === 'transfer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Transfer your domain</strong> to us and enjoy better management tools and competitive pricing.
                You'll keep your existing domain registration and extend it by one year.
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      {showResults && (
        <>
          {/* Error State */}
          {searchError && (
            <div className="px-6 pb-4">
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                <div className="flex">
                  <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
                  {searchError}
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">
                  {activeTab === 'register' ? 'Registration Results' : 'Transfer Results'} for "{searchQuery}"
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {searchResults.filter(r => r.available).length} available domains found
                </p>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <div key={result.domain} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {result.available ? (
                            <CheckIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {result.domain}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.available ? 'Available' : 'Not Available'} 
                            {result.registrar && ` • ${result.registrar}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {result.available && result.price && result.price > 0 ? (
                          <>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                ${result.price.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                per {result.registration_period || 1} year{(result.registration_period || 1) > 1 ? 's' : ''}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDomainSelect(result.domain, result.price)}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              {activeTab === 'register' ? 'Register' : 'Transfer'}
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {result.available ? 'Contact for pricing' : 'Unavailable'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {showSearchResults && searchResults.length === 0 && !searchError && (
            <div className="px-6 py-8 text-center">
              <XMarkIcon className="mx-auto h-8 w-8 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab === 'register' ? 'available domains' : 'transferable domains'} found
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Try searching with a different name or extension.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
