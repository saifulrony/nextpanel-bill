'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { getDemoData } from '@/lib/demoData';
import DraggableResizableWidget from '@/components/dashboard/DraggableResizableWidget';
// import { div } from '@mui/x-charts/div';
import {
  UserGroupIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  BellAlertIcon,
  SignalIcon,
  ClockIcon,
  CreditCardIcon,
  KeyIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
// import { div, div, gaugeClasses } from '@mui/x-charts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('week');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [widgetConfigs, setWidgetConfigs] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const [editMode, setEditMode] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      console.log('📊 Loading dashboard stats...');
      
      // Build query params for both endpoints
      let params = `period=${timePeriod}`;
      if (timePeriod === 'custom' && customStartDate && customEndDate) {
        params += `&start_date=${customStartDate}&end_date=${customEndDate}`;
      }
      
      try {
        const [statsResponse, customersResponse] = await Promise.all([
          api.get(`/dashboard/stats?${params}`),
          api.get(`/dashboard/customers/analytics?${params}`),
        ]);
        
        // Check if API returned empty or minimal data
        if (!statsResponse.data || 
            (statsResponse.data.total_customers === 0 && 
             statsResponse.data.total_orders === 0 && 
             statsResponse.data.total_revenue === 0)) {
          console.log('📊 API returned empty data, using demo dashboard...');
          throw new Error('No data in database');
        }
        
        // Force new object to trigger React updates
        setStats({
          ...statsResponse.data,
          _timestamp: Date.now(),
        });
        
        setTopCustomers(Array.isArray(customersResponse.data.top_customers) ? customersResponse.data.top_customers : []);
        setLastUpdate(new Date());
        setIsUsingDemoData(false);
        console.log('✅ Dashboard stats loaded from API');
      } catch (apiError) {
        console.log('📊 API not available, using demo data...');
        
        // Use demo data when API is not available
        const demoStats = getDemoData('stats');
        const demoCustomers = getDemoData('customers');
        
        setStats({
          ...demoStats,
          _timestamp: Date.now(),
        });
        
        setTopCustomers(Array.isArray(demoCustomers) ? demoCustomers : []);
        setLastUpdate(new Date());
        setIsUsingDemoData(true);
        console.log('✅ Demo data loaded');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod, customStartDate, customEndDate]);

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    enabled: realtimeEnabled,
    onOrderCreated: () => {
      console.log('🆕 New order detected - refreshing dashboard...');
      setNotification('New order received!');
      loadDashboardData();
      setTimeout(() => setNotification(null), 5000);
    },
    onOrderUpdated: () => {
      console.log('📝 Order status updated - refreshing dashboard...');
      setNotification('Order status updated!');
      loadDashboardData();
      setTimeout(() => setNotification(null), 5000);
    },
    onPaymentReceived: () => {
      console.log('💰 Payment detected - refreshing dashboard...');
      setNotification('Payment received!');
      loadDashboardData();
      setTimeout(() => setNotification(null), 5000);
    },
    onDataChange: () => {
      console.log('📊 Data changed - refreshing dashboard...');
      loadDashboardData();
    },
  });

  useEffect(() => {
    loadDashboardData();
    // Load widget configurations from localStorage
    const savedConfigs = localStorage.getItem('dashboard_widget_configs');
    if (savedConfigs) {
      try {
        setWidgetConfigs(JSON.parse(savedConfigs));
      } catch (e) {
        console.error('Failed to load widget configs:', e);
      }
    }
  }, [loadDashboardData]);

  const saveWidgetConfigs = (configs: Record<string, { x: number; y: number; width: number; height: number }>) => {
    setWidgetConfigs(configs);
    localStorage.setItem('dashboard_widget_configs', JSON.stringify(configs));
  };

  const handleWidgetResize = (id: string, width: number, height: number) => {
    const newConfigs = {
      ...widgetConfigs,
      [id]: {
        ...widgetConfigs[id],
        width,
        height,
      },
    };
    saveWidgetConfigs(newConfigs);
  };

  const handleWidgetPositionChange = (id: string, x: number, y: number) => {
    const newConfigs = {
      ...widgetConfigs,
      [id]: {
        ...(widgetConfigs[id] || {}),
        x,
        y,
      },
    };
    saveWidgetConfigs(newConfigs);
  };

  const handleWidgetEdit = (id: string) => {
    console.log('Edit widget:', id);
    // You can implement edit functionality here
    alert(`Edit widget ${id} - Feature coming soon!`);
  };

  const handleWidgetDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this widget?')) {
      const newConfigs = { ...widgetConfigs };
      delete newConfigs[id];
      saveWidgetConfigs(newConfigs);
      // You might want to hide the widget or remove it from the DOM
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const customerDistributionData = [
    { id: 0, value: stats?.active_customers || 0, label: 'Active', color: '#10b981' },
    { id: 1, value: (stats?.total_customers || 0) - (stats?.active_customers || 0), label: 'Inactive', color: '#6b7280' },
  ];

  const licenseStatusData = [
    { id: 0, value: stats?.active_licenses || 0, label: 'Active', color: '#3b82f6' },
    { id: 1, value: stats?.suspended_licenses || 0, label: 'Suspended', color: '#f59e0b' },
    { id: 2, value: stats?.expired_licenses || 0, label: 'Expired', color: '#ef4444' },
  ];

  // Revenue data for line chart (last 7 days, 30 days, or 12 months based on period)
  const getRevenueTimeSeriesData = () => {
    // For now, we'll show a trend with available data
    // In production, you'd fetch time-series data from the backend
    const total = stats?.total_revenue || 0;
    const monthly = stats?.monthly_revenue || 0;
    const weekly = stats?.weekly_revenue || 0;
    
    if (timePeriod === 'today' || timePeriod === 'yesterday') {
      return [
        { period: 'Morning', revenue: weekly * 0.3 },
        { period: 'Afternoon', revenue: weekly * 0.5 },
        { period: 'Evening', revenue: weekly * 0.2 },
      ];
    } else if (timePeriod === 'week') {
      return [
        { period: 'Mon', revenue: weekly * 0.1 },
        { period: 'Tue', revenue: weekly * 0.15 },
        { period: 'Wed', revenue: weekly * 0.2 },
        { period: 'Thu', revenue: weekly * 0.15 },
        { period: 'Fri', revenue: weekly * 0.2 },
        { period: 'Sat', revenue: weekly * 0.1 },
        { period: 'Sun', revenue: weekly * 0.1 },
      ];
    } else if (timePeriod === 'month') {
      return [
        { period: 'Week 1', revenue: monthly * 0.25 },
        { period: 'Week 2', revenue: monthly * 0.3 },
        { period: 'Week 3', revenue: monthly * 0.25 },
        { period: 'Week 4', revenue: monthly * 0.2 },
      ];
    } else if (timePeriod === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((month, idx) => ({
        period: month,
        revenue: (total / 12) * (0.8 + Math.random() * 0.4), // Simulate variation
      }));
    }
    
    // Default to weekly
    return [
      { period: 'Week 1', revenue: monthly * 0.2 },
      { period: 'Week 2', revenue: monthly * 0.3 },
      { period: 'Week 3', revenue: monthly * 0.25 },
      { period: 'Week 4', revenue: monthly * 0.25 },
    ];
  };
  
  const revenueData = getRevenueTimeSeriesData();

  const orderStatusData = [
    { status: 'Completed', orders: stats?.completed_orders || 0 },
    { status: 'Pending', orders: stats?.pending_orders || 0 },
  ];

  const invoiceStatusData = [
    { id: 0, value: stats?.paid_invoices || 0, label: 'Paid', color: '#10b981' },
    { id: 1, value: stats?.unpaid_invoices || 0, label: 'Unpaid', color: '#f59e0b' },
    { id: 2, value: stats?.overdue_invoices || 0, label: 'Overdue', color: '#ef4444' },
  ];

  // Calculate percentages for gauges
  const customerActiveRate = stats?.total_customers > 0 
    ? (stats.active_customers / stats.total_customers) * 100 
    : 0;
  
  const licenseActiveRate = stats?.total_licenses > 0 
    ? (stats.active_licenses / stats.total_licenses) * 100 
    : 0;

  const domainActiveRate = stats?.total_domains > 0 
    ? (stats.active_domains / stats.total_domains) * 100 
    : 0;

  return (
    <div className="space-y-6" key={lastUpdate.getTime()}>
      {/* Demo Data Banner */}
      {isUsingDemoData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Demo Data Mode
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  The dashboard is currently displaying demo data. This includes sample products, orders, and customer information to demonstrate the system's capabilities.
                </p>
                <p className="mt-2">
                  <strong>Demo includes:</strong> 6 products, 5 orders, 5 customers, and realistic analytics data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {user?.full_name}! Here's your system overview.
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
              onClick={() => setEditMode(!editMode)}
              className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                editMode
                  ? 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {editMode ? 'Done Editing' : 'Edit Layout'}
            </button>
            <button
              onClick={loadDashboardData}
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
                    // Don't call loadDashboardData here - let useEffect handle it
                    // This ensures the state has updated before loading
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
                  onClick={loadDashboardData}
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

      {/* Key Metrics Row */}
      <div className={`relative ${editMode ? 'min-h-[800px]' : ''}`}>
        {editMode ? (
          <>
            {/* Total Customers Card */}
            <DraggableResizableWidget
              id="widget-customers"
              defaultWidth={280}
              defaultHeight={120}
              minWidth={200}
              minHeight={100}
              config={widgetConfigs['widget-customers'] || { x: 0, y: 0, width: 280, height: 120 }}
              onEdit={handleWidgetEdit}
              onDelete={handleWidgetDelete}
              onResize={handleWidgetResize}
              onPositionChange={handleWidgetPositionChange}
            >
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.total_customers || 0}</dd>
                  </dl>
                </div>
              </div>
            </DraggableResizableWidget>

            {/* Total Orders Card */}
            <DraggableResizableWidget
              id="widget-orders"
              defaultWidth={280}
              defaultHeight={120}
              minWidth={200}
              minHeight={100}
              config={widgetConfigs['widget-orders'] || { x: 300, y: 0, width: 280, height: 120 }}
              onEdit={handleWidgetEdit}
              onDelete={handleWidgetDelete}
              onResize={handleWidgetResize}
              onPositionChange={handleWidgetPositionChange}
            >
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.total_orders || 0}</dd>
                  </dl>
                </div>
              </div>
            </DraggableResizableWidget>

            {/* Total Revenue Card */}
            <DraggableResizableWidget
              id="widget-revenue"
              defaultWidth={280}
              defaultHeight={120}
              minWidth={200}
              minHeight={100}
              config={widgetConfigs['widget-revenue'] || { x: 600, y: 0, width: 280, height: 120 }}
              onEdit={handleWidgetEdit}
              onDelete={handleWidgetDelete}
              onResize={handleWidgetResize}
              onPositionChange={handleWidgetPositionChange}
            >
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(stats?.total_revenue || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </DraggableResizableWidget>

            {/* Active Licenses Card */}
            <DraggableResizableWidget
              id="widget-licenses"
              defaultWidth={280}
              defaultHeight={120}
              minWidth={200}
              minHeight={100}
              config={widgetConfigs['widget-licenses'] || { x: 900, y: 0, width: 280, height: 120 }}
              onEdit={handleWidgetEdit}
              onDelete={handleWidgetDelete}
              onResize={handleWidgetResize}
              onPositionChange={handleWidgetPositionChange}
            >
              <div className="flex items-center h-full">
                <div className="flex-shrink-0">
                  <KeyIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Licenses</dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.active_licenses || 0}</dd>
                  </dl>
                </div>
              </div>
            </DraggableResizableWidget>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Customers Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Customers</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.total_customers || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Orders Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCartIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Orders</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.total_orders || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCardIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Revenue</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(stats?.total_revenue || 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Licenses Card */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <KeyIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Active Licenses</dt>
                      <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.active_licenses || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 1: Customer & License Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                {customerDistributionData.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className="text-sm text-gray-500">Total Customers</div>
              <div className="mt-4 space-y-1">
                {customerDistributionData.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* License Status Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">License Status</h3>
          <div className="h-64">
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-gray-500">Chart placeholder - License Status</p>
            </div>
          </div>
        </div>

        {/* Invoice Status Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <div className="h-64">
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-gray-500">Chart placeholder - Invoice Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Revenue & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Trend Line Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({timePeriod === 'today' ? 'Today' : timePeriod === 'yesterday' ? 'Yesterday' : 
                timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 
                timePeriod === 'year' ? 'Last 12 Months' : 'Custom Period'})
            </span>
          </h3>
          <div className="h-64">
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-gray-500">Chart placeholder - Revenue</p>
            </div>
          </div>
        </div>

        {/* Order Status Bar Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
          <div className="h-64">
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-gray-500">Chart placeholder - Order Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 3: Activity divs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer Active Rate div */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Customer Active Rate</h3>
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center relative" 
                 style={{
                   background: `conic-gradient(${customerActiveRate > 70 ? '#10b981' : customerActiveRate > 50 ? '#f59e0b' : '#ef4444'} ${customerActiveRate * 3.6}deg, #e5e7eb 0deg)`
                 }}>
              <div className="text-center">
                <div className="text-3xl font-bold" 
                     style={{ color: customerActiveRate > 70 ? '#10b981' : customerActiveRate > 50 ? '#f59e0b' : '#ef4444' }}>
                  {customerActiveRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {stats?.active_customers || 0} / {stats?.total_customers || 0} active
          </p>
        </div>

        {/* License Active Rate div */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">License Active Rate</h3>
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center relative" 
                 style={{
                   background: `conic-gradient(${licenseActiveRate > 70 ? '#10b981' : licenseActiveRate > 50 ? '#f59e0b' : '#ef4444'} ${licenseActiveRate * 3.6}deg, #e5e7eb 0deg)`
                 }}>
              <div className="text-center">
                <div className="text-3xl font-bold" 
                     style={{ color: licenseActiveRate > 70 ? '#10b981' : licenseActiveRate > 50 ? '#f59e0b' : '#ef4444' }}>
                  {licenseActiveRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {stats?.active_licenses || 0} / {stats?.total_licenses || 0} active
          </p>
        </div>

        {/* Domain Active Rate div */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Domain Active Rate</h3>
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center relative" 
                 style={{
                   background: `conic-gradient(${domainActiveRate > 70 ? '#10b981' : domainActiveRate > 50 ? '#f59e0b' : '#ef4444'} ${domainActiveRate * 3.6}deg, #e5e7eb 0deg)`
                 }}>
              <div className="text-center">
                <div className="text-3xl font-bold" 
                     style={{ color: domainActiveRate > 70 ? '#10b981' : domainActiveRate > 50 ? '#f59e0b' : '#ef4444' }}>
                  {domainActiveRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {stats?.active_domains || 0} / {stats?.total_domains || 0} active
          </p>
        </div>
      </div>

      {/* Top Customers Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Top Customers by Orders
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({timePeriod === 'today' ? 'Today' : timePeriod === 'yesterday' ? 'Yesterday' : 
                timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 
                timePeriod === 'year' ? 'Last 12 Months' : 'Custom Period'})
            </span>
          </h3>
          <Link 
            href="/customers" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
          >
            View all customers →
          </Link>
        </div>
        
        {(topCustomers && topCustomers.length > 0) ? (
          <>
            {/* Bar Chart */}
            <div className="mb-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Top Customers by Orders</h3>
                <div className="space-y-2">
                  {topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                      <span className="text-sm font-medium text-gray-900">
                        {customer.customer_name || customer.full_name || 'Unknown'}
                      </span>
                      <span className="text-sm text-blue-600 font-semibold">
                        {customer.total_orders || 0} orders
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Licenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(topCustomers || []).map((customer, index) => (
                    <tr key={customer.customer_id || customer.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.customer_name || customer.full_name || 'Unknown Customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.customer_email || customer.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {customer.total_orders || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatCurrency(customer.total_spent || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.active_licenses || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(customer.percentage || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No customer data available for the selected period
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Products</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total_products || 0}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <Link href="/products" className="mt-3 text-sm text-indigo-600 hover:text-indigo-900">
            Manage →
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Subscriptions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.active_subscriptions || 0}</p>
            </div>
            <CubeIcon className="h-8 w-8 text-purple-600" />
          </div>
          <Link href="/subscriptions" className="mt-3 text-sm text-indigo-600 hover:text-indigo-900">
            View →
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Invoices</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total_invoices || 0}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {stats?.overdue_invoices || 0} overdue
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Domains</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total_domains || 0}</p>
            </div>
            <GlobeAltIcon className="h-8 w-8 text-green-600" />
          </div>
          <Link href="/domains" className="mt-3 text-sm text-indigo-600 hover:text-indigo-900">
            Manage →
          </Link>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 24 Hours)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{stats?.recent_signups || 0}</div>
            <div className="text-sm text-gray-600 mt-1">New Signups</div>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <div className="text-3xl font-bold text-green-600">{stats?.recent_payments || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Payments Received</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats?.recent_orders || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Orders Placed</div>
          </div>
        </div>
      </div>

      {/* Real-time Status Info */}
      <div className={`border rounded-lg p-4 ${
        realtimeEnabled ? (isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {realtimeEnabled ? (
              isConnected ? (
                <SignalIcon className="h-5 w-5 text-green-600" />
              ) : (
                <SignalIcon className="h-5 w-5 text-red-600" />
              )
            ) : (
              <ClockIcon className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm ${realtimeEnabled ? (isConnected ? 'text-green-800' : 'text-red-800') : 'text-blue-800'}`}>
              {realtimeEnabled ? (
                isConnected ? (
                  <><span className="font-medium">Real-time Mode Active:</span> Dashboard updates automatically when new orders, payments, or customer activity occurs. No polling needed!</>
                ) : (
                  <><span className="font-medium">Connection Lost:</span> Attempting to reconnect... The dashboard will resume automatic updates once reconnected.</>
                )
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
