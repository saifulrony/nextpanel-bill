'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultPages } from '@/contexts/DefaultPageContext';
import { TrashIcon, ShoppingBagIcon, ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { DynamicPageRenderer } from '@/components/page-builder/DynamicPageRenderer';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart, getItemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [customCartPage, setCustomCartPage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for custom cart page configuration
    const checkCustomCartPage = () => {
      try {
        if (typeof window !== 'undefined') {
          const savedConfig = localStorage.getItem('default_page_config');
          console.log('Cart page - Raw localStorage data:', savedConfig);
          if (savedConfig) {
            const config = JSON.parse(savedConfig);
            console.log('Cart page - Parsed config:', config);
            if (config.cart) {
              console.log('Custom cart page found:', config.cart);
              setCustomCartPage(config.cart);
            } else {
              console.log('No cart page configured in config:', config);
            }
          } else {
            console.log('No saved config found in localStorage');
          }
        }
      } catch (error) {
        console.error('Error reading localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Use a small delay to ensure localStorage is available
    const timer = setTimeout(checkCustomCartPage, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking for custom page configuration
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart page...</p>
        </div>
      </div>
    );
  }

  // If custom cart page is configured, render it
  if (customCartPage) {
    console.log('Rendering custom cart page:', customCartPage);
    return <DynamicPageRenderer slug={customCartPage} fallbackComponent={<DefaultCartPage />} />;
  }

  // Default cart page component
  function DefaultCartPage() {
    const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <a href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
                NextPanel
              </a>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition"
                    >
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.full_name || user.email}</span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                        <a
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Dashboard
                        </a>
                        <a
                          href="/shop"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Shop
                        </a>
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</a>
                    <a href="/auth/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
                      Get Started
                    </a>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBagIcon className="mx-auto h-24 w-24 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Add some products to get started!</p>
            <button
              onClick={() => router.push('/shop')}
              className="mt-6 inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              Browse Products
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-sm text-gray-600 mb-4 md:mb-0">
                © 2025 NextPanel. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <a href="/" className="text-gray-600 hover:text-indigo-600 transition">Home</a>
                <a href="/shop" className="text-gray-600 hover:text-indigo-600 transition">Shop</a>
                <a href="/pricing" className="text-gray-600 hover:text-indigo-600 transition">Pricing</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <a href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
              NextPanel
            </a>
            <nav className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition"
                  >
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{user.full_name || user.email}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                      <a
                        href="/admin/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </a>
                      <a
                        href="/shop"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Shop
                      </a>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</a>
                  <a href="/auth/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
                    Get Started
                  </a>
                </>
              )}
            </nav>
          </div>
        </div>
        </header>

      {/* Cart Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/shop')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Continue Shopping
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="py-6 flex items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.billing_cycle}
                        </span>
                      </div>
                    </div>

                    <div className="ml-6 flex items-center space-x-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 text-gray-900 font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.price)} each
                          </p>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(getTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (estimated)</span>
                  <span className="font-medium">{formatPrice(getTotal() * 0.1)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(getTotal() * 1.1)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  // Check if customer is logged in
                  if (isAuthenticated && user) {
                    // Customer is logged in, go to checkout
                    router.push('/checkout');
                  } else {
                    // Customer is not logged in, redirect to login
                    router.push('/customer/login');
                  }
                }}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition mb-4"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => router.push('/shop')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                Continue Shopping
              </button>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">New customer?</span> Please login or create an account to proceed with checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-gray-600 mb-4 md:mb-0">
              © 2025 NextPanel. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="/" className="text-gray-600 hover:text-indigo-600 transition">Home</a>
              <a href="/shop" className="text-gray-600 hover:text-indigo-600 transition">Shop</a>
              <a href="/pricing" className="text-gray-600 hover:text-indigo-600 transition">Pricing</a>
              <a href="/cart" className="text-gray-600 hover:text-indigo-600 transition">Cart ({items.length})</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
  }

  // Return the default cart page
  return <DefaultCartPage />;
}

