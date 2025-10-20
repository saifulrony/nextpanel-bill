'use client';

import { useState, useEffect } from 'react';
import { ordersAPI } from '@/lib/api';
import { getDemoData } from '@/lib/demoData';
import CreateOrderModal from '@/components/orders/CreateOrderModal';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import OrderFilters from '@/components/orders/OrderFilters';

interface Customer {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
}

interface Order {
  id: string;
  customer_id: string;
  status: string;
  invoice_number?: string;
  order_number?: string;
  items: any[];
  subtotal: number;
  discount_amount: number;
  discount_percent?: number;
  tax: number;
  tax_rate?: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  payment_method?: string;
  billing_info?: any;
  billing_period?: string;
  due_date: string;
  order_date?: string;
  invoice_date?: string;
  paid_at: string | null;
  notes: string | null;
  terms?: string | null;
  payment_instructions?: string | null;
  is_recurring: boolean;
  recurring_interval?: string | null;
  sent_to_customer: boolean;
  reminder_count?: number;
  created_at: string;
  updated_at?: string;
  customer?: Customer;
}

interface OrderStats {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  overdue_amount: number;
  open_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  partially_paid_invoices: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    min_amount: '',
    max_amount: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      try {
        const params: any = {};
        
        if (filters.status) params.status = filters.status;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        if (filters.min_amount) params.min_amount = parseFloat(filters.min_amount);
        if (filters.max_amount) params.max_amount = parseFloat(filters.max_amount);

        const ordersResponse = await ordersAPI.list(params);
        
        // Check if API returned empty data (no orders in database)
        if (ordersResponse.data && ordersResponse.data.length === 0) {
          console.log('📋 API returned empty data, using demo orders...');
          throw new Error('No orders in database');
        }
        
        setOrders(ordersResponse.data);
        
        // Try to get stats
        try {
          const statsResponse = await ordersAPI.stats();
          setStats(statsResponse.data);
        } catch (error) {
          console.log('Stats not available yet');
          setStats(null);
        }
        setIsUsingDemoData(false);
        console.log('✅ Orders loaded from API');
      } catch (apiError) {
        console.log('📋 API not available, using demo data...');
        
        // Use demo data when API is not available
        const demoOrders = getDemoData('orders');
        const demoStats = {
          total_invoiced: 1025.57,
          total_paid: 156.77,
          total_outstanding: 868.80,
          overdue_amount: 32.39,
          open_invoices: 2,
          paid_invoices: 2,
          overdue_invoices: 1,
          partially_paid_invoices: 0
        };
        
        setOrders(demoOrders as Order[]);
        setStats(demoStats);
        setIsUsingDemoData(true);
        console.log('✅ Demo orders loaded');
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail || '';
        if (errorDetail.includes('Could not validate') || 
            errorDetail.includes('credentials')) {
          // The interceptor will handle the redirect
          console.log('Authentication error - redirecting to login');
          return;
        }
      }
      
      // For other errors, show a message
      alert(error.response?.data?.detail || 'Failed to load order data');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async (order: Order) => {
    try {
      const response = await ordersAPI.downloadPDF(order.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${order.invoice_number || order.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF');
    }
  };

  const handleStripePayment = async (order: Order) => {
    try {
      // Create payment intent for this order
      const response = await fetch('/api/v1/payments/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          amount: order.total,
          currency: 'USD',
          metadata: {
            order_id: order.id,
            invoice_number: order.invoice_number || order.order_number
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();
      
      // Open Stripe payment modal or redirect to payment page
      // For now, we'll show an alert with the payment intent ID
      alert(`Payment intent created: ${client_secret}. This would open Stripe Checkout in a real implementation.`);
      
      // In a real implementation, you would:
      // 1. Open a Stripe Checkout session
      // 2. Or redirect to a payment page with the client_secret
      // 3. Handle the payment completion webhook
      
    } catch (error: any) {
      console.error('Error creating Stripe payment:', error);
      alert(`Failed to create payment: ${error.message}`);
    }
  };

  const sendOrder = async (order: Order) => {
    try {
      await ordersAPI.send(order.id);
      alert('Order sent successfully!');
      loadData();
    } catch (error) {
      alert('Failed to send order');
    }
  };

  const markAsPaid = async (order: Order) => {
    try {
      await ordersAPI.pay(order.id);
      alert('Order marked as paid!');
      loadData();
    } catch (error) {
      alert('Failed to mark as paid');
    }
  };

  const voidOrder = async (order: Order) => {
    if (!confirm('Are you sure you want to void this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ordersAPI.void(order.id);
      alert('Order voided successfully');
      loadData();
    } catch (error) {
      alert('Failed to void order');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      // Backend statuses
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-600',
      failed: 'bg-red-100 text-red-800',
      
      // Legacy/alternative statuses
      draft: 'bg-gray-100 text-gray-800',
      open: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      void: 'bg-gray-100 text-gray-600',
      uncollectible: 'bg-red-100 text-red-900',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Demo Data Banner */}
      {isUsingDemoData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Demo Data Mode
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  Showing demo orders with various statuses including completed, pending, processing, and overdue orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage customer orders and payments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Order
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${stats.total_invoiced.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Paid</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${stats.total_paid.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Outstanding</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${stats.total_outstanding.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${stats.overdue_amount.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <OrderFilters filters={filters} setFilters={setFilters} />

      {/* Orders Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            All Orders
          </h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.status || filters.start_date || filters.end_date
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new order'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Order
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.invoice_number || order.order_number || order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.due_date || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {order.payment_method !== 'stripe' && order.status === 'pending' && (
                          <button
                            onClick={() => handleStripePayment(order)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Pay with Stripe"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => downloadPDF(order)}
                          className="text-green-600 hover:text-green-900"
                          title="Download PDF"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        {(order.status === 'pending' || order.status === 'processing' || order.status === 'open') && (
                          <button
                            onClick={() => markAsPaid(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as Paid"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {order.status !== 'void' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => sendOrder(order)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Send to Customer"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        {order.status !== 'void' && order.status !== 'cancelled' && order.status !== 'completed' && order.status !== 'paid' && (
                          <button
                            onClick={() => voidOrder(order)}
                            className="text-red-600 hover:text-red-900"
                            title="Void Order"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

