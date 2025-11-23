'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { customerDomainsAPI, customerSubscriptionsAPI, ordersAPI, customerBillingAPI } from '@/lib/api';
import {
  ShoppingCartIcon,
  CreditCardIcon,
  GlobeAltIcon,
  CubeIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface CustomerStats {
  activeSubscriptions: number;
  totalDomains: number;
  nextBillingDate: string;
  pendingInvoices: number;
  supportTickets: number;
}

interface RecentActivity {
  id: string;
  type: 'subscription' | 'domain' | 'payment' | 'support';
  description: string;
  date: string;
  status: 'success' | 'pending' | 'error';
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CustomerStats>({
    activeSubscriptions: 0,
    totalDomains: 0,
    nextBillingDate: '',
    pendingInvoices: 0,
    supportTickets: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [addingFunds, setAddingFunds] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from APIs
        const [domainsResponse, subscriptionsResponse, ordersResponse, balanceResponse, paymentMethodsResponse] = await Promise.all([
          customerDomainsAPI.list().catch(() => ({ data: [] })),
          customerSubscriptionsAPI.getHosting().catch(() => []),
          ordersAPI.list().catch(() => ({ data: [] })),
          customerBillingAPI.getAccountBalance().catch(() => ({ balance: 0 })),
          customerBillingAPI.getPaymentMethods().catch(() => [])
        ]);

        const domains = domainsResponse.data || [];
        const subscriptions = subscriptionsResponse || [];
        const orders = ordersResponse.data || [];

        // Calculate stats
        const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'active').length;
        const totalDomains = domains.length;
        
        // Find next billing date from active subscriptions
        const nextBillingDate = subscriptions
          .filter((sub: any) => sub.status === 'active' && sub.current_period_end)
          .map((sub: any) => sub.current_period_end)
          .sort()
          [0] || '';

        // Count pending invoices (orders with status pending)
        const pendingInvoices = orders.filter((order: any) => order.status === 'pending').length;

        setStats({
          activeSubscriptions,
          totalDomains,
          nextBillingDate,
          pendingInvoices,
          supportTickets: 0, // TODO: Implement support tickets API
        });

        // Generate recent activity from orders
        const recentActivity = orders
          .slice(0, 5)
          .map((order: any) => ({
            id: order.id,
            type: 'payment' as const,
            description: `Order ${order.order_number} - ${order.items?.[0]?.product_name || 'Service'}`,
            date: order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            status: order.status === 'completed' ? 'success' as const : 'pending' as const,
          }));

        setRecentActivity(recentActivity);
        setAccountBalance(balanceResponse.balance || 0);
        const methods = paymentMethodsResponse || [];
        setPaymentMethods(methods);
        // Set default payment method
        if (methods.length > 0) {
          const defaultMethod = methods.find(m => m.is_default) || methods[0];
          setSelectedPaymentMethodId(defaultMethod.id);
        }

      } catch (error) {
        console.error('Error loading customer data:', error);
        // Set default values on error
        setStats({
          activeSubscriptions: 0,
          totalDomains: 0,
          nextBillingDate: '',
          pendingInvoices: 0,
          supportTickets: 0,
        });
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <CubeIcon className="h-5 w-5 text-blue-500" />;
      case 'domain':
        return <GlobeAltIcon className="h-5 w-5 text-green-500" />;
      case 'payment':
        return <CreditCardIcon className="h-5 w-5 text-purple-500" />;
      case 'support':
        return <BellIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name || user?.email}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your services today.
          </p>
        </div>
      </div>

      {/* Account Overview */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Account Balance */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Account Balance</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-2">
                    ${accountBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-indigo-500 mt-1">Available for payments</p>
                </div>
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-12 w-12 text-indigo-400" />
                </div>
              </div>
              <button
                onClick={() => setShowAddFundsModal(true)}
                className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Funds
              </button>
            </div>

            {/* Pending Invoices */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending Invoices</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">
                    {stats.pendingInvoices}
                  </p>
                  <p className="text-xs text-yellow-500 mt-1">Require attention</p>
                </div>
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-12 w-12 text-yellow-400" />
                </div>
              </div>
              <a
                href="/customer/invoices"
                className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md shadow-sm text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                View Invoices
              </a>
            </div>

            {/* Active Services */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Services</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {stats.activeSubscriptions + stats.totalDomains}
                  </p>
                  <p className="text-xs text-green-500 mt-1">Subscriptions & Domains</p>
                </div>
                <div className="flex-shrink-0">
                  <CubeIcon className="h-12 w-12 text-green-400" />
                </div>
              </div>
              <a
                href="/customer/my-services"
                className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md shadow-sm text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Manage Services
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active Subscriptions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CubeIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Subscriptions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeSubscriptions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Domains */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Domains
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalDomains}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/customer/services"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-indigo-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                  <ShoppingCartIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Browse Services
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Discover new services and add-ons
                </p>
              </div>
            </a>

            <a
              href="/customer/domains"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-indigo-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <GlobeAltIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Manage Domains
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage your domains
                </p>
              </div>
            </a>

            <a
              href="/customer/billing"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-indigo-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <CreditCardIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  View Billing
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Check invoices and payment methods
                </p>
              </div>
            </a>

            <a
              href="/customer/support"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-indigo-300"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                  <BellIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" />
                  Get Support
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Contact support or view tickets
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivity.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          {getTypeIcon(activity.type)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500 flex items-center space-x-2">
                          <span>{activity.date}</span>
                          {getStatusIcon(activity.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.pendingInvoices > 0 || stats.supportTickets > 0) && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Important Notices
            </h3>
            <div className="space-y-3">
              {stats.pendingInvoices > 0 && (
                <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      You have {stats.pendingInvoices} pending invoice{stats.pendingInvoices > 1 ? 's' : ''}. 
                      <a href="/customer/billing" className="font-medium underline text-yellow-800 hover:text-yellow-600">
                        View billing details
                      </a>
                    </p>
                  </div>
                </div>
              )}
              {stats.supportTickets > 0 && (
                <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <BellIcon className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      You have {stats.supportTickets} open support ticket{stats.supportTickets > 1 ? 's' : ''}. 
                      <a href="/customer/support" className="font-medium underline text-blue-800 hover:text-blue-600">
                        View support tickets
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Funds</h3>
                <button
                  onClick={() => {
                    setShowAddFundsModal(false);
                    setFundAmount('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Add
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Minimum amount: $1.00
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={selectedPaymentMethodId}
                  onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                >
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.brand} •••• {method.last4} {method.is_default ? '(Default)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value="">No payment methods available</option>
                  )}
                </select>
                {paymentMethods.length === 0 && (
                  <p className="mt-2 text-xs text-red-500">
                    Please add a payment method first.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddFundsModal(false);
                    setFundAmount('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  disabled={addingFunds}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const amount = parseFloat(fundAmount);
                    if (!amount || amount < 1) {
                      alert('Please enter a valid amount (minimum $1.00)');
                      return;
                    }
                    
                    if (paymentMethods.length === 0) {
                      alert('Please add a payment method first');
                      return;
                    }

                    if (!selectedPaymentMethodId) {
                      alert('Please select a payment method');
                      return;
                    }

                    setAddingFunds(true);
                    try {
                      await customerBillingAPI.addFunds(amount, selectedPaymentMethodId);
                      
                      // Refresh balance
                      const balanceResponse = await customerBillingAPI.getAccountBalance();
                      setAccountBalance(balanceResponse.balance || 0);
                      
                      setShowAddFundsModal(false);
                      setFundAmount('');
                      alert(`Successfully added $${amount.toFixed(2)} to your account!`);
                    } catch (error: any) {
                      console.error('Failed to add funds:', error);
                      console.error('Error response:', error.response?.data);
                      const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to add funds. Please try again.';
                      alert(`Failed to add funds: ${errorMessage}`);
                    } finally {
                      setAddingFunds(false);
                    }
                  }}
                  disabled={addingFunds || paymentMethods.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addingFunds ? 'Processing...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
