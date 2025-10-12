'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import {
  UsersIcon,
  UserPlusIcon,
  UserMinusIcon,
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  SignalIcon,
  BellAlertIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function ClientNumbersPage() {
  const [stats, setStats] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('month');

  const loadClientData = useCallback(async () => {
    try {
      console.log('👥 Loading client data...');
      
      let params = `period=${timePeriod}`;
      
      const [statsResponse, customersResponse] = await Promise.all([
        api.get(`/dashboard/stats?${params}`),
        api.get(`/dashboard/customers/analytics?${params}`),
      ]);
      
      setStats({
        ...statsResponse.data,
        _timestamp: Date.now(),
      });
      
      setTopCustomers(customersResponse.data.top_customers || []);
      setLastUpdate(new Date());
      console.log('✅ Client data loaded');
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod]);

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    enabled: realtimeEnabled,
    onOrderCreated: () => {
      console.log('🆕 New order detected - refreshing client data...');
      setNotification('New customer activity!');
      loadClientData();
      setTimeout(() => setNotification(null), 5000);
    },
    onDataChange: () => {
      console.log('📊 Data changed - refreshing client data...');
      loadClientData();
    },
  });

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  // Generate client trend data
  const clientTrendData = useMemo(() => {
    if (!stats) return [];
    
    let periods: string[] = [];
    let dataPoints = 7;
    
    switch (timePeriod) {
      case 'week':
        periods = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dataPoints = 7;
        break;
      case 'month':
        periods = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
        dataPoints = 30;
        break;
      case 'year':
        periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dataPoints = 12;
        break;
      default:
        periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        dataPoints = 4;
        break;
    }
    
    const totalCustomers = stats.total_customers || 0;
    return periods.map((period, index) => ({
      period,
      newClients: Math.floor(totalCustomers / dataPoints * (0.1 + Math.random() * 0.2)),
      activeClients: Math.floor(totalCustomers * 0.8 / dataPoints * (0.8 + Math.random() * 0.4)),
    }));
  }, [stats, timePeriod]);

  // Calculate growth rates
  const customerGrowth = stats?.new_customers_this_month && stats?.total_customers
    ? (stats.new_customers_this_month / stats.total_customers) * 100
    : 0;

  const activeRate = stats?.active_customers && stats?.total_customers
    ? (stats.active_customers / stats.total_customers) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading client analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" key={lastUpdate.getTime()}>
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <BellAlertIcon className="h-5 w-5" />
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Numbers</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive customer analytics and growth metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
            
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <SignalIcon className={`h-4 w-4 ${isConnected ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={realtimeEnabled}
                onChange={(e) => setRealtimeEnabled(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Real-time</span>
            </label>

            <button
              onClick={loadClientData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Time Period Selector */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Time Period:</label>
            <div className="flex items-center space-x-2">
              {['week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    timePeriod === period
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Client Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Clients */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-100 truncate">Total Clients</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {stats?.total_customers || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Active Clients</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {stats?.active_customers || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-green-200">
                        ({activeRate.toFixed(1)}%)
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* New Clients This Month */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserPlusIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">New This Month</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {stats?.new_customers_this_month || 0}
                    </div>
                    {customerGrowth > 0 && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold">
                        <TrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-purple-200" />
                        <span className="text-purple-200">
                          {customerGrowth.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Clients */}
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserMinusIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-100 truncate">Inactive Clients</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {(stats?.total_customers || 0) - (stats?.active_customers || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Client Growth Trend
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 'Last 12 Months'})
            </span>
          </h3>
{/* <BarChart
            xAxis={[{ scaleType: 'band', data: clientTrendData.map(d => d.period) }]}
            series={[
              { 
                data: clientTrendData.map(d => d.newClients), 
                label: 'New Clients',
                color: '#8b5cf6',
              },
              { 
                data: clientTrendData.map(d => d.activeClients), 
                label: 'Active Clients',
                color: '#10b981',
              }
            ]}
            height={300}
          /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>

        {/* Client Status Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Status Distribution</h3>
{/* <PieChart
            series={[
              {
                data: [
                  { id: 0, value: stats?.active_customers || 0, label: 'Active', color: '#10b981' },
                  { id: 1, value: (stats?.total_customers || 0) - (stats?.active_customers || 0), label: 'Inactive', color: '#6b7280' },
                ],
                highlightScope: { faded: 'global', highlighted: 'item' },
              },
            ]}
            height={300}
          /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>
      </div>

      {/* Detailed Client Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Clients</span>
              <span className="text-sm font-semibold text-gray-900">{stats?.total_customers || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Active Clients</span>
              <span className="text-sm font-semibold text-green-600">{stats?.active_customers || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Inactive Clients</span>
              <span className="text-sm font-semibold text-red-600">
                {(stats?.total_customers || 0) - (stats?.active_customers || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">New This Month</span>
              <span className="text-sm font-semibold text-purple-600">{stats?.new_customers_this_month || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">New This Week</span>
              <span className="text-sm font-semibold text-blue-600">{stats?.new_customers_this_week || 0}</span>
            </div>
          </div>
        </div>

        {/* Client Engagement */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Engagement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">With Licenses</span>
              <span className="text-sm font-semibold text-green-600">{stats?.customers_with_licenses || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">With Subscriptions</span>
              <span className="text-sm font-semibold text-blue-600">{stats?.customers_with_subscriptions || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Average Customer Value</span>
              <span className="text-sm font-semibold text-purple-600">
                ${(stats?.average_customer_value || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Retention Rate</span>
              <span className="text-sm font-semibold text-indigo-600">
                {activeRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Monthly Growth</span>
              <span className="text-sm font-semibold text-green-600">
                {customerGrowth > 0 ? '+' : ''}{customerGrowth.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Active Rate</span>
              <span className="text-sm font-semibold text-blue-600">{activeRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Churn Rate</span>
              <span className="text-sm font-semibold text-red-600">{(100 - activeRate).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Avg. Lifetime</span>
              <span className="text-sm font-semibold text-gray-600">
                {stats?.total_customers > 0 ? (365 / ((stats.new_customers_this_month || 1) * 12 / stats.total_customers)).toFixed(0) : 0} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Licenses
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCustomers.slice(0, 10).map((customer, index) => (
                  <tr key={customer.customer_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.customer_name}</div>
                      <div className="text-sm text-gray-500">{customer.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${customer.total_spent?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.active_licenses || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
