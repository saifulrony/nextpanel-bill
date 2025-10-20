'use client';

import { useState, useEffect } from 'react';
import { paymentGatewaysAPI } from '@/lib/api';
import {
  PlusIcon,
  Cog6ToothIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  display_name: string;
  description?: string;
  status: 'active' | 'inactive' | 'testing';
  is_default: boolean;
  supports_recurring: boolean;
  supports_refunds: boolean;
  supports_partial_refunds: boolean;
  supports_webhooks: boolean;
  fixed_fee: number;
  percentage_fee: number;
  is_sandbox: boolean;
  created_at: string;
  updated_at?: string;
}

const getGatewayTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'stripe':
      return '💳';
    case 'paypal':
      return '🅿️';
    case 'razorpay':
      return '⚡';
    case 'square':
      return '◼️';
    case 'braintree':
      return '🧠';
    case 'authorize_net':
      return '🔐';
    case 'payu':
      return '💰';
    case 'mollie':
      return '🔶';
    default:
      return '💳';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Active
        </span>
      );
    case 'inactive':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircleIcon className="w-4 h-4 mr-1" />
          Inactive
        </span>
      );
    case 'testing':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <WrenchScrewdriverIcon className="w-4 h-4 mr-1" />
          Testing
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unknown
        </span>
      );
  }
};

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [testingGateway, setTestingGateway] = useState<string | null>(null);

  useEffect(() => {
    loadGateways();
  }, [filter]);

  const loadGateways = async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await paymentGatewaysAPI.list(params);
      setGateways(response.data);
    } catch (error) {
      console.error('Failed to load payment gateways:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await paymentGatewaysAPI.activate(id);
      await loadGateways();
    } catch (error) {
      console.error('Failed to activate gateway:', error);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await paymentGatewaysAPI.deactivate(id);
      await loadGateways();
    } catch (error) {
      console.error('Failed to deactivate gateway:', error);
    }
  };

  const handleTest = async (id: string) => {
    try {
      setTestingGateway(id);
      const response = await paymentGatewaysAPI.test(id, {
        test_amount: 1.00,
        test_currency: 'USD'
      });
      if (response.data.success) {
        alert('Gateway test successful!');
        // Refresh the gateway list to show updated status
        await loadGateways();
      } else {
        alert(`Gateway test failed: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Gateway test failed:', error);
      
      // Handle different error response formats
      let errorMessage = 'Gateway test failed. Please check the configuration.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (Array.isArray(errorData)) {
          errorMessage = errorData.map((err: any) => 
            err.msg || err.message || 'Validation error'
          ).join(', ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.msg) {
          errorMessage = errorData.msg;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      // Refresh the gateway list even on error to show current state
      await loadGateways();
    } finally {
      setTestingGateway(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" payment gateway? This action cannot be undone.`)) {
      try {
        await paymentGatewaysAPI.delete(id);
        await loadGateways();
      } catch (error) {
        console.error('Failed to delete gateway:', error);
        alert('Failed to delete gateway. It may have associated transactions.');
      }
    }
  };

  const filteredGateways = gateways;

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Gateways</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your payment processing gateways and configurations
            </p>
          </div>
          <Link
            href="/admin/payments/gateways/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Gateway
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Gateways' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Inactive' },
              { key: 'testing', label: 'Testing' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Gateways List */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading payment gateways...</p>
            </div>
          ) : filteredGateways.length === 0 ? (
            <div className="text-center py-12">
              <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payment gateways</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first payment gateway.
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/payments/gateways/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Gateway
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Environment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGateways.map((gateway) => (
                    <tr key={gateway.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">{getGatewayTypeIcon(gateway.type)}</div>
                          <div>
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {gateway.display_name}
                              </div>
                              {gateway.is_default && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{gateway.name}</div>
                            {gateway.description && (
                              <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                {gateway.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                          {gateway.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(gateway.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {gateway.supports_recurring && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Recurring
                            </span>
                          )}
                          {gateway.supports_refunds && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Refunds
                            </span>
                          )}
                          {gateway.supports_webhooks && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Webhooks
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {gateway.percentage_fee > 0 && (
                            <div>{gateway.percentage_fee}%</div>
                          )}
                          {gateway.fixed_fee > 0 && (
                            <div>${gateway.fixed_fee.toFixed(2)}</div>
                          )}
                          {gateway.percentage_fee === 0 && gateway.fixed_fee === 0 && (
                            <div className="text-gray-400">No fees</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          gateway.is_sandbox
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {gateway.is_sandbox ? 'Sandbox' : 'Production'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleTest(gateway.id)}
                            disabled={testingGateway === gateway.id}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                            title="Test Connection"
                          >
                            {testingGateway === gateway.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            ) : (
                              <WrenchScrewdriverIcon className="h-4 w-4" />
                            )}
                          </button>
                          
                          <Link
                            href={`/admin/payments/gateways/${gateway.id}/stats`}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Stats"
                          >
                            <ChartBarIcon className="h-4 w-4" />
                          </Link>
                          
                          <Link
                            href={`/admin/payments/gateways/${gateway.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Gateway"
                          >
                            <Cog6ToothIcon className="h-4 w-4" />
                          </Link>
                          
                          {gateway.status === 'active' ? (
                            <button
                              onClick={() => handleDeactivate(gateway.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Deactivate"
                            >
                              <PauseIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(gateway.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Activate"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => window.open(`/admin/payments/gateways/${gateway.id}/edit`, '_blank')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Gateway"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(gateway.id, gateway.display_name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Gateway"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
