'use client';

import { useState, useEffect } from 'react';
import { reportsAPI } from '@/lib/api';
import { DocumentArrowDownIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadRevenueSummary();
  }, []);

  const loadRevenueSummary = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      };
      const response = await reportsAPI.getRevenueSummary(params);
      setRevenueSummary(response.data);
    } catch (error: any) {
      console.error('Failed to load revenue summary:', error);
      alert(`Failed to load revenue summary: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrders = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      };
      const response = await reportsAPI.exportOrders(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_export_${dateRange.start_date}_to_${dateRange.end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('Orders exported successfully!');
    } catch (error: any) {
      console.error('Failed to export orders:', error);
      alert(`Failed to export orders: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      };
      const response = await reportsAPI.exportInvoices(params);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_export_${dateRange.start_date}_to_${dateRange.end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('Invoices exported successfully!');
    } catch (error: any) {
      console.error('Failed to export invoices:', error);
      alert(`Failed to export invoices: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !revenueSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Export</h1>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={loadRevenueSummary}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              ${revenueSummary.revenue.total.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {revenueSummary.revenue.invoice_count} invoices
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Tax Collected</p>
            <p className="text-3xl font-bold text-blue-600">
              ${revenueSummary.revenue.tax.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Net Revenue</p>
            <p className="text-3xl font-bold text-indigo-600">
              ${revenueSummary.revenue.net.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-purple-600">
              ${revenueSummary.orders.total.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {revenueSummary.orders.count} orders
            </p>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Export Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportOrders}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <DocumentArrowDownIcon className="h-8 w-8 text-indigo-600" />
            <div className="text-left">
              <p className="font-semibold">Export Orders</p>
              <p className="text-sm text-gray-500">Download orders as CSV</p>
            </div>
          </button>

          <button
            onClick={handleExportInvoices}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            <DocumentArrowDownIcon className="h-8 w-8 text-indigo-600" />
            <div className="text-left">
              <p className="font-semibold">Export Invoices</p>
              <p className="text-sm text-gray-500">Download invoices as CSV</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

