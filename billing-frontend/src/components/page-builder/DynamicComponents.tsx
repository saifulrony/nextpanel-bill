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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.warn('Domain check API not available:', error);
      setResult({ available: false, error: 'Domain check API not configured.' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8" style={style}>
      <div className="max-w-4xl mx-auto">
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
                  className={`px-3 py-1 text-sm rounded-full border transition-all ${
                    selectedTld === tld.extension
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tld.extension} - {tld.price}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {result && (
            <div className="mt-8 p-6 bg-gray-50 rounded-xl border">
              {result.available ? (
                <div className="flex items-center space-x-3 text-green-600">
                  <CheckCircleIcon className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Domain Available!</p>
                    <p className="text-sm text-gray-600">
                      {searchQuery}{selectedTld} is available for registration
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-red-600">
                  <XCircleIcon className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Domain Not Available</p>
                    <p className="text-sm text-gray-600">
                      {result.error || 'This domain is already registered'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const { addItem } = useCart();

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

  useEffect(() => {
    fetchProducts();
  }, [hasFetched]);

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      billing_cycle: product.billing_cycle || 'monthly',
      category: product.category || 'hosting'
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

  // Get configuration from props
  const columns = props?.columns || 3;
  const productCount = props?.productCount || products.length;
  const showPrices = props?.showPrices !== false; // Default to true
  const showButtons = props?.showButtons !== false; // Default to true
  const title = props?.title || "Our Products";
  const subtitle = props?.subtitle || "Choose from our range of hosting solutions designed to meet your needs";

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
          <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              {showPrices && (
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-3xl font-bold text-indigo-600">${product.price}</span>
                    <span className="text-gray-600 ml-1">/{product.billing_cycle}</span>
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
  const [products, setProducts] = useState([]);
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
      price: product.price,
      billing_cycle: product.billing_cycle || 'monthly',
      category: product.category || 'hosting'
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
                    <span className="text-3xl font-bold text-indigo-600">${product.price}</span>
                    <span className="text-gray-600 ml-1">/{product.billing_cycle}</span>
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
  const [products, setProducts] = useState([]);
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
      price: product.price,
      billing_cycle: product.billing_cycle || 'monthly',
      category: product.category || 'hosting'
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
                <span className="text-2xl font-bold text-indigo-600">${product.price}</span>
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
