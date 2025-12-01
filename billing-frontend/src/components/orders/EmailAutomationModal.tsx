'use client';

import AutomationRules from './AutomationRules';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EmailAutomationModalProps {
  orderId: string;
  orderNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailAutomationModal({ orderId, orderNumber, isOpen, onClose }: EmailAutomationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Email Automation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {orderNumber ? `Configure automated email actions for Order ${orderNumber}` : 'Configure automated email actions for this order'}
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
          <AutomationRules orderId={orderId} actionTypeFilter={['send_email', 'send_reminder']} defaultActionType="send_email" />
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

