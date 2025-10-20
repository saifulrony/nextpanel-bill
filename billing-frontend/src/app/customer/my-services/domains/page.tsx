'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { plansAPI } from '@/lib/api';
import {
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

interface DomainService {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  category: string;
  subcategory?: string;
  status: 'active' | 'expired' | 'expiring' | 'pending';
  expiryDate: string;
  autoRenew: boolean;
  nameservers: string[];
  dnsRecords: number;
  sslStatus: 'active' | 'inactive' | 'pending';
  purchased_at: string;
  next_renewal: string;
}

export default function MyDomainsPage() {
  const { user } = useAuth();
  const [domainServices, setDomainServices] = useState<DomainService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDomain, setShowAddDomain] = useState(false);

  useEffect(() => {
    const loadDomainServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's purchased domain services
        const response = await plansAPI.list({ 
          is_active: true,
          category: 'domains',
          user_id: user?.id 
        });
        
        // Transform products to domain services with mock data for demonstration
        const services = (response.data || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price_monthly: product.price_monthly,
          price_yearly: product.price_yearly,
          category: product.category,
          subcategory: product.subcategory,
          status: 'active' as const,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
          autoRenew: true,
          nameservers: ['ns1.example.com', 'ns2.example.com'],
          dnsRecords: Math.floor(Math.random() * 10) + 1,
          sslStatus: 'active' as const,
          purchased_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          next_renewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }));
        
        setDomainServices(services);
        
      } catch (err) {
        console.error('Failed to load domain services:', err);
        setError('Failed to load your domain services. Please try again later.');
        setDomainServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadDomainServices();
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSSLStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-2xl font-bold text-gray-900">My Domain Services</h1>
            <p className="mt-1 text-sm text-gray-500">Loading your domain services...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">My Domain Services</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">My Domain Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your domain registrations, DNS settings, and SSL certificates.
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/customer/services?category=domains"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                Buy More Domains
              </a>
              <button
                onClick={() => setShowAddDomain(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Register Domain
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Services List */}
      <div className="space-y-4">
        {domainServices.map((service) => {
          const daysUntilExpiry = getDaysUntilExpiry(service.expiryDate);
          return (
            <div
              key={service.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-6 w-6 text-indigo-500 mr-3" />
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
                    
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(service.expiryDate).toLocaleDateString()}
                        </dd>
                        {service.status === 'expiring' && (
                          <p className="text-xs text-yellow-600">
                            Expires in {daysUntilExpiry} days
                          </p>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Auto Renew</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {service.autoRenew ? 'Enabled' : 'Disabled'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">SSL Status</dt>
                        <dd className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSSLStatusColor(service.sslStatus)}`}>
                            {service.sslStatus}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">DNS Records</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {service.dnsRecords} records
                        </dd>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Nameservers:</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.nameservers.map((nameserver, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {nameserver}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View DNS
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
      {domainServices.length === 0 && (
        <div className="text-center py-12">
          <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No domain services</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any domain services yet. Browse our domain products to get started.
          </p>
          <div className="mt-6">
            <a
              href="/customer/services?category=domains"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Browse Domain Products
            </a>
          </div>
        </div>
      )}

      {/* Add Domain Modal Placeholder */}
      {showAddDomain && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Register New Domain</h3>
              <p className="text-sm text-gray-500 mb-4">
                This feature will be available soon. You can register domains through our services page.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddDomain(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <a
                  href="/customer/services?category=domains"
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
