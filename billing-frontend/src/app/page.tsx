'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCartIcon, CheckIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface FeaturedProduct {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  max_accounts: number;
  max_domains: number;
  max_databases: number;
  max_emails: number;
  billing_cycle?: string;
  category?: string;
  is_featured: boolean;
  sort_order: number;
}

export default function Home() {
  const router = useRouter();
  const { getItemCount, addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, FeaturedProduct[]>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const popularTlds = [
    { extension: '.com', price: '$8.99/yr' },
    { extension: '.net', price: '$10.99/yr' },
    { extension: '.org', price: '$11.99/yr' },
    { extension: '.io', price: '$34.99/yr' },
    { extension: '.dev', price: '$14.99/yr' },
    { extension: '.app', price: '$17.99/yr' },
  ];

  useEffect(() => {
    loadFeaturedProducts();
    loadCategoryProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await axios.get(`${apiUrl}/api/v1/plans`, {
        params: { is_active: true, is_featured: true }
      });
      
      setFeaturedProducts(response.data);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategoryProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      // Load all active products
      const productsResponse = await axios.get(`${apiUrl}/api/v1/plans`, {
        params: { is_active: true }
      });
      
      // Load categories
      const categoriesResponse = await axios.get(`${apiUrl}/api/v1/plans/categories`);
      
      // Group products by category
      const grouped: Record<string, FeaturedProduct[]> = {};
      productsResponse.data.forEach((product: FeaturedProduct) => {
        const category = product.features?.category || 'other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(product);
      });
      
      setCategoryProducts(grouped);
      setCategories(categoriesResponse.data.categories || []);
    } catch (error) {
      console.error('Failed to load category products:', error);
    }
  };

  const handleAddToCart = (product: FeaturedProduct) => {
    addItem({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price_monthly,
      billing_cycle: 'monthly',
      category: product.features?.category || 'product',
      type: 'product',
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const fullDomain = searchQuery.includes('.') ? searchQuery : `${searchQuery}${selectedTld}`;
    // Redirect to domain registration page (we'll create this later)
    window.location.href = `/dashboard/domains?search=${encodeURIComponent(fullDomain)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer" onClick={() => router.push('/')}>
                NextPanel
              </h1>
              <nav className="hidden md:flex space-x-6">
                <a href="/" className="text-gray-600 hover:text-gray-900 font-medium">Home</a>
                <a href="/shop" className="text-indigo-600 hover:text-indigo-700 font-medium">Shop</a>
                <a href="/#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
              </nav>
            </div>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {getItemCount()}
                  </span>
                )}
              </button>
              <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</a>
              <a href="/auth/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Domain Search */}
      <div id="domain-search" className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Find Your Perfect Domain
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
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
                <p className="text-sm text-gray-600 mb-3 font-medium text-left">
                  Popular Extensions:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {popularTlds.map((tld) => (
                    <button
                      key={tld.extension}
                      type="button"
                      onClick={() => setSelectedTld(tld.extension)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedTld === tld.extension
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">
                        {tld.extension}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {tld.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="mt-10">
            <a
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              View Pricing Plans
            </a>
          </div>
        </div>

        {/* Shop CTA */}
        <div className="mt-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Browse Our Products
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Explore our full catalog of hosting plans, domains, SSL certificates, and more. 
            Find the perfect solution for your needs.
          </p>
          <button
            onClick={() => router.push('/shop')}
            className="inline-flex items-center bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            <ShoppingCartIcon className="h-6 w-6 mr-2" />
            Visit Shop
          </button>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-blue-600 text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Fast & Reliable</h3>
            <p className="text-gray-600">
              High-performance hosting infrastructure designed to handle 10,000+ concurrent users.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-blue-600 text-3xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Payments</h3>
            <p className="text-gray-600">
              Secure payment processing with Stripe. Monthly or annual billing options available.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-blue-600 text-3xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Domain Registration</h3>
            <p className="text-gray-600">
              Register domains at wholesale prices starting from $8.99/year with full management.
            </p>
          </div>
        </div>

        {/* Featured Products */}
        <div id="pricing" className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Featured Products
          </h3>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose from our carefully selected products. Manage featured products from your dashboard.
          </p>
          
          {loadingProducts ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 mb-4">No featured products yet</p>
              <p className="text-sm text-gray-500">
                Administrators can mark products as featured in the dashboard
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-8 ${
              featuredProducts.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
              featuredProducts.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
              'md:grid-cols-3'
            }`}>
              {featuredProducts.map((product, index) => {
                const isPopular = index === 1 && featuredProducts.length === 3; // Middle product in 3-column layout
                
                return (
                  <div
                    key={product.id}
                    className={`p-8 rounded-xl shadow-xl border-2 ${
                      isPopular
                        ? 'bg-indigo-600 border-indigo-700 transform scale-105'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className={`text-2xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                        {product.name}
                      </h4>
                      {isPopular && (
                        <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <p className={`mt-2 ${isPopular ? 'text-indigo-100' : 'text-gray-600'}`}>
                      {product.description}
                    </p>
                    <div className="mt-4">
                      <span className={`text-4xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                        ${product.price_monthly}
                      </span>
                      <span className={isPopular ? 'text-indigo-100' : 'text-gray-600'}>/month</span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {product.max_accounts > 0 && (
                        <li className={`flex items-center ${isPopular ? 'text-white' : 'text-gray-600'}`}>
                          <CheckIcon className={`h-5 w-5 mr-2 ${isPopular ? 'text-yellow-400' : 'text-green-500'}`} />
                          {product.max_accounts === 999999 ? 'Unlimited' : product.max_accounts} Hosting {product.max_accounts === 1 ? 'Account' : 'Accounts'}
                        </li>
                      )}
                      {product.max_domains > 0 && (
                        <li className={`flex items-center ${isPopular ? 'text-white' : 'text-gray-600'}`}>
                          <CheckIcon className={`h-5 w-5 mr-2 ${isPopular ? 'text-yellow-400' : 'text-green-500'}`} />
                          {product.max_domains === 999999 ? 'Unlimited' : product.max_domains} {product.max_domains === 1 ? 'Domain' : 'Domains'}
                        </li>
                      )}
                      {product.max_databases > 0 && (
                        <li className={`flex items-center ${isPopular ? 'text-white' : 'text-gray-600'}`}>
                          <CheckIcon className={`h-5 w-5 mr-2 ${isPopular ? 'text-yellow-400' : 'text-green-500'}`} />
                          {product.max_databases === 999999 ? 'Unlimited' : product.max_databases} {product.max_databases === 1 ? 'Database' : 'Databases'}
                        </li>
                      )}
                      {product.max_emails > 0 && (
                        <li className={`flex items-center ${isPopular ? 'text-white' : 'text-gray-600'}`}>
                          <CheckIcon className={`h-5 w-5 mr-2 ${isPopular ? 'text-yellow-400' : 'text-green-500'}`} />
                          {product.max_emails === 999999 ? 'Unlimited' : product.max_emails} Email {product.max_emails === 1 ? 'Account' : 'Accounts'}
                        </li>
                      )}
                      {/* Show additional features from JSON if available */}
                      {product.features && Object.entries(product.features).slice(0, 2).map(([key, value]) => {
                        if (key !== 'category' && value && typeof value !== 'object') {
                          return (
                            <li key={key} className={`flex items-center ${isPopular ? 'text-white' : 'text-gray-600'}`}>
                              <CheckIcon className={`h-5 w-5 mr-2 ${isPopular ? 'text-yellow-400' : 'text-green-500'}`} />
                              {key.replace(/_/g, ' ')}: {String(value)}
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`mt-8 block w-full px-6 py-3 rounded-lg text-center font-semibold transition ${
                        isPopular
                          ? 'bg-white text-indigo-600 hover:bg-gray-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/shop')}
              className="inline-flex items-center px-8 py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition"
            >
              View All Products
            </button>
          </div>
        </div>
      </div>

      {/* Browse by Category Section */}
      <div className="mt-32">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Browse by Category
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our complete range of products organized by category
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
            }`}
          >
            All Products
          </button>
          {categories.map((category) => {
            const productCount = categoryProducts[category.id]?.length || 0;
            if (productCount === 0) return null;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {category.name} ({productCount})
              </button>
            );
          })}
        </div>

        {/* Category Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(selectedCategory === 'all' 
            ? Object.values(categoryProducts).flat()
            : categoryProducts[selectedCategory] || []
          ).map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    {categories.find(c => c.id === (product.features?.category || 'other'))?.name || 'Other'}
                  </span>
                  {product.is_featured && (
                    <span className="text-yellow-500" title="Featured Product">⭐</span>
                  )}
                </div>

                {/* Product Name */}
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                  {product.name}
                </h4>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.price_monthly}
                    </span>
                    <span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    or ${product.price_yearly}/year
                  </div>
                </div>

                {/* Key Features */}
                <div className="space-y-2 mb-4">
                  {product.max_accounts > 0 && (
                    <div className="flex items-center text-xs text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {product.max_accounts === 999999 ? 'Unlimited' : product.max_accounts} Accounts
                    </div>
                  )}
                  {product.max_domains > 0 && (
                    <div className="flex items-center text-xs text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {product.max_domains === 999999 ? 'Unlimited' : product.max_domains} Domains
                    </div>
                  )}
                  {product.max_databases > 0 && (
                    <div className="flex items-center text-xs text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {product.max_databases === 999999 ? 'Unlimited' : product.max_databases} Databases
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => router.push('/shop')}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition text-sm"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {selectedCategory !== 'all' && (!categoryProducts[selectedCategory] || categoryProducts[selectedCategory].length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products in this category yet.</p>
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/shop')}
            className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg"
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            View All Products in Shop
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              &copy; 2025 NextPanel Billing. All rights reserved.
            </p>
            <div className="mt-4 space-x-6">
              <a href="/terms" className="text-gray-400 hover:text-white">Terms</a>
              <a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="/support" className="text-gray-400 hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

