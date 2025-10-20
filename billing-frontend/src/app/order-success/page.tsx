'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultPages } from '@/contexts/DefaultPageContext';
import { CheckCircleIcon, ArrowLeftIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { DynamicPageRenderer } from '@/components/page-builder/DynamicPageRenderer';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, getTotal, clearCart, getItemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { defaultPageConfig, isLoading: isLoadingConfig } = useDefaultPages();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  // Load order data from localStorage or URL parameter
  useEffect(() => {
    const loadOrderData = async () => {
      const orderId = searchParams.get('order');
      
      // First try to get from localStorage (for immediate redirects)
      const storedOrderData = localStorage.getItem('lastOrderData');
      if (storedOrderData) {
        try {
          const parsedOrderData = JSON.parse(storedOrderData);
          setOrderData(parsedOrderData);
          // Clear the stored data after loading
          localStorage.removeItem('lastOrderData');
          return;
        } catch (error) {
          console.error('Failed to parse stored order data:', error);
        }
      }
      
      // If we have an order ID in URL, try to fetch from API
      if (orderId) {
        setIsLoadingOrder(true);
        try {
          // Import ordersAPI dynamically to avoid SSR issues
          const { ordersAPI } = await import('@/lib/api');
          const result = await ordersAPI.get(orderId);
          if (result.data) {
            setOrderData(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch order data:', error);
        } finally {
          setIsLoadingOrder(false);
        }
      }
    };

    loadOrderData();
  }, [searchParams]);

  // Check if a custom order success page is configured
  const customOrderSuccessPage = defaultPageConfig?.order_success;

  // Show loading while checking for custom page configuration or loading order data
  if (isLoadingConfig || isLoadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoadingOrder ? 'Loading order details...' : 'Loading order success page...'}
          </p>
        </div>
      </div>
    );
  }

  // If custom order success page is configured, render it
  if (customOrderSuccessPage) {
    console.log('Rendering custom order success page:', customOrderSuccessPage);
    return <DynamicPageRenderer slug={customOrderSuccessPage} fallbackComponent={<DefaultOrderSuccessPage />} />;
  }

  // Default order success page component
  function DefaultOrderSuccessPage() {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(price);
    };

    // Use actual order data or fallback to cart data
    const orderNumber = orderData?.order_number || orderData?.id || `ORD-${Date.now().toString().slice(-8)}`;
    const totalAmount = orderData?.total || orderData?.amount || getTotal();
    const orderDate = orderData?.created_at ? new Date(orderData.created_at).toLocaleDateString() : new Date().toLocaleDateString();
    const orderItems = orderData?.items || orderData?.order_items || items;
    
    // Customer details
    const customerInfo = orderData?.customer || orderData?.user || user;
    const billingInfo = orderData?.billing_address || orderData?.billing;
    const paymentInfo = orderData?.payment || orderData?.payment_method;
    
    // Order status
    const orderStatus = orderData?.status || 'confirmed';
    const statusColor = {
      'confirmed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }[orderStatus] || 'bg-gray-100 text-gray-800';

    // Show fallback message if no order data and no cart items
    if (!orderData && items.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100 mb-6">
              <CheckCircleIcon className="h-12 w-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Successful!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Home
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Cart Button */}
                <button
                  onClick={() => router.push('/cart')}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingBagIcon className="h-6 w-6" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getItemCount()}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-medium">{user?.email || 'User'}</p>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Successful!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your purchase. Your order has been confirmed and will be processed shortly.
            </p>

            {/* Order Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order Number</h3>
                  <p className="text-gray-600 font-mono">{orderNumber}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Total Amount</h3>
                  <p className="text-gray-600 text-lg font-semibold">{formatPrice(totalAmount)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order Date</h3>
                  <p className="text-gray-600">{orderDate}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Status</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                    {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            {customerInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Name</h3>
                    <p className="text-gray-600">
                      {customerInfo.full_name || 
                       `${customerInfo.first_name || ''} ${customerInfo.last_name || ''}`.trim() || 
                       customerInfo.name || 
                       'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Email</h3>
                    <p className="text-gray-600">{customerInfo.email || 'N/A'}</p>
                  </div>
                  {customerInfo.phone && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Phone</h3>
                      <p className="text-gray-600">{customerInfo.phone}</p>
                    </div>
                  )}
                  {billingInfo && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Billing Address</h3>
                      <p className="text-gray-600">
                        {billingInfo.address && `${billingInfo.address}, `}
                        {billingInfo.city && `${billingInfo.city}, `}
                        {billingInfo.state && `${billingInfo.state} `}
                        {billingInfo.zip_code && billingInfo.zip_code}
                        {billingInfo.country && `, ${billingInfo.country}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Details */}
            {paymentInfo && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                    <p className="text-gray-600">
                      {paymentInfo.method === 'stripe' ? 'Credit Card (Stripe)' : 
                       paymentInfo.method === 'manual' ? 'Manual Payment' :
                       paymentInfo.method || 'N/A'}
                    </p>
                  </div>
                  {paymentInfo.transaction_id && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Transaction ID</h3>
                      <p className="text-gray-600 font-mono text-sm">{paymentInfo.transaction_id}</p>
                    </div>
                  )}
                  {paymentInfo.card_last_four && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Card Ending In</h3>
                      <p className="text-gray-600">**** **** **** {paymentInfo.card_last_four}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Payment Status</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      paymentInfo.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                      paymentInfo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {paymentInfo.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              
              <div className="space-y-6">
                {orderItems.map((item: any, index: number) => (
                  <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-lg">{item.name || item.product_name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'} • 
                          {item.category && ` ${item.category}`}
                          {item.type && ` • ${item.type}`}
                        </p>
                        
                        {/* Product details */}
                        {(item.description || item.features) && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              {item.description || item.features}
                            </p>
                          </div>
                        )}
                        
                        {/* Resource limits if available */}
                        {(item.max_accounts || item.max_domains || item.max_databases || item.max_emails) && (
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                            {item.max_accounts > 0 && <div>Accounts: {item.max_accounts}</div>}
                            {item.max_domains > 0 && <div>Domains: {item.max_domains}</div>}
                            {item.max_databases > 0 && <div>Databases: {item.max_databases}</div>}
                            {item.max_emails > 0 && <div>Emails: {item.max_emails}</div>}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatPrice((item.price || item.unit_price) * (item.quantity || 1))}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price || item.unit_price)} × {item.quantity || 1}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {item.billing_cycle === 'yearly' ? 'per year' : 'per month'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">{formatPrice(totalAmount)}</span>
                  </div>
                  {orderData?.tax_amount && orderData.tax_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900">{formatPrice(orderData.tax_amount)}</span>
                    </div>
                  )}
                  {orderData?.shipping_amount && orderData.shipping_amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-900">{formatPrice(orderData.shipping_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-semibold pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-blue-800 space-y-2">
                <li>• You will receive an email confirmation shortly</li>
                <li>• Your order will be processed within 1-2 business days</li>
                <li>• You can track your order status in your account</li>
                <li>• Contact support if you have any questions</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Continue Shopping
              </button>
              {orderNumber && (
                <button
                  onClick={() => {
                    // Copy order number to clipboard
                    navigator.clipboard.writeText(orderNumber);
                    alert('Order number copied to clipboard!');
                  }}
                  className="px-6 py-3 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Copy Order Number
                </button>
              )}
              <button
                onClick={() => {
                  clearCart();
                  router.push('/');
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Cart & Go Home
              </button>
            </div>

            {/* Order Tracking Info */}
            {orderNumber && (
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Bookmark this page or save the order number <span className="font-mono font-semibold">{orderNumber}</span> to track your order later.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  URL: {typeof window !== 'undefined' ? window.location.href : ''}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return <DefaultOrderSuccessPage />;
}
