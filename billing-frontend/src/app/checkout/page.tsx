'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultPages } from '@/contexts/DefaultPageContext';
import { TrashIcon, ShoppingBagIcon, ArrowLeftIcon, ShoppingCartIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { DynamicPageRenderer } from '@/components/page-builder/DynamicPageRenderer';
import { ordersAPI, couponsAPI } from '@/lib/api';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import { useStripe } from '@/contexts/StripeContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart, getItemCount } = useCart();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { defaultPageConfig, isLoading: isLoadingConfig } = useDefaultPages();
  const { stripePromise } = useStripe();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'manual'>('stripe');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [billingPeriods, setBillingPeriods] = useState(1); // Number of billing periods to order
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '12345',
    country: 'US',
    cardNumber: '4242424242424242',
    expiryDate: '12/29',
    cvv: '123',
    nameOnCard: 'John Doe'
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Helper functions for discount calculation
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    // If coupon is first_billing_period_only, discount applies only to first period
    if (appliedCoupon.coupon?.first_billing_period_only && billingPeriods > 1) {
      // Calculate discount for first period only
      const singlePeriodPrice = getTotal() / billingPeriods;
      if (appliedCoupon.coupon.coupon_type === 'percentage') {
        return singlePeriodPrice * (appliedCoupon.coupon.discount_value / 100);
      } else {
        // Fixed amount discount
        return Math.min(appliedCoupon.coupon.discount_value, singlePeriodPrice);
      }
    }
    
    // Regular discount calculation for all periods
    return appliedCoupon.discount_amount || 0;
  };

  const calculateTotal = () => {
    const subtotal = getTotal();
    const discount = calculateDiscount();
    const tax = 0; // No tax for now
    return Math.max(0, subtotal - discount + tax);
  };

  // Calculate breakdown for multi-period orders with first-period-only discount
  const calculatePeriodBreakdown = () => {
    if (!appliedCoupon?.coupon?.first_billing_period_only || billingPeriods <= 1) {
      return null;
    }

    const totalPrice = getTotal();
    const singlePeriodPrice = totalPrice / billingPeriods;
    let firstPeriodPrice = singlePeriodPrice;
    
    // Apply discount to first period only
    if (appliedCoupon.coupon.coupon_type === 'percentage') {
      const discountPercent = appliedCoupon.coupon.discount_value / 100;
      firstPeriodPrice = singlePeriodPrice * (1 - discountPercent);
      // Apply maximum discount limit if set
      if (appliedCoupon.coupon.maximum_discount) {
        const discountAmount = singlePeriodPrice * discountPercent;
        if (discountAmount > appliedCoupon.coupon.maximum_discount) {
          firstPeriodPrice = singlePeriodPrice - appliedCoupon.coupon.maximum_discount;
        }
      }
    } else {
      // Fixed amount discount
      firstPeriodPrice = Math.max(0, singlePeriodPrice - appliedCoupon.coupon.discount_value);
    }

    return {
      firstPeriod: firstPeriodPrice,
      remainingPeriods: singlePeriodPrice * (billingPeriods - 1),
      total: firstPeriodPrice + (singlePeriodPrice * (billingPeriods - 1))
    };
  };

  // Handle successful Stripe payment
  const handleStripePaymentSuccess = async (paymentIntent: any) => {
    try {
      // Create order with Stripe payment info
      const subtotal = getTotal();
      const discount = calculateDiscount();
      const tax = 0;
      const total = calculateTotal();
      
      // Build order items - if first_billing_period_only, split into multiple line items
      let orderItems: any[] = [];
      
      if (appliedCoupon?.coupon?.first_billing_period_only && billingPeriods > 1) {
        // Split into first period (discounted) and remaining periods (regular price)
        const breakdown = calculatePeriodBreakdown();
        if (breakdown) {
          items.forEach(item => {
            const itemTotalPrice = item.price * item.quantity;
            const singlePeriodPrice = itemTotalPrice / billingPeriods;
            
            // Calculate first period price with discount
            let firstPeriodPrice = singlePeriodPrice;
            if (appliedCoupon.coupon.coupon_type === 'percentage') {
              const discountPercent = appliedCoupon.coupon.discount_value / 100;
              firstPeriodPrice = singlePeriodPrice * (1 - discountPercent);
              if (appliedCoupon.coupon.maximum_discount) {
                const discountAmount = singlePeriodPrice * discountPercent;
                if (discountAmount > appliedCoupon.coupon.maximum_discount) {
                  firstPeriodPrice = singlePeriodPrice - appliedCoupon.coupon.maximum_discount;
                }
              }
            } else {
              firstPeriodPrice = Math.max(0, singlePeriodPrice - appliedCoupon.coupon.discount_value);
            }
            
            // First period with discount
            orderItems.push({
              product_id: item.id || 'custom',
              product_name: `${item.name} - Period 1 (with discount)`,
              quantity: item.quantity,
              price: firstPeriodPrice / item.quantity // Price per unit
            });
            
            // Remaining periods at regular price
            for (let i = 2; i <= billingPeriods; i++) {
              orderItems.push({
                product_id: item.id || 'custom',
                product_name: `${item.name} - Period ${i}`,
                quantity: item.quantity,
                price: singlePeriodPrice / item.quantity // Price per unit
              });
            }
          });
        }
      } else {
        // Regular order items
        orderItems = items.map(item => ({
          product_id: item.id || 'custom',
          product_name: item.name,
          quantity: item.quantity,
          price: item.price
        }));
      }
      
      const orderData = {
        customer_id: user!.id,
        items: orderItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        discount_amount: discount,
        discount_percent: appliedCoupon?.coupon?.coupon_type === 'percentage' ? appliedCoupon.coupon.discount_value : 0,
        coupon_code: appliedCoupon?.coupon?.code || null,
        billing_periods: billingPeriods, // Store number of periods
        payment_method: 'stripe',
        billing_info: {
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: formData.email,
          customer_phone: formData.phone || null,
          billing_address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zipCode,
            country: formData.country
          },
          payment_notes: `Stripe payment: ${paymentIntent.id}`,
          stripe_payment_intent_id: paymentIntent.id
        },
        billing_period: 'monthly'
      };

      console.log('Creating order with Stripe payment:', JSON.stringify(orderData, null, 2));
      
      // Create the order
      const result = await ordersAPI.create(orderData);
      console.log('Order created successfully:', result);
      
      // Store order data for success page
      if (result.data) {
        localStorage.setItem('lastOrderData', JSON.stringify(result.data));
      }
      
      // Clear the cart
      clearCart();
      
      // Redirect to success page with order ID
      const orderId = result.data?.id || result.data?.order_number;
      if (orderId) {
        router.push(`/order-success?order=${orderId}`);
      } else {
        router.push('/order-success');
      }
      
    } catch (error: any) {
      console.error('Failed to create order after Stripe payment:', error);
      alert('Payment successful but failed to create order. Please contact support.');
    }
  };

  // Handle Stripe payment error
  const handleStripePaymentError = (error: string) => {
    console.error('Stripe payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  // Check if a custom checkout page is configured
  const customCheckoutPage = defaultPageConfig?.checkout;

  // Show loading while checking for custom page configuration or authentication
  if (isLoadingConfig || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout page...</p>
        </div>
      </div>
    );
  }

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // If custom checkout page is configured, render it
  if (customCheckoutPage) {
    console.log('Rendering custom checkout page:', customCheckoutPage);
    return <DynamicPageRenderer slug={customCheckoutPage} fallbackComponent={<DefaultCheckoutPage />} />;
  }

  // Default checkout page component
  function DefaultCheckoutPage() {
    const [isProcessing, setIsProcessing] = useState(false);

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(price);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleApplyCoupon = async () => {
      if (!couponCode.trim()) {
        setCouponError('Please enter a coupon code');
        return;
      }

      setIsValidatingCoupon(true);
      setCouponError('');
      
      try {
        const subtotal = getTotal();
        const response = await couponsAPI.validate({
          code: couponCode.trim().toUpperCase(),
          order_amount: subtotal,
          user_id: user?.id,
          product_ids: items.map(item => item.id).filter(Boolean)
        });

        if (response.data.valid) {
          setAppliedCoupon(response.data);
          setCouponError('');
        } else {
          setAppliedCoupon(null);
          setCouponError(response.data.message || 'Invalid coupon code');
        }
      } catch (error: any) {
        console.error('Failed to validate coupon:', error);
        setAppliedCoupon(null);
        setCouponError(error.response?.data?.message || 'Failed to validate coupon. Please try again.');
      } finally {
        setIsValidatingCoupon(false);
      }
    };

    const handleRemoveCoupon = () => {
      setCouponCode('');
      setAppliedCoupon(null);
      setCouponError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessing(true);
      
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          alert('Please wait while we verify your authentication...');
          setIsProcessing(false);
          return;
        }
        
        // Check if user is authenticated and has required data
        if (!isAuthenticated || !user || !user.id) {
          alert('Please log in to complete your order');
          router.push('/customer/login');
          setIsProcessing(false);
          return;
        }
        
        // Validate cart has items
        if (!items || items.length === 0) {
          alert('Your cart is empty. Please add items before checkout.');
          setIsProcessing(false);
          return;
        }

        // Create order data
        const subtotal = getTotal();
        const discount = calculateDiscount();
        const tax = 0; // No tax for now
        const total = calculateTotal();
        
        // Build order items - if first_billing_period_only, split into multiple line items
        let orderItems: any[] = [];
        
        if (appliedCoupon?.coupon?.first_billing_period_only && billingPeriods > 1) {
          // Split into first period (discounted) and remaining periods (regular price)
          const breakdown = calculatePeriodBreakdown();
          if (breakdown) {
            items.forEach(item => {
              const itemTotalPrice = item.price * item.quantity;
              const singlePeriodPrice = itemTotalPrice / billingPeriods;
              
              // Calculate first period price with discount
              let firstPeriodPrice = singlePeriodPrice;
              if (appliedCoupon.coupon.coupon_type === 'percentage') {
                const discountPercent = appliedCoupon.coupon.discount_value / 100;
                firstPeriodPrice = singlePeriodPrice * (1 - discountPercent);
                if (appliedCoupon.coupon.maximum_discount) {
                  const discountAmount = singlePeriodPrice * discountPercent;
                  if (discountAmount > appliedCoupon.coupon.maximum_discount) {
                    firstPeriodPrice = singlePeriodPrice - appliedCoupon.coupon.maximum_discount;
                  }
                }
              } else {
                firstPeriodPrice = Math.max(0, singlePeriodPrice - appliedCoupon.coupon.discount_value);
              }
              
              // First period with discount
              orderItems.push({
                product_id: item.id || 'custom',
                product_name: `${item.name} - Period 1 (with discount)`,
                quantity: item.quantity,
                price: firstPeriodPrice / item.quantity // Price per unit
              });
              
              // Remaining periods at regular price
              for (let i = 2; i <= billingPeriods; i++) {
                orderItems.push({
                  product_id: item.id || 'custom',
                  product_name: `${item.name} - Period ${i}`,
                  quantity: item.quantity,
                  price: singlePeriodPrice / item.quantity // Price per unit
                });
              }
            });
          }
        } else {
          // Regular order items
          orderItems = items.map(item => ({
            product_id: item.id || 'custom',
            product_name: item.name,
            quantity: item.quantity,
            price: item.price
          }));
        }
        
        const orderData = {
          customer_id: user.id,
          items: orderItems,
          subtotal: subtotal,
          tax: tax,
          total: total,
          discount_amount: discount,
          discount_percent: appliedCoupon?.coupon?.coupon_type === 'percentage' ? appliedCoupon.coupon.discount_value : 0,
          coupon_code: appliedCoupon?.coupon?.code || null,
          billing_periods: billingPeriods, // Store number of periods
          payment_method: 'credit_card',
          billing_info: {
            customer_name: `${formData.firstName} ${formData.lastName}`,
            customer_email: formData.email,
            customer_phone: formData.phone || null,
            billing_address: {
              street: formData.address,
              city: formData.city,
              state: formData.state,
              zip_code: formData.zipCode,
              country: formData.country
            },
            payment_notes: `Order placed via checkout page. Card ending in ${formData.cardNumber.slice(-4)}`
          },
          billing_period: 'monthly' // Default to monthly
        };

        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        console.log('User ID:', user.id);
        console.log('User object:', user);
        
        // Create the order
        let result;
        try {
          result = await ordersAPI.create(orderData);
          console.log('Order created successfully:', result);
        } catch (error: any) {
          console.error('Order creation error:', error);
          console.error('Error response:', error.response?.data);
          const errorMessage = error.response?.data?.detail || error.message || 'Failed to create order. Please try again.';
          alert(errorMessage);
          setIsProcessing(false);
          return;
        }
        
        // Store order data for success page
        if (result.data) {
          localStorage.setItem('lastOrderData', JSON.stringify(result.data));
        }
        
        // Clear the cart
        clearCart();
        
        // Redirect to success page with order ID
        const orderId = result.data?.id || result.data?.order_number;
        if (orderId) {
          router.push(`/order-success?order=${orderId}`);
        } else {
          router.push('/order-success');
        }
        
      } catch (error: any) {
        console.error('Failed to create order:', error);
        
        // Parse error message
        let errorMessage = 'Failed to create order. Please try again.';
        if (error.response?.data?.detail) {
          if (typeof error.response.data.detail === 'string') {
            errorMessage = error.response.data.detail;
          } else if (Array.isArray(error.response.data.detail)) {
            errorMessage = error.response.data.detail.map((err: any) => err.msg || err.message || err).join(', ');
          } else if (error.response.data.detail.message) {
            errorMessage = error.response.data.detail.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(`Error: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/cart')}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Cart
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Cart Button */}
                <button
                  onClick={() => router.push('/cart')}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getItemCount()}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative" data-user-menu>
                  <button
                    type="button"
                    className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700">{user?.full_name || user?.email}</p>
                      <p className="text-xs text-gray-500">Customer</p>
                    </div>
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                      <a
                        href="/customer/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </a>
                      <a
                        href="/customer/my-services"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Services
                      </a>
                      <a
                        href="/customer/invoices"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Invoices
                      </a>
                      <a
                        href="/customer/billing"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Billing
                      </a>
                      <a
                        href="/customer/support"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Support
                      </a>
                      <a
                        href="/customer/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Settings
                      </a>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
            <p className="text-lg text-gray-600">Complete your order</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Checkout Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Billing Periods Selection */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Periods</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of billing periods to order
                    </label>
                    <select
                      value={billingPeriods}
                      onChange={(e) => setBillingPeriods(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'period' : 'periods'}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      {billingPeriods > 1 
                        ? `Ordering ${billingPeriods} billing periods at once. ${appliedCoupon?.coupon?.first_billing_period_only ? 'Discount applies only to the first period.' : 'Discount applies to all periods.'}`
                        : 'Ordering for 1 billing period.'
                      }
                    </p>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Payment Method
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="stripe-payment"
                        name="payment-method"
                        type="radio"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'manual')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label htmlFor="stripe-payment" className="ml-3 block text-sm font-medium text-gray-700">
                        Credit/Debit Card (Stripe)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="manual-payment"
                        name="payment-method"
                        type="radio"
                        value="manual"
                        checked={paymentMethod === 'manual'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'stripe' | 'manual')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <label htmlFor="manual-payment" className="ml-3 block text-sm font-medium text-gray-700">
                        Manual Payment (Bank Transfer, etc.)
                      </label>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'stripe' ? (
                  <div className="mt-6">
                    <Elements stripe={stripePromise}>
                      <StripePaymentForm
                        amount={calculateTotal()}
                        onSuccess={handleStripePaymentSuccess}
                        onError={handleStripePaymentError}
                        disabled={isProcessing || items.length === 0}
                      />
                    </Elements>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isProcessing || items.length === 0}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? 'Processing...' : `Complete Order - ${formatPrice(calculateTotal())}`}
                  </button>
                )}
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                {items.map((item) => {
                  const breakdown = calculatePeriodBreakdown();
                  const singlePeriodPrice = item.price / billingPeriods;
                  
                  return (
                    <div key={item.id} className="py-2 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × {billingPeriods} {billingPeriods === 1 ? 'period' : 'periods'}</p>
                    </div>
                    <span className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                      
                      {/* Show breakdown if first_billing_period_only coupon and multiple periods */}
                      {breakdown && billingPeriods > 1 && (() => {
                        const itemTotalPrice = item.price * item.quantity;
                        const singlePeriodPrice = itemTotalPrice / billingPeriods;
                        let firstPeriodPrice = singlePeriodPrice;
                        
                        // Calculate first period price with discount for this item
                        if (appliedCoupon?.coupon?.coupon_type === 'percentage') {
                          const discountPercent = appliedCoupon.coupon.discount_value / 100;
                          firstPeriodPrice = singlePeriodPrice * (1 - discountPercent);
                          if (appliedCoupon.coupon.maximum_discount) {
                            const discountAmount = singlePeriodPrice * discountPercent;
                            if (discountAmount > appliedCoupon.coupon.maximum_discount) {
                              firstPeriodPrice = singlePeriodPrice - appliedCoupon.coupon.maximum_discount;
                            }
                          }
                        } else {
                          firstPeriodPrice = Math.max(0, singlePeriodPrice - (appliedCoupon?.coupon?.discount_value || 0));
                        }
                        
                        return (
                          <div className="ml-4 mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Period 1 (with discount):</span>
                              <span className="text-green-600">{formatPrice(firstPeriodPrice)}</span>
                            </div>
                            {billingPeriods > 1 && (
                              <div className="flex justify-between">
                                <span>Periods 2-{billingPeriods}:</span>
                                <span>{formatPrice(singlePeriodPrice * (billingPeriods - 1))}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Coupon Code Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Have a coupon code?</h3>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {isValidatingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Coupon Applied: {appliedCoupon.coupon?.code}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {appliedCoupon.coupon?.name || 'Discount applied'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                {couponError && (
                  <p className="mt-2 text-sm text-red-600">{couponError}</p>
                )}
              </div>

              {/* Order Totals */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({billingPeriods} {billingPeriods === 1 ? 'period' : 'periods'}):</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
                {appliedCoupon && (
                  <>
                    {appliedCoupon.coupon?.first_billing_period_only && billingPeriods > 1 ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount on Period 1 ({appliedCoupon.coupon?.code}):</span>
                          <span>-{formatPrice(calculateDiscount())}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Discount applies only to the first billing period. Remaining {billingPeriods - 1} {billingPeriods - 1 === 1 ? 'period' : 'periods'} at regular price.
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({appliedCoupon.coupon?.code}):</span>
                        <span>-{formatPrice(calculateDiscount())}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax:</span>
                  <span>{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <DefaultCheckoutPage />;
}