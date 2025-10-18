'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCartIcon, CheckIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DynamicHomepage } from '@/components/page-builder/DynamicHomepage';
import Header from '@/components/Header';
import EnhancedDomainSearch from '@/components/domains/EnhancedDomainSearch';
import { domainsAPI } from '@/lib/api';
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
  const { getItemCount, addItem, updateQuantity, items } = useCart();
  const [headerDesign, setHeaderDesign] = useState<{
    selectedDesign: string;
    elements: any[];
    deviceType: string;
    timestamp: string;
  } | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const addingToCartRef = useRef<Set<string>>(new Set());
  const [categoryProducts, setCategoryProducts] = useState<Record<string, FeaturedProduct[]>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hasCustomHomepage, setHasCustomHomepage] = useState<boolean | null>(null);
  const [checkingHomepage, setCheckingHomepage] = useState(true);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  useEffect(() => {
    checkForCustomHomepage();
    loadFeaturedProducts();
    loadCategoryProducts();
    
    // Load logo from localStorage
    const logoSettings = localStorage.getItem('logo_settings');
    if (logoSettings) {
      try {
        const settings = JSON.parse(logoSettings);
        if (settings.logo) {
          setLogoUrl(settings.logo);
        }
      } catch (error) {
        console.error('Failed to load logo settings:', error);
      }
    }

    // Load saved header design
    const savedSettings = localStorage.getItem('customization_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.headerDesign) {
          setHeaderDesign(settings.headerDesign);
        }
      } catch (error) {
        console.error('Failed to load header design:', error);
      }
    }
  }, []);

  const checkForCustomHomepage = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      console.log('Checking for custom homepage at:', `${apiUrl}/api/v1/pages/homepage`);
      
      const response = await fetch(`${apiUrl}/api/v1/pages/homepage/`);
      
      console.log('Homepage response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Homepage data:', data);
        setHasCustomHomepage(!!data);
      } else {
        console.log('No custom homepage found');
        setHasCustomHomepage(false);
      }
    } catch (error) {
      console.error('Error checking for custom homepage:', error);
      setHasCustomHomepage(false);
    } finally {
      setCheckingHomepage(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await axios.get(`${apiUrl}/api/v1/plans/`, {
        params: { is_active: true, is_featured: true }
      });
      
      // Check if API returned empty data
      if (response.data && response.data.length === 0) {
        console.log('API returned empty products, using demo data...');
        const demoProducts: FeaturedProduct[] = [
          {
            id: 'demo-1',
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
            },
            sort_order: 1
          },
          {
            id: 'demo-2',
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
            },
            sort_order: 2
          },
          {
            id: 'demo-3',
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
            },
            sort_order: 3
          }
        ];
        setFeaturedProducts(demoProducts);
      } else {
        setFeaturedProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to load featured products:', error);
      // Use demo data as fallback
      const demoProducts: FeaturedProduct[] = [
        {
          id: 'demo-1',
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
          },
          sort_order: 1
        }
      ];
      setFeaturedProducts(demoProducts);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategoryProducts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      // Load all active products
      const productsResponse = await axios.get(`${apiUrl}/api/v1/plans/`, {
        params: { is_active: true }
      });
      
      // Load categories
      const categoriesResponse = await axios.get(`${apiUrl}/api/v1/plans/categories/`);
      
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
    console.log('Add to cart clicked for product:', product);
    
    // Prevent double-clicks by checking if we're already adding this item
    if (addingToCartRef.current.has(product.id)) {
      console.log('Already adding this item, skipping...');
      return;
    }
    
    addingToCartRef.current.add(product.id);
    
    // Prevent double-clicks by checking if item already exists with same ID
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      // Item already in cart, just increment quantity
      console.log('Item exists, updating quantity:', existingItem.quantity + 1);
      updateQuantity(product.id, existingItem.quantity + 1);
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
    
    // Remove from the set after a short delay to allow for the state update
    setTimeout(() => {
      addingToCartRef.current.delete(product.id);
    }, 500);
  };

  // Show loading state while checking for custom homepage
  if (checkingHomepage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's a custom homepage, render it
  if (hasCustomHomepage) {
    return (
      <div>
        <DynamicHomepage />
      </div>
    );
  }

  // Otherwise, render the default homepage
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Custom Header */}
      <Header headerDesign={headerDesign} />

      {/* Enhanced Domain Search */}
      <EnhancedDomainSearch />

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
      </div>

      {/* Featured Products - Only show if there are featured products or loading */}
      {(loadingProducts || featuredProducts.length > 0) && (
        <div id="pricing" className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Featured Hosting Plans
          </h3>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose the perfect hosting plan for your needs. All plans include free SSL certificates, daily backups, and 24/7 support.
          </p>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {loadingProducts ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))
              ) : (
                featuredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                    <div className="text-center mb-6">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h4>
                      <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                      
                      <div className="mb-6">
                        <div className="text-4xl font-bold text-blue-600">
                          ${product.price_monthly}
                          <span className="text-lg font-normal text-gray-500">/month</span>
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
                            {product.max_domains === 999999 ? 'Unlimited' : product.max_domains} {product.max_domains === 1 ? 'Domain' : 'Domains'}
                          </div>
                        )}
                        {product.max_databases > 0 && (
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {product.max_databases === 999999 ? 'Unlimited' : product.max_databases} Databases
                          </div>
                        )}
                        {product.max_emails > 0 && (
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {product.max_emails === 999999 ? 'Unlimited' : product.max_emails} Email Accounts
                          </div>
                        )}
                        {product.features?.ssl && (
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            Free SSL Certificate
                          </div>
                        )}
                        {product.features?.backup && (
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {product.features.backup} Backups
                          </div>
                        )}
                        {product.features?.support && (
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {product.features.support} Support
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={addingToCartRef.current.has(product.id)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                        addingToCartRef.current.has(product.id)
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : addedToCart === product.id
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      {addingToCartRef.current.has(product.id)
                        ? 'Adding...'
                        : addedToCart === product.id
                        ? 'Added to Cart!'
                        : 'Add to Cart'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category-based Products */}
      {categories.length > 0 && (
        <div className="mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Browse by Category
            </h3>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-all capitalize ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(categoryProducts)
                .filter(([category]) => selectedCategory === 'all' || category === selectedCategory)
                .map(([category, products]) =>
                  products.map((product) => (
                    <div key={product.id} className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                      <div className="text-center mb-6">
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h4>
                        <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                        
                        <div className="mb-6">
                          <div className="text-4xl font-bold text-blue-600">
                            ${product.price_monthly}
                            <span className="text-lg font-normal text-gray-500">/month</span>
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
                          {product.max_emails > 0 && (
                            <div className="flex items-center text-xs text-gray-600">
                              <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {product.max_emails === 999999 ? 'Unlimited' : product.max_emails} Email Accounts
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCartRef.current.has(product.id)}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                          addingToCartRef.current.has(product.id)
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : addedToCart === product.id
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                        }`}
                      >
                        {addingToCartRef.current.has(product.id)
                          ? 'Adding...'
                          : addedToCart === product.id
                          ? 'Added to Cart!'
                          : 'Add to Cart'}
                      </button>
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary */}
      {items.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            <span>Cart ({getItemCount()})</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">NextPanel Billing</h3>
              <p className="text-gray-400 text-sm">
                Professional hosting and domain management solutions for businesses of all sizes.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/pricing" className="hover:text-white">Hosting Plans</a></li>
                <li><a href="/domains" className="hover:text-white">Domain Registration</a></li>
                <li><a href="/support" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4">Legal</h4>
              <div className="flex space-x-4 text-sm text-gray-400">
                <a href="/terms" className="hover:text-white">Terms</a>
                <a href="/privacy" className="hover:text-white">Privacy</a>
                <a href="/support" className="hover:text-white">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
