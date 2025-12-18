'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { plansAPI, ordersAPI } from '@/lib/api';
import {
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ShoppingCartIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface LicenseService {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  category: string;
  subcategory?: string;
  status: 'active' | 'expired' | 'expiring' | 'pending' | 'suspended';
  license_key: string;
  license_type: string;
  max_accounts: number;
  max_domains: number;
  max_databases: number;
  max_emails: number;
  current_accounts: number;
  current_domains: number;
  current_databases: number;
  current_emails: number;
  activation_date: string;
  expiry_date: string;
  auto_renew: boolean;
  nextpanel_user_id: string;
  features: any;
}

export default function MyLicensesPage() {
  const { user } = useAuth();
  const [licenseServices, setLicenseServices] = useState<LicenseService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddLicense, setShowAddLicense] = useState(false);

  useEffect(() => {
    const loadLicenseServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's purchased licenses from orders
        const ordersResponse = await ordersAPI.list({ status: 'completed' });
        const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
        
        // Filter orders for license products
        const licenseOrders = orders.filter((order: any) => {
          const items = order.items || [];
          return items.some((item: any) => 
            item.type === 'license' || 
            item.category === 'licenses' ||
            item.category === 'license'
          );
        });

        if (licenseOrders.length === 0) {
          setLicenseServices([]);
          setLoading(false);
          return;
        }

        // Transform orders into license services
        const services: LicenseService[] = [];
        for (const order of licenseOrders) {
          const items = order.items || [];
          for (const item of items) {
            if (item.type === 'license' || item.category === 'licenses' || item.category === 'license') {
              // Try to fetch product details for more info
              let productDetails = null;
              if (item.product_id) {
                try {
                  const productResponse = await plansAPI.get(item.product_id);
                  productDetails = productResponse.data;
                } catch (e) {
                  console.warn(`Could not fetch product details for ${item.product_id}:`, e);
                }
              }

              const product = productDetails || item;
              const purchaseDate = new Date(order.created_at || Date.now());
              const expiryDate = new Date(purchaseDate);
              expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Default 1 year expiry

              services.push({
                id: item.product_id || order.id + '-' + Math.random(),
                name: product.name || item.name || 'License Service',
                description: product.description || item.description || '',
                price_monthly: product.price_monthly || item.price || 0,
                price_yearly: product.price_yearly || (product.price_monthly || item.price) * 12,
                category: product.category || item.category || 'licenses',
                subcategory: product.subcategory || item.subcategory,
          status: 'active' as const,
                license_key: item.license_key || `LIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                license_type: product.features?.license_type || item.license_type || 'Professional',
                max_accounts: product.max_accounts || item.max_accounts || 1,
                max_domains: product.max_domains || item.max_domains || 1,
                max_databases: product.max_databases || item.max_databases || 1,
                max_emails: product.max_emails || item.max_emails || 1,
                current_accounts: item.current_accounts || 0,
                current_domains: item.current_domains || 0,
                current_databases: item.current_databases || 0,
                current_emails: item.current_emails || 0,
                activation_date: purchaseDate.toISOString().split('T')[0],
                expiry_date: expiryDate.toISOString().split('T')[0],
                auto_renew: order.billing_period && order.billing_period !== 'one-time',
          nextpanel_user_id: user?.email?.split('@')[0] || 'user',
                features: product.features || item.features || {},
              });
            }
          }
        }
        
        setLicenseServices(services);
        
      } catch (err) {
        console.error('Failed to load license services:', err);
        setError('Failed to load your license services. Please try again later.');
        setLicenseServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadLicenseServices();
    }
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'expiring':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <ClockIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'suspended':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
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
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">My License Services</h1>
            <p className="mt-1 text-sm text-gray-500">Loading your license services...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">My License Services</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">My License Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your NextPanel licenses, quotas, and access permissions.
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/customer/services?category=licenses"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                Buy More Licenses
              </a>
              <button
                onClick={() => setShowAddLicense(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add License
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* License Services List */}
      <div className="space-y-4">
        {licenseServices.map((service) => {
          const accountsUsage = getUsagePercentage(service.current_accounts, service.max_accounts);
          const domainsUsage = getUsagePercentage(service.current_domains, service.max_domains);
          const databasesUsage = getUsagePercentage(service.current_databases, service.max_databases);
          const emailsUsage = getUsagePercentage(service.current_emails, service.max_emails);
          const daysUntilExpiry = getDaysUntilExpiry(service.expiry_date);
          
          return (
            <div
              key={service.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <KeyIcon className="h-6 w-6 text-indigo-500 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                        <span className="ml-1 capitalize">{service.status}</span>
                      </span>
                    </div>
                    
                    {/* License Key */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">License Key</h4>
                      <div className="flex items-center space-x-2">
                        <code className="px-3 py-2 bg-gray-100 text-gray-800 rounded-md font-mono text-sm">
                          {service.license_key}
                        </code>
                        <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Resource Usage */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Resource Usage</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Accounts */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Accounts</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{service.current_accounts}</span>
                              <span>{service.max_accounts}</span>
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
                            <DocumentTextIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Domains</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{service.current_domains}</span>
                              <span>{service.max_domains}</span>
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
                            <ShieldCheckIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Databases</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{service.current_databases}</span>
                              <span>{service.max_databases}</span>
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
                            <DocumentTextIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Emails</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{service.current_emails}</span>
                              <span>{service.max_emails}</span>
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

                    {/* License Details */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">License Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {service.license_type}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Activation Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(service.activation_date).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(service.expiry_date).toLocaleDateString()}
                          {service.status === 'expiring' && (
                            <p className="text-xs text-yellow-600">
                              Expires in {daysUntilExpiry} days
                            </p>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Auto Renewal</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {service.auto_renew ? 'Enabled' : 'Disabled'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">NextPanel User ID</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-mono">
                          {service.nextpanel_user_id}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    {service.status === 'expired' && (
                      <button className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Renew
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
      {licenseServices.length === 0 && (
        <div className="text-center py-12">
          <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No license services</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any license services yet. Browse our license plans to get started.
          </p>
          <div className="mt-6">
            <a
              href="/customer/services?category=licenses"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Browse License Plans
            </a>
          </div>
        </div>
      )}

      {/* Add License Modal Placeholder */}
      {showAddLicense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add License Service</h3>
              <p className="text-sm text-gray-500 mb-4">
                This feature will be available soon. You can purchase license plans through our services page.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddLicense(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <a
                  href="/customer/services?category=licenses"
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
