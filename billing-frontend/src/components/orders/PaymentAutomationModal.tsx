'use client';

import AutomationRules from './AutomationRules';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PaymentAutomationModalProps {
  orderId: string;
  orderNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentAutomationModal({ orderId, orderNumber, isOpen, onClose }: PaymentAutomationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Payment Automation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {orderNumber ? `Configure automated payment charging for Order ${orderNumber}` : 'Configure automated payment charging for this order'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <AutomationRules orderId={orderId} actionTypeFilter={['charge_payment']} defaultActionType="charge_payment" />
        </div>
        
        <div className="flex justify-end pt-4 border-t mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

