'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  GlobeAltIcon,
  ServerIcon,
  KeyIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { customerDomainsAPI, customerSubscriptionsAPI, plansAPI } from '@/lib/api';

interface ServiceOption {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  count: number;
}

export default function MyServicesPage() {
  const { user } = useAuth();
  const [serviceCounts, setServiceCounts] = useState({
    domains: 0,
    hosting: 0,
    servers: 0,
    licenses: 0,
    others: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServiceCounts = async () => {
      try {
        setLoading(true);
        
        // Load counts for each service type
        const [domainsResponse, subscriptionsResponse] = await Promise.all([
          customerDomainsAPI.list().catch(() => []),
          customerSubscriptionsAPI.getHosting().catch(() => []),
        ]);

        // customerDomainsAPI.list() already returns response.data, so it's an array directly
        let domainsArray: any[] = [];
        if (Array.isArray(domainsResponse)) {
          domainsArray = domainsResponse;
        } else if (domainsResponse && Array.isArray(domainsResponse.data)) {
          domainsArray = domainsResponse.data;
        }

        // Handle different response structures for subscriptions
        let subscriptionsArray: any[] = [];
        if (Array.isArray(subscriptionsResponse)) {
          subscriptionsArray = subscriptionsResponse;
        } else if (subscriptionsResponse && Array.isArray(subscriptionsResponse.data)) {
          subscriptionsArray = subscriptionsResponse.data;
        } else if (subscriptionsResponse && Array.isArray(subscriptionsResponse.subscriptions)) {
          subscriptionsArray = subscriptionsResponse.subscriptions;
        }

        // Count all domains (or active if status filtering is needed)
        // For now, count all domains since most domains should be active
        const totalDomains = domainsArray.length;
        
        // Count active hosting subscriptions
        const activeHosting = subscriptionsArray.filter((sub: any) => sub.status === 'active').length;
        
        setServiceCounts({
          domains: totalDomains,
          hosting: activeHosting,
          servers: 0, // TODO: Add servers API
          licenses: 0, // TODO: Add licenses API
          others: 0, // TODO: Add others API
        });
        
        console.log('Service counts loaded:', {
          domains: totalDomains,
          hosting: activeHosting,
          domainsArray: domainsArray.length,
          subscriptionsArray: subscriptionsArray.length,
        });
      } catch (error) {
        console.error('Error loading service counts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadServiceCounts();
    }
  }, [user]);

  const serviceOptions: ServiceOption[] = [
    {
      name: 'Domains',
      href: '/customer/my-services/domains',
      icon: GlobeAltIcon,
      description: 'Manage your domain registrations and DNS settings',
      count: serviceCounts.domains,
    },
    {
      name: 'Hosting',
      href: '/customer/my-services/hosting',
      icon: ServerIcon,
      description: 'View and manage your web hosting services',
      count: serviceCounts.hosting,
    },
    {
      name: 'Servers',
      href: '/customer/my-services/servers',
      icon: ServerIcon,
      description: 'Manage your dedicated and VPS servers',
      count: serviceCounts.servers,
    },
    {
      name: 'Licenses',
      href: '/customer/my-services/licenses',
      icon: KeyIcon,
      description: 'View and manage your software licenses',
      count: serviceCounts.licenses,
    },
    {
      name: 'Others',
      href: '/customer/my-services/others',
      icon: CubeIcon,
      description: 'Other services and add-ons',
      count: serviceCounts.others,
    },
  ];

  // Calculate total active services
  const totalActiveServices = serviceCounts.domains + serviceCounts.hosting + 
                              serviceCounts.servers + serviceCounts.licenses + serviceCounts.others;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all your services from one place
              </p>
            </div>
            {!loading && (
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">{totalActiveServices}</div>
                <div className="text-sm text-gray-500">
                  {totalActiveServices === 1 ? 'Active Service' : 'Active Services'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Options Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {serviceOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Link
              key={option.name}
              href={option.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {option.name}
                        </h3>
                        {option.count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {option.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    {option.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                View {option.name}
                <svg
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State (if no services) */}
      {!loading && serviceCounts.domains === 0 && serviceCounts.hosting === 0 && 
       serviceCounts.servers === 0 && serviceCounts.licenses === 0 && serviceCounts.others === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No services yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by browsing our available services.
          </p>
          <div className="mt-6">
            <Link
              href="/customer/services"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Services
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

