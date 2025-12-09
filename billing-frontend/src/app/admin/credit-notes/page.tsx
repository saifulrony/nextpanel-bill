'use client';

import { useState, useEffect } from 'react';
import { creditNotesAPI } from '@/lib/api';
import { PlusIcon, PencilIcon, DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    invoice_id: '',
    order_id: '',
    payment_id: '',
    amount: 0,
    currency: 'USD',
    reason: 'refund',
    description: '',
    notes: '',
  });

  useEffect(() => {
    loadCreditNotes();
  }, []);

  const loadCreditNotes = async () => {
    try {
      setLoading(true);
      const response = await creditNotesAPI.list();
      setCreditNotes(response.data);
    } catch (error: any) {
      console.error('Failed to load credit notes:', error);
      alert(`Failed to load credit notes: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await creditNotesAPI.create(formData);
      alert('Credit note created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadCreditNotes();
    } catch (error: any) {
      console.error('Failed to create credit note:', error);
      alert(`Failed to create credit note: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleApply = async () => {
    if (!selectedCreditNote) return;
    
    try {
      const applyData = {
        invoice_id: formData.invoice_id,
        amount: formData.amount,
      };
      await creditNotesAPI.apply(selectedCreditNote.id, applyData);
      alert('Credit note applied successfully!');
      setShowApplyModal(false);
      setSelectedCreditNote(null);
      resetForm();
      loadCreditNotes();
    } catch (error: any) {
      console.error('Failed to apply credit note:', error);
      alert(`Failed to apply credit note: ${error.response?.data?.detail || error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      invoice_id: '',
      order_id: '',
      payment_id: '',
      amount: 0,
      currency: 'USD',
      reason: 'refund',
      description: '',
      notes: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Credit Notes</h1>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Credit Note
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit Note #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {creditNotes.map((cn) => (
              <tr key={cn.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{cn.credit_note_number}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{cn.user_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${cn.amount.toFixed(2)} {cn.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${cn.applied_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${cn.remaining_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    cn.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                    cn.status === 'applied' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cn.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {cn.status === 'issued' && (
                    <button
                      onClick={() => {
                        setSelectedCreditNote(cn);
                        setFormData({ ...formData, amount: cn.remaining_amount });
                        setShowApplyModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <CheckIcon className="h-5 w-5 inline" /> Apply
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Credit Note</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID *</label>
                <input
                  type="text"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason *</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="refund">Refund</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="dispute">Dispute</option>
                  <option value="cancellation">Cancellation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedCreditNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Apply Credit Note</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Invoice ID *</label>
                <input
                  type="text"
                  value={formData.invoice_id}
                  onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount to Apply *</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedCreditNote.remaining_amount}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Remaining: ${selectedCreditNote.remaining_amount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedCreditNote(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

