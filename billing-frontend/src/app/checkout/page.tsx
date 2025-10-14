'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircleIcon, LockClosedIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart, getItemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [checkoutType, setCheckoutType] = useState<'guest' | 'register' | 'login'>('guest');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    email: user?.email || '',
    full_name: user?.full_name || '',
    company_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
  });

  // Registration Info (if creating account)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Payment Info
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardInfo, setCardInfo] = useState({
    card_number: '',
    expiry: '',
    cvv: '',
    cardholder_name: '',
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (checkoutType === 'register' && password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setIsProcessing(true);

    try {
      let customerId = user?.id;

      // Step 1: Create account if registering
      if (checkoutType === 'register' && !user) {
        const registerResponse = await api.post('/auth/register', {
          email: customerInfo.email,
          password: password,
          full_name: customerInfo.full_name,
          company_name: customerInfo.company_name,
        });
        
        customerId = registerResponse.data.user.id;
        
        // Auto login after registration
        const loginResponse = await api.post('/auth/login', {
          email: customerInfo.email,
          password: password,
        });
        
        localStorage.setItem('access_token', loginResponse.data.access_token);
      }

      // Step 2: Create customer record if guest (and not already logged in)
      if (checkoutType === 'guest' && !user) {
        const customerResponse = await api.post('/customers/guest', {
          email: customerInfo.email,
          full_name: customerInfo.full_name,
          company_name: customerInfo.company_name,
        });
        
        customerId = customerResponse.data.id;
      }

      // Step 3: Create order
      const orderData = {
        customer_id: customerId,
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: getTotal(),
        tax: getTotal() * 0.1,
        total: getTotal() * 1.1,
        payment_method: paymentMethod,
        billing_info: customerInfo,
      };

      const orderResponse = await api.post('/orders', orderData);
      setOrderId(orderResponse.data.id);
      setInvoiceNumber(orderResponse.data.invoice_number || '');

      // Step 4: Process payment (mock for now)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment processing

      // Clear cart and show success
      clearCart();
      setOrderComplete(true);

    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.detail || 'Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !orderComplete) {
    router.push('/cart');
    return null;
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Complete!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
          {invoiceNumber && (
            <p className="text-sm text-gray-500 mb-6">
              Invoice Number: <span className="font-mono font-semibold text-indigo-600">{invoiceNumber}</span>
            </p>
          )}
          <div className="space-y-3">
                {checkoutType === 'register' && (
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
                  >
                    Go to Dashboard
                  </button>
                )}
            <button
              onClick={() => router.push('/shop')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
                NextPanel
              </a>
              <span className="ml-4 text-sm text-gray-500">/ Checkout</span>
            </div>
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
                        href="/dashboard"
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

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Checkout Type Selection */}
              {!user && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Checkout Options</h2>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="radio"
                        name="checkout_type"
                        value="guest"
                        checked={checkoutType === 'guest'}
                        onChange={(e) => setCheckoutType(e.target.value as any)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">Checkout as Guest</p>
                        <p className="text-sm text-gray-600">Quick checkout without creating an account</p>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition border-indigo-500 bg-indigo-50">
                      <input
                        type="radio"
                        name="checkout_type"
                        value="register"
                        checked={checkoutType === 'register'}
                        onChange={(e) => setCheckoutType(e.target.value as any)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">Create Account & Checkout</p>
                        <p className="text-sm text-gray-600">Track orders and manage services easily</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={!!user}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerInfo.full_name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={customerInfo.company_name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={customerInfo.country}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Password fields for registration */}
                {checkoutType === 'register' && !user && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        minLength={6}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <LockClosedIcon className="h-5 w-5 mr-2 text-green-500" />
                  Payment Information
                </h2>
                
                <div className="mb-4">
                  <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer mb-2">
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mr-3"
                    />
                    <span className="font-medium">Credit/Debit Card</span>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name *</label>
                      <input
                        type="text"
                        required
                        value={cardInfo.cardholder_name}
                        onChange={(e) => setCardInfo({ ...cardInfo, cardholder_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="1234 5678 9012 3456"
                        value={cardInfo.card_number}
                        onChange={(e) => setCardInfo({ ...cardInfo, card_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={cardInfo.expiry}
                          onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV *</label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          value={cardInfo.cvv}
                          onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="divide-y divide-gray-200 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="py-3">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium">{formatPrice(getTotal() * 0.1)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatPrice(getTotal() * 1.1)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Pay ${formatPrice(getTotal() * 1.1)}`}
                </button>

                <p className="mt-4 text-xs text-gray-500 text-center">
                  <LockClosedIcon className="h-4 w-4 inline mr-1" />
                  Secure checkout powered by NextPanel
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-gray-600 mb-4 md:mb-0">
              © 2025 NextPanel. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <a href="/" className="text-gray-600 hover:text-indigo-600 transition">
                Home
              </a>
              <a href="/shop" className="text-gray-600 hover:text-indigo-600 transition">
                Shop
              </a>
              <a href="/pricing" className="text-gray-600 hover:text-indigo-600 transition">
                Pricing
              </a>
              <span className="flex items-center text-green-600">
                <LockClosedIcon className="h-4 w-4 mr-1" />
                Secure
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

