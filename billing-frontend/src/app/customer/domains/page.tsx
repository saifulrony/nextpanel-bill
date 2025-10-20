'use client';

import { useState, useEffect } from 'react';
import {
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface Domain {
  id: string;
  name: string;
  status: 'active' | 'expired' | 'expiring' | 'pending';
  expiryDate: string;
  autoRenew: boolean;
  nameservers: string[];
  dnsRecords: number;
  sslStatus: 'active' | 'inactive' | 'pending';
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDomain, setShowAddDomain] = useState(false);

  useEffect(() => {
    // Simulate loading domains
    setTimeout(() => {
      setDomains([
        {
          id: '1',
          name: 'mycompany.com',
          status: 'active',
          expiryDate: '2024-12-15',
          autoRenew: true,
          nameservers: ['ns1.example.com', 'ns2.example.com'],
          dnsRecords: 8,
          sslStatus: 'active',
        },
        {
          id: '2',
          name: 'blog.mycompany.com',
          status: 'active',
          expiryDate: '2024-12-15',
          autoRenew: true,
          nameservers: ['ns1.example.com', 'ns2.example.com'],
          dnsRecords: 5,
          sslStatus: 'active',
        },
        {
          id: '3',
          name: 'oldproject.net',
          status: 'expiring',
          expiryDate: '2024-02-01',
          autoRenew: false,
          nameservers: ['ns1.example.com', 'ns2.example.com'],
          dnsRecords: 3,
          sslStatus: 'inactive',
        },
        {
          id: '4',
          name: 'testdomain.org',
          status: 'expired',
          expiryDate: '2023-11-15',
          autoRenew: false,
          nameservers: ['ns1.example.com', 'ns2.example.com'],
          dnsRecords: 0,
          sslStatus: 'inactive',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Domains</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your domain names, DNS settings, and SSL certificates.
              </p>
            </div>
            <button
              onClick={() => setShowAddDomain(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Domain
            </button>
          </div>
        </div>
      </div>

      {/* Domains List */}
      <div className="space-y-4">
        {domains.map((domain) => {
          const daysUntilExpiry = getDaysUntilExpiry(domain.expiryDate);
          return (
            <div
              key={domain.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-6 w-6 text-indigo-500 mr-3" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {domain.name}
                      </h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(domain.status)}`}>
                        {getStatusIcon(domain.status)}
                        <span className="ml-1 capitalize">{domain.status}</span>
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(domain.expiryDate).toLocaleDateString()}
                        </dd>
                        {domain.status === 'expiring' && (
                          <p className="text-xs text-yellow-600">
                            Expires in {daysUntilExpiry} days
                          </p>
                        )}
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Auto Renew</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {domain.autoRenew ? 'Enabled' : 'Disabled'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">SSL Status</dt>
                        <dd className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSSLStatusColor(domain.sslStatus)}`}>
                            {domain.sslStatus}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">DNS Records</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {domain.dnsRecords} records
                        </dd>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Nameservers:</h4>
                      <div className="flex flex-wrap gap-2">
                        {domain.nameservers.map((nameserver, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {nameserver}
                          </span>
                        ))}
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
                    {domain.status === 'expired' && (
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
      {domains.length === 0 && (
        <div className="text-center py-12">
          <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No domains</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any domains registered yet.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddDomain(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Register Domain
            </button>
          </div>
        </div>
      )}

      {/* Add Domain Modal Placeholder */}
      {showAddDomain && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Domain</h3>
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
                  href="/customer/services"
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
