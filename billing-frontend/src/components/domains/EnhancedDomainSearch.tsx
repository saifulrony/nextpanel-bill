'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon, GlobeAltIcon, ShoppingCartIcon, SparklesIcon, BoltIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { domainsAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

interface DomainResult {
  domain: string;
  available: boolean;
  price?: number;
  registrar?: string;
  registration_period?: number;
}

interface AuctionDomain {
  domain: string;
  current_bid: number;
  time_left: string;
  bids: number;
  auction_type: string;
  end_time: string;
  premium: boolean;
}

interface PremiumDomain {
  domain: string;
  price: number;
  currency: string;
  premium_type: string;
  description: string;
  available: boolean;
}

interface SuggestionDomain {
  domain: string;
  price: number;
  available: boolean;
  reason: string;
}

interface BulkResult {
  domain: string;
  available: boolean;
  price?: number;
}

export default function EnhancedDomainSearch() {
  const router = useRouter();
  const { addItem, getItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [activeTab, setActiveTab] = useState<'search' | 'auctions' | 'premium' | 'generator' | 'bulk'>('search');
  const [isSearching, setIsSearching] = useState(false);
  
  // Search results
  const [searchResults, setSearchResults] = useState<DomainResult[]>([]);
  const [auctionResults, setAuctionResults] = useState<AuctionDomain[]>([]);
  const [premiumResults, setPremiumResults] = useState<PremiumDomain[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionDomain[]>([]);
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [bulkKeywords, setBulkKeywords] = useState('');
  
  // Cart
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Error states
  const [searchError, setSearchError] = useState<string | null>(null);
  const [auctionError, setAuctionError] = useState<string | null>(null);
  const [premiumError, setPremiumError] = useState<string | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const popularTlds = [
    { extension: '.com', price: '$8.99/yr' },
    { extension: '.net', price: '$10.99/yr' },
    { extension: '.org', price: '$11.99/yr' },
    { extension: '.io', price: '$34.99/yr' },
    { extension: '.dev', price: '$14.99/yr' },
    { extension: '.app', price: '$17.99/yr' },
  ];

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const response = await domainsAPI.getCart();
      if (response.data.success) {
        setCartItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load cart items:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const baseName = searchQuery.includes('.') ? searchQuery.split('.')[0] : searchQuery;
      const response = await domainsAPI.search({
        domain_name: baseName,
        tlds: popularTlds.map(tld => tld.extension)
      });
      
      setSearchResults(response.data.results);
    } catch (error: any) {
      console.error('Domain search error:', error);
      setSearchError('Failed to search domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchAuctions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setAuctionError(null);
    
    try {
      const response = await domainsAPI.searchAuctions(searchQuery);
      if (response.data.success) {
        setAuctionResults(response.data.domains || []);
      } else {
        setAuctionError(response.data.message || 'Failed to search auctions');
      }
    } catch (error: any) {
      console.error('Auction search error:', error);
      setAuctionError('Failed to search auction domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setPremiumError(null);
    
    try {
      const response = await domainsAPI.getPremiumDomains(searchQuery);
      if (response.data.success) {
        setPremiumResults(response.data.domains || []);
      } else {
        setPremiumError(response.data.message || 'Failed to get premium domains');
      }
    } catch (error: any) {
      console.error('Premium search error:', error);
      setPremiumError('Failed to get premium domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSuggestionError(null);
    
    try {
      const response = await domainsAPI.generateSuggestions(searchQuery);
      if (response.data.success) {
        setSuggestions(response.data.suggestions || []);
      } else {
        setSuggestionError(response.data.message || 'Failed to generate suggestions');
      }
    } catch (error: any) {
      console.error('Suggestion generation error:', error);
      setSuggestionError('Failed to generate domain suggestions. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBulkSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkKeywords.trim()) return;
    
    setIsSearching(true);
    setBulkError(null);
    
    try {
      const keywords = bulkKeywords.split(',').map(k => k.trim()).filter(k => k);
      const response = await domainsAPI.bulkSearch(keywords);
      if (response.data.success) {
        setBulkResults(response.data.results || []);
      } else {
        setBulkError(response.data.message || 'Failed to perform bulk search');
      }
    } catch (error: any) {
      console.error('Bulk search error:', error);
      setBulkError('Failed to perform bulk search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = async (domain: string, price: number, type: string = 'regular') => {
    try {
      // Add to domain cart API (backend database)
      const response = await domainsAPI.addToCart({
        domain_name: domain,
        price,
        domain_type: type,
        currency: 'USD'
      });
      
      if (response.data.success) {
        // Also add to local cart context (for cart page display)
        addItem({
          id: `domain-${domain}-${Date.now()}`, // Unique ID for domain items
          name: domain,
          description: `Domain registration - ${type}`,
          price: price,
          billing_cycle: 'yearly',
          category: 'Domain',
          type: 'domain',
          domain_name: domain
        });
        
        await loadCartItems();
        // Show success message with view cart option
        const viewCart = confirm(`${domain} added to cart! Would you like to view your cart?`);
        if (viewCart) {
          router.push('/cart');
        }
      } else {
        alert(response.data.message || 'Failed to add to cart');
      }
    } catch (error: any) {
      console.error('Add to cart error:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'search': return <MagnifyingGlassIcon className="h-5 w-5" />;
      case 'auctions': return <GlobeAltIcon className="h-5 w-5" />;
      case 'premium': return <SparklesIcon className="h-5 w-5" />;
      case 'generator': return <LightBulbIcon className="h-5 w-5" />;
      case 'bulk': return <BoltIcon className="h-5 w-5" />;
      default: return <MagnifyingGlassIcon className="h-5 w-5" />;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'search': return 'Search';
      case 'auctions': return 'Auctions';
      case 'premium': return 'Premium';
      case 'generator': return 'Generator';
      case 'bulk': return 'Beast Mode';
      default: return 'Search';
    }
  };

  const renderSearchForm = () => {
    if (activeTab === 'bulk') {
      return (
        <form onSubmit={handleBulkSearch} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200">
          <div className="flex flex-col gap-3">
            <div className="flex-1 relative">
              <textarea
                value={bulkKeywords}
                onChange={(e) => setBulkKeywords(e.target.value)}
                placeholder="Enter keywords separated by commas (e.g., tech, startup, app, business)"
                className="block w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all resize-none"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !bulkKeywords.trim()}
              className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSearching ? 'Searching...' : 'Beast Mode Search'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={activeTab === 'search' ? handleSearch : activeTab === 'auctions' ? handleSearchAuctions : activeTab === 'premium' ? handleSearchPremium : handleGenerateSuggestions} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search for your ${activeTab === 'auctions' ? 'auction' : activeTab === 'premium' ? 'premium' : activeTab === 'generator' ? 'domain' : ''} domain name...`}
              className="block w-full pl-11 pr-3 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
            />
          </div>
          {activeTab === 'search' && (
            <select
              value={selectedTld}
              onChange={(e) => setSelectedTld(e.target.value)}
              className="px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {popularTlds.map((tld) => (
                <option key={tld.extension} value={tld.extension}>
                  {tld.extension}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSearching ? 'Searching...' : getTabLabel(activeTab)}
          </button>
        </div>
      </form>
    );
  };

  const renderResults = () => {
    if (activeTab === 'search' && searchResults.length > 0) {
      return (
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results for "{searchQuery}"
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {searchResults.filter(r => r.available).length} available domains found
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {searchResults.map((result) => (
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
                              per {result.registration_period} year{result.registration_period && result.registration_period > 1 ? 's' : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(result.domain, result.price!, 'regular')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Add to Cart
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
        </div>
      );
    }

    if (activeTab === 'auctions' && auctionResults.length > 0) {
      return (
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Auction Domains for "{searchQuery}"
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {auctionResults.length} auction domains found
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {auctionResults.map((result) => (
                <div key={result.domain} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <GlobeAltIcon className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {result.domain}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.auction_type} • {result.bids} bids • {result.time_left} left
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ${result.current_bid.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          current bid
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(result.domain, result.current_bid, 'auction')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'premium' && premiumResults.length > 0) {
      return (
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Premium Domains for "{searchQuery}"
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {premiumResults.length} premium domains found
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {premiumResults.map((result) => (
                <div key={result.domain} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <SparklesIcon className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {result.domain}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.premium_type} • {result.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ${result.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.currency}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(result.domain, result.price, 'premium')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'generator' && suggestions.length > 0) {
      return (
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Domain Suggestions for "{searchQuery}"
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {suggestions.length} suggestions generated
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {suggestions.map((result) => (
                <div key={result.domain} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <LightBulbIcon className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">
                          {result.domain}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.reason}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ${result.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          per year
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(result.domain, result.price, 'suggestion')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'bulk' && bulkResults.length > 0) {
      return (
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Search Results
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {bulkResults.filter(r => r.available).length} available domains found
              </p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {bulkResults.map((result) => (
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
                          {result.available ? 'Available' : 'Not Available'}
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
                              per year
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(result.domain, result.price!, 'bulk')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Add to Cart
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
        </div>
      );
    }

    return null;
  };

  const renderError = () => {
    const error = searchError || auctionError || premiumError || suggestionError || bulkError;
    if (!error) return null;

    return (
      <div className="mt-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
          Find Your Perfect Domain
        </h2>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          Search and register domains at wholesale prices. Get started with NextPanel hosting and manage your entire web presence in one place.
        </p>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {(['search', 'auctions', 'premium', 'generator', 'bulk'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {getTabIcon(tab)}
              <span>{getTabLabel(tab)}</span>
            </button>
          ))}
        </div>

        {/* Search Form */}
        <div className="mt-8 max-w-4xl mx-auto">
          {renderSearchForm()}
        </div>

        {/* Error Display */}
        {renderError()}

        {/* Results */}
        {renderResults()}

        {/* View Cart Button */}
        {getItemCount() > 0 && (
          <div className="mt-8">
            <button
              onClick={() => router.push('/cart')}
              className="relative px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <span>View Cart ({getItemCount()})</span>
            </button>
          </div>
        )}

        <div className="mt-10">
          <button
            onClick={() => router.push('/pricing')}
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            View Pricing Plans
          </button>
        </div>
      </div>

      {/* Floating View Cart Button */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => router.push('/cart')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 flex items-center space-x-2 animate-pulse hover:animate-none transition-all duration-200"
          >
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="font-semibold">View Cart ({getItemCount()})</span>
          </button>
        </div>
      )}
    </div>
  );
}
