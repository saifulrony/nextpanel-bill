'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCartIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  category?: string;
  is_active: boolean;
  features: Record<string, any>;
  subcategory?: string;
}

export default function ShopPage() {
  const router = useRouter();
  const { addItem, getItemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'hosting', name: 'Hosting' },
    { id: 'license', name: 'Licenses' },
    { id: 'domain', name: 'Domains' },
    { id: 'email', name: 'Email Services' },
    { id: 'ssl', name: 'SSL Certificates' },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const loadProducts = async () => {
    try {
      // Use public endpoint or handle without auth
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await axios.get(`${apiUrl}/api/v1/plans`, {
        params: { is_active: true }
      });
      
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Show some mock products if API fails
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category && p.category.toLowerCase() === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    const price = billingCycle === 'monthly' ? product.price_monthly : product.price_yearly;
    
    addItem({
      id: product.id,
      name: product.name,
      description: product.description,
      price: price || 0,
      billing_cycle: billingCycle,
      category: product.category || (product.features?.category) || 'general',
      type: 'product',
    });

    // Show checkmark animation
    setAddedItems(prev => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
  };

  const formatPrice = (price: number, cycle: string) => {
    // Handle undefined or null values
    if (price === undefined || price === null || isNaN(price)) {
      return 'Price not available';
    }
    
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);

    const cycleText = cycle === 'monthly' ? '/mo' : 
                      cycle === 'yearly' ? '/yr' : 
                      cycle === 'one-time' ? '' : 
                      cycle ? `/${cycle}` : '';

    return `${formatted}${cycleText}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer" onClick={() => router.push('/')}>
                NextPanel Shop
              </h1>
              <nav className="hidden md:flex space-x-6">
                <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                <a href="/shop" className="text-indigo-600 font-medium">Shop</a>
                <a href="/#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
              <a href="/login" className="text-gray-600 hover:text-gray-900">Login</a>
              <a
                href="/auth/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center mt-6">
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Yearly Billing <span className="ml-1 text-xs text-green-600">(Save 20%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 flex-1">{product.description}</p>

                  {/* Features */}
                  {product.features && Object.keys(product.features).length > 0 && (
                    <div className="mb-4 space-y-2">
                      {Object.entries(product.features).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{key.replace(/_/g, ' ')}: {String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(
                            billingCycle === 'monthly' ? product.price_monthly : product.price_yearly, 
                            billingCycle
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addedItems.has(product.id)}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                        addedItems.has(product.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {addedItems.has(product.id) ? (
                        <span className="flex items-center justify-center">
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Added to Cart!
                        </span>
                      ) : (
                        'Add to Cart'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Domain Search CTA */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Looking for a domain?</h2>
          <p className="text-indigo-100 mb-6">Search and register your perfect domain name</p>
          <button
            onClick={() => router.push('/#domain-search')}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Search Domains
          </button>
        </div>
      </div>
    </div>
  );
}

