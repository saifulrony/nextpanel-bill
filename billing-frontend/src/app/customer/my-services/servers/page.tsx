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
  CpuChipIcon,
  CircleStackIcon,
  WifiIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface ServerService {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  category: string;
  subcategory?: string;
  status: 'active' | 'suspended' | 'expired' | 'pending' | 'maintenance';
  server_type: string;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  bandwidth_gb: number;
  ip_address: string;
  location: string;
  os: string;
  nextpanel_url: string;
  nextpanel_username: string;
  purchased_at: string;
  next_renewal: string;
  features: any;
}

export default function MyServersPage() {
  const { user } = useAuth();
  const [serverServices, setServerServices] = useState<ServerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddServer, setShowAddServer] = useState(false);

  useEffect(() => {
    const loadServerServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's purchased server services
        const response = await plansAPI.list({ 
          is_active: true,
          category: 'servers',
        });
        
        // Transform products to server services with mock data for demonstration
        const services = (response.data || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price_monthly: product.price_monthly,
          price_yearly: product.price_yearly,
          category: product.category,
          subcategory: product.subcategory,
          status: 'active' as const,
          server_type: product.features?.server_type || 'VPS',
          cpu_cores: product.features?.cpu_cores || 2,
          ram_gb: product.features?.ram_gb || 4,
          storage_gb: product.features?.storage_gb || 50,
          bandwidth_gb: product.features?.bandwidth_gb || 1000,
          ip_address: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
          location: product.features?.location || 'US East',
          os: product.features?.os || 'Ubuntu 22.04',
          nextpanel_url: 'https://panel.example.com',
          nextpanel_username: user?.email?.split('@')[0] || 'user',
          purchased_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          next_renewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          features: product.features || {},
        }));
        
        setServerServices(services);
        
      } catch (err) {
        console.error('Failed to load server services:', err);
        setError('Failed to load your server services. Please try again later.');
        setServerServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadServerServices();
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
      case 'maintenance':
        return <Cog6ToothIcon className="h-5 w-5 text-orange-500" />;
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
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">My Server Services</h1>
            <p className="mt-1 text-sm text-gray-500">Loading your server services...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">My Server Services</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">My Server Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your dedicated servers, VPS, and cloud instances.
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/customer/services?category=servers"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                Buy More Servers
              </a>
              <button
                onClick={() => setShowAddServer(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Server
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Server Services List */}
      <div className="space-y-4">
        {serverServices.map((service) => (
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
                  
                  {/* Server Specifications */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Server Specifications</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* CPU */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <CpuChipIcon className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">CPU</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {service.cpu_cores} Cores
                          </div>
                          <div className="text-xs text-gray-500">
                            {service.server_type}
                          </div>
                        </div>
                      </div>

                      {/* RAM */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <CloudIcon className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">RAM</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {service.ram_gb} GB
                          </div>
                          <div className="text-xs text-gray-500">
                            Memory
                          </div>
                        </div>
                      </div>

                      {/* Storage */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <CircleStackIcon className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Storage</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {service.storage_gb} GB
                          </div>
                          <div className="text-xs text-gray-500">
                            SSD Storage
                          </div>
                        </div>
                      </div>

                      {/* Bandwidth */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <WifiIcon className="h-5 w-5 text-indigo-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Bandwidth</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {service.bandwidth_gb} GB
                          </div>
                          <div className="text-xs text-gray-500">
                            Monthly Transfer
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Server Details */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">
                        {service.ip_address}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {service.location}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Operating System</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {service.os}
                      </dd>
                    </div>
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
        ))}
      </div>

      {/* Empty State */}
      {serverServices.length === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No server services</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any server services yet. Browse our server plans to get started.
          </p>
          <div className="mt-6">
            <a
              href="/customer/services?category=servers"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Browse Server Plans
            </a>
          </div>
        </div>
      )}

      {/* Add Server Modal Placeholder */}
      {showAddServer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Server Service</h3>
              <p className="text-sm text-gray-500 mb-4">
                This feature will be available soon. You can purchase server plans through our services page.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddServer(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <a
                  href="/customer/services?category=servers"
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
