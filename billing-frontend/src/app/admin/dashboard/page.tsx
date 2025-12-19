'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { DashboardElement } from '@/components/admin/DashboardCustomization';
import DashboardBlockEditModal from '@/components/admin/DashboardBlockEditModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
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
  LinkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>(() => {
    // Load default time period from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_default_time_period');
      return saved || 'week';
    }
    return 'week';
  });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [revenueTimeSeries, setRevenueTimeSeries] = useState<Array<{period: string; revenue: number}>>([]);
  const [customerTimeSeries, setCustomerTimeSeries] = useState<Array<{period: string; customers: number}>>([]);
  const [orderTimeSeries, setOrderTimeSeries] = useState<Array<{period: string; orders: number}>>([]);
  const [dashboardElements, setDashboardElements] = useState<DashboardElement[]>([]);
  const [editingBlock, setEditingBlock] = useState<DashboardElement | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    // Build query params for all endpoints (declare outside try for error handling)
    let params = `period=${timePeriod}`;
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      // Convert date strings to ISO datetime format for FastAPI
      // Start date: beginning of day (00:00:00)
      // End date: end of day (23:59:59)
      const startDateTime = `${customStartDate}T00:00:00Z`;
      const endDateTime = `${customEndDate}T23:59:59Z`;
      params += `&start_date=${encodeURIComponent(startDateTime)}&end_date=${encodeURIComponent(endDateTime)}`;
    } else if (timePeriod === 'custom') {
      // If custom period is selected but dates are missing, don't make the request
      console.warn('Custom period selected but dates are missing');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('📊 Loading dashboard stats...');
      console.log('Request params:', params);
      
      // Make requests with individual error handling
      const [statsResponse, customersResponse, revenueResponse, customerTrendResponse, orderTrendResponse] = await Promise.allSettled([
          api.get(`/dashboard/stats?${params}`),
          api.get(`/dashboard/customers/analytics?${params}`),
          api.get(`/dashboard/revenue/time-series?${params}`),
          api.get(`/dashboard/customers/time-series?${params}`),
          api.get(`/dashboard/orders/time-series?${params}`),
      ]);
      
      // Handle stats response
      if (statsResponse.status === 'rejected') {
        console.error('Failed to load stats:', statsResponse.reason);
        throw statsResponse.reason;
      }
      
      // Handle customers response
      if (customersResponse.status === 'rejected') {
        console.error('Failed to load customers:', customersResponse.reason);
        throw customersResponse.reason;
      }
      
      // Handle revenue response (optional, can fail silently)
      const revenueData = revenueResponse.status === 'fulfilled' 
        ? revenueResponse.value.data 
        : { data: [] };
      
      // Handle customer trend response (optional, can fail silently)
      const customerTrendData = customerTrendResponse.status === 'fulfilled' 
        ? customerTrendResponse.value.data 
        : { data: [] };
      
      // Handle order trend response (optional, can fail silently)
      const orderTrendData = orderTrendResponse.status === 'fulfilled' 
        ? orderTrendResponse.value.data 
        : { data: [] };
      
      // Use real data from API
        setStats({
          ...statsResponse.value.data,
          _timestamp: Date.now(),
        });
        
      setTopCustomers(Array.isArray(customersResponse.value.data?.top_customers) ? customersResponse.value.data.top_customers : []);
      setRevenueTimeSeries(Array.isArray(revenueData?.data) ? revenueData.data : []);
      setCustomerTimeSeries(Array.isArray(customerTrendData?.data) ? customerTrendData.data : []);
      setOrderTimeSeries(Array.isArray(orderTrendData?.data) ? orderTrendData.data : []);
        setLastUpdate(new Date());
        console.log('✅ Dashboard stats loaded from API');
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        console.error('Request URL:', error.config?.url);
        console.error('Request params:', params);
      }
      // Set empty stats if API fails
      setStats({
        total_customers: 0,
        total_orders: 0,
        total_revenue: 0,
        active_customers: 0,
        active_licenses: 0,
        total_licenses: 0,
        suspended_licenses: 0,
        expired_licenses: 0,
        total_domains: 0,
        active_domains: 0,
        completed_orders: 0,
        pending_orders: 0,
        paid_invoices: 0,
        unpaid_invoices: 0,
        overdue_invoices: 0,
        total_invoices: 0,
        monthly_revenue: 0,
        weekly_revenue: 0,
        total_products: 0,
        active_subscriptions: 0,
        recent_signups: 0,
        recent_payments: 0,
        recent_orders: 0,
      });
      setTopCustomers([]);
      setRevenueTimeSeries([]);
      setCustomerTimeSeries([]);
      setOrderTimeSeries([]);
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
  }, [loadDashboardData]);

  // Load dashboard customization
  useEffect(() => {
    const loadCustomization = () => {
      const saved = localStorage.getItem('dashboard_elements_customization');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDashboardElements(parsed);
          }
        } catch (e) {
          console.error('Failed to load dashboard customization:', e);
        }
      }
      
      // Load default time period
      const savedTimePeriod = localStorage.getItem('dashboard_default_time_period');
      if (savedTimePeriod) {
        setTimePeriod(savedTimePeriod);
      }
    };

    loadCustomization();

    // Listen for storage changes (when customization is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard_elements_customization') {
        loadCustomization();
      } else if (e.key === 'dashboard_default_time_period') {
        if (e.newValue) {
          setTimePeriod(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event (for same-window updates)
    const handleCustomStorageChange = () => {
      loadCustomization();
      // Also update time period if changed
      const savedTimePeriod = localStorage.getItem('dashboard_default_time_period');
      if (savedTimePeriod) {
        setTimePeriod(savedTimePeriod);
      }
    };
    
    window.addEventListener('dashboardCustomizationUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dashboardCustomizationUpdated', handleCustomStorageChange);
    };
  }, []);

  // Helper function to get width class (for 12-column grid)
  const getWidthClass = (width?: string) => {
    switch (width) {
      case '1/4': return 'lg:col-span-3';
      case '1/3': return 'lg:col-span-4';
      case '1/2': return 'lg:col-span-6';
      case '2/3': return 'lg:col-span-8';
      case '3/4': return 'lg:col-span-9';
      case 'full':
      default: return 'lg:col-span-12';
    }
  };

  // Helper function to check if element is visible
  const isElementVisible = (elementId: string) => {
    if (dashboardElements.length === 0) return true; // Show all if no customization
    const element = dashboardElements.find(el => el.id === elementId);
    return element ? element.visible : true; // Default to visible if not found
  };

  // Helper function to get element width
  const getElementWidth = (elementId: string) => {
    if (dashboardElements.length === 0) return 'full';
    const element = dashboardElements.find(el => el.id === elementId);
    return element?.width || 'full';
  };

  // Helper function to get element order (for CSS ordering)
  const getElementOrder = (elementId: string) => {
    if (dashboardElements.length === 0) return 0;
    const element = dashboardElements.find(el => el.id === elementId);
    return element?.order ?? 999; // Default to high number if not found
  };

  // Handle block edit
  const handleEditBlock = (elementId: string) => {
    const element = dashboardElements.find(el => el.id === elementId);
    if (element) {
      setEditingBlock(element);
      setIsEditModalOpen(true);
    }
  };

  // Handle block update
  const handleUpdateBlock = (updatedElement: DashboardElement) => {
    const updatedElements = dashboardElements.map(el =>
      el.id === updatedElement.id ? updatedElement : el
    );
    setDashboardElements(updatedElements);
    localStorage.setItem('dashboard_elements_customization', JSON.stringify(updatedElements));
    
    // Trigger custom event to notify other components
    window.dispatchEvent(new CustomEvent('dashboardCustomizationUpdated'));
    
    setNotification('Block updated successfully!');
    setTimeout(() => setNotification(null), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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

  // Use real revenue time-series data from API
  const revenueData = revenueTimeSeries.length > 0 
    ? revenueTimeSeries 
    : [{ period: 'No Data', revenue: 0 }];

  // Use real customer time-series data from API
  const customerData = customerTimeSeries.length > 0 
    ? customerTimeSeries 
    : [{ period: 'No Data', customers: 0 }];

  // Use real order time-series data from API
  const orderData = orderTimeSeries.length > 0 
    ? orderTimeSeries 
    : [{ period: 'No Data', orders: 0 }];

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
  const customerActiveRate = stats && stats.total_customers > 0 
    ? (stats.active_customers || 0) / stats.total_customers * 100 
    : 0;
  
  const licenseActiveRate = stats && stats.total_licenses > 0 
    ? (stats.active_licenses || 0) / stats.total_licenses * 100 
    : 0;

  const domainActiveRate = stats && stats.total_domains > 0 
    ? (stats.active_domains || 0) / stats.total_domains * 100 
    : 0;

  // Create sorted list of dashboard sections by order
  const dashboardSections = [
    { id: 'quick-stats', elementIds: ['quick-stats'], order: getElementOrder('quick-stats') },
    { id: 'charts-row-1', elementIds: ['customer-distribution', 'license-status', 'invoice-status'], order: Math.min(
      getElementOrder('customer-distribution'),
      getElementOrder('license-status'),
      getElementOrder('invoice-status')
    ) },
    { id: 'charts-row-2', elementIds: ['revenue-trend', 'customer-trend', 'order-trend', 'order-status'], order: Math.min(
      getElementOrder('revenue-trend'),
      getElementOrder('customer-trend'),
      getElementOrder('order-trend'),
      getElementOrder('order-status')
    ) },
    { id: 'gauges-row', elementIds: ['customer-active-rate', 'license-active-rate', 'domain-active-rate'], order: Math.min(
      getElementOrder('customer-active-rate'),
      getElementOrder('license-active-rate'),
      getElementOrder('domain-active-rate')
    ) },
    { id: 'top-customers', elementIds: ['top-customers'], order: getElementOrder('top-customers') },
    { id: 'recent-activity', elementIds: ['recent-activity'], order: getElementOrder('recent-activity') },
    { id: 'realtime-status', elementIds: ['realtime-status'], order: getElementOrder('realtime-status') },
  ].filter(section => section.elementIds.some(id => isElementVisible(id)))
   .sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Mobile: Show only essential items */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Real-time Status - Always visible */}
              <div className={`flex items-center space-x-2 px-2 sm:px-3 py-1 rounded-full ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <SignalIcon className={`h-4 w-4 ${isConnected ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium hidden min-[375px]:inline">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>

              {/* Refresh Button - Always visible */}
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-1 sm:flex-initial"
              >
                <ArrowPathIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Desktop: Show additional info */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                Updated: {lastUpdate.toLocaleTimeString()}
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
            </div>

            {/* Mobile: Show timestamp and real-time toggle in a row below */}
            <div className="flex items-center justify-between w-full sm:hidden text-xs text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                {lastUpdate.toLocaleTimeString()}
              </div>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={realtimeEnabled}
                  onChange={(e) => setRealtimeEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                />
                <span className="text-xs text-gray-700">Real-time</span>
              </label>
            </div>
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
      {isElementVisible('key-metrics') && (
      <div 
        key={`key-metrics-${getElementOrder('key-metrics')}`}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        style={{ order: getElementOrder('key-metrics') }}
      >
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

      {/* Charts Row 1: Customer & License Distribution */}
      {(isElementVisible('customer-distribution') || isElementVisible('license-status') || isElementVisible('invoice-status')) && (
      <div 
        key={`charts-row-1-${Math.min(
          getElementOrder('customer-distribution'),
          getElementOrder('license-status'),
          getElementOrder('invoice-status')
        )}`}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5" 
        style={{ order: Math.min(
          getElementOrder('customer-distribution'),
          getElementOrder('license-status'),
          getElementOrder('invoice-status')
        ) }}
      >
        {/* Customer Distribution Chart */}
        {isElementVisible('customer-distribution') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('customer-distribution'))}`}>
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
        )}

        {/* License Status Chart */}
        {isElementVisible('license-status') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('license-status'))} relative group`}>
          <button
            onClick={() => handleEditBlock('license-status')}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit block"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">License Status</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: licenseStatusData.map(item => item.label),
                datasets: [
                  {
                    label: 'Licenses',
                    data: licenseStatusData.map(item => item.value),
                    backgroundColor: licenseStatusData.map(item => item.color),
                    borderColor: licenseStatusData.map(item => item.color),
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        )}

        {/* Invoice Status Chart */}
        {isElementVisible('invoice-status') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('invoice-status'))} relative group`}>
          <button
            onClick={() => handleEditBlock('invoice-status')}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit block"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: invoiceStatusData.map(item => item.label),
                datasets: [
                  {
                    label: 'Invoices',
                    data: invoiceStatusData.map(item => item.value),
                    backgroundColor: invoiceStatusData.map(item => item.color),
                    borderColor: invoiceStatusData.map(item => item.color),
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        )}
      </div>
      )}

      {/* Charts Row 2: Revenue, Customer & Order Trends */}
      {(isElementVisible('revenue-trend') || isElementVisible('customer-trend') || isElementVisible('order-trend') || isElementVisible('order-status')) && (
      <div 
        key={`charts-row-2-${Math.min(
          getElementOrder('revenue-trend'),
          getElementOrder('customer-trend'),
          getElementOrder('order-trend'),
          getElementOrder('order-status')
        )}`}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5" 
        style={{ order: Math.min(
          getElementOrder('revenue-trend'),
          getElementOrder('customer-trend'),
          getElementOrder('order-trend'),
          getElementOrder('order-status')
        ) }}
      >
        {/* Revenue Trend Line Chart */}
        {isElementVisible('revenue-trend') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('revenue-trend'))} relative group`}>
          <button
            onClick={() => handleEditBlock('revenue-trend')}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit block"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({timePeriod === 'today' ? 'Today' : timePeriod === 'yesterday' ? 'Yesterday' : 
                timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 
                timePeriod === 'year' ? 'Last 12 Months' : 'Custom Period'})
            </span>
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: revenueData.map(item => item.period),
                datasets: [
                  {
                    label: 'Revenue',
                    data: revenueData.map(item => item.revenue),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                      label: function(context) {
                        return `Revenue: ${formatCurrency(context.parsed.y)}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value as number);
                      },
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        )}

        {/* Order Status Bar Chart */}
        {isElementVisible('order-status') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('order-status'))} relative group`}>
          <button
            onClick={() => handleEditBlock('order-status')}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit block"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
          <div className="h-64">
            <Bar
              data={{
                labels: orderStatusData.map(item => item.status),
                datasets: [
                  {
                    label: 'Orders',
                    data: orderStatusData.map(item => item.orders),
                    backgroundColor: ['#10b981', '#f59e0b'],
                    borderColor: ['#10b981', '#f59e0b'],
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        )}
      </div>
      )}

      {/* Charts Row 3: Activity divs */}
      {(isElementVisible('customer-active-rate') || isElementVisible('license-active-rate') || isElementVisible('domain-active-rate')) && (
      <div 
        key={`gauges-row-${Math.min(
          getElementOrder('customer-active-rate'),
          getElementOrder('license-active-rate'),
          getElementOrder('domain-active-rate')
        )}`}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5" 
        style={{ order: Math.min(
          getElementOrder('customer-active-rate'),
          getElementOrder('license-active-rate'),
          getElementOrder('domain-active-rate')
        ) }}
      >
        {/* Customer Active Rate div */}
        {isElementVisible('customer-active-rate') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('customer-active-rate'))} relative group`}>
          <button
            onClick={() => handleEditBlock('customer-active-rate')}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit block"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
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
        )}

        {/* License Active Rate div */}
        {isElementVisible('license-active-rate') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('license-active-rate'))} relative group`}>
          <button
            onClick={() => handleEditBlock('license-active-rate')}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit block"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
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
        )}

        {/* Domain Active Rate div */}
        {isElementVisible('domain-active-rate') && (
        <div className={`bg-white shadow rounded-lg p-6 ${getWidthClass(getElementWidth('domain-active-rate'))} relative group`}>
          <button
            onClick={() => handleEditBlock('domain-active-rate')}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit block"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
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
        )}
      </div>
      )}

      {/* Top Customers Section */}
      {isElementVisible('top-customers') && (
      <div 
        key={`top-customers-${getElementOrder('top-customers')}`}
        className="bg-white shadow rounded-lg p-6 relative group" 
        style={{ order: getElementOrder('top-customers') }}
      >
        <button
          onClick={() => handleEditBlock('top-customers')}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit block"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
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
      )}

      {/* Quick Stats Grid */}
      {isElementVisible('quick-stats') && (
      <div 
        key={`quick-stats-${getElementOrder('quick-stats')}`}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative group" 
        style={{ order: getElementOrder('quick-stats') }}
      >
        <button
          onClick={() => handleEditBlock('quick-stats')}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
          title="Edit block"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
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
      )}

      {/* Recent Activity Summary */}
      {isElementVisible('recent-activity') && (
      <div 
        key={`recent-activity-${getElementOrder('recent-activity')}`}
        className="bg-white shadow rounded-lg p-6 relative group" 
        style={{ order: getElementOrder('recent-activity') }}
      >
        <button
          onClick={() => handleEditBlock('recent-activity')}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit block"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
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
      )}

      {/* Real-time Status Info */}
      {isElementVisible('realtime-status') && (
      <div 
        key={`realtime-status-${getElementOrder('realtime-status')}`}
        className={`border rounded-lg p-4 ${
          realtimeEnabled ? (isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-blue-50 border-blue-200'
        }`}
        style={{ order: getElementOrder('realtime-status') }}
      >
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
      )}

      {/* Custom Blocks */}
      {(() => {
        const customBlocks = dashboardElements
          .filter(el => el.isCustom && el.type === 'custom' && el.buttons && el.buttons.length > 0)
          .sort((a, b) => a.order - b.order)
          .filter(el => isElementVisible(el.id));

        if (customBlocks.length === 0) return null;

        // Dynamic icon import helper
        const getIconComponent = (iconName?: string) => {
          if (!iconName) return LinkIcon;
          // Map common icon names to components
          const iconMap: { [key: string]: any } = {
            'HomeIcon': UserGroupIcon,
            'UserIcon': UserGroupIcon,
            'UserGroupIcon': UserGroupIcon,
            'ShoppingCartIcon': ShoppingCartIcon,
            'KeyIcon': KeyIcon,
            'GlobeAltIcon': GlobeAltIcon,
            'DocumentTextIcon': DocumentTextIcon,
            'CubeIcon': CubeIcon,
            'CreditCardIcon': CreditCardIcon,
            'BellAlertIcon': BellAlertIcon,
            'ArrowPathIcon': ArrowPathIcon,
          };
          return iconMap[iconName] || LinkIcon;
        };

        // Group custom blocks that should be in the same row
        const blocksByRow: DashboardElement[][] = [];
        let currentRow: DashboardElement[] = [];
        let currentRowWidth = 0;

        customBlocks.forEach((element) => {
          const widthValue = element.width || 'full';
          const widthNum = widthValue === 'full' ? 12 : 
                          widthValue === '1/2' ? 6 :
                          widthValue === '1/3' ? 4 :
                          widthValue === '1/4' ? 3 :
                          widthValue === '2/3' ? 8 :
                          widthValue === '3/4' ? 9 : 12;

          if (currentRowWidth + widthNum > 12 && currentRow.length > 0) {
            blocksByRow.push(currentRow);
            currentRow = [element];
            currentRowWidth = widthNum;
          } else {
            currentRow.push(element);
            currentRowWidth += widthNum;
          }
        });

        if (currentRow.length > 0) {
          blocksByRow.push(currentRow);
        }

        return blocksByRow.map((row, rowIndex) => (
          <div key={`custom-row-${rowIndex}`} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {row.map((element) => (
              <div key={element.id} className={`bg-white shadow rounded-lg p-6 ${getWidthClass(element.width || 'full')}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{element.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {element.buttons?.map((button) => {
                    const IconComponent = getIconComponent(button.icon);
                    return (
                      <Link
                        key={button.id}
                        href={button.link}
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors"
                      >
                        <IconComponent className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900">{button.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ));
      })()}

      {/* Block Edit Modal */}
      <DashboardBlockEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBlock(null);
        }}
        element={editingBlock}
        onUpdate={handleUpdateBlock}
      />

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
