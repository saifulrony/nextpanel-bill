'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShoppingCartIcon,
  HeartIcon,
  LightBulbIcon,
  FireIcon,
  StarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useCart } from '@/contexts/CartContext';

// Global cache for products to prevent multiple API calls
let productsCache: any[] | null = null;
let productsCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Domain Search Component (Namecheap-style with tabs)
export function DomainSearchComponent({ style }: { style?: React.CSSProperties }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'generator' | 'auctions' | 'premium' | 'beast' | 'favorites'>('results');
  const [beastMode, setBeastMode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [generatedDomains, setGeneratedDomains] = useState<any[]>([]);
  const [auctionData, setAuctionData] = useState<any[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [premiumData, setPremiumData] = useState<any[]>([]);
  const [loadingPremium, setLoadingPremium] = useState(false);
  const cartContext = useCart();

  // Always access cart context, but handle cases where it might be null
  const { addItem, items } = cartContext || { addItem: () => { }, items: [] };

  useEffect(() => {
    setMounted(true);
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('domain_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    // Check for search query in URL
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
      // Perform automatic search
      performSearch(searchFromUrl);
    }
  }, [searchParams]);

  // Auto-generate domains when switching to generator tab
  useEffect(() => {
    if (activeTab === 'generator' && searchQuery.trim() && result) {
      handleDomainGenerator();
    }
  }, [activeTab, searchQuery, result]);

  // Auto-fetch auction data when switching to auctions tab
  useEffect(() => {
    if (activeTab === 'auctions' && result) {
      console.log('Switching to auctions tab, fetching data...');
      fetchAuctionData();
    }
  }, [activeTab, result]);

  // Auto-fetch premium data when switching to premium tab
  useEffect(() => {
    if (activeTab === 'premium' && result) {
      console.log('Switching to premium tab, fetching data...');
      fetchPremiumData();
    }
  }, [activeTab, result]);


  const popularTlds = [
    { extension: '.com', price: '$8.99/yr' },
    { extension: '.net', price: '$10.99/yr' },
    { extension: '.org', price: '$11.99/yr' },
    { extension: '.io', price: '$34.99/yr' },
    { extension: '.dev', price: '$14.99/yr' },
    { extension: '.app', price: '$17.99/yr' },
    { extension: '.xyz', price: '$1.99/yr' },
    { extension: '.store', price: '$4.99/yr' },
    { extension: '.online', price: '$0.99/yr' },
    { extension: '.tech', price: '$6.99/yr' },
    { extension: '.co', price: '$29.99/yr' },
    { extension: '.me', price: '$19.99/yr' },
    { extension: '.pro', price: '$12.99/yr' },
    { extension: '.biz', price: '$15.99/yr' },
    { extension: '.info', price: '$13.99/yr' },
    { extension: '.name', price: '$9.99/yr' },
    { extension: '.us', price: '$7.99/yr' },
    { extension: '.ca', price: '$11.99/yr' },
    { extension: '.uk', price: '$8.99/yr' },
    { extension: '.de', price: '$9.99/yr' },
    { extension: '.fr', price: '$10.99/yr' },
    { extension: '.es', price: '$9.99/yr' },
    { extension: '.it', price: '$10.99/yr' },
    { extension: '.nl', price: '$9.99/yr' },
  ];

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

      const domainName = query.includes('.') ? query.split('.')[0] : query;
      const tld = selectedTld.startsWith('.') ? selectedTld : `.${selectedTld}`;

      const response = await fetch(`${apiUrl}/api/v1/domains/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain_name: domainName,
          tlds: [tld]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract the first result for single domain check
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        const resultData = {
          available: firstResult.available,
          domain: firstResult.domain,
          price: firstResult.price,
          currency: firstResult.currency,
          registrar: firstResult.registrar,
          registration_period: firstResult.registration_period || 1
        };
        setResult(resultData);
      } else {
        const resultData = {
          available: false,
          domain: `${domainName}${tld}`,
          error: 'No results found'
        };
        setResult(resultData);
      }
    } catch (error) {
      console.warn('Domain search API error:', error);
      const resultData = {
        available: false,
        domain: `${query}${selectedTld}`,
        error: 'Domain check API not configured.'
      };
      setResult(resultData);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update URL with search query
    const params = new URLSearchParams(searchParams);
    params.set('search', searchQuery);
    router.push(`?${params.toString()}`, { scroll: false });

    // Perform search
    await performSearch(searchQuery);
  };

  const handleAddDomainToCart = async (domain: string, price: number) => {
    if (addingToCart) return; // Prevent duplicate calls

    setAddingToCart(true);

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

    // Show cart notification
    setShowCartNotification(true);

    // Reset after a short delay
    setTimeout(() => {
      setAddingToCart(false);
    }, 1000);

    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowCartNotification(false);
    }, 3000);
  };

  const isDomainInCart = (domain: string) => {
    return items.some(item => item.domain_name === domain);
  };

  const toggleFavorite = (domain: string) => {
    const newFavorites = favorites.includes(domain)
      ? favorites.filter(f => f !== domain)
      : [...favorites, domain];
    setFavorites(newFavorites);
    localStorage.setItem('domain_favorites', JSON.stringify(newFavorites));
  };

  const fetchAuctionData = async () => {
    setLoadingAuctions(true);
    console.log('Starting to fetch auction data...');

    try {
      // Try to fetch from API first
      const response = await fetch('/api/v1/domains/auctions');

      if (response.ok) {
        const data = await response.json();
        console.log('Auction data from API:', data);
        setAuctionData(data.auctions || []);
      } else {
        // Generate dynamic sample data with random variations
        const categories = ['Technology', 'Business', 'Creative', 'Healthcare', 'E-commerce', 'Crypto', 'Finance', 'Education'];
        const domains = [
          'techstartup', 'businesshub', 'creativeart', 'healthcare', 'ecommerce', 'crypto', 'finance', 'education',
          'innovation', 'digital', 'smart', 'global', 'premium', 'elite', 'pro', 'expert', 'master', 'prime', 'gold'
        ];
        const extensions = ['.com', '.net', '.org', '.io', '.pro', '.biz', '.co', '.me'];

        const generateRandomAuction = (index: number) => {
          const domain = domains[Math.floor(Math.random() * domains.length)] +
            (Math.random() > 0.5 ? Math.floor(Math.random() * 1000) : '') +
            extensions[Math.floor(Math.random() * extensions.length)];
          const category = categories[Math.floor(Math.random() * categories.length)];
          const currentBid = Math.floor(Math.random() * 500) + 50;
          const bids = Math.floor(Math.random() * 20) + 1;
          const hoursLeft = Math.floor(Math.random() * 72) + 1;
          const minutesLeft = Math.floor(Math.random() * 60);

          return {
            id: `auction-${index}-${Date.now()}`,
            domain,
            currentBid,
            timeLeft: `${hoursLeft}h ${minutesLeft}m`,
            bids,
            category,
            description: `Premium ${category.toLowerCase()} domain perfect for your business needs`
          };
        };

        const dynamicAuctions = Array.from({ length: 6 }, (_, i) => generateRandomAuction(i));
        setAuctionData(dynamicAuctions);
      }
    } catch (error) {
      console.warn('Error fetching auction data:', error);
      // Fallback to dynamic sample data
      const dynamicAuctions = Array.from({ length: 4 }, (_, i) => ({
        id: `fallback-${i}-${Date.now()}`,
        domain: `premium${i + 1}.com`,
        currentBid: Math.floor(Math.random() * 300) + 100,
        timeLeft: `${Math.floor(Math.random() * 48) + 1}h ${Math.floor(Math.random() * 60)}m`,
        bids: Math.floor(Math.random() * 15) + 1,
        category: ['Technology', 'Business', 'Creative', 'Healthcare'][i],
        description: `High-value premium domain for ${['tech', 'business', 'creative', 'healthcare'][i]} companies`
      }));
      setAuctionData(dynamicAuctions);
    } finally {
      setLoadingAuctions(false);
    }
  };

  const fetchPremiumData = async () => {
    setLoadingPremium(true);
    console.log('Starting to fetch premium domain data...');

    try {
      // Try to fetch from API first
      const response = await fetch('/api/v1/domains/premium');

      if (response.ok) {
        const data = await response.json();
        console.log('Premium data from API:', data);
        setPremiumData(data.premium || []);
      } else {
        // Generate dynamic premium domain data
        const premiumDomains = [
          'business', 'finance', 'tech', 'health', 'education', 'travel', 'food', 'fashion',
          'realestate', 'automotive', 'sports', 'entertainment', 'gaming', 'crypto', 'ai', 'cloud'
        ];
        const extensions = ['.com', '.net', '.org', '.io', '.co', '.pro', '.biz'];
        const adjectives = ['premium', 'elite', 'gold', 'platinum', 'diamond', 'royal', 'luxury', 'exclusive'];

        const generatePremiumDomain = (index: number) => {
          const isAdjective = Math.random() > 0.5;
          const base = premiumDomains[Math.floor(Math.random() * premiumDomains.length)];
          const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
          const extension = extensions[Math.floor(Math.random() * extensions.length)];

          const domain = isAdjective ? `${adjective}${base}${extension}` : `${base}${adjective}${extension}`;
          const price = Math.floor(Math.random() * 5000) + 500; // $500 - $5500
          const category = base.charAt(0).toUpperCase() + base.slice(1);

          return {
            id: `premium-${index}-${Date.now()}`,
            domain,
            price,
            category,
            description: `Premium ${category} domain - perfect for established businesses`,
            features: ['High SEO value', 'Brandable', 'Memorable', 'Professional'],
            availability: 'Available for purchase'
          };
        };

        const dynamicPremium = Array.from({ length: 8 }, (_, i) => generatePremiumDomain(i));
        setPremiumData(dynamicPremium);
      }
    } catch (error) {
      console.warn('Error fetching premium data:', error);
      // Fallback to sample premium data
      const samplePremium = [
        {
          id: 'premium-1',
          domain: 'premiumbusiness.com',
          price: 2500,
          category: 'Business',
          description: 'Premium business domain - perfect for established companies',
          features: ['High SEO value', 'Brandable', 'Memorable'],
          availability: 'Available for purchase'
        },
        {
          id: 'premium-2',
          domain: 'elitetech.io',
          price: 1800,
          category: 'Technology',
          description: 'Elite technology domain - ideal for tech startups',
          features: ['Premium extension', 'Brandable', 'Professional'],
          availability: 'Available for purchase'
        }
      ];
      setPremiumData(samplePremium);
    } finally {
      setLoadingPremium(false);
    }
  };

  const handleDomainGenerator = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      // Generate domain suggestions based on search term
      const suggestions: any[] = [];
      const baseWord = searchQuery.toLowerCase();
      const categories = ['Technology', 'Business', 'Creative', 'Personal', 'E-commerce'];
      const keywords = ['app', 'tech', 'digital', 'online', 'web', 'cloud', 'data', 'smart', 'pro', 'hub'];

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
            if (suggestions.length >= 12) break;

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

      setGeneratedDomains(suggestions.slice(0, 12));
    } catch (error) {
      console.error('Domain generation error:', error);
    } finally {
      setIsSearching(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
      <div className="max-w-4xl mx-auto">
        {/* Simple Domain Search Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">🚀 Find Your Perfect Domain - Hot Reloading Test 2!</h2>
            <p className="text-gray-600">Search for available domain names and register them instantly</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
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

            {/* Tabs Navigation - Only show after search */}
            {result && (
              <div className="mt-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'results', name: 'Results', icon: MagnifyingGlassIcon },
                      { id: 'generator', name: 'Generator', icon: LightBulbIcon },
                      { id: 'auctions', name: 'Auctions', icon: FireIcon },
                      { id: 'premium', name: 'Premium', icon: StarIcon },
                      { id: 'beast', name: 'Beast Mode', icon: BoltIcon },
                      { id: 'favorites', name: `Favorites (${favorites.length})`, icon: HeartIcon }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveTab(tab.id as any);
                          }}
                          className={`${activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            )}

            {/* Tab Content - Only show after search */}
            {result && (
              <>
                {activeTab === 'results' && (
                  <div className="mt-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-medium text-gray-900">
                            {result.domain}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.available ? 'Available' : 'Taken'}
                          </div>
                          {result.price && result.price > 0 && (
                            <div className="text-sm font-semibold text-gray-900">
                              ${result.price.toFixed(2)}/yr
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleFavorite(result.domain)}
                            className={`p-2 rounded-lg ${favorites.includes(result.domain)
                              ? 'text-red-500 bg-red-50'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                          >
                            <HeartIcon className="h-4 w-4" />
                          </button>
                          {result.available && result.price && result.price > 0 && mounted && (
                            <>
                              {isDomainInCart(result.domain) ? (
                                <button
                                  type="button"
                                  onClick={() => router.push('/cart')}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
                                >
                                  <ShoppingCartIcon className="h-4 w-4" />
                                  <span>View Cart</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAddDomainToCart(result.domain, result.price)}
                                  disabled={addingToCart}
                                  className={`px-4 py-2 text-white rounded-lg text-sm ${addingToCart
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Generator Tab */}
            {result && activeTab === 'generator' && (
              <div className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <LightBulbIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Domain Generator
                  </h3>

                  {isSearching && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-blue-600 font-medium">Generating domain suggestions...</span>
                    </div>
                  )}

                  {generatedDomains.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Generated Suggestions</h4>
                      <div className="space-y-2">
                        {generatedDomains.map((domain, index) => (
                          <div key={`${domain.domain}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="text-lg font-medium text-gray-900">
                                {domain.domain}
                              </div>
                              <div className="text-sm text-gray-500">
                                {domain.available ? 'Available' : 'Taken'}
                              </div>
                              {domain.price && (
                                <div className="text-sm font-semibold text-gray-900">
                                  ${domain.price.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleFavorite(domain.domain)}
                                className={`p-2 rounded-lg ${favorites.includes(domain.domain)
                                  ? 'text-red-500 bg-red-50'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                  }`}
                              >
                                <HeartIcon className="h-4 w-4" />
                              </button>
                              {domain.available && domain.price && (
                                <>
                                  {isDomainInCart(domain.domain) ? (
                                    <button
                                      type="button"
                                      onClick={() => router.push('/cart')}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
                                    >
                                      <ShoppingCartIcon className="h-4 w-4" />
                                      <span>View Cart</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAddDomainToCart(domain.domain, domain.price)}
                                      disabled={addingToCart}
                                      className={`px-4 py-2 text-white rounded-lg text-sm ${addingToCart
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    >
                                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auctions Tab */}
            {result && activeTab === 'auctions' && (
              <div className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FireIcon className="h-5 w-5 mr-2 text-orange-500" />
                    Domain Auctions
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">Bid on expiring domains and grab a great deal!</p>

                  {loadingAuctions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
                      <span className="text-orange-600 font-medium">Loading auction data...</span>
                    </div>
                  ) : auctionData.length > 0 ? (
                    <div className="space-y-4">
                      {auctionData.map((auction) => (
                        <div key={auction.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">{auction.domain}</h4>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                                  {auction.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{auction.description}</p>
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <FireIcon className="h-4 w-4 mr-1" />
                                  {auction.bids} bids
                                </span>
                                <span className="flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {auction.timeLeft}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-orange-600">${auction.currentBid}</div>
                              <div className="text-sm text-gray-500">Current Bid</div>
                              <button className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                                Place Bid
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FireIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-600">No active auctions</p>
                      <p className="text-gray-500 mt-2">Check back later for domain auction listings.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Premium Tab */}
            {result && activeTab === 'premium' && (
              <div className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                    Premium Domains
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">Discover high-value, memorable domains for your brand.</p>

                  {loadingPremium ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
                      <span className="text-yellow-600 font-medium">Loading premium domains...</span>
                    </div>
                  ) : premiumData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {premiumData.map((domain) => (
                        <div key={domain.id} className="border border-gray-200 rounded-lg p-4 hover:border-yellow-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">{domain.domain}</h4>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                {domain.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-yellow-600">${domain.price.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">Premium Price</div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">{domain.description}</p>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {domain.features.map((feature: any, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {feature}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600 font-medium">{domain.availability}</span>
                            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium">
                              Purchase Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-600">No premium domains available</p>
                      <p className="text-gray-500 mt-2">Check back later for premium domain listings.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Beast Mode Tab */}
            {result && activeTab === 'beast' && (
              <div className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BoltIcon className="h-5 w-5 mr-2 text-yellow-500" />
                    Beast Mode
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">Search across all available TLDs for maximum domain discovery.</p>

                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="beastMode"
                      checked={beastMode}
                      onChange={(e) => setBeastMode(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="beastMode" className="text-sm font-medium text-gray-700">
                      Enable Beast Mode - Search all TLDs
                    </label>
                  </div>

                  {beastMode && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        Beast Mode is enabled! This will search across all available TLDs when you perform a domain search.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {result && activeTab === 'favorites' && (
              <div className="mt-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <HeartIcon className="h-5 w-5 mr-2 text-red-500" />
                    My Favorites ({favorites.length})
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">Domains you've marked as favorites for quick access.</p>

                  {favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-600">No favorites yet!</p>
                      <p className="text-gray-500 mt-2">Start searching for domains and click the heart icon to add them here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {favorites.map((domain) => (
                        <div key={domain} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="text-lg font-medium text-gray-900">
                              {domain}
                            </div>
                            <div className="text-sm text-gray-500">
                              Favorited
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleFavorite(domain)}
                              className="p-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100"
                            >
                              <HeartIcon className="h-4 w-4" />
                            </button>
                            {isDomainInCart(domain) ? (
                              <button
                                type="button"
                                onClick={() => router.push('/cart')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
                              >
                                <ShoppingCartIcon className="h-4 w-4" />
                                <span>View Cart</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  // Use a default price for favorites since we don't have pricing data
                                  const price = 12.99; // Default price
                                  handleAddDomainToCart(domain, price);
                                }}
                                disabled={addingToCart}
                                className={`px-4 py-2 text-white rounded-lg text-sm ${addingToCart
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700'
                                  }`}
                              >
                                {addingToCart ? 'Adding...' : 'Add to Cart'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Cart Notification */}
        {showCartNotification && (
          <div className="mt-4 max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Item added to cart successfully!
                    </p>
                    <p className="text-xs text-green-600">
                      {items.length} item{items.length > 1 ? 's' : ''} in your cart
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push('/cart')}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span>View Cart</span>
                  </button>
                  <button
                    onClick={() => setShowCartNotification(false)}
                    className="p-2 text-green-400 hover:text-green-600 transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Products Grid Component (Fetches from Real Backend)
export const ProductsGridComponent = React.memo(function ProductsGridComponent({
  style,
  props
}: {
  style?: React.CSSProperties;
  props?: {
    columns?: number;
    productCount?: number;
    showPrices?: boolean;
    showFeatures?: boolean;
    showButtons?: boolean;
    title?: string;
    subtitle?: string;
  };
}) {
  // ALL HOOKS MUST BE AT THE TOP
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { addItem } = useCart();

  // Get configuration from props (before hooks that depend on them)
  const columns = props?.columns || 3;
  const productCount = props?.productCount || products.length;
  const showPrices = props?.showPrices !== false; // Default to true
  const showButtons = props?.showButtons !== false; // Default to true
  const title = props?.title || "Our Products";
  const subtitle = props?.subtitle || "Choose from our range of hosting solutions designed to meet your needs";

  // Limit products based on productCount
  const displayProducts = products.slice(0, productCount);

  // Responsive columns hooks
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [actualColumns, setActualColumns] = React.useState(columns);

  // ALL useEffect hooks together
  useEffect(() => {
    // Fetch products logic inlined to avoid forward reference
    const fetchProducts = async () => {
      // Prevent multiple API calls
      if (hasFetched) return;

      // Check cache first
      const now = Date.now();
      if (productsCache && (now - productsCacheTimestamp) < CACHE_DURATION) {
        setProducts(productsCache);
        setHasFetched(true);
        return;
      }

      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
          (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

        const response = await fetch(`${apiUrl}/api/v1/products/`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();

        // Cache the results
        productsCache = data;
        productsCacheTimestamp = now;
        setProducts(data);
      } catch (error) {
        console.warn('Products API not available, using fallback data:', error);
        // Fallback to mock data if API fails
        setProducts([
          {
            id: '1',
            name: 'Basic Hosting',
            description: 'Perfect for small websites',
            price: 9.99,
            billing_cycle: 'monthly',
            category: 'hosting'
          },
          {
            id: '2',
            name: 'Professional Hosting',
            description: 'Great for business websites',
            price: 19.99,
            billing_cycle: 'monthly',
            category: 'hosting'
          },
          {
            id: '3',
            name: 'Premium Hosting',
            description: 'For high-traffic websites',
            price: 39.99,
            billing_cycle: 'monthly',
            category: 'hosting'
          }
        ]);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchProducts();
  }, [hasFetched]);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateColumns = () => {
      const width = containerRef.current?.offsetWidth || 0;
      const baseColumns = columns;

      // Responsive column calculation based on width
      let responsiveCols = baseColumns;
      if (width < 400) {
        responsiveCols = 1;
      } else if (width < 600) {
        responsiveCols = Math.min(2, baseColumns);
      } else if (width < 900) {
        responsiveCols = Math.min(3, baseColumns);
      } else if (width < 1200) {
        responsiveCols = Math.min(4, baseColumns);
      } else {
        responsiveCols = baseColumns;
      }

      setActualColumns(responsiveCols);
    };

    updateColumns();
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [columns]);

  // Function definitions AFTER all hooks
  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      description: product.description || product.name,
      price: product.price_monthly || product.price || 0,
      billing_cycle: product.billing_cycle || 'monthly',
      category: product.category || 'hosting',
      type: 'product' as const
    });
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${actualColumns}, 1fr)` }}>
        {displayProducts.map((product: any) => (
          <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>

              {showPrices && (
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-3xl font-bold text-indigo-600">${product.price_monthly || product.price || 0}</span>
                    <span className="text-gray-600 ml-1">/month</span>
                  </div>
                </div>
              )}

              {showButtons && (
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={addedToCart === product.id}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addedToCart === product.id ? 'Added to Cart!' : 'Add to Cart'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Featured Products Component (Shows only featured products)
export const FeaturedProductsComponent = React.memo(function FeaturedProductsComponent({
  style,
  props
}: {
  style?: React.CSSProperties;
  props?: {
    columns?: number;
    productCount?: number;
    showPrices?: boolean;
    showFeatures?: boolean;
    showButtons?: boolean;
    title?: string;
    subtitle?: string;
  };
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { addItem } = useCart();

  const fetchFeaturedProducts = async () => {
    // Prevent multiple API calls
    if (hasFetched) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

      // Try to fetch featured products specifically
      let response = await fetch(`${apiUrl}/api/v1/products/?featured=true`);
      if (!response.ok) {
        // Fallback to regular products if featured endpoint doesn't exist
        response = await fetch(`${apiUrl}/api/v1/products/`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Filter for featured products or use first few as featured
      const featuredProducts = data.filter((product: any) => product.featured === true) || data.slice(0, 4);
      setProducts(featuredProducts);
    } catch (error) {
      console.warn('Featured Products API not available, using fallback data:', error);
      // Fallback to mock featured data
      setProducts([
        {
          id: '1',
          name: 'Premium Hosting',
          description: 'Our most popular hosting solution with premium features',
          price: 29.99,
          billing_cycle: 'monthly',
          category: 'hosting',
          featured: true
        },
        {
          id: '2',
          name: 'Business VPS',
          description: 'High-performance VPS for growing businesses',
          price: 79.99,
          billing_cycle: 'monthly',
          category: 'vps',
          featured: true
        },
        {
          id: '3',
          name: 'Enterprise Cloud',
          description: 'Scalable cloud infrastructure for enterprises',
          price: 199.99,
          billing_cycle: 'monthly',
          category: 'cloud',
          featured: true
        }
      ]);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, [hasFetched]);

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      description: product.description || product.name,
      price: product.price_monthly || product.price || 0,
      billing_cycle: product.billing_cycle || 'monthly',
      category: product.category || 'hosting',
      type: 'product' as const
    });
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading featured products...</p>
        </div>
      </div>
    );
  }

  // Get configuration from props
  const columns = props?.columns || 3;
  const productCount = props?.productCount || products.length;
  const showPrices = props?.showPrices !== false; // Default to true
  const showButtons = props?.showButtons !== false; // Default to true
  const title = props?.title || "Featured Products";
  const subtitle = props?.subtitle || "Discover our most popular and recommended hosting solutions";

  // Limit products based on productCount
  const displayProducts = products.slice(0, productCount);

  // Generate grid classes based on columns
  const getGridClasses = (cols: number) => {
    switch (cols) {
      case 1: return "grid-cols-1";
      case 2: return "grid-cols-1 md:grid-cols-2";
      case 3: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
      default: return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>

      <div className={`grid ${getGridClasses(columns)} gap-8`}>
        {displayProducts.map((product: any) => (
          <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 relative">
            {/* Featured Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                ⭐ Featured
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>

              {showPrices && (
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-3xl font-bold text-indigo-600">${product.price_monthly || product.price || 0}</span>
                    <span className="text-gray-600 ml-1">/month</span>
                  </div>
                </div>
              )}

              {showButtons && (
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={addedToCart === product.id}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addedToCart === product.id ? 'Added to Cart!' : 'Add to Cart'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Contact Form Component
export function ContactFormComponent({ style }: { style?: React.CSSProperties }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

      const response = await fetch(`${apiUrl}/api/v1/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        console.warn('Contact form API not available');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.warn('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
        <p className="text-xl text-gray-600">
          Get in touch with our team for any questions or support
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Thank you! Your message has been sent successfully.</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Sorry, there was an error sending your message. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="What's this about?"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
              placeholder="Tell us more..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Product Search Component
export function ProductSearchComponent({ style }: { style?: React.CSSProperties }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

      const response = await fetch(`${apiUrl}/api/v1/products/?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.warn('Product search API not available');
        setProducts([]);
      }
    } catch (error) {
      console.warn('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      description: product.description || product.name,
      price: product.price_monthly || product.price || 0,
      billing_cycle: product.billing_cycle || 'monthly',
      category: product.category || 'hosting',
      type: 'product' as const
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h2>
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-indigo-600">${product.price_monthly || product.price || 0}</span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Newsletter Component
export function NewsletterComponent({ style }: { style?: React.CSSProperties }) {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

      const response = await fetch(`${apiUrl}/api/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubscribeStatus('success');
        setEmail('');
      } else {
        console.warn('Newsletter API not available');
        setSubscribeStatus('error');
      }
    } catch (error) {
      console.warn('Error subscribing to newsletter:', error);
      setSubscribeStatus('error');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="bg-indigo-600 py-16" style={style}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Stay Updated</h2>
        <p className="text-xl text-indigo-100 mb-8">
          Subscribe to our newsletter for the latest updates and offers
        </p>

        {subscribeStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Thank you for subscribing!</p>
          </div>
        )}

        {subscribeStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Sorry, there was an error. Please try again.</p>
          </div>
        )}

        <form onSubmit={handleSubscribe} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-indigo-300"
              required
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
