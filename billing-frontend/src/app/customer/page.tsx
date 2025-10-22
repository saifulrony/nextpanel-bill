'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { customerDomainsAPI, customerSubscriptionsAPI, ordersAPI } from '@/lib/api';
import {
  ShoppingCartIcon,
  CreditCardIcon,
  GlobeAltIcon,
  CubeIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
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

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from APIs
        const [domainsResponse, subscriptionsResponse, ordersResponse] = await Promise.all([
          customerDomainsAPI.list().catch(() => ({ data: [] })),
          customerSubscriptionsAPI.getHosting().catch(() => []),
          ordersAPI.list().catch(() => ({ data: [] }))
        ]);

        const domains = domainsResponse.data || [];
        const subscriptions = subscriptionsResponse || [];
        const orders = ordersResponse.data || [];

        // Calculate stats
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
        const totalDomains = domains.length;
        
        // Find next billing date from active subscriptions
        const nextBillingDate = subscriptions
          .filter(sub => sub.status === 'active' && sub.current_period_end)
          .map(sub => sub.current_period_end)
          .sort()
          [0] || '';

        // Count pending invoices (orders with status pending)
        const pendingInvoices = orders.filter(order => order.status === 'pending').length;

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
          .map(order => ({
            id: order.id,
            type: 'payment' as const,
            description: `Order ${order.invoice_number || order.order_number} - ${order.items?.[0]?.product_name || 'Service'}`,
            date: order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            status: order.status === 'completed' ? 'success' as const : 'pending' as const,
          }));

        setRecentActivity(recentActivity);

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
    </div>
  );
}
