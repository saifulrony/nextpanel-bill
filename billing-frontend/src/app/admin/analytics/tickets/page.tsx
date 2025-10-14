'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowPathIcon,
  SignalIcon,
  BellAlertIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function SupportTicketsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('month');

  // Mock ticket data since we don't have support tickets in the backend yet
  const generateMockTicketStats = useCallback(() => {
    const totalCustomers = stats?.total_customers || 100;
    const baseTickets = Math.floor(totalCustomers * 0.15); // 15% of customers create tickets
    
    return {
      total_tickets: baseTickets,
      open_tickets: Math.floor(baseTickets * 0.25),
      resolved_tickets: Math.floor(baseTickets * 0.70),
      pending_tickets: Math.floor(baseTickets * 0.05),
      high_priority: Math.floor(baseTickets * 0.10),
      medium_priority: Math.floor(baseTickets * 0.35),
      low_priority: Math.floor(baseTickets * 0.55),
      avg_response_time: 2.5, // hours
      avg_resolution_time: 8.3, // hours
      customer_satisfaction: 4.2, // out of 5
      tickets_this_month: Math.floor(baseTickets * 0.4),
      tickets_this_week: Math.floor(baseTickets * 0.1),
    };
  }, [stats]);

  const loadSupportData = useCallback(async () => {
    try {
      console.log('🎫 Loading support ticket data...');
      
      let params = `period=${timePeriod}`;
      
      const response = await api.get(`/dashboard/stats?${params}`);
      
      setStats({
        ...response.data,
        _timestamp: Date.now(),
      });
      
      setLastUpdate(new Date());
      console.log('✅ Support ticket data loaded');
    } catch (error) {
      console.error('Failed to load support data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod]);

  // Real-time updates hook
  const { isConnected } = useRealtimeUpdates({
    enabled: realtimeEnabled,
    onDataChange: () => {
      console.log('📊 Data changed - refreshing support data...');
      loadSupportData();
    },
  });

  useEffect(() => {
    loadSupportData();
  }, [loadSupportData]);

  const ticketStats = useMemo(() => {
    if (!stats) return null;
    return generateMockTicketStats();
  }, [stats, generateMockTicketStats]);

  // Generate ticket trend data
  const ticketTrendData = useMemo(() => {
    if (!ticketStats) return [];
    
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
    
    const totalTickets = ticketStats.total_tickets || 0;
    const resolvedTickets = ticketStats.resolved_tickets || 0;
    
    return periods.map((period, index) => ({
      period,
      newTickets: Math.floor(totalTickets / dataPoints * (0.8 + Math.random() * 0.4)),
      resolvedTickets: Math.floor(resolvedTickets / dataPoints * (0.8 + Math.random() * 0.4)),
      responseTime: 1 + Math.random() * 4, // 1-5 hours
    }));
  }, [ticketStats, timePeriod]);

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading support analytics...</p>
        </div>
      </div>
    );
  }

  if (!ticketStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <p className="mt-1 text-sm text-gray-600">
              Support performance metrics and ticket analytics
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
              onClick={loadSupportData}
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

      {/* Support Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tickets */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-100 truncate">Total Tickets</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {ticketStats.total_tickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-100 truncate">Resolved</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {ticketStats.resolved_tickets}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold">
                      <span className="text-green-200">
                        ({((ticketStats.resolved_tickets / ticketStats.total_tickets) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-red-100 truncate">Open Tickets</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {ticketStats.open_tickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-purple-100 truncate">Avg Response</dt>
                  <dd className="text-2xl font-semibold text-white">
                    {formatHours(ticketStats.avg_response_time)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trends Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ticket Trends
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 'Last 12 Months'})
            </span>
          </h3>
{/* <LineChart ... /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>

        {/* Ticket Priority Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
{/* <PieChart ... /> */}
          <div className="text-center py-12 text-gray-500">Chart placeholder</div>
        </div>
      </div>

      {/* Response Time Performance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Performance</h3>
{/* <BarChart ... /> */}
        <div className="text-center py-12 text-gray-500">Chart placeholder</div>
      </div>

      {/* Detailed Support Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Total Tickets</span>
              <span className="text-sm font-semibold text-gray-900">{ticketStats.total_tickets}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Resolved Tickets</span>
              <span className="text-sm font-semibold text-green-600">{ticketStats.resolved_tickets}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Open Tickets</span>
              <span className="text-sm font-semibold text-red-600">{ticketStats.open_tickets}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Pending Tickets</span>
              <span className="text-sm font-semibold text-yellow-600">{ticketStats.pending_tickets}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Resolution Rate</span>
              <span className="text-sm font-semibold text-blue-600">
                {((ticketStats.resolved_tickets / ticketStats.total_tickets) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatHours(ticketStats.avg_response_time)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Avg Resolution Time</span>
              <span className="text-sm font-semibold text-purple-600">
                {formatHours(ticketStats.avg_resolution_time)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">First Response SLA</span>
              <span className="text-sm font-semibold text-green-600">94.2%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Resolution SLA</span>
              <span className="text-sm font-semibold text-green-600">87.5%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Escalation Rate</span>
              <span className="text-sm font-semibold text-orange-600">12.3%</span>
            </div>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction</h3>
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                {ticketStats.customer_satisfaction.toFixed(1)}/5.0
              </div>
              <div className="flex justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-2xl ${i < Math.floor(ticketStats.customer_satisfaction) ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Very Satisfied</span>
              <div className="flex items-center">
                <FaceSmileIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-semibold text-green-600">68%</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Satisfied</span>
              <span className="text-sm font-semibold text-blue-600">24%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Neutral</span>
              <span className="text-sm font-semibold text-yellow-600">5%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Unsatisfied</span>
              <div className="flex items-center">
                <FaceFrownIcon className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm font-semibold text-red-600">3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">High Priority</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">{ticketStats.high_priority}</span>
                <span className="text-xs text-gray-500">
                  ({((ticketStats.high_priority / ticketStats.total_tickets) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Medium Priority</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">{ticketStats.medium_priority}</span>
                <span className="text-xs text-gray-500">
                  ({((ticketStats.medium_priority / ticketStats.total_tickets) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Low Priority</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">{ticketStats.low_priority}</span>
                <span className="text-xs text-gray-500">
                  ({((ticketStats.low_priority / ticketStats.total_tickets) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Tickets This Month</span>
              <span className="text-sm font-semibold text-blue-600">{ticketStats.tickets_this_month}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Tickets This Week</span>
              <span className="text-sm font-semibold text-green-600">{ticketStats.tickets_this_week}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Avg Daily Volume</span>
              <span className="text-sm font-semibold text-purple-600">
                {Math.floor(ticketStats.total_tickets / 30)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Peak Hour</span>
              <span className="text-sm font-semibold text-orange-600">2-4 PM</span>
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
