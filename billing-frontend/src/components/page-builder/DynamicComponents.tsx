'use client';

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/contexts/CartContext';

// Global cache for products to prevent multiple API calls
let productsCache: any[] | null = null;
let productsCacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Domain Search Component (Matches Homepage Design)
export function DomainSearchComponent({ style }: { style?: React.CSSProperties }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const popularTlds = [
    { extension: '.com', price: '$8.99/yr' },
    { extension: '.net', price: '$10.99/yr' },
    { extension: '.org', price: '$11.99/yr' },
    { extension: '.io', price: '$34.99/yr' },
    { extension: '.dev', price: '$14.99/yr' },
    { extension: '.app', price: '$17.99/yr' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/domains/check?domain=${searchQuery}${selectedTld}`);
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error checking domain:', error);
      setResult({ available: false, error: 'Domain check API not configured.' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
      <div className="text-center">
        <h2 className="text-5xl font-extrabold sm:text-6xl" style={{ color: style?.color || '#111827' }}>
          Find Your Perfect Domain
        </h2>
        <p className="mt-6 text-xl max-w-3xl mx-auto" style={{ color: style?.color || '#4B5563' }}>
          Search and register domains at wholesale prices. Get started with NextPanel hosting and manage your entire web presence in one place.
        </p>

        {/* Domain Search Box */}
        <div className="mt-12 max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200">
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
                  placeholder="Search for your domain name..."
                  className="block w-full pl-11 pr-3 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
                />
              </div>
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
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Popular TLDs */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">Popular extensions:</p>
              <div className="flex flex-wrap gap-2">
                {popularTlds.map((tld) => (
                  <button
                    key={tld.extension}
                    type="button"
                    onClick={() => setSelectedTld(tld.extension)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTld === tld.extension
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tld.extension} <span className="text-xs opacity-75">{tld.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Search Result */}
        {result && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              {result.available ? (
                <div className="flex items-center gap-4 text-green-600">
                  <CheckCircleIcon className="h-8 w-8 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xl font-semibold">{searchQuery}{selectedTld} is available!</p>
                    <p className="text-sm text-gray-600 mt-1">You can register this domain right now</p>
                  </div>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors">
                    Add to Cart
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-red-600">
                  <XCircleIcon className="h-8 w-8 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xl font-semibold">{searchQuery}{selectedTld} is taken</p>
                    <p className="text-sm text-gray-600 mt-1">Try a different domain name or extension</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Products Grid Component (Fetches from Real Backend)
export const ProductsGridComponent = React.memo(function ProductsGridComponent({ style }: { style?: React.CSSProperties }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { addItem, items } = useCart();

  const loadProducts = async () => {
    // Check cache first
    const now = Date.now();
    if (productsCache && (now - productsCacheTimestamp) < CACHE_DURATION) {
      console.log('Using cached products');
      setProducts(productsCache);
      setHasLoaded(true);
      return;
    }

    // Prevent multiple API calls
    if (loading || hasLoaded) return;
    
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/plans?is_active=true&is_featured=true`);
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data = await response.json();
      
      // Check if API returned empty data
      if (data && data.length === 0) {
        console.log('API returned empty products, using demo data...');
        // Use demo products when API returns empty
        const demoProducts = [
          {
            id: 'prod-1',
            name: 'Starter Hosting',
            description: 'Perfect for small websites and blogs. Includes 1 hosting account, 1 domain, and basic support.',
            price_monthly: 9.99,
            price_yearly: 99.99,
            max_accounts: 1,
            max_domains: 1,
            max_databases: 1,
            max_emails: 5,
            is_featured: true,
            features: {
              category: 'hosting',
              storage: '10GB',
              bandwidth: '100GB',
              ssl: true,
              backup: 'Daily',
              support: 'Email'
            }
          },
          {
            id: 'prod-2',
            name: 'Professional Hosting',
            description: 'Ideal for growing businesses. Includes 5 hosting accounts, 5 domains, and priority support.',
            price_monthly: 29.99,
            price_yearly: 299.99,
            max_accounts: 5,
            max_domains: 5,
            max_databases: 10,
            max_emails: 25,
            is_featured: true,
            features: {
              category: 'hosting',
              storage: '50GB',
              bandwidth: '500GB',
              ssl: true,
              backup: 'Daily',
              support: 'Priority',
              cdn: true
            }
          },
          {
            id: 'prod-3',
            name: 'Enterprise Hosting',
            description: 'For large businesses and agencies. Unlimited resources and 24/7 phone support.',
            price_monthly: 99.99,
            price_yearly: 999.99,
            max_accounts: 999999,
            max_domains: 999999,
            max_databases: 999999,
            max_emails: 999999,
            is_featured: true,
            features: {
              category: 'hosting',
              storage: 'Unlimited',
              bandwidth: 'Unlimited',
              ssl: true,
              backup: 'Real-time',
              support: '24/7 Phone',
              cdn: true,
              dedicated: true
            }
          }
        ];
        setProducts(demoProducts);
        setHasLoaded(true);
        // Update cache
        productsCache = demoProducts;
        productsCacheTimestamp = Date.now();
      } else {
        setProducts(data);
        setHasLoaded(true);
        // Update cache
        productsCache = data;
        productsCacheTimestamp = Date.now();
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Use demo products as fallback
      const demoProducts = [
        {
          id: 'prod-1',
          name: 'Starter Hosting',
          description: 'Perfect for small websites and blogs. Includes 1 hosting account, 1 domain, and basic support.',
          price_monthly: 9.99,
          price_yearly: 99.99,
          max_accounts: 1,
          max_domains: 1,
          max_databases: 1,
          max_emails: 5,
          is_featured: true,
          features: {
            category: 'hosting',
            storage: '10GB',
            bandwidth: '100GB',
            ssl: true,
            backup: 'Daily',
            support: 'Email'
          }
        },
        {
          id: 'prod-2',
          name: 'Professional Hosting',
          description: 'Ideal for growing businesses. Includes 5 hosting accounts, 5 domains, and priority support.',
          price_monthly: 29.99,
          price_yearly: 299.99,
          max_accounts: 5,
          max_domains: 5,
          max_databases: 10,
          max_emails: 25,
          is_featured: true,
          features: {
            category: 'hosting',
            storage: '50GB',
            bandwidth: '500GB',
            ssl: true,
            backup: 'Daily',
            support: 'Priority',
            cdn: true
          }
        },
        {
          id: 'prod-3',
          name: 'Enterprise Hosting',
          description: 'For large businesses and agencies. Unlimited resources and 24/7 phone support.',
          price_monthly: 99.99,
          price_yearly: 999.99,
          max_accounts: 999999,
          max_domains: 999999,
          max_databases: 999999,
          max_emails: 999999,
          is_featured: true,
          features: {
            category: 'hosting',
            storage: 'Unlimited',
            bandwidth: 'Unlimited',
            ssl: true,
            backup: 'Real-time',
            support: '24/7 Phone',
            cdn: true,
            dedicated: true
          }
        }
      ];
      setProducts(demoProducts);
      setHasLoaded(true);
      // Update cache
      productsCache = demoProducts;
      productsCacheTimestamp = Date.now();
    } finally {
      setLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddToCart = (product: any) => {
    console.log('Add to cart clicked for product:', product);
    
    // Check if item already exists in cart
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      // Item already in cart, just show feedback
      console.log('Item already in cart');
    } else {
      // New item, add to cart
      const cartItem = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price_monthly,
        billing_cycle: 'monthly',
        category: product.features?.category || 'product',
        type: 'product' as const,
      };
      console.log('Adding new item to cart:', cartItem);
      addItem(cartItem);
    }
    
    // Show visual feedback
    setAddedToCart(product.id);
    setTimeout(() => {
      setAddedToCart(null);
    }, 2000);
  };

  return (
    <div className="py-12" style={style}>
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: style?.color || '#111827' }}>Our Products</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No products available</p>
            <p className="text-sm text-gray-400">Check your backend API at /api/v1/plans or add products in the admin panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold" style={{ color: style?.color || '#111827' }}>{product.name}</h3>
                    {product.is_featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Featured</span>
                    )}
                  </div>
                  <p className="mb-4 min-h-[60px]" style={{ color: style?.color || '#4B5563' }}>{product.description}</p>
                  
                  {product.features && (
                    <div className="mb-4 space-y-2">
                      {product.max_accounts && (
                        <p className="text-sm" style={{ color: style?.color || '#4B5563' }}>✓ {product.max_accounts} NextPanel Accounts</p>
                      )}
                      {product.max_domains && (
                        <p className="text-sm" style={{ color: style?.color || '#4B5563' }}>✓ {product.max_domains} Domains</p>
                      )}
                      {product.max_databases && (
                        <p className="text-sm" style={{ color: style?.color || '#4B5563' }}>✓ {product.max_databases} Databases</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-2xl font-bold text-indigo-600">${product.price_monthly}</span>
                      <span className="text-gray-500 text-sm">/mo</span>
                    </div>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                        addedToCart === product.id
                          ? 'bg-green-600 text-white'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {addedToCart === product.id ? '✓ Added to Cart!' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Product Search Component (Uses Real Backend)
export function ProductSearchComponent({ style }: { style?: React.CSSProperties }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const { addItem, items } = useCart();

  const searchProducts = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/plans?is_active=true&search=${searchTerm}`);
      if (!response.ok) {
        throw new Error('API not available');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: any) => {
    console.log('Add to cart clicked for product:', product);
    
    // Check if item already exists in cart
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      // Item already in cart, just show feedback
      console.log('Item already in cart');
    } else {
      // New item, add to cart
      const cartItem = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price_monthly,
        billing_cycle: 'monthly',
        category: product.features?.category || 'product',
        type: 'product' as const,
      };
      console.log('Adding new item to cart:', cartItem);
      addItem(cartItem);
    }
    
    // Show visual feedback
    setAddedToCart(product.id);
    setTimeout(() => {
      setAddedToCart(null);
    }, 2000);
  };

  return (
    <div className="py-12 bg-gray-50" style={style}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: style?.color || '#111827' }}>Search Products</h2>
        
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
            placeholder="Search for products..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={searchProducts}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                <h3 className="text-lg font-semibold mb-2" style={{ color: style?.color || '#111827' }}>{product.name}</h3>
                <p className="text-sm mb-3" style={{ color: style?.color || '#4B5563' }}>{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-indigo-600">${product.price_monthly}<span className="text-sm text-gray-500">/mo</span></span>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      addedToCart === product.id
                        ? 'bg-green-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {addedToCart === product.id ? '✓ Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Contact Form Component
export function ContactFormComponent({ style }: { style?: React.CSSProperties }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-12" style={style}>
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: style?.color || '#111827' }}>Get in Touch</h2>
        
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-800 font-semibold">Thank you! We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Newsletter Signup Component
export function NewsletterComponent({ style }: { style?: React.CSSProperties }) {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribing(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setSubscribed(true);
        setEmail('');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="bg-indigo-600 py-12" style={style}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ color: style?.color || '#FFFFFF' }}>Subscribe to Our Newsletter</h2>
        <p className="mb-6" style={{ color: style?.color || '#E0E7FF' }}>Get the latest updates and special offers</p>
        
        {subscribed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">Thank you for subscribing!</p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

