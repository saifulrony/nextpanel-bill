'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { customerSubscriptionsAPI } from '@/lib/api';
import {
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

interface HostingSubscription {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'suspended' | 'expired' | 'pending' | 'expiring';
  nextpanel_url: string;
  nextpanel_username: string;
  purchased_at: string;
  expiry_date?: string;
  price_monthly?: number;
  price_yearly?: number;
  max_accounts?: number;
  max_domains?: number;
  max_databases?: number;
  max_emails?: number;
  current_accounts?: number;
  current_domains?: number;
  current_databases?: number;
  current_emails?: number;
  auto_renew?: boolean;
  subscription_status?: string;
}


export default function MyHostingPage() {
  const { user } = useAuth();
  const [hostingSubscriptions, setHostingSubscriptions] = useState<HostingSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHostingSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's hosting subscriptions
        const subscriptionsResponse = await customerSubscriptionsAPI.getHosting();
        setHostingSubscriptions(subscriptionsResponse);
        
      } catch (err) {
        console.error('Failed to load hosting subscriptions:', err);
        setError('Failed to load your hosting subscriptions. Please try again later.');
        setHostingSubscriptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadHostingSubscriptions();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

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
                Manage your hosting accounts and access your control panels.
              </p>
            </div>
            <a
              href="/customer/services?category=hosting"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Browse Plans
            </a>
          </div>
        </div>
      </div>

      {/* Hosting Subscriptions List */}
      <div className="space-y-4">
        {hostingSubscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="px-4 py-5 sm:p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <ServerIcon className="h-8 w-8 text-indigo-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {subscription.name}
                    </h3>
                    <p className="text-sm text-gray-500">{subscription.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                    {subscription.status === 'active' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                    {subscription.status === 'expiring' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                    {subscription.status === 'expired' && <ClockIcon className="h-3 w-3 mr-1" />}
                    {subscription.status === 'pending' && <ClockIcon className="h-3 w-3 mr-1" />}
                    <span className="capitalize">{subscription.status}</span>
                  </span>
                  
                  <a
                    href={subscription.nextpanel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Open Control Panel
                  </a>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Control Panel</dt>
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
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900">{subscription.nextpanel_username}</dd>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purchased</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(subscription.purchased_at).toLocaleDateString()}
                  </dd>
                </div>
                
                {subscription.expiry_date && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(subscription.expiry_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Auto Renewal</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
                
                {subscription.subscription_status && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{subscription.subscription_status}</dd>
                  </div>
                )}
              </div>

              {/* Resource Limits (if available) */}
              {(subscription.max_accounts || subscription.max_domains || subscription.max_databases || subscription.max_emails) && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Resource Limits</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {subscription.max_accounts && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {subscription.current_accounts || 0}/{subscription.max_accounts}
                        </div>
                        <div className="text-xs text-gray-500">Accounts</div>
                      </div>
                    )}
                    {subscription.max_domains && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {subscription.current_domains || 0}/{subscription.max_domains}
                        </div>
                        <div className="text-xs text-gray-500">Domains</div>
                      </div>
                    )}
                    {subscription.max_databases && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {subscription.current_databases || 0}/{subscription.max_databases}
                        </div>
                        <div className="text-xs text-gray-500">Databases</div>
                      </div>
                    )}
                    {subscription.max_emails && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {subscription.current_emails || 0}/{subscription.max_emails}
                        </div>
                        <div className="text-xs text-gray-500">Email Accounts</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
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
    </div>
  );
}
