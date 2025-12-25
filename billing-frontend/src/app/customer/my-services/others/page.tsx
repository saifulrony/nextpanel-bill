'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { plansAPI } from '@/lib/api';
import {
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ShoppingCartIcon,
  ShieldCheckIcon,
  CloudIcon,
  DocumentTextIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ServerIcon,
  KeyIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface OtherService {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  category: string;
  subcategory?: string;
  status: 'active' | 'expired' | 'expiring' | 'pending' | 'suspended';
  service_type: string;
  features: any;
  purchased_at: string;
  next_renewal: string;
  management_url?: string;
  username?: string;
}

export default function MyOthersPage() {
  const { user } = useAuth();
  const [otherServices, setOtherServices] = useState<OtherService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [serviceToCancel, setServiceToCancel] = useState<OtherService | null>(null);

  useEffect(() => {
    const loadOtherServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user's purchased other services (not domains, hosting, servers, or licenses)
        const response = await plansAPI.list({ 
          is_active: true
        });
        
        // Filter out domains, hosting, servers, and licenses
        const filteredData = (response.data || []).filter((product: any) => 
          !['domains', 'hosting', 'servers', 'licenses'].includes(product.category?.toLowerCase())
        );
        
        // Transform products to other services with mock data for demonstration
        const services = filteredData.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price_monthly: product.price_monthly,
          price_yearly: product.price_yearly,
          category: product.category || 'other',
          subcategory: product.subcategory,
          status: 'active' as const,
          service_type: product.features?.service_type || product.category || 'Service',
          features: product.features || {},
          purchased_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          next_renewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          management_url: product.features?.management_url || 'https://panel.example.com',
          username: user?.email?.split('@')[0] || 'user',
        }));
        
        setOtherServices(services);
        
      } catch (err) {
        console.error('Failed to load other services:', err);
        setError('Failed to load your other services. Please try again later.');
        setOtherServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadOtherServices();
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

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'security':
        return ShieldCheckIcon;
      case 'email':
        return DocumentTextIcon;
      case 'backup':
        return CloudIcon;
      case 'ssl':
        return ShieldCheckIcon;
      case 'support':
        return UserGroupIcon;
      case 'monitoring':
        return GlobeAltIcon;
      case 'storage':
        return ServerIcon;
      case 'api':
        return KeyIcon;
      default:
        return CubeIcon;
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
            <h1 className="text-2xl font-bold text-gray-900">My Other Services</h1>
            <p className="mt-1 text-sm text-gray-500">Loading your other services...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">My Other Services</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">My Other Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your additional services like security, email, backup, and more.
              </p>
            </div>
            <div className="flex space-x-3">
              <a
                href="/customer/services"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                Browse All Services
              </a>
              <button
                onClick={() => setShowAddService(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Service
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Other Services List */}
      <div className="space-y-4">
        {otherServices.map((service) => {
          const CategoryIcon = getCategoryIcon(service.category);
          const daysUntilExpiry = getDaysUntilExpiry(service.next_renewal);
          
          return (
            <div
              key={service.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CategoryIcon className="h-6 w-6 text-indigo-500 mr-3" />
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
                    
                    {/* Service Features */}
                    {service.features && Object.keys(service.features).length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Features</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(service.features).slice(0, 6).map(([key, value]) => {
                            if (key === 'category' || key === 'service_type' || !value) return null;
                            return (
                              <div key={key} className="flex items-center text-sm text-gray-600">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                <span className="capitalize">{key.replace(/_/g, ' ')}: {String(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Service Details */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {service.service_type}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Category</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">
                          {service.category}
                        </dd>
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
                          {new Date(service.next_renewal).toLocaleDateString()}
                          {service.status === 'expiring' && (
                            <p className="text-xs text-yellow-600">
                              Expires in {daysUntilExpiry} days
                            </p>
                          )}
                        </dd>
                      </div>
                      {service.management_url && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Management URL</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <a 
                              href={service.management_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500"
                            >
                              {service.management_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {service.username && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Username</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-mono">
                            {service.username}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    {service.management_url && (
                      <a
                        href={service.management_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Manage Service
                      </a>
                    )}
                    <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    {(service.status === 'active' || service.status === 'expiring') && (
                      <button
                        onClick={() => {
                          setServiceToCancel(service);
                          setShowCancelModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Cancel Service
                      </button>
                    )}
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
      {otherServices.length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No other services</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any additional services yet. Browse our services to find what you need.
          </p>
          <div className="mt-6">
            <a
              href="/customer/services"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Browse All Services
            </a>
          </div>
        </div>
      )}

      {/* Add Service Modal Placeholder */}
      {showAddService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Service</h3>
              <p className="text-sm text-gray-500 mb-4">
                This feature will be available soon. You can purchase services through our services page.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddService(false)}
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

      {/* Cancel Confirmation Modal */}
      {showCancelModal && serviceToCancel && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCancelModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Cancel Service
                  </h3>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to cancel <strong>{serviceToCancel.name}</strong>? To proceed with cancellation, please contact our support team.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Service cancellation requires manual processing. Please contact support to cancel your service. Your service will remain active until the end of the current billing period.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                  <a
                    href="/customer/support"
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
