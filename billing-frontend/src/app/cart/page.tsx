'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultPages } from '@/contexts/DefaultPageContext';
import { TrashIcon, ShoppingBagIcon, ArrowLeftIcon, ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Cart Items List */}
              <div className="divide-y divide-gray-200">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex items-start gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBagIcon className="h-10 w-10 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                            <span className="capitalize">{item.category}</span>
                            {item.billing_cycle && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{item.billing_cycle}</span>
                              </>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Add to wishlist"
                          >
                            <HeartIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove item"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="px-4 py-1.5 text-gray-900 font-medium border-x border-gray-300 min-w-[2.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: <span className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty Cart Button */}
              {items.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={clearCart}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 text-red-600 rounded hover:bg-red-50 transition-colors font-medium"
                  >
                    <TrashIcon className="h-5 w-5" />
                    Empty Cart
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 sticky top-24">
              {/* Summary Header */}
              <div className="px-4 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              </div>

              {/* Summary Content */}
              <div className="px-4 py-4">
                {/* Price Breakdown */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-gray-900">-{formatPrice(0)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(getTotal())}
                    </span>
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => {
                    if (isAuthenticated && user) {
                      router.push('/checkout');
                    } else {
                      router.push('/customer/login');
                    }
                  }}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm"
                >
                  {isAuthenticated ? 'Continue' : 'Login to Continue'}
                </button>
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


