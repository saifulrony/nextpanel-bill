'use client';

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { invoicesAPI, adminAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  order_id?: string | null;
  subscription_id?: string | null;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  invoice_date: string;
  due_date?: string | null;
  paid_at?: string | null;
  items: any[];
  is_recurring: boolean;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
  order?: {
    id: string;
    order_number: string;
  };
}

interface InvoiceStats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  overdue_amount: number;
  open_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
}

export default function AdminInvoicesPage() {
  const { user } = useAuth();
  const isAdmin = (user as any)?.is_admin === true;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // all, order, subscription, manual
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchTerm, statusFilter, sourceFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all invoices (API now supports admin view)
      const response = await invoicesAPI.list({ limit: 1000 });
      
      // Handle different response formats
      let invoicesData: Invoice[] = [];
      if (Array.isArray(response.data)) {
        invoicesData = response.data;
      } else if (Array.isArray(response)) {
        invoicesData = response;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        invoicesData = response.data.data;
      }
      
      // Set invoices
      setInvoices(invoicesData);

      // Calculate stats
      calculateStats(invoicesData);
    } catch (error: any) {
      console.error('Failed to load invoices:', error);
      const errorDetails = error.response?.data || error.message;
      console.error('Error details:', errorDetails);
      console.error('Full error response:', error.response);
      setInvoices([]);
      // Show detailed error to user
      if (error.response?.status === 500) {
        const errorMsg = errorDetails?.detail || errorDetails?.message || errorDetails || 'Unknown server error';
        alert(`Server error loading invoices: ${JSON.stringify(errorMsg)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoicesData: Invoice[]) => {
    const now = new Date();
    const stats: InvoiceStats = {
      total_invoices: invoicesData.length,
      total_amount: invoicesData.reduce((sum, inv) => sum + (inv.total || 0), 0),
      paid_amount: invoicesData
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0),
      outstanding_amount: invoicesData
        .filter(inv => inv.status === 'open' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + (inv.amount_due || inv.total || 0), 0),
      overdue_amount: invoicesData
        .filter(inv => {
          if (inv.status !== 'overdue' && inv.status !== 'open') return false;
          if (!inv.due_date) return false;
          return new Date(inv.due_date) < now;
        })
        .reduce((sum, inv) => sum + (inv.amount_due || inv.total || 0), 0),
      open_invoices: invoicesData.filter(inv => inv.status === 'open').length,
      paid_invoices: invoicesData.filter(inv => inv.status === 'paid').length,
      overdue_invoices: invoicesData.filter(inv => inv.status === 'overdue').length,
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        inv =>
          inv.invoice_number?.toLowerCase().includes(term) ||
          inv.user?.email?.toLowerCase().includes(term) ||
          inv.user?.full_name?.toLowerCase().includes(term) ||
          inv.order?.order_number?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'order') {
        filtered = filtered.filter(inv => inv.order_id);
      } else if (sourceFilter === 'subscription') {
        filtered = filtered.filter(inv => inv.subscription_id);
      } else if (sourceFilter === 'manual') {
        filtered = filtered.filter(inv => !inv.order_id && !inv.subscription_id);
      }
    }

    setFilteredInvoices(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'void':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'open':
        return <ClockIcon className="h-4 w-4" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getSourceBadge = (invoice: Invoice) => {
    if (invoice.order_id) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          From Order
        </span>
      );
    } else if (invoice.subscription_id) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
          From Subscription
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          Manual
        </span>
      );
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await invoicesAPI.downloadPDF(invoiceId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="px-4 py-8 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <p className="mt-1 text-sm text-red-700">You need admin privileges to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">Manage all billing invoices from orders and subscriptions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_invoices}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Paid Amount</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.paid_amount.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Outstanding</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.outstanding_amount.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.overdue_amount.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="all">All Sources</option>
            <option value="order">From Orders</option>
            <option value="subscription">From Subscriptions</option>
            <option value="manual">Manual Invoices</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.user?.full_name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">{invoice.user?.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSourceBadge(invoice)}
                    {invoice.order_id && (
                      <Link
                        href={`/admin/orders?order=${invoice.order_id}`}
                        className="ml-2 text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        View Order
                      </Link>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${invoice.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {getStatusIcon(invoice.status)}
                      <span className="ml-1 capitalize">{invoice.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoice_number)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Invoice {selectedInvoice.invoice_number}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Customer</h4>
                  <p className="text-sm text-gray-600">
                    {selectedInvoice.user?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedInvoice.user?.email || ''}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Invoice Details</h4>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(selectedInvoice.invoice_date || selectedInvoice.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Due: {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status:{' '}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                        selectedInvoice.status
                      )}`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </p>
                </div>
              </div>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Price
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.description || item.product_name || 'Item'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity || 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            ${(item.price || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium">
                          Subtotal:
                        </td>
                        <td className="px-4 py-2 text-sm font-medium">
                          ${selectedInvoice.subtotal.toFixed(2)}
                        </td>
                      </tr>
                      {selectedInvoice.tax > 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium">
                            Tax:
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            ${selectedInvoice.tax.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-sm font-bold">
                          ${selectedInvoice.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.invoice_number)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

