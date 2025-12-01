'use client';

import AutomationRules from './AutomationRules';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AutomationModalProps {
  orderId: string;
  orderNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AutomationModal({ orderId, orderNumber, isOpen, onClose }: AutomationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Automation Rules</h3>
            <p className="mt-1 text-sm text-gray-500">
              {orderNumber ? `Configure automated email and payment actions for Order ${orderNumber}` : 'Configure automated email and payment actions for this order'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <AutomationRules orderId={orderId} />
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

