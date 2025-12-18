'use client';

import { useState, useEffect } from 'react';
import { subscriptionsAPI, plansAPI, adminAPI } from '@/lib/api';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface Subscription {
  id: string;
  license_id?: string;
  plan_id: string;
  customer_id?: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at?: string;
  plan?: {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly?: number;
  };
  customer?: {
    id: string;
    email: string;
    full_name: string;
  };
  license?: {
    id: string;
    license_key: string;
    status: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [subscriptions, searchTerm, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subsResponse, plansResponse] = await Promise.all([
        subscriptionsAPI.list(),
        plansAPI.list()
      ]);
      
      const subs = Array.isArray(subsResponse.data) ? subsResponse.data : [];
      
      // Enrich subscriptions with customer and plan data
      const enrichedSubs = await Promise.all(
        subs.map(async (sub: Subscription) => {
          // Get plan details
          const plan = Array.isArray(plansResponse.data) 
            ? plansResponse.data.find((p: any) => p.id === sub.plan_id)
            : null;
          
          // Get customer details if customer_id exists
          let customer = null;
          if (sub.customer_id) {
            try {
              const customerRes = await adminAPI.users.get(sub.customer_id);
              customer = customerRes.data;
            } catch (e) {
              // Customer not found or API error
            }
          }
          
          return {
            ...sub,
            plan: plan || sub.plan,
            customer: customer || sub.customer,
          };
        })
      );
      
      setSubscriptions(enrichedSubs);
      setPlans(Array.isArray(plansResponse.data) ? plansResponse.data : []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...subscriptions];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.id.toLowerCase().includes(term) ||
        sub.customer?.email?.toLowerCase().includes(term) ||
        sub.customer?.full_name?.toLowerCase().includes(term) ||
        sub.plan?.name?.toLowerCase().includes(term) ||
        sub.license?.license_key?.toLowerCase().includes(term)
      );
    }

    setFilteredSubscriptions(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, label: 'Active' },
      past_due: { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon, label: 'Past Due' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, label: 'Cancelled' },
      trialing: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, label: 'Trialing' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon, label: 'Expired' },
      suspended: { color: 'bg-orange-100 text-orange-800', icon: ExclamationTriangleIcon, label: 'Suspended' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      await subscriptionsAPI.cancel(id, { cancel_at_period_end: true });
      alert('Subscription cancelled. It will remain active until the end of the billing period.');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to cancel subscription');
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await subscriptionsAPI.reactivate(id);
      alert('Subscription reactivated successfully!');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to reactivate subscription');
    }
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    past_due: subscriptions.filter(s => s.status === 'past_due').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Subscriptions / Services</h1>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CubeIcon className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Past Due</p>
              <p className="text-2xl font-bold text-gray-900">{stats.past_due}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, email, subscription ID, or license key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No subscriptions found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Subscriptions will appear here when customers make purchases'}
            </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service / Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.customer?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.customer?.email || subscription.customer_id || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.plan?.name || 'Unknown Plan'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscription.license?.license_key 
                          ? `License: ${subscription.license.license_key.substring(0, 12)}...`
                          : 'No license'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                      {subscription.cancel_at_period_end && (
                        <div className="text-xs text-red-600 mt-1">Cancelling at period end</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(subscription.current_period_end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subscription.plan?.price_monthly 
                        ? formatCurrency(subscription.plan.price_monthly)
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {subscription.id.substring(0, 8)}...
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowDetailsModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {subscription.cancel_at_period_end ? (
                          <button
                            onClick={() => handleReactivate(subscription.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Reactivate"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                        ) : subscription.status === 'active' ? (
                          <button
                            onClick={() => handleCancel(subscription.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                      )}
                    </div>

      {/* Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Subscription Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSubscription(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subscription ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedSubscription.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedSubscription.customer?.full_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedSubscription.customer?.email || selectedSubscription.customer_id || 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan / Service</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedSubscription.plan?.name || 'Unknown Plan'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedSubscription.plan?.price_monthly 
                      ? `${formatCurrency(selectedSubscription.plan.price_monthly)}/month`
                      : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSubscription.status)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Period</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedSubscription.current_period_start)} - {formatDate(selectedSubscription.current_period_end)}
                  </p>
                </div>

                {selectedSubscription.license && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Key</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">
                      {selectedSubscription.license.license_key}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {selectedSubscription.license.status}
                    </p>
            </div>
          )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(selectedSubscription.created_at)}
                  </p>
                </div>

                {selectedSubscription.cancel_at_period_end && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ This subscription is set to cancel at the end of the current billing period.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {selectedSubscription.cancel_at_period_end ? (
                  <button
                    onClick={() => {
                      handleReactivate(selectedSubscription.id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Reactivate Subscription
                  </button>
                ) : selectedSubscription.status === 'active' ? (
                  <button
                    onClick={() => {
                      handleCancel(selectedSubscription.id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel Subscription
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSubscription(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
