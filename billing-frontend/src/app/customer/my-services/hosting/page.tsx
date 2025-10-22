'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { customerSubscriptionsAPI } from '@/lib/api';
import {
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ShoppingCartIcon,
  CloudIcon,
  CircleStackIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface HostingSubscription {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  category: string;
  status: 'active' | 'suspended' | 'expired' | 'pending' | 'expiring';
  max_accounts: number;
  max_domains: number;
  max_databases: number;
  max_emails: number;
  current_accounts: number;
  current_domains: number;
  current_databases: number;
  current_emails: number;
  nextpanel_url: string;
  nextpanel_username: string;
  purchased_at: string;
  expiry_date?: string;
  auto_renew: boolean;
  features: any;
  subscription_id?: string;
  subscription_status?: string;
  current_period_start?: string;
  current_period_end?: string;
}

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  expiring_soon: number;
  expired_subscriptions: number;
  categories: Record<string, number>;
}

export default function MyHostingPage() {
  const { user } = useAuth();
  const [hostingSubscriptions, setHostingSubscriptions] = useState<HostingSubscription[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddHosting, setShowAddHosting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const loadHostingSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's hosting subscriptions and stats
        const [subscriptionsResponse, statsResponse] = await Promise.all([
          customerSubscriptionsAPI.getHosting({
            status: selectedStatus === 'all' ? undefined : selectedStatus
          }),
          customerSubscriptionsAPI.getStats()
        ]);
        
        setHostingSubscriptions(subscriptionsResponse);
        setSubscriptionStats(statsResponse);
        
      } catch (err) {
        console.error('Failed to load hosting subscriptions:', err);
        setError('Failed to load your hosting subscriptions. Please try again later.');
        setHostingSubscriptions([]);
        setSubscriptionStats(null);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadHostingSubscriptions();
    } else {
      setLoading(false);
    }
  }, [user?.id, selectedStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'expiring':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'suspended':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <ClockIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    return days <= 30 && days > 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">My Hosting Services</h1>
            <p className="mt-1 text-sm text-gray-500">Loading your hosting services...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">My Hosting Services</h1>
            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Hosting Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your hosting accounts, websites, databases, and email services.
              </p>
              {subscriptionStats && (
                <div className="mt-3 flex space-x-6 text-sm text-gray-600">
                  <span>{subscriptionStats.total_subscriptions} total subscriptions</span>
                  <span className="text-green-600">{subscriptionStats.active_subscriptions} active</span>
                  {subscriptionStats.expiring_soon > 0 && (
                    <span className="text-yellow-600">{subscriptionStats.expiring_soon} expiring soon</span>
                  )}
                  {subscriptionStats.expired_subscriptions > 0 && (
                    <span className="text-red-600">{subscriptionStats.expired_subscriptions} expired</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <a
                href="/customer/services?category=hosting"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                Upgrade Plan
              </a>
              <button
                onClick={() => setShowAddHosting(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Hosting
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Subscriptions</option>
                  <option value="active">Active</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hosting Subscriptions List */}
      <div className="space-y-4">
        {hostingSubscriptions.map((subscription) => {
          const accountsUsage = getUsagePercentage(subscription.current_accounts, subscription.max_accounts);
          const domainsUsage = getUsagePercentage(subscription.current_domains, subscription.max_domains);
          const databasesUsage = getUsagePercentage(subscription.current_databases, subscription.max_databases);
          const emailsUsage = getUsagePercentage(subscription.current_emails, subscription.max_emails);
          
          // Calculate expiry information
          const daysUntilExpiry = subscription.expiry_date ? getDaysUntilExpiry(subscription.expiry_date) : 0;
          const expiringSoon = subscription.expiry_date ? isExpiringSoon(subscription.expiry_date) : false;
          
          return (
            <div
              key={subscription.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <ServerIcon className="h-6 w-6 text-indigo-500 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {subscription.name}
                        </h3>
                        <p className="text-sm text-gray-500">{subscription.description}</p>
                      </div>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {getStatusIcon(subscription.status)}
                        <span className="ml-1 capitalize">{subscription.status}</span>
                      </span>
                    </div>
                    
                    {/* Resource Usage */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Resource Usage</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Accounts */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CloudIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Accounts</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{subscription.current_accounts}</span>
                              <span>{subscription.max_accounts}</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUsageColor(accountsUsage)}`}
                                style={{ width: `${accountsUsage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{accountsUsage}% used</p>
                          </div>
                        </div>

                        {/* Domains */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <GlobeAltIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Domains</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{subscription.current_domains}</span>
                              <span>{subscription.max_domains}</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUsageColor(domainsUsage)}`}
                                style={{ width: `${domainsUsage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{domainsUsage}% used</p>
                          </div>
                        </div>

                        {/* Databases */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CircleStackIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Databases</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{subscription.current_databases}</span>
                              <span>{subscription.max_databases}</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUsageColor(databasesUsage)}`}
                                style={{ width: `${databasesUsage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{databasesUsage}% used</p>
                          </div>
                        </div>

                        {/* Emails */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <EnvelopeIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Emails</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{subscription.current_emails}</span>
                              <span>{subscription.max_emails}</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getUsageColor(emailsUsage)}`}
                                style={{ width: `${emailsUsage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{emailsUsage}% used</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">NextPanel URL</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a 
                            href={subscription.nextpanel_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {subscription.nextpanel_url}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Username</dt>
                        <dd className="mt-1 text-sm text-gray-900">{subscription.nextpanel_username}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Purchased</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(subscription.purchased_at).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          {subscription.expiry_date ? 'Expiry Date' : 'Next Renewal'}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {subscription.expiry_date ? 
                            new Date(subscription.expiry_date).toLocaleDateString() : 
                            'N/A'
                          }
                          {expiringSoon && (
                            <p className="text-xs text-yellow-600 mt-1">
                              Expires in {daysUntilExpiry} days
                            </p>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Auto Renewal</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Subscription Status</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {subscription.subscription_status || 'N/A'}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <a
                      href={subscription.nextpanel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Open Control Panel
                    </a>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    {(subscription.status === 'expired' || subscription.status === 'expiring') && (
                      <button className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        {subscription.status === 'expired' ? 'Renew' : 'Extend'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {hostingSubscriptions.length === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hosting subscriptions</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any hosting subscriptions yet. Browse our hosting plans to get started.
          </p>
          <div className="mt-6">
            <a
              href="/customer/services?category=hosting"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Browse Hosting Plans
            </a>
          </div>
        </div>
      )}

      {/* Add Hosting Modal Placeholder */}
      {showAddHosting && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Hosting Service</h3>
              <p className="text-sm text-gray-500 mb-4">
                This feature will be available soon. You can purchase hosting plans through our services page.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddHosting(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <a
                  href="/customer/services?category=hosting"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Browse Services
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
