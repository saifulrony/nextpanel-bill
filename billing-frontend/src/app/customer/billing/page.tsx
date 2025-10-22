'use client';

import { useState, useEffect } from 'react';
import { customerBillingAPI } from '@/lib/api';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  number: string;
  date: string;
  due_date?: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  days_until_due?: number;
  is_overdue: boolean;
  items?: any[];
  tax_amount: number;
  discount_amount: number;
  subtotal: number;
  created_at: string;
  updated_at?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
}

interface BillingSummary {
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  total_invoices: number;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load billing data
        const [invoicesResponse, paymentMethodsResponse, summaryResponse] = await Promise.all([
          customerBillingAPI.getInvoices({ due_only: showDueOnly }),
          customerBillingAPI.getPaymentMethods(),
          customerBillingAPI.getBillingSummary()
        ]);
        
        setInvoices(invoicesResponse);
        setPaymentMethods(paymentMethodsResponse);
        setBillingSummary(summaryResponse);
        
      } catch (err) {
        console.error('Failed to load billing data:', err);
        setError('Failed to load billing information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [showDueOnly]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardIcon = (brand: string) => {
    // Simple card icon based on brand
    return <CreditCardIcon className="h-6 w-6 text-gray-400" />;
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (paymentMethodId: string) => {
    if (!selectedInvoice) return;
    
    try {
      await customerBillingAPI.payInvoice(selectedInvoice.id, paymentMethodId);
      
      // Refresh data
      const [invoicesResponse, summaryResponse] = await Promise.all([
        customerBillingAPI.getInvoices({ due_only: showDueOnly }),
        customerBillingAPI.getBillingSummary()
      ]);
      
      setInvoices(invoicesResponse);
      setBillingSummary(summaryResponse);
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      
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
            <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
            <p className="mt-1 text-sm text-red-500">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your invoices, payment methods, and billing history.
          </p>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Paid
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${billingSummary?.total_paid.toFixed(2) || '0.00'}
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
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${billingSummary?.total_pending.toFixed(2) || '0.00'}
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
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${billingSummary?.total_overdue.toFixed(2) || '0.00'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  id="due-only-filter"
                  type="checkbox"
                  checked={showDueOnly}
                  onChange={(e) => setShowDueOnly(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="due-only-filter" className="ml-2 block text-sm text-gray-900">
                  Show due invoices only
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Payment Methods
          </h3>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center">
                  {getCardIcon(method.brand || 'card')}
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires {method.expiry_month}/{method.expiry_year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {method.is_default && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button 
              onClick={() => setShowAddPaymentMethod(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Payment Method
            </button>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Invoices
          </h3>
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
                  <tr key={invoice.id}>
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
                      {invoice.due_date && (
                        <div className="text-xs text-gray-500">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                          {invoice.days_until_due !== undefined && (
                            <span className={`ml-2 ${
                              invoice.days_until_due < 0 ? 'text-red-600' : 
                              invoice.days_until_due <= 7 ? 'text-yellow-600' : 'text-gray-500'
                            }`}>
                              ({invoice.days_until_due < 0 ? 'Overdue' : `${invoice.days_until_due} days`})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1 capitalize">{invoice.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                          <button 
                            onClick={() => handlePayInvoice(invoice)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay Now
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

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">
            {showDueOnly ? 'No due invoices found.' : 'You don\'t have any invoices yet.'}
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Pay Invoice</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Invoice: <span className="font-medium">{selectedInvoice.number}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Amount: <span className="font-medium">${selectedInvoice.amount.toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Description: {selectedInvoice.description}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Payment Method
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.brand} •••• {method.last4} {method.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const select = document.querySelector('select') as HTMLSelectElement;
                    if (select && select.value) {
                      handleProcessPayment(select.value);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentMethod && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Payment Method</h3>
                <button
                  onClick={() => setShowAddPaymentMethod(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                This feature will be available soon. You can add payment methods through Stripe integration.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddPaymentMethod(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // In a real implementation, this would open Stripe's payment method setup
                    alert('Stripe integration coming soon!');
                    setShowAddPaymentMethod(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Setup Stripe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
