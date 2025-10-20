'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { plansAPI } from '@/lib/api';
import {
  ShoppingCartIcon,
  CheckIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CloudIcon,
  ServerIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_accounts: number;
  max_domains: number;
  max_databases: number;
  max_emails: number;
  features: any;
  is_active: boolean;
  is_featured?: boolean;
  sort_order?: number;
  created_at: string;
  category?: string;
  subcategory?: string;
}

// Icon mapping for different product categories
const getProductIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'hosting':
      return ServerIcon;
    case 'domains':
      return GlobeAltIcon;
    case 'security':
      return ShieldCheckIcon;
    case 'email':
      return CloudIcon;
    default:
      return ServerIcon;
  }
};

export default function ServicesPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [productsRes, categoriesRes] = await Promise.all([
          plansAPI.list({ is_active: true }),
          plansAPI.categories().catch(() => ({ data: [] }))
        ]);
        
        setProducts(productsRes.data || []);
        
        // Extract unique categories from products
        const productCategories = [...new Set(productsRes.data?.map((p: Product) => p.category).filter(Boolean))] as string[];
        setCategories(['all', ...productCategories]);
        
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again later.');
        // Fallback to empty array
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  );

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    
    const cartItem = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: billingCycle === 'monthly' ? product.price_monthly : product.price_yearly,
      billing_cycle: billingCycle,
      category: product.category || 'general',
      type: 'product' as const,
      quantity: 1
    };

    addItem(cartItem);
    
    // Simulate loading
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  const getPrice = (product: Product) => {
    return billingCycle === 'monthly' ? product.price_monthly : product.price_yearly;
  };

  const getBillingText = () => {
    return billingCycle === 'monthly' ? '/month' : '/year';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="mt-1 text-sm text-gray-500">Loading products...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and purchase services for your business needs.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Category Filter */}
            <div className="flex space-x-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Billing:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const IconComponent = getProductIcon(product.category || '');
          return (
            <div
              key={product.id}
              className={`bg-white overflow-hidden shadow rounded-lg relative ${
                product.is_featured ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              {product.is_featured && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Featured
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category || 'General'}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-600">{product.description}</p>

                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      ${getPrice(product).toFixed(2)}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      {getBillingText()}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Specifications:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Max Accounts: {product.max_accounts}
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Max Domains: {product.max_domains}
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Max Databases: {product.max_databases}
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      Max Emails: {product.max_emails}
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product.id}
                    className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      addingToCart === product.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {addingToCart === product.id ? (
                      <>
                        <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="h-4 w-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}
    </div>
  );
}
