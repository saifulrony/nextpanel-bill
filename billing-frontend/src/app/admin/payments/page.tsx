'use client';

import { useState, useEffect } from 'react';
import { paymentsAPI, paymentGatewaysAPI } from '@/lib/api';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  description?: string;
  payment_method?: string;
  gateway_id?: string;
  gateway_transaction_id?: string;
  failure_reason?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  gateway?: {
    display_name: string;
    type: string;
  };
}

interface PaymentStats {
  total_spent: number;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
}

interface PaymentGateway {
  id: string;
  display_name: string;
  type: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'succeeded':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'pending':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'failed':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    case 'refunded':
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case 'succeeded':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'pending':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'failed':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'refunded':
      return `${baseClasses} bg-orange-100 text-orange-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export default function TransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    gateway_id: '',
    date_from: '',
    date_to: '',
    min_amount: '',
    max_amount: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadData();
    loadGateways();
  }, [filters, currentPage]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params = {
        ...filters,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!(params as any)[key]) delete (params as any)[key];
      });

      console.log('Loading payments data...');
      console.log('API base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001');
      console.log('Request params:', params);
      
      const [paymentsResponse, statsResponse] = await Promise.all([
        paymentsAPI.list(params).catch(err => {
          console.error('Payments list error:', err);
          throw err;
        }),
        paymentsAPI.stats().catch(err => {
          console.error('Stats error:', err);
          throw err;
        })
      ]);
      
      console.log('Payments response:', paymentsResponse);
      console.log('Stats response:', statsResponse);
      
      setPayments(paymentsResponse.data);
      setStats(statsResponse.data);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
          (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
        setError(`Cannot connect to backend server at ${apiUrl}. Please ensure the backend is running on port 8001. Run: cd billing-backend && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`);
      } else {
        setError(error.response?.data?.detail || error.message || 'Failed to load payments data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadGateways = async () => {
    try {
      const response = await paymentGatewaysAPI.listActive();
      setGateways(response.data);
    } catch (error) {
      console.error('Failed to load gateways:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      gateway_id: '',
      date_from: '',
      date_to: '',
      min_amount: '',
      max_amount: '',
    });
    setCurrentPage(1);
  };

  const exportTransactions = () => {
    // This would typically generate a CSV or Excel file
    alert('Export functionality would be implemented here');
  };

  const viewPaymentDetails = (payment: Payment) => {
    // This would open a modal or navigate to a detail page
    alert(`View details for payment ${payment.id}`);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Transactions</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage all payment transactions across your gateways
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Active
                </span>
              )}
            </button>
            <button
              onClick={exportTransactions}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Payments
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setError(null);
                    loadData();
                  }}
                  className="text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                ${stats.total_spent?.toFixed(2) || '0.00'}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.total_payments || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Successful</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {stats.successful_payments || 0}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {stats.failed_payments || 0}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by transaction ID, description, or customer..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="succeeded">Succeeded</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
                  <select
                    value={filters.gateway_id}
                    onChange={(e) => handleFilterChange('gateway_id', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">All Gateways</option>
                    {gateways.map((gateway) => (
                      <option key={gateway.id} value={gateway.id}>
                        {gateway.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.min_amount}
                    onChange={(e) => handleFilterChange('min_amount', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    value={filters.max_amount}
                    onChange={(e) => handleFilterChange('max_amount', e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading transactions...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No payment transactions yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.description || 'Payment'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {payment.id.slice(0, 8)}...
                          </div>
                          {payment.gateway_transaction_id && (
                            <div className="text-xs text-gray-400">
                              Gateway: {payment.gateway_transaction_id.slice(0, 12)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.user ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${payment.amount.toFixed(2)} {payment.currency}
                        </div>
                        {payment.payment_method && (
                          <div className="text-xs text-gray-500 capitalize">
                            {payment.payment_method}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.gateway ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {payment.gateway.display_name}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {payment.gateway.type}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(payment.status)}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1 capitalize">{payment.status}</span>
                        </span>
                        {payment.failure_reason && (
                          <div className="text-xs text-red-600 mt-1">
                            {payment.failure_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewPaymentDetails(payment)}
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
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

