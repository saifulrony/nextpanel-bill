'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { plansAPI } from '@/lib/api';
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

interface HostingService {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  category: string;
  subcategory?: string;
  status: 'active' | 'suspended' | 'expired' | 'pending';
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
  next_renewal: string;
  features: any;
}

export default function MyHostingPage() {
  const { user } = useAuth();
  const [hostingServices, setHostingServices] = useState<HostingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddHosting, setShowAddHosting] = useState(false);

  useEffect(() => {
    const loadHostingServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's purchased hosting services
        const response = await plansAPI.list({ 
          is_active: true,
          category: 'hosting',
          user_id: user?.id 
        });
        
        // Transform products to hosting services with mock data for demonstration
        const services = (response.data || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price_monthly: product.price_monthly,
          price_yearly: product.price_yearly,
          category: product.category,
          subcategory: product.subcategory,
          status: 'active' as const,
          max_accounts: product.max_accounts || 1,
          max_domains: product.max_domains || 1,
          max_databases: product.max_databases || 1,
          max_emails: product.max_emails || 1,
          current_accounts: Math.floor(Math.random() * (product.max_accounts || 1)),
          current_domains: Math.floor(Math.random() * (product.max_domains || 1)),
          current_databases: Math.floor(Math.random() * (product.max_databases || 1)),
          current_emails: Math.floor(Math.random() * (product.max_emails || 1)),
          nextpanel_url: 'https://panel.example.com',
          nextpanel_username: user?.email?.split('@')[0] || 'user',
          purchased_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          next_renewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          features: product.features || {},
        }));
        
        setHostingServices(services);
        
      } catch (err) {
        console.error('Failed to load hosting services:', err);
        setError('Failed to load your hosting services. Please try again later.');
        setHostingServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadHostingServices();
    }
  }, [user?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
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

      {/* Hosting Services List */}
      <div className="space-y-4">
        {hostingServices.map((service) => {
          const accountsUsage = getUsagePercentage(service.current_accounts, service.max_accounts);
          const domainsUsage = getUsagePercentage(service.current_domains, service.max_domains);
          const databasesUsage = getUsagePercentage(service.current_databases, service.max_databases);
          const emailsUsage = getUsagePercentage(service.current_emails, service.max_emails);
          
          return (
            <div
              key={service.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <ServerIcon className="h-6 w-6 text-indigo-500 mr-3" />
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
                            <GlobeAltIcon className="h-5 w-5 text-indigo-500 mr-2" />
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
                            <CircleStackIcon className="h-5 w-5 text-indigo-500 mr-2" />
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
                            <EnvelopeIcon className="h-5 w-5 text-indigo-500 mr-2" />
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

                    {/* Service Details */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">NextPanel URL</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a 
                            href={service.nextpanel_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {service.nextpanel_url}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Username</dt>
                        <dd className="mt-1 text-sm text-gray-900">{service.nextpanel_username}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Purchased</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(service.purchased_at).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Next Renewal</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {service.next_renewal}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <a
                      href={service.nextpanel_url}
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
      {hostingServices.length === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hosting services</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any hosting services yet. Browse our hosting plans to get started.
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
