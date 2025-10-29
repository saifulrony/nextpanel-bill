'use client';

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { ordersAPI } from '@/lib/api';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  description: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer_name?: string;
  customer_email?: string;
  payment_method?: string;
  payment_status?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  due_date: string;
  total: number;
  status: string;
  description?: string;
  items?: any[];
  subtotal?: number;
  tax_amount?: number;
  customer_name?: string;
  customer_email?: string;
  payment_method?: string;
  payment_status?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Function to convert order to invoice format
  const convertOrderToInvoice = (order: Order): Invoice => {
    const items: InvoiceItem[] = order.items?.map((item: any, index: number) => ({
      id: item.id || index.toString(),
      description: item.product_name || item.name || item.description || 'Service',
      quantity: item.quantity || 1,
      price: item.price || item.unit_price || 0,
      total: (item.price || item.unit_price || 0) * (item.quantity || 1)
    })) || [];

    // Map order status to invoice status
    const getInvoiceStatus = (orderStatus: string): 'paid' | 'pending' | 'overdue' | 'draft' => {
      switch (orderStatus.toLowerCase()) {
        case 'completed':
        case 'paid':
          return 'paid';
        case 'pending':
        case 'processing':
          return 'pending';
        case 'overdue':
        case 'cancelled':
          return 'overdue';
        default:
          return 'draft';
      }
    };

    return {
      id: order.id,
      number: order.order_number, // Use order_number
      date: order.created_at,
      dueDate: order.due_date,
      amount: order.total,
      status: getInvoiceStatus(order.status),
      description: order.description || `Order ${order.order_number}`,
      items,
      subtotal: order.subtotal || order.total,
      tax: order.tax_amount || 0,
      total: order.total,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      payment_method: order.payment_method,
      payment_status: order.payment_status
    };
  };

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch orders from API
        const response = await ordersAPI.list();
        
        if (response.data && Array.isArray(response.data)) {
          const convertedInvoices = response.data.map(convertOrderToInvoice);
          setInvoices(convertedInvoices);
        } else {
          setInvoices([]);
        }
      } catch (error: any) {
        console.error('Failed to load invoices:', error);
        setError('Failed to load invoices. Please try again later.');
        
        // Fallback to demo data if API fails
        setInvoices([
          {
            id: 'demo-1',
            number: 'INV-2024-001',
            date: '2024-01-15',
            dueDate: '2024-02-15',
            amount: 89.99,
            status: 'paid',
            description: 'Professional Hosting - January 2024',
            items: [
              {
                id: '1',
                description: 'Professional Hosting Plan',
                quantity: 1,
                price: 79.99,
                total: 79.99,
              },
              {
                id: '2',
                description: 'SSL Certificate',
                quantity: 1,
                price: 10.00,
                total: 10.00,
              },
            ],
            subtotal: 89.99,
            tax: 0.00,
            total: 89.99,
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'draft':
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      // Find the invoice to get its details
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) return;

      // For now, simulate payment processing
      // In a real implementation, this would integrate with a payment gateway
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: 'paid' as const }
            : inv
        )
      );

      // Show success message
      alert('Payment processed successfully!');
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your billing invoices and payment history.
            </p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Invoices</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your billing invoices and payment history.
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
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
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </span>
                        {invoice.status !== 'paid' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Payment Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => handlePayInvoice(invoice.id)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <CreditCardIcon className="h-4 w-4 mr-1" />
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Invoice {selectedInvoice.number}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Bill To:</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedInvoice.customer_name || 'Customer'}</p>
                    <p>{selectedInvoice.customer_email || 'customer@example.com'}</p>
                    <p>Address not available</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Invoice Details:</h4>
                  <div className="text-sm text-gray-600">
                    <p>Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                    <p>Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                    <p>Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusIcon(selectedInvoice.status)}
                      <span className="ml-1 capitalize">{selectedInvoice.status}</span>
                    </span></p>
                    {selectedInvoice.payment_method && (
                      <p>Payment Method: {selectedInvoice.payment_method}</p>
                    )}
                    {selectedInvoice.payment_status && (
                      <p>Payment Status: {selectedInvoice.payment_status}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Subtotal:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${selectedInvoice.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Tax:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${selectedInvoice.tax.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        Total:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${selectedInvoice.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2 inline" />
                  Download PDF
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => handlePayInvoice(selectedInvoice.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <CreditCardIcon className="h-4 w-4 mr-2 inline" />
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any invoices yet.
          </p>
        </div>
      )}
    </div>
  );
}
