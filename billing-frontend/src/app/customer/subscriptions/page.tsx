'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CalendarIcon,
  ArrowPathIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'suspended' | 'cancelled' | 'pending';
  nextBillingDate: string;
  autoRenew: boolean;
  category: string;
  features: string[];
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading subscriptions
    setTimeout(() => {
      setSubscriptions([
        {
          id: '1',
          name: 'Professional Hosting',
          description: 'High-performance hosting for business websites',
          price: 19.99,
          billingCycle: 'monthly',
          status: 'active',
          nextBillingDate: '2024-02-15',
          autoRenew: true,
          category: 'hosting',
          features: ['50GB Storage', '500GB Bandwidth', '5 Domains', 'Priority Support'],
        },
        {
          id: '2',
          name: 'Domain Registration',
          description: 'mycompany.com domain registration',
          price: 12.99,
          billingCycle: 'yearly',
          status: 'active',
          nextBillingDate: '2025-01-15',
          autoRenew: true,
          category: 'domains',
          features: ['1 Year Registration', 'DNS Management', 'Domain Privacy'],
        },
        {
          id: '3',
          name: 'SSL Certificate',
          description: 'Wildcard SSL certificate for all subdomains',
          price: 29.99,
          billingCycle: 'yearly',
          status: 'suspended',
          nextBillingDate: '2024-03-15',
          autoRenew: false,
          category: 'security',
          features: ['256-bit Encryption', 'Wildcard Support', 'Auto-renewal'],
        },
        {
          id: '4',
          name: 'Email Hosting',
          description: 'Professional email hosting for 10 users',
          price: 4.99,
          billingCycle: 'monthly',
          status: 'cancelled',
          nextBillingDate: '2024-01-31',
          autoRenew: false,
          category: 'email',
          features: ['5GB Mailbox', 'Webmail Access', 'Mobile Sync'],
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'suspended':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
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
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelSubscription = async (id: string) => {
    setCancellingId(id);
    // Simulate API call
    setTimeout(() => {
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === id 
            ? { ...sub, status: 'cancelled' as const, autoRenew: false }
            : sub
        )
      );
      setCancellingId(null);
    }, 1000);
  };

  const handleReactivateSubscription = async (id: string) => {
    setCancellingId(id);
    // Simulate API call
    setTimeout(() => {
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === id 
            ? { ...sub, status: 'active' as const, autoRenew: true }
            : sub
        )
      );
      setCancellingId(null);
    }, 1000);
  };

  const handleToggleAutoRenew = async (id: string) => {
    setCancellingId(id);
    // Simulate API call
    setTimeout(() => {
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === id 
            ? { ...sub, autoRenew: !sub.autoRenew }
            : sub
        )
      );
      setCancellingId(null);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your active subscriptions and billing settings.
          </p>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {subscription.name}
                    </h3>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {getStatusIcon(subscription.status)}
                      <span className="ml-1 capitalize">{subscription.status}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {subscription.description}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Price</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        ${subscription.price.toFixed(2)} / {subscription.billingCycle}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Next Billing</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Auto Renew</dt>
                      <dd className="mt-1">
                        <label className={`relative inline-flex items-center ${subscription.status === 'active' ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            checked={subscription.autoRenew}
                            onChange={() => handleToggleAutoRenew(subscription.id)}
                            disabled={cancellingId === subscription.id || subscription.status !== 'active'}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${subscription.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''} ${cancellingId === subscription.id ? 'opacity-50' : ''}`}></div>
                          <span className="ml-3 text-sm text-gray-700 flex items-center">
                            {cancellingId === subscription.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 mr-2"></div>
                                Updating...
                              </>
                            ) : (
                              `${subscription.autoRenew ? 'Enabled' : 'Disabled'}`
                            )}
                          </span>
                        </label>
                      </dd>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {subscription.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  {subscription.status === 'active' && (
                    <button
                      onClick={() => handleCancelSubscription(subscription.id)}
                      disabled={cancellingId === subscription.id}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      {cancellingId === subscription.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                  
                  {subscription.status === 'cancelled' && (
                    <button
                      onClick={() => handleReactivateSubscription(subscription.id)}
                      disabled={cancellingId === subscription.id}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      {cancellingId === subscription.id ? 'Reactivating...' : 'Reactivate'}
                    </button>
                  )}

                  {subscription.status === 'suspended' && (
                    <div className="text-center">
                      <p className="text-sm text-yellow-600 mb-2">
                        This subscription is suspended. Please contact support.
                      </p>
                      <a
                        href="/customer/support"
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Contact Support
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="text-center py-12">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any active subscriptions yet.
          </p>
          <div className="mt-6">
            <a
              href="/customer/services"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Services
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
