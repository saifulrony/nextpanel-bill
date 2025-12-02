'use client';

import { useState, useEffect } from 'react';
import { orderAutomationAPI } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ChargePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharge: (amount: number, paymentMethod: string) => Promise<void>;
  orderId: string;
  maxAmount: number; // Maximum amount that can be charged (amount_due)
  orderNumber?: string;
  isLoading?: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  display_name?: string;
}

export default function ChargePaymentModal({
  isOpen,
  onClose,
  onCharge,
  orderId,
  maxAmount,
  orderNumber,
  isLoading = false
}: ChargePaymentModalProps) {
  const [amount, setAmount] = useState(maxAmount);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [useCustomPaymentMethod, setUseCustomPaymentMethod] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  useEffect(() => {
    if (isOpen && !useCustomPaymentMethod) {
      loadPaymentMethods();
    }
  }, [isOpen, orderId, useCustomPaymentMethod]);

  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      const response = await orderAutomationAPI.getPaymentMethods(orderId);
      setPaymentMethods(response.data || []);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const handleCharge = async () => {
    if (!paymentMethod) {
      alert('Please select or enter a payment method');
      return;
    }

    if (amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (amount > maxAmount) {
      alert(`Amount cannot exceed the due amount of $${maxAmount.toFixed(2)}`);
      return;
    }

    try {
      await onCharge(amount, paymentMethod);
      // Reset form
      setAmount(maxAmount);
      setPaymentMethod('');
      setUseCustomPaymentMethod(false);
      onClose();
    } catch (error) {
      console.error('Charge failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Charge Payment</h3>
            <p className="mt-1 text-sm text-gray-500">
              {orderNumber ? `Charge payment for Order ${orderNumber}` : 'Charge payment for this order'}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-700">
              Maximum chargeable amount: <span className="text-green-600">${maxAmount.toFixed(2)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Charge *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxAmount}
              value={amount}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (value <= maxAmount) {
                  setAmount(value);
                }
              }}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={`Max: $${maxAmount.toFixed(2)}`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter amount up to ${maxAmount.toFixed(2)} (due amount)
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Method *
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseCustomPaymentMethod(!useCustomPaymentMethod);
                  setPaymentMethod('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {useCustomPaymentMethod ? 'Select from saved' : 'Enter manually'}
              </button>
            </div>

            {useCustomPaymentMethod ? (
              <input
                type="text"
                placeholder="pm_1234567890abcdef"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            ) : (
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loadingPaymentMethods}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">
                  {loadingPaymentMethods ? 'Loading payment methods...' : 'Select a payment method'}
                </option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.display_name || `${pm.brand || 'Card'} •••• ${pm.last4 || 'xxxx'}`}
                  </option>
                ))}
              </select>
            )}
            {!useCustomPaymentMethod && paymentMethods.length === 0 && !loadingPaymentMethods && (
              <p className="mt-1 text-xs text-gray-500">
                No saved payment methods found. Click "Enter manually" to use a payment method ID.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleCharge}
            disabled={isLoading || !paymentMethod || amount <= 0 || amount > maxAmount}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : `Charge $${amount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

