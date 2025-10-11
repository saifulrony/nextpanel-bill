'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { analyticsAPI, invoicesAPI, plansAPI } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { RevenueWaveChart, OrdersWaveChart } from '@/components/analytics/RevenueChart';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  ChartBarIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowPathIcon,
  BellAlertIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>({
    dashboard: null,
    revenue: null,
    orders: null,
    products: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  const loadData = useCallback(async () => {
    try {
      console.log('📊 Loading analytics data...');
      
      const [dashboard, revenue, orders, products] = await Promise.all([
        analyticsAPI.dashboard().catch((err) => {
          console.error('Dashboard API error:', err);
          return { data: null };
        }),
        analyticsAPI.revenue().catch((err) => {
          console.error('Revenue API error:', err);
          return { data: null };
        }),
        invoicesAPI.stats().catch((err) => {
          console.error('Invoices API error:', err);
          return { data: null };
        }),
        plansAPI.stats().catch((err) => {
          console.error('Plans API error:', err);
          return { data: null };
        }),
      ]);

      console.log('📊 Analytics data loaded:', {
        dashboard: dashboard.data,
        revenue: revenue.data,
        orders: orders.data,
        products: products.data,
      });

      // Always create a completely new object to force React to detect changes
      setData({
        dashboard: dashboard.data,
        revenue: revenue.data,
        orders: orders.data,
        products: products.data,
        _timestamp: Date.now(), // Force change detection
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    enabled: realtimeEnabled,
    onOrderCreated: () => {
      console.log('🆕 New order detected - refreshing data...');
      setNotification('New order received!');
      loadData();
      setTimeout(() => setNotification(null), 5000);
    },
    onOrderUpdated: () => {
      console.log('📝 Order status updated - refreshing data...');
      setNotification('Order status updated!');
      loadData();
      setTimeout(() => setNotification(null), 5000);
    },
    onPaymentReceived: () => {
      console.log('💰 Payment detected - refreshing data...');
      setNotification('Payment received!');
      loadData();
      setTimeout(() => setNotification(null), 5000);
    },
    onDataChange: () => {
      console.log('📊 Data changed - refreshing...');
      loadData();
    },
  });

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate chart data based on timeframe
  const chartData = useMemo(() => {
    let days: string[] = [];
    let dataPoints = 7;
    
    switch (timeframe) {
      case 'daily':
        days = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        dataPoints = 24;
        break;
      case 'weekly':
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dataPoints = 7;
        break;
      case 'monthly':
        days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
        dataPoints = 30;
        break;
      case 'yearly':
        days = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dataPoints = 12;
        break;
    }
    
    const revenueBase = data.revenue?.period_revenue || data.revenue?.total_revenue || 0;
    const ordersBase = data.orders?.paid_invoices || data.orders?.total_invoiced || 0;
    
    return days.map((day, index) => ({
      name: day,
      revenue: Number((revenueBase / dataPoints * (0.7 + Math.random() * 0.6)).toFixed(2)),
      orders: Math.floor(ordersBase / dataPoints * (0.7 + Math.random() * 0.6))
    }));
  }, [data.revenue?.period_revenue, data.revenue?.total_revenue, data.orders?.paid_invoices, data.orders?.total_invoiced, timeframe]);

  const revenueGrowth = data.revenue?.period_revenue && data.revenue?.total_revenue
    ? parseFloat(((data.revenue.period_revenue / data.revenue.total_revenue) * 100).toFixed(1))
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics & Insights</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time business metrics with live updates
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
          
          {/* Real-time Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
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
            onClick={loadData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <span className="text-sm text-gray-600 font-medium pl-3">Timeframe:</span>
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 overflow-hidden shadow-lg rounded-lg" key={`total-revenue-${data.revenue?.total_revenue}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-white opacity-75" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-indigo-100 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      ${data.revenue?.total_revenue?.toFixed(2) || '0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 overflow-hidden shadow-lg rounded-lg" key={`period-revenue-${data.revenue?.period_revenue}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-white opacity-75" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Last 30 Days</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      ${data.revenue?.period_revenue?.toFixed(2) || '0.00'}
                    </div>
                    {revenueGrowth > 0 && (
                      <span className="ml-2 text-sm font-medium text-green-200">
                        {revenueGrowth.toFixed(1)}%
                      </span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 overflow-hidden shadow-lg rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBagIcon className="h-8 w-8 text-white opacity-75" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">Total Orders</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      ${data.orders?.total_invoiced?.toFixed(2) || '0.00'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden shadow-lg rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-white opacity-75" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-orange-100 truncate">Active Products</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {data.products?.total_active_plans || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Wave Chart */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-6">
          <RevenueWaveChart 
            data={chartData} 
            title={`Revenue Trend (${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})`} 
            height={280} 
          />
        </div>

        {/* Orders Wave Chart */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-6">
          <OrdersWaveChart 
            data={chartData} 
            title={`Orders Trend (${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})`} 
            height={280} 
          />
        </div>
      </div>

      {/* Visual Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Total Revenue</span>
                <span className="text-indigo-600 font-semibold">
                  ${data.revenue?.total_revenue?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-indigo-600 h-3 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Last 30 Days</span>
                <span className="text-green-600 font-semibold">
                  ${data.revenue?.period_revenue?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                  style={{ 
                    width: data.revenue?.total_revenue && data.revenue?.period_revenue 
                      ? `${(data.revenue.period_revenue / data.revenue.total_revenue * 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Average Transaction</span>
                <span className="text-blue-600 font-semibold">
                  ${data.revenue?.average_transaction?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                  style={{ 
                    width: data.revenue?.total_revenue && data.revenue?.average_transaction 
                      ? `${Math.min((data.revenue.average_transaction / data.revenue.total_revenue * 100) * 50, 100)}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders by Category */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders by Category</h3>
          <div className="space-y-3">
            {data.orders?.plans_by_category && Object.entries(data.orders.plans_by_category).map(([category, count]: [string, any], index) => {
              const total = Object.values(data.orders.plans_by_category as Record<string, number>).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total * 100) : 0;
              const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-green-500', 'bg-blue-500'];
              
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{category}</span>
                    <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Products by Category */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Products by Category</h3>
          <div className="space-y-3">
            {data.products?.plans_by_category && Object.entries(data.products.plans_by_category).map(([category, count]: [string, any], index) => {
              const maxCount = Math.max(...Object.values(data.products.plans_by_category as Record<string, number>));
              const percentage = maxCount > 0 ? (count / maxCount * 100) : 0;
              const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
              
              return (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{category}</span>
                    <span className="text-gray-600">{count} products</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6" key={`quick-stats-${lastUpdate.getTime()}`}>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600 font-medium">Avg Transaction</p>
                <p className="text-2xl font-bold text-blue-900" key={`avg-trans-${data.revenue?.average_transaction}`}>
                  ${data.revenue?.average_transaction?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-600 font-medium">Paid Orders</p>
                <p className="text-2xl font-bold text-green-900" key={`paid-orders-${data.orders?.paid_invoices}`}>
                  {data.orders?.paid_invoices || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg Product Price</p>
                <p className="text-2xl font-bold text-orange-900" key={`avg-price-${data.products?.average_price}`}>
                  ${data.products?.average_price?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ShoppingBagIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Stats */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Open Orders</span>
              <span className="text-sm font-semibold text-blue-600">{data.orders?.open_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Paid Orders</span>
              <span className="text-sm font-semibold text-green-600">{data.orders?.paid_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Overdue</span>
              <span className="text-sm font-semibold text-red-600">{data.orders?.overdue_invoices || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Partially Paid</span>
              <span className="text-sm font-semibold text-yellow-600">{data.orders?.partially_paid_invoices || 0}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Paid</span>
              <span className="text-sm font-semibold text-green-600">
                ${data.orders?.total_paid?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Outstanding</span>
              <span className="text-sm font-semibold text-yellow-600">
                ${data.orders?.total_outstanding?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Overdue Amount</span>
              <span className="text-sm font-semibold text-red-600">
                ${data.orders?.overdue_amount?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Total Payments</span>
              <span className="text-sm font-semibold text-indigo-600">
                {data.revenue?.total_payments || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Product Insights */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Categories</span>
              <span className="text-sm font-semibold text-indigo-600">
                {Object.keys(data.products?.plans_by_category || {}).length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Min Price</span>
              <span className="text-sm font-semibold text-gray-900">
                ${data.products?.min_price?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Max Price</span>
              <span className="text-sm font-semibold text-gray-900">
                ${data.products?.max_price?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Active Products</span>
              <span className="text-sm font-semibold text-green-600">
                {data.products?.total_active_plans || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Note */}
      <div className={`border rounded-lg p-4 ${
        realtimeEnabled ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {realtimeEnabled ? (
              <SignalIcon className="h-5 w-5 text-green-600" />
            ) : (
              <ClockIcon className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm ${realtimeEnabled ? 'text-green-800' : 'text-blue-800'}`}>
              {realtimeEnabled ? (
                <><span className="font-medium">Real-time Mode Active:</span> Dashboard updates automatically when new orders are placed or payments received. No polling needed!</>
              ) : (
                <><span className="font-medium">Manual Mode:</span> Click refresh button to update data. Real-time updates are disabled.</>
              )}
            </p>
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
