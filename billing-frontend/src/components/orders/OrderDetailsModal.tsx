'use client';

import { useState, useEffect } from 'react';
import { ordersAPI } from '@/lib/api';

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax: number;
  tax_rate: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  order_date: string;
  due_date: string;
  paid_at: string | null;
  items: any[];
  notes: string | null;
  terms: string | null;
  payment_instructions: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  sent_to_customer: boolean;
  reminder_count: number;
  created_at: string;
}

interface PartialPayment {
  id: string;
  amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
}

export default function OrderDetailsModal({ order, onClose, onUpdate }: OrderDetailsModalProps) {
  const [partialPayments, setPartialPayments] = useState<PartialPayment[]>([]);
  const [showPartialPaymentForm, setShowPartialPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPartialPayments();
  }, [order.id]);

  const loadPartialPayments = async () => {
    try {
      const response = await ordersAPI.getPartialPayments(order.id);
      setPartialPayments(response.data);
    } catch (error) {
      console.error('Failed to load partial payments:', error);
    }
  };

  const handlePartialPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      if (amount > order.amount_due) {
        alert(`Payment amount cannot exceed amount due: $${order.amount_due.toFixed(2)}`);
        return;
      }

      await ordersAPI.partialPayment(order.id, {
        amount,
        payment_method: paymentMethod,
        notes: paymentNotes || undefined,
      });

      alert('Partial payment recorded successfully!');
      setShowPartialPaymentForm(false);
      setPaymentAmount('');
      setPaymentNotes('');
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await ordersAPI.downloadPDF(order.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${order.order_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF');
    }
  };

  const sendOrder = async () => {
    if (!confirm('Send this order via email?')) return;
    
    try {
      await ordersAPI.send(order.id);
      alert('Order sent successfully!');
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'void': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
            <p className="mt-1 text-sm text-gray-500">Order {order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Download PDF
              </button>
              {!order.sent_to_customer && (
                <button
                  onClick={sendOrder}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Send Email
                </button>
              )}
            </div>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Order Date</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(order.order_date || order.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(order.due_date)}</p>
            </div>
            {order.paid_at && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Paid Date</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(order.paid_at)}</p>
              </div>
            )}
            {order.is_recurring && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Recurring</h4>
                <p className="mt-1 text-sm text-gray-900">{order.recurring_interval}</p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Line Items</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">${(item.unit_price || item.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">${((item.unit_price || item.amount) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="space-y-2 text-sm max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>
                    Discount {order.discount_percent > 0 && `(${order.discount_percent}%)`}:
                  </span>
                  <span>-${order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tax {order.tax_rate > 0 && `(${order.tax_rate}%)`}:
                  </span>
                  <span className="font-medium">${order.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
              {order.amount_paid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid:</span>
                    <span>-${order.amount_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Amount Due:</span>
                    <span>${order.amount_due.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Partial Payments */}
          {partialPayments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Payment History</h4>
              <div className="space-y-2">
                {partialPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center bg-green-50 p-3 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(payment.created_at)} • {payment.payment_method}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partial Payment Form */}
          {order.status !== 'paid' && order.status !== 'void' && (
            <div>
              {!showPartialPaymentForm ? (
                <button
                  onClick={() => setShowPartialPaymentForm(true)}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-indigo-500 hover:text-indigo-600"
                >
                  + Record Partial Payment
                </button>
              ) : (
                <form onSubmit={handlePartialPayment} className="border-2 border-indigo-200 rounded-md p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Record Partial Payment</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount (Max: ${order.amount_due.toFixed(2)})
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      max={order.amount_due}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="manual">Manual</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Payment reference or notes"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Recording...' : 'Record Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPartialPaymentForm(false);
                        setPaymentAmount('');
                        setPaymentNotes('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Notes and Terms */}
          {(order.notes || order.terms || order.payment_instructions) && (
            <div className="space-y-4 pt-4 border-t">
              {order.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
              {order.terms && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Terms</h4>
                  <p className="text-sm text-gray-600">{order.terms}</p>
                </div>
              )}
              {order.payment_instructions && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Payment Instructions</h4>
                  <p className="text-sm text-gray-600">{order.payment_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

