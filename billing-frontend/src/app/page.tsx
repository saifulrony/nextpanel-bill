'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCartIcon, CheckIcon, MagnifyingGlassIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { DynamicHomepage } from '@/components/page-builder/DynamicHomepage';
import Header from '@/components/Header';
import ChatBot from '@/components/ChatBot';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const addingToCartRef = useRef<Set<string>>(new Set());
  const [categoryProducts, setCategoryProducts] = useState<Record<string, FeaturedProduct[]>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Customer authentication state
  const [customerAuth, setCustomerAuth] = useState<{ isAuthenticated: boolean; user: any }>({ isAuthenticated: false, user: null });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hasCustomHomepage, setHasCustomHomepage] = useState<boolean | null>(null);
  const [checkingHomepage, setCheckingHomepage] = useState(true);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [domainSearchResults, setDomainSearchResults] = useState<any[]>([]);
  const [showDomainResults, setShowDomainResults] = useState(false);
  const [domainSearchError, setDomainSearchError] = useState<string | null>(null);
  const [showChatBot, setShowChatBot] = useState(false);

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
    } else {
      // Set default header design with user menu and cart for customers
      setHeaderDesign({
        selectedDesign: 'default',
        deviceType: 'desktop',
        timestamp: new Date().toISOString(),
        elements: [
          {
            id: 'logo',
            type: 'logo',
            label: 'Logo',
            visible: true,
            position: 0,
            settings: {
              color: '#1f2937',
              fontSize: 24,
              fontWeight: 'bold'
            }
          },
          {
            id: 'navigation',
            type: 'navigation',
            label: 'Navigation',
            visible: true,
            position: 1,
            settings: {
              color: '#374151',
              fontSize: 16
            }
          },
          {
            id: 'search',
            type: 'search',
            label: 'Search',
            visible: true,
            position: 2,
            settings: {
              color: '#6b7280',
              fontSize: 14
            }
          },
          {
            id: 'cart',
            type: 'cart',
            label: 'Cart',
            visible: true,
            position: 3,
            settings: {
              color: '#374151',
              fontSize: 16
            }
          },
          {
            id: 'user-menu',
            type: 'user-menu',
            label: 'User Menu',
            visible: true,
            position: 4,
            settings: {
              color: '#374151',
              fontSize: 16
            }
          }
        ]
      });
    }
  }, []);

  // Check for customer authentication
  useEffect(() => {
    const checkCustomerAuth = () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('user_type');
      const userData = localStorage.getItem('user');
      
      console.log('Customer auth check:', { token: !!token, userType, userData: !!userData });
      
      if (token && userType === 'customer' && userData) {
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
          console.log('Decoded customer token:', decoded);
          
          // Check if token is expired
          if (decoded.exp && Date.now() / 1000 > decoded.exp) {
            console.log('Customer token expired');
            localStorage.removeItem('token');
            localStorage.removeItem('user_type');
            localStorage.removeItem('user');
            setCustomerAuth({ isAuthenticated: false, user: null });
          } else {
            const user = JSON.parse(userData);
            console.log('Customer authenticated:', user);
            setCustomerAuth({ isAuthenticated: true, user });
          }
        } catch (error) {
          console.error('Customer token decode error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user');
          setCustomerAuth({ isAuthenticated: false, user: null });
        }
      } else {
        console.log('No customer token or wrong user type:', { token: !!token, userType });
        setCustomerAuth({ isAuthenticated: false, user: null });
      }
    };
    
    // Check immediately
    checkCustomerAuth();
    
    // Also check on window focus (in case user logged in from another tab)
    const handleFocus = () => {
      checkCustomerAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Force re-render when customer auth changes
  useEffect(() => {
    console.log('Customer auth state changed:', customerAuth);
  }, [customerAuth]);

  // Combined authentication state - check both admin and customer auth
  const combinedAuth = {
    isAuthenticated: isAuthenticated || customerAuth.isAuthenticated,
    user: user || customerAuth.user,
    userType: customerAuth.isAuthenticated ? 'customer' : (isAuthenticated ? 'admin' : null)
  };

  // Debug logging
  console.log('Auth states:', {
    admin: { isAuthenticated, user: !!user },
    customer: customerAuth,
    combined: combinedAuth
  });
  
  // Additional debug for Header
  console.log('Header will receive:', {
    customAuth: combinedAuth,
    isAuthenticated: combinedAuth.isAuthenticated,
    user: combinedAuth.user,
    userType: combinedAuth.userType
  });

  // Debug info for development
  const debugInfo = {
    localStorage: typeof window !== 'undefined' ? {
      token: localStorage.getItem('token'),
      userType: localStorage.getItem('user_type'),
      user: localStorage.getItem('user')
    } : null,
    customerAuth,
    combinedAuth
  };
  console.log('Full debug info:', debugInfo);


  // Combined logout function that handles both admin and customer logout
  const handleLogout = () => {
    if (customerAuth.isAuthenticated) {
      // Customer logout
      localStorage.removeItem('token');
      localStorage.removeItem('user_type');
      localStorage.removeItem('user');
      document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setCustomerAuth({ isAuthenticated: false, user: null });
      setShowUserMenu(false);
    } else if (isAuthenticated) {
      // Admin logout
      logout();
      setShowUserMenu(false);
    }
  };

  const checkForCustomHomepage = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      console.log('Checking for custom homepage at:', `${apiUrl}/api/v1/pages/homepage`);
      
      const response = await fetch(`${apiUrl}/api/v1/pages/homepage`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
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
      setLoadingProducts(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await axios.get(`${apiUrl}/api/v1/plans`, {
        params: { is_active: true, is_featured: true },
        timeout: 5000 // 5 second timeout
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
      // Use demo products as fallback
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
        params: { is_active: true },
        timeout: 5000
      });
      
      // Load categories
      const categoriesResponse = await axios.get(`${apiUrl}/api/v1/plans/categories`, {
        timeout: 5000
      });
      
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setDomainSearchError(null);
    setShowDomainResults(false);
    
    try {
      const baseName = searchQuery.includes('.') ? searchQuery.split('.')[0] : searchQuery;
      const response = await domainsAPI.search({
        domain_name: baseName,
        tlds: popularTlds.map(tld => tld.extension)
      });
      
      setDomainSearchResults(response.data.results);
      setShowDomainResults(true);
    } catch (error: any) {
      console.error('Domain search error:', error);
      setDomainSearchError('Failed to search domains. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddDomainToCart = (domain: string, price: number) => {
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

  const isDomainInCart = (domain: string) => {
    return items.some(item => item.domain_name === domain);
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
      <Header 
        key={`header-${combinedAuth.isAuthenticated}-${combinedAuth.user?.id || 'anonymous'}`}
        headerDesign={headerDesign} 
        customAuth={combinedAuth}
        customLogout={handleLogout}
        settings={{
          logo: logoUrl,
          logoWidth: 120,
          logoHeight: 40,
          logoPosition: 'left',
          logoPadding: 16,
          logoOpacity: 1,
          logoMaxWidth: '200px',
          logoText: 'NextPanel',
          logoColor: '#1f2937',
          headerBackgroundColor: '#ffffff',
          headerPadding: 16,
          headerMarginTop: 0,
          headerMarginBottom: 0,
          headerMarginLeft: 0,
          headerMarginRight: 0,
          headerIsStatic: false
        }}
      />

      {/* Debug info for development - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 m-4 rounded">
          <strong>Debug Info:</strong>
          <br />
          Admin Auth: {isAuthenticated ? 'Yes' : 'No'} {user ? `(${user.email})` : ''}
          <br />
          Customer Auth: {customerAuth.isAuthenticated ? 'Yes' : 'No'} {customerAuth.user ? `(${customerAuth.user.email || customerAuth.user.name})` : ''}
          <br />
          Combined Auth: {combinedAuth.isAuthenticated ? 'Yes' : 'No'} {combinedAuth.user ? `(${combinedAuth.user.email || combinedAuth.user.name})` : ''}
          <br />
          User Type: {combinedAuth.userType || 'None'}
          <br />
          <button 
            onClick={() => {
              console.log('Manual refresh triggered');
              const token = localStorage.getItem('token');
              const userType = localStorage.getItem('user_type');
              const userData = localStorage.getItem('user');
              console.log('Current localStorage:', { token: !!token, userType, userData: !!userData });
              if (token && userType === 'customer') {
                try {
                  const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                  console.log('Token decoded:', decoded);
                  const user = userData ? JSON.parse(userData) : null;
                  setCustomerAuth({ isAuthenticated: true, user });
                } catch (error) {
                  console.error('Token decode error:', error);
                }
              }
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm mt-2 mr-2"
          >
            Manual Refresh Auth
          </button>
          <button 
            onClick={() => {
              console.log('Setting test customer auth');
              const testUser = {
                id: '1',
                email: 'test@customer.com',
                name: 'Test Customer',
                user_type: 'customer'
              };
              const testToken = Buffer.from(JSON.stringify({
                userId: '1',
                email: 'test@customer.com',
                userType: 'customer',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
              })).toString('base64');
              
              localStorage.setItem('token', testToken);
              localStorage.setItem('user', JSON.stringify(testUser));
              localStorage.setItem('user_type', 'customer');
              
              console.log('Test customer data set:', { testUser, testToken });
              setCustomerAuth({ isAuthenticated: true, user: testUser });
              
              // Force a re-render
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-sm mt-2 mr-2"
          >
            Set Test Customer
          </button>
          <button 
            onClick={() => {
              console.log('Clearing all auth data');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('user_type');
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setCustomerAuth({ isAuthenticated: false, user: null });
              window.location.reload();
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-sm mt-2"
          >
            Clear All Auth
          </button>
          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
            <strong>Current Auth Status:</strong><br/>
            Authenticated: {combinedAuth.isAuthenticated ? 'Yes' : 'No'}<br/>
            User: {combinedAuth.user?.name || combinedAuth.user?.email || 'None'}<br/>
            Type: {combinedAuth.userType || 'None'}<br/>
            Customer Auth: {customerAuth.isAuthenticated ? 'Yes' : 'No'}
          </div>
        </div>
      )}

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

            </form>
          </div>

          {/* Domain Search Results - Simplified */}
          {domainSearchError && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {domainSearchError}
                </div>
              </div>
            </div>
          )}

          {showDomainResults && domainSearchResults.length > 0 && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Search Results for "{searchQuery}"
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {domainSearchResults.filter(r => r.available).length} available domains found
                  </p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {domainSearchResults.map((result) => (
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
                                  onClick={() => router.push(`/domains?register=${result.domain}`)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={() => router.push('/domains')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all domains →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cart Indicator */}
          {items.length > 0 && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCartIcon className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      {items.length} item{items.length > 1 ? 's' : ''} in cart
                    </span>
                  </div>
                  <button
                    onClick={() => router.push('/checkout')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10">
            <a
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              View Pricing Plans
            </a>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
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
      </div>

      {/* Featured Products - Only show if there are featured products or loading */}
        {(loadingProducts || featuredProducts.length > 0) && (
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
                        addedToCart === product.id
                          ? 'bg-green-600 text-white'
                          : isPopular
                          ? 'bg-white text-indigo-600 hover:bg-gray-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {addedToCart === product.id ? '✓ Added to Cart!' : 'Add to Cart'}
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
        )}

      {/* Browse by Category Section */}
      <div className="mt-16 max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Browse by Category
          </h3>
          <p className="text-gray-600 text-sm">
            Explore our complete range of products organized by category
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
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
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition text-sm ${
                      addedToCart === product.id
                        ? 'bg-green-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {addedToCart === product.id ? '✓ Added!' : 'Add to Cart'}
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

      {/* ChatBot */}
      <ChatBot isOpen={showChatBot} onClose={() => setShowChatBot(false)} />

      {/* Floating Chat Button */}
      {!showChatBot && (
        <button
          onClick={() => setShowChatBot(true)}
          className="fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-40"
          title="Open AI Assistant"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>
      )}

    </main>
  )
}

