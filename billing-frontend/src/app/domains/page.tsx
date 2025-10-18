'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  CheckIcon, 
  XMarkIcon, 
  GlobeAltIcon, 
  ShoppingCartIcon,
  HeartIcon,
  StarIcon,
  BoltIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon,
  LightBulbIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { domainsAPI } from '@/lib/api';
import DomainRegistrationModal from '@/components/domains/DomainRegistrationModal';

interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number;
  currency: string;
  registrar: string;
  registration_period: number;
  is_premium?: boolean;
  is_auction?: boolean;
  auction_end_date?: string;
  auction_price?: number;
  is_favorite?: boolean;
}

interface DomainSearchResponse {
  results: DomainSearchResult[];
  search_term: string;
  total_found: number;
  available_count: number;
}

interface GeneratedDomain {
  domain: string;
  available: boolean;
  price?: number;
  category: string;
  score: number;
}

export default function DomainsPage() {
  const { user, isAuthenticated } = useAuth();
  const { addItem, items } = useCart();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'search' | 'auctions' | 'premium' | 'generator' | 'favorites'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DomainSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTlds, setSelectedTlds] = useState<string[]>(['.com', '.net', '.org', '.io']);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [beastMode, setBeastMode] = useState(false);
  const [generatedDomains, setGeneratedDomains] = useState<GeneratedDomain[]>([]);
  const [auctionDomains, setAuctionDomains] = useState<DomainSearchResult[]>([]);
  const [premiumDomains, setPremiumDomains] = useState<DomainSearchResult[]>([]);
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
    { extension: '.io', price: '$39.99/yr', popular: true },
    { extension: '.co', price: '$29.99/yr', popular: false },
    { extension: '.app', price: '$19.99/yr', popular: false },
    { extension: '.dev', price: '$16.99/yr', popular: false },
    { extension: '.ai', price: '$89.99/yr', popular: false },
    { extension: '.tech', price: '$24.99/yr', popular: false },
    { extension: '.online', price: '$18.99/yr', popular: false },
  ];

  const categories = [
    'Technology', 'Business', 'Creative', 'Personal', 'E-commerce', 'Blog', 'Portfolio'
  ];

  const keywords = [
    'app', 'tech', 'digital', 'online', 'web', 'cloud', 'data', 'smart', 'pro', 'hub'
  ];

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('domain_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('domain_favorites', JSON.stringify(newFavorites));
  };

  const toggleFavorite = (domain: string) => {
    const newFavorites = favorites.includes(domain)
      ? favorites.filter(f => f !== domain)
      : [...favorites, domain];
    saveFavorites(newFavorites);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await domainsAPI.search({
        domain_name: searchTerm,
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

  const handleDomainGenerator = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Generate domain suggestions based on search term
      const suggestions: GeneratedDomain[] = [];
      const baseWord = searchTerm.toLowerCase();
      
      // Generate variations
      for (const category of categories.slice(0, 3)) {
        for (const keyword of keywords.slice(0, 3)) {
          const variations = [
            `${baseWord}${keyword}.com`,
            `${baseWord}${keyword}.net`,
            `${baseWord}${keyword}.io`,
            `${keyword}${baseWord}.com`,
            `${baseWord}${category.toLowerCase()}.com`,
            `${baseWord}pro.com`,
            `${baseWord}hub.com`,
            `${baseWord}app.com`,
            `${baseWord}tech.com`,
            `${baseWord}digital.com`
          ];
          
          for (const domain of variations) {
            if (suggestions.length >= 20) break;
            
            // Mock availability and pricing
            const isAvailable = Math.random() > 0.7;
            const price = isAvailable ? Math.random() * 50 + 10 : undefined;
            const score = Math.random() * 100;
            
            suggestions.push({
              domain,
              available: isAvailable,
              price,
              category,
              score
            });
          }
        }
      }
      
      // Sort by score and availability
      suggestions.sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return b.score - a.score;
      });
      
      setGeneratedDomains(suggestions.slice(0, 20));
    } catch (error) {
      console.error('Domain generation error:', error);
      setError('Failed to generate domain suggestions.');
    } finally {
      setIsSearching(false);
    }
  };

  const loadAuctionDomains = async () => {
    try {
      // Mock auction domains
      const mockAuctions: DomainSearchResult[] = [
        {
          domain: 'premium.com',
          available: true,
          price: 2500,
          currency: 'USD',
          registrar: 'namecheap',
          registration_period: 1,
          is_auction: true,
          auction_end_date: '2024-01-15T18:00:00Z',
          auction_price: 2500
        },
        {
          domain: 'business.io',
          available: true,
          price: 1200,
          currency: 'USD',
          registrar: 'namecheap',
          registration_period: 1,
          is_auction: true,
          auction_end_date: '2024-01-16T12:00:00Z',
          auction_price: 1200
        },
        {
          domain: 'startup.tech',
          available: true,
          price: 800,
          currency: 'USD',
          registrar: 'namecheap',
          registration_period: 1,
          is_auction: true,
          auction_end_date: '2024-01-17T20:00:00Z',
          auction_price: 800
        }
      ];
      
      setAuctionDomains(mockAuctions);
    } catch (error) {
      console.error('Error loading auction domains:', error);
    }
  };

  const loadPremiumDomains = async () => {
    try {
      // Mock premium domains
      const mockPremium: DomainSearchResult[] = [
        {
          domain: 'luxury.com',
          available: true,
          price: 5000,
          currency: 'USD',
          registrar: 'namecheap',
          registration_period: 1,
          is_premium: true
        },
        {
          domain: 'invest.com',
          available: true,
          price: 3500,
          currency: 'USD',
          registrar: 'namecheap',
          registration_period: 1,
          is_premium: true
        },
        {
          domain: 'crypto.io',
          available: true,
          price: 2800,
          currency: 'USD',
          registrar: 'namecheap',
          registration_period: 1,
          is_premium: true
        }
      ];
      
      setPremiumDomains(mockPremium);
    } catch (error) {
      console.error('Error loading premium domains:', error);
    }
  };

  const handleAddToCart = (domain: string, price: number) => {
    const domainItem = {
      id: `domain-${domain}`,
      name: domain,
      description: `Domain registration for ${domain}`,
      price: price,
      billing_cycle: 'yearly',
      category: 'domain',
      type: 'domain' as const,
      domain_name: domain,
      quantity: 1
    };
    
    addItem(domainItem);
  };

  const isInCart = (domain: string) => {
    return items.some(item => item.domain_name === domain);
  };

  const formatAuctionTime = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'auctions') {
      loadAuctionDomains();
    } else if (activeTab === 'premium') {
      loadPremiumDomains();
    }
  }, [activeTab]);

  // Show loading state while checking authentication
  if (typeof window === 'undefined') {
    return (
      <div className="min-h-screen bg-gray-50">
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
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Client-side authentication check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Redirecting to login...</p>
            </div>
          </div>
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
              {items.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-indigo-600">
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span>{items.length} item{items.length > 1 ? 's' : ''} in cart</span>
                  <button
                    onClick={() => router.push('/checkout')}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs"
                  >
                    View Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'search', name: 'Search', icon: MagnifyingGlassIcon },
                { id: 'auctions', name: 'Auctions', icon: ClockIcon },
                { id: 'premium', name: 'Premium', icon: StarIcon },
                { id: 'generator', name: 'Generator', icon: LightBulbIcon },
                { id: 'favorites', name: 'Favorites', icon: HeartIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                    {tab.id === 'favorites' && favorites.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                      Domain Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter domain name..."
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TLDs
                    </label>
                    <select
                      multiple
                      value={selectedTlds}
                      onChange={(e) => setSelectedTlds(Array.from(e.target.selectedOptions, option => option.value))}
                      className="block w-full py-3 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      size={4}
                    >
                      {popularTlds.map((tld) => (
                        <option key={tld.extension} value={tld.extension}>
                          {tld.extension} - {tld.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSearching || !searchTerm.trim()}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
                
                {/* Beast Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="beastMode"
                    checked={beastMode}
                    onChange={(e) => setBeastMode(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="beastMode" className="flex items-center space-x-2 text-sm text-gray-700">
                    <BoltIcon className="h-4 w-4 text-yellow-500" />
                    <span>Beast Mode - Search all TLDs</span>
                  </label>
                </div>
              </form>
            </div>

            {/* Search Results */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {searchResults && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results for "{searchResults.search_term}"
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {searchResults.available_count} available domains found
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
                          {result.available && result.price && result.price > 0 ? (
                            <>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900">
                                  ${result.price.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  per {result.registration_period} year{result.registration_period > 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => toggleFavorite(result.domain)}
                                  className={`p-2 rounded-lg ${
                                    favorites.includes(result.domain)
                                      ? 'text-red-500 bg-red-50'
                                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                  }`}
                                >
                                  {favorites.includes(result.domain) ? (
                                    <HeartSolidIcon className="h-5 w-5" />
                                  ) : (
                                    <HeartIcon className="h-5 w-5" />
                                  )}
                                </button>
                                {isInCart(result.domain) ? (
                                  <button
                                    disabled
                                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                    <span>In Cart</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(result.domain, result.price!)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center space-x-2"
                                  >
                                    <ShoppingCartIcon className="h-4 w-4" />
                                    <span>Add to Cart</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setRegistrationModal({
                                    isOpen: true,
                                    domain: result.domain,
                                    price: result.price!
                                  })}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                  Register Now
                                </button>
                              </div>
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
          </div>
        )}

        {/* Auctions Tab */}
        {activeTab === 'auctions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-orange-500" />
                  Domain Auctions
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Bid on premium domains in live auctions
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {auctionDomains.map((domain) => (
                  <div key={domain.domain} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <FireIcon className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {domain.domain}
                          </div>
                          <div className="text-sm text-gray-500">
                            Auction ends in {formatAuctionTime(domain.auction_end_date!)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-orange-600">
                            ${domain.auction_price!.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Current bid
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleFavorite(domain.domain)}
                            className={`p-2 rounded-lg ${
                              favorites.includes(domain.domain)
                                ? 'text-red-500 bg-red-50'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            {favorites.includes(domain.domain) ? (
                              <HeartSolidIcon className="h-5 w-5" />
                            ) : (
                              <HeartIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                            Place Bid
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Premium Tab */}
        {activeTab === 'premium' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Premium Domains
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  High-value domains ready for immediate purchase
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {premiumDomains.map((domain) => (
                  <div key={domain.domain} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <StarSolidIcon className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {domain.domain}
                          </div>
                          <div className="text-sm text-gray-500">
                            Premium domain • {domain.registrar}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-yellow-600">
                            ${domain.price!.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Buy now price
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleFavorite(domain.domain)}
                            className={`p-2 rounded-lg ${
                              favorites.includes(domain.domain)
                                ? 'text-red-500 bg-red-50'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            {favorites.includes(domain.domain) ? (
                              <HeartSolidIcon className="h-5 w-5" />
                            ) : (
                              <HeartIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generator Tab */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <LightBulbIcon className="h-5 w-5 mr-2 text-blue-500" />
                Domain Generator
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter a keyword and we'll generate creative domain suggestions for you.
              </p>
              
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter a keyword (e.g., 'tech', 'business', 'creative')"
                />
                <button
                  onClick={handleDomainGenerator}
                  disabled={isSearching || !searchTerm.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            {generatedDomains.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generated Suggestions
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {generatedDomains.filter(d => d.available).length} available domains found
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {generatedDomains.map((domain) => (
                    <div key={domain.domain} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900">
                          {domain.domain}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            domain.available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {domain.available ? 'Available' : 'Taken'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(domain.score)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-3">
                        Category: {domain.category}
                      </div>
                      
                      {domain.available && domain.price && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900">
                            ${domain.price.toFixed(2)}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => toggleFavorite(domain.domain)}
                              className={`p-1 rounded ${
                                favorites.includes(domain.domain)
                                  ? 'text-red-500 bg-red-50'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              {favorites.includes(domain.domain) ? (
                                <HeartSolidIcon className="h-4 w-4" />
                              ) : (
                                <HeartIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleAddToCart(domain.domain, domain.price!)}
                              className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <HeartSolidIcon className="h-5 w-5 mr-2 text-red-500" />
                  Favorite Domains
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {favorites.length} domain{favorites.length !== 1 ? 's' : ''} saved
                </p>
              </div>
              
              {favorites.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-500">Start searching for domains and add them to your favorites!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {favorites.map((domain) => (
                    <div key={domain} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <HeartSolidIcon className="h-6 w-6 text-red-500" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">
                              {domain}
                            </div>
                            <div className="text-sm text-gray-500">
                              Saved to favorites
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleFavorite(domain)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setSearchTerm(domain.split('.')[0])}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            Search Similar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <DomainRegistrationModal
        isOpen={registrationModal.isOpen}
        onClose={() => setRegistrationModal({ isOpen: false, domain: '', price: 0 })}
        domain={registrationModal.domain}
        price={registrationModal.price}
      />
    </div>
  );
}