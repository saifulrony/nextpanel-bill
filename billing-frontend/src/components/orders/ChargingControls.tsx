'use client';

import { useState } from 'react';
import { CreditCardIcon, ClockIcon, CogIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Order {
  id: string;
  invoice_number?: string;
  order_number?: string;
  total: number;
  status: string;
  customer?: {
    email: string;
    full_name: string;
  };
}

interface ChargingControlsProps {
  order: Order;
  onCharge: (orderId: string, amount: number, paymentMethod: string) => Promise<void>;
  onConfigureAutoCharge: (orderId: string, config: any) => Promise<void>;
  onViewPaymentHistory: (orderId: string) => void;
  isLoading?: boolean;
}

export default function ChargingControls({
  order,
  onCharge,
  onConfigureAutoCharge,
  onViewPaymentHistory,
  isLoading = false
}: ChargingControlsProps) {
  const [showManualCharge, setShowManualCharge] = useState(false);
  const [showAutoChargeConfig, setShowAutoChargeConfig] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  
  const [manualChargeData, setManualChargeData] = useState({
    amount: order.total,
    paymentMethod: '',
    description: `Payment for ${order.invoice_number || order.order_number}`
  });
  
  const [autoChargeConfig, setAutoChargeConfig] = useState({
    enabled: false,
    paymentMethodId: '',
    retryAttempts: 3,
    retryIntervalDays: 3,
    nextChargeDate: ''
  });

  const handleManualCharge = async () => {
    if (!manualChargeData.paymentMethod) {
      alert('Please select a payment method');
      return;
    }
    
    try {
      await onCharge(order.id, manualChargeData.amount, manualChargeData.paymentMethod);
      setShowManualCharge(false);
      setManualChargeData({
        amount: order.total,
        paymentMethod: '',
        description: `Payment for ${order.invoice_number || order.order_number}`
      });
    } catch (error) {
      console.error('Manual charge failed:', error);
    }
  };

  const handleConfigureAutoCharge = async () => {
    try {
      await onConfigureAutoCharge(order.id, {
        ...autoChargeConfig,
        nextChargeDate: autoChargeConfig.nextChargeDate ? new Date(autoChargeConfig.nextChargeDate) : null
      });
      setShowAutoChargeConfig(false);
    } catch (error) {
      console.error('Auto-charge configuration failed:', error);
    }
  };

  const canCharge = order.status === 'pending' || order.status === 'processing' || order.status === 'open';
  const isPaid = order.status === 'completed' || order.status === 'paid';

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {canCharge && (
          <button
            onClick={() => setShowManualCharge(true)}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <CreditCardIcon className="h-4 w-4 mr-2" />
            Manual Charge
          </button>
        )}
        
        <button
          onClick={() => setShowAutoChargeConfig(true)}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <CogIcon className="h-4 w-4 mr-2" />
          Auto-Charge Config
        </button>
        
        <button
          onClick={() => onViewPaymentHistory(order.id)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ClockIcon className="h-4 w-4 mr-2" />
          Payment History
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-4 text-sm">
        {isPaid && (
          <div className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            Paid
          </div>
        )}
        
        {canCharge && (
          <div className="flex items-center text-yellow-600">
            <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></div>
            Pending Payment
          </div>
        )}
      </div>

      {/* Manual Charge Modal */}
      {showManualCharge && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manual Charge - {order.invoice_number || order.order_number}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualChargeData.amount}
                    onChange={(e) => setManualChargeData({
                      ...manualChargeData,
                      amount: parseFloat(e.target.value) || 0
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method ID
                  </label>
                  <input
                    type="text"
                    placeholder="pm_1234567890abcdef"
                    value={manualChargeData.paymentMethod}
                    onChange={(e) => setManualChargeData({
                      ...manualChargeData,
                      paymentMethod: e.target.value
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter Stripe payment method ID (e.g., pm_1234567890abcdef)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    value={manualChargeData.description}
                    onChange={(e) => setManualChargeData({
                      ...manualChargeData,
                      description: e.target.value
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowManualCharge(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualCharge}
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Charge Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Charge Configuration Modal */}
      {showAutoChargeConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Auto-Charge Configuration
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={autoChargeConfig.enabled}
                    onChange={(e) => setAutoChargeConfig({
                      ...autoChargeConfig,
                      enabled: e.target.checked
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                    Enable automatic charging
                  </label>
                </div>
                
                {autoChargeConfig.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Method ID
                      </label>
                      <input
                        type="text"
                        placeholder="pm_1234567890abcdef"
                        value={autoChargeConfig.paymentMethodId}
                        onChange={(e) => setAutoChargeConfig({
                          ...autoChargeConfig,
                          paymentMethodId: e.target.value
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Retry Attempts
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={autoChargeConfig.retryAttempts}
                        onChange={(e) => setAutoChargeConfig({
                          ...autoChargeConfig,
                          retryAttempts: parseInt(e.target.value) || 3
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Retry Interval (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={autoChargeConfig.retryIntervalDays}
                        onChange={(e) => setAutoChargeConfig({
                          ...autoChargeConfig,
                          retryIntervalDays: parseInt(e.target.value) || 3
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Next Charge Date
                      </label>
                      <input
                        type="datetime-local"
                        value={autoChargeConfig.nextChargeDate}
                        onChange={(e) => setAutoChargeConfig({
                          ...autoChargeConfig,
                          nextChargeDate: e.target.value
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAutoChargeConfig(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfigureAutoCharge}
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
