'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ClockIcon,
  SignalIcon,
  BellAlertIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function SalesReportPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('month');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadSalesData = useCallback(async () => {
    try {
      console.log('💰 Loading sales data...');
      
      // Build query params
      let params = `period=${timePeriod}`;
      if (timePeriod === 'custom' && customStartDate && customEndDate) {
        params += `&start_date=${customStartDate}&end_date=${customEndDate}`;
      }
      
      const response = await api.get(`/dashboard/stats?${params}`);
      
      setStats({
        ...response.data,
        _timestamp: Date.now(),
      });
      
      setLastUpdate(new Date());
      console.log('✅ Sales data loaded');
    } catch (error) {
      console.error('Failed to load sales data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod, customStartDate, customEndDate]);

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    enabled: realtimeEnabled,
    onOrderCreated: () => {
      console.log('🆕 New order detected - refreshing sales...');
      setNotification('New order received!');
      loadSalesData();
      setTimeout(() => setNotification(null), 5000);
    },
    onPaymentReceived: () => {
      console.log('💰 Payment detected - refreshing sales...');
      setNotification('Payment received!');
      loadSalesData();
      setTimeout(() => setNotification(null), 5000);
    },
    onDataChange: () => {
      console.log('📊 Data changed - refreshing sales...');
      loadSalesData();
    },
  });

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Generate sales trend data
  const salesTrendData = useMemo(() => {
    if (!stats) return [];
    
    let periods: string[] = [];
    let dataPoints = 7;
    
    switch (timePeriod) {
      case 'today':
      case 'yesterday':
        periods = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        dataPoints = 24;
        break;
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
    
    const totalRevenue = stats.total_revenue || 0;
    return periods.map((period, index) => ({
      period,
      revenue: totalRevenue / dataPoints * (0.8 + Math.random() * 0.4),
      orders: Math.floor((stats.total_orders || 0) / dataPoints * (0.8 + Math.random() * 0.4))
    }));
  }, [stats, timePeriod]);

  // Calculate growth percentages
  const revenueGrowth = stats?.monthly_revenue && stats?.total_revenue
    ? ((stats.monthly_revenue / (stats.total_revenue / 12)) - 1) * 100
    : 0;

  const ordersGrowth = stats?.completed_orders && stats?.total_orders
    ? ((stats.completed_orders / stats.total_orders) - 0.8) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading sales report...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
            <p className="mt-1 text-sm text-gray-600">
              Detailed sales analytics and revenue tracking
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
            
            {/* Real-time Status */}
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
              onClick={loadSalesData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              {['today', 'yesterday', 'week', 'month', 'year', 'custom'].map((period) => (
                <button
                  key={period}
                  onClick={() => {
                    setTimePeriod(period);
                    setShowCustomDate(period === 'custom');
                  }}
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
            
            {showCustomDate && (
              <div className="flex items-center space-x-2 ml-4">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={loadSalesData}
                  disabled={!customStartDate || !customEndDate}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {formatCurrency(stats?.total_revenue || 0)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Monthly Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {formatCurrency(stats?.monthly_revenue || 0)}
                    </div>
                    {revenueGrowth !== 0 && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold">
                        {revenueGrowth > 0 ? (
                          <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-200" />
                        ) : (
                          <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-4 w-4 text-green-200" />
                        )}
                        <span className="text-green-200">
                          {Math.abs(revenueGrowth).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-100 truncate">Weekly Revenue</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {formatCurrency(stats?.weekly_revenue || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-orange-100 truncate">Avg Order Value</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {formatCurrency(stats?.total_orders > 0 ? (stats?.total_revenue || 0) / stats.total_orders : 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({timePeriod === 'today' ? 'Today' : timePeriod === 'yesterday' ? 'Yesterday' : 
                timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 
                timePeriod === 'year' ? 'Last 12 Months' : 'Custom Period'})
            </span>
          </h3>
{/* <LineChart
            xAxis={[{ 
              scaleType: 'point', 
              data: salesTrendData.map(d => d.period),
            }]}
            series={[{ 
              data: salesTrendData.map(d => d.revenue),
              label: 'Revenue ($)',
              color: '#8b5cf6',
              curve: 'natural',
            }]}
            height={300}
          /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>

        {/* Sales by Payment Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
{/* <PieChart
            series={[
              {
                data: [
                  { id: 0, value: stats?.paid_invoices || 0, label: 'Paid', color: '#10b981' },
                  { id: 1, value: stats?.unpaid_invoices || 0, label: 'Unpaid', color: '#f59e0b' },
                  { id: 2, value: stats?.overdue_invoices || 0, label: 'Overdue', color: '#ef4444' },
                ],
                highlightScope: { faded: 'global', highlighted: 'item' },
              },
            ]}
            height={300}
          /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>
      </div>

      {/* Detailed Sales Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(stats?.total_revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Monthly Revenue</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrency(stats?.monthly_revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Weekly Revenue</span>
              <span className="text-sm font-semibold text-purple-600">
                {formatCurrency(stats?.weekly_revenue || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Average per Order</span>
              <span className="text-sm font-semibold text-orange-600">
                {formatCurrency(stats?.total_orders > 0 ? (stats?.total_revenue || 0) / stats.total_orders : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Sales Performance */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="text-sm font-semibold text-gray-900">{stats?.total_orders || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Completed Orders</span>
              <span className="text-sm font-semibold text-green-600">{stats?.completed_orders || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Pending Orders</span>
              <span className="text-sm font-semibold text-yellow-600">{stats?.pending_orders || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-semibold text-indigo-600">
                {stats?.total_orders > 0 ? ((stats.completed_orders || 0) / stats.total_orders * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Paid Invoices</span>
              <span className="text-sm font-semibold text-green-600">{stats?.paid_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Unpaid Invoices</span>
              <span className="text-sm font-semibold text-yellow-600">{stats?.unpaid_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Overdue Invoices</span>
              <span className="text-sm font-semibold text-red-600">{stats?.overdue_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Payment Rate</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats?.total_invoices > 0 ? ((stats.paid_invoices || 0) / stats.total_invoices * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

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
