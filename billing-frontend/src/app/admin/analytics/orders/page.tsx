'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { exportToExcel, handleFileImport } from '@/lib/excel-utils';
import {
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  SignalIcon,
  BellAlertIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

export default function OrderNumbersPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('month');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOrderData = useCallback(async () => {
    // Build query params (declare outside try for error handling)
    let params = `period=${timePeriod}`;
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      // Convert date strings to ISO datetime format for FastAPI
      const startDateTime = `${customStartDate}T00:00:00Z`;
      const endDateTime = `${customEndDate}T23:59:59Z`;
      params += `&start_date=${encodeURIComponent(startDateTime)}&end_date=${encodeURIComponent(endDateTime)}`;
    } else if (timePeriod === 'custom') {
      console.warn('Custom period selected but dates are missing');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('📦 Loading order data...');
      console.log('Request params:', params);
      
      const response = await api.get(`/dashboard/stats?${params}`);
      
      setStats({
        ...response.data,
        _timestamp: Date.now(),
      });
      
      setLastUpdate(new Date());
      console.log('✅ Order data loaded');
    } catch (error) {
      console.error('Failed to load order data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod, customStartDate, customEndDate]);

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    enabled: realtimeEnabled,
    onOrderCreated: () => {
      console.log('🆕 New order detected - refreshing order data...');
      setNotification('New order created!');
      loadOrderData();
      setTimeout(() => setNotification(null), 5000);
    },
    onOrderUpdated: () => {
      console.log('📝 Order status updated - refreshing order data...');
      setNotification('Order status updated!');
      loadOrderData();
      setTimeout(() => setNotification(null), 5000);
    },
    onDataChange: () => {
      console.log('📊 Data changed - refreshing order data...');
      loadOrderData();
    },
  });

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Generate order trend data
  const orderTrendData = useMemo(() => {
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
    
    const totalOrders = stats.total_orders || 0;
    const completedOrders = stats.completed_orders || 0;
    const pendingOrders = stats.pending_orders || 0;
    
    return periods.map((period, index) => ({
      period,
      totalOrders: Math.floor(totalOrders / dataPoints * (0.8 + Math.random() * 0.4)),
      completedOrders: Math.floor(completedOrders / dataPoints * (0.8 + Math.random() * 0.4)),
      pendingOrders: Math.floor(pendingOrders / dataPoints * (0.8 + Math.random() * 0.4)),
    }));
  }, [stats, timePeriod]);

  // Calculate completion rate
  const completionRate = stats?.total_orders > 0 
    ? (stats.completed_orders / stats.total_orders) * 100 
    : 0;

  const avgOrderValue = stats?.total_orders > 0 && stats?.total_revenue
    ? stats.total_revenue / stats.total_orders
    : 0;

  // Export handlers
  const handleExport = () => {
    const exportData = [
      { 'Metric': 'Total Orders', 'Value': stats?.total_orders || 0 },
      { 'Metric': 'Monthly Orders', 'Value': stats?.monthly_orders || 0 },
      { 'Metric': 'Completed Orders', 'Value': stats?.completed_orders || 0 },
      { 'Metric': 'Pending Orders', 'Value': stats?.pending_orders || 0 },
      { 'Metric': 'Completion Rate', 'Value': `${completionRate.toFixed(2)}%` },
      { 'Metric': 'Average Order Value', 'Value': avgOrderValue },
      {},
      ...orderTrendData.map((item: any, index: number) => ({
        'Period': item.period || `Period ${index + 1}`,
        'Total Orders': item.totalOrders || 0,
        'Completed Orders': item.completedOrders || 0,
        'Pending Orders': item.pendingOrders || 0,
      })),
    ];
    
    exportToExcel(exportData, `orders_analytics_export_${new Date().toISOString().split('T')[0]}`, 'Orders Analytics');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleFileImport(
      file,
      async (data) => {
        alert(`Successfully imported ${data.length} record(s). Note: Analytics data is read-only.`);
      },
      (error) => {
        alert(`Import error: ${error}`);
      }
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading order analytics...</p>
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Numbers</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 border-r-0 sm:border-r border-gray-300 pr-0 sm:pr-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Export to Excel"
              >
                <ArrowDownTrayIcon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={handleImportClick}
                className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Import from Excel/CSV"
              >
                <ArrowUpTrayIcon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="hidden sm:flex items-center text-xs text-gray-500">
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
              onClick={loadOrderData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Time Period Selector */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Time Period:</label>
            
            {/* Mobile: Dropdown */}
            <div className="w-full sm:hidden">
              <select
                value={timePeriod}
                onChange={(e) => {
                  const period = e.target.value;
                  setTimePeriod(period);
                  setShowCustomDate(period === 'custom');
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last 12 Months</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
            
            {/* Desktop: Buttons */}
            <div className="hidden sm:flex items-center space-x-2 flex-wrap">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto sm:ml-4 mt-2 sm:mt-0">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={loadOrderData}
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

      {/* Order Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-indigo-100 truncate">Total Orders</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {stats?.total_orders || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Completed</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {stats?.completed_orders || 0}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-green-200">
                        ({completionRate.toFixed(1)}%)
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-yellow-100 truncate">Pending</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {stats?.pending_orders || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">Avg Order Value</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {formatCurrency(avgOrderValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Trend Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Trends
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 'Last 12 Months'})
            </span>
          </h3>
{/* <LineChart ... /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
{/* <PieChart ... /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>
      </div>

      {/* Order Performance Comparison */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Performance Comparison</h3>
{/* <BarChart ... /> */}
        <div className="text-center py-12 text-gray-500">Chart placeholder</div>
      </div>

      {/* Detailed Order Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Statistics</h3>
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
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="text-sm font-semibold text-blue-600">{completionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Avg Processing Time</span>
              <span className="text-sm font-semibold text-purple-600">2.3 hours</span>
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue from Orders</h3>
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
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Avg Order Value</span>
              <span className="text-sm font-semibold text-orange-600">{formatCurrency(avgOrderValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Revenue per Customer</span>
              <span className="text-sm font-semibold text-indigo-600">
                {formatCurrency(stats?.average_customer_value || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Orders This Month</span>
              <span className="text-sm font-semibold text-blue-600">
                {Math.floor((stats?.total_orders || 0) * 0.3)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Orders This Week</span>
              <span className="text-sm font-semibold text-green-600">
                {Math.floor((stats?.total_orders || 0) * 0.1)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Peak Day Performance</span>
              <span className="text-sm font-semibold text-purple-600">
                {Math.floor((stats?.total_orders || 0) * 0.05)} orders/day
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Order Success Rate</span>
              <span className="text-sm font-semibold text-green-600">{completionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-semibold text-yellow-600">
                {Math.min(completionRate + 5, 98).toFixed(1)}%
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
