'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentGatewaysAPI } from '@/lib/api';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const GATEWAY_TYPES = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    description: 'Accept credit cards, digital wallets, and bank transfers',
    popular: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🅿️',
    description: 'PayPal, Venmo, and Buy Now Pay Later options',
    popular: true,
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    icon: '⚡',
    description: 'Popular payment gateway for Indian businesses',
    popular: false,
  },
  {
    id: 'square',
    name: 'Square',
    icon: '◼️',
    description: 'In-person and online payments by Square',
    popular: false,
  },
  {
    id: 'braintree',
    name: 'Braintree',
    icon: '🧠',
    description: 'PayPal-owned payment platform',
    popular: false,
  },
  {
    id: 'authorize_net',
    name: 'Authorize.Net',
    icon: '🔐',
    description: 'Established payment gateway by Visa',
    popular: false,
  },
  {
    id: 'payu',
    name: 'PayU',
    icon: '💰',
    description: 'Payment gateway for emerging markets',
    popular: false,
  },
  {
    id: 'mollie',
    name: 'Mollie',
    icon: '🔶',
    description: 'European payment service provider',
    popular: false,
  },
];

interface FormData {
  name: string;
  type: string;
  display_name: string;
  description: string;
  supports_recurring: boolean;
  supports_refunds: boolean;
  supports_partial_refunds: boolean;
  supports_webhooks: boolean;
  fixed_fee: number;
  percentage_fee: number;
  api_key: string;
  secret_key: string;
  webhook_secret: string;
  is_sandbox: boolean;
  sandbox_api_key: string;
  sandbox_secret_key: string;
}

const getGatewayConfiguration = (type: string) => {
  switch (type) {
    case 'stripe':
      return {
        supports_recurring: true,
        supports_refunds: true,
        supports_partial_refunds: true,
        supports_webhooks: true,
        fields: [
          { key: 'api_key', label: 'Publishable Key', type: 'text', required: true, help: 'Your Stripe publishable key (pk_...)' },
          { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, help: 'Your Stripe secret key (sk_...)' },
          { key: 'webhook_secret', label: 'Webhook Endpoint Secret', type: 'password', required: false, help: 'Webhook signing secret for verifying events' },
          { key: 'sandbox_api_key', label: 'Test Publishable Key', type: 'text', required: false, help: 'Test mode publishable key' },
          { key: 'sandbox_secret_key', label: 'Test Secret Key', type: 'password', required: false, help: 'Test mode secret key' },
        ],
      };
    case 'paypal':
      return {
        supports_recurring: true,
        supports_refunds: true,
        supports_partial_refunds: true,
        supports_webhooks: true,
        fields: [
          { key: 'api_key', label: 'Client ID', type: 'text', required: true, help: 'Your PayPal application Client ID' },
          { key: 'secret_key', label: 'Client Secret', type: 'password', required: true, help: 'Your PayPal application Client Secret' },
          { key: 'webhook_secret', label: 'Webhook ID', type: 'text', required: false, help: 'Webhook ID for event verification' },
          { key: 'sandbox_api_key', label: 'Sandbox Client ID', type: 'text', required: false, help: 'Sandbox Client ID for testing' },
          { key: 'sandbox_secret_key', label: 'Sandbox Client Secret', type: 'password', required: false, help: 'Sandbox Client Secret for testing' },
        ],
      };
    case 'razorpay':
      return {
        supports_recurring: true,
        supports_refunds: true,
        supports_partial_refunds: true,
        supports_webhooks: true,
        fields: [
          { key: 'api_key', label: 'Key ID', type: 'text', required: true, help: 'Your Razorpay Key ID' },
          { key: 'secret_key', label: 'Key Secret', type: 'password', required: true, help: 'Your Razorpay Key Secret' },
          { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', required: false, help: 'Webhook secret for event verification' },
        ],
      };
    default:
      return {
        supports_recurring: false,
        supports_refunds: true,
        supports_partial_refunds: false,
        supports_webhooks: false,
        fields: [
          { key: 'api_key', label: 'API Key', type: 'text', required: true, help: 'Your API key' },
          { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, help: 'Your secret key' },
        ],
      };
  }
};

export default function AddPaymentGatewayPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    display_name: '',
    description: '',
    supports_recurring: false,
    supports_refunds: true,
    supports_partial_refunds: false,
    supports_webhooks: false,
    fixed_fee: 0,
    percentage_fee: 0,
    api_key: '',
    secret_key: '',
    webhook_secret: '',
    is_sandbox: true,
    sandbox_api_key: '',
    sandbox_secret_key: '',
  });

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    const gatewayType = GATEWAY_TYPES.find(gt => gt.id === type);
    const config = getGatewayConfiguration(type);
    
    setFormData({
      ...formData,
      type,
      name: gatewayType?.name || '',
      display_name: gatewayType?.name || '',
      description: gatewayType?.description || '',
      supports_recurring: config.supports_recurring,
      supports_refunds: config.supports_refunds,
      supports_partial_refunds: config.supports_partial_refunds,
      supports_webhooks: config.supports_webhooks,
    });
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await paymentGatewaysAPI.create(formData);
      router.push('/payments/gateways');
    } catch (error: any) {
      console.error('Failed to create payment gateway:', error);
      setError(error.response?.data?.detail || 'Failed to create payment gateway');
    } finally {
      setIsLoading(false);
    }
  };

  const configuration = getGatewayConfiguration(selectedType);

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center">
          <Link
            href="/payments/gateways"
            className="mr-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Gateways
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Add Payment Gateway</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure a new payment gateway to accept payments from your customers
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            <li className="relative">
              <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Choose Gateway</span>
              </div>
            </li>
            <li className="relative ml-8">
              <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>
                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Configure</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {step === 1 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Select Payment Gateway Type
            </h3>
            
            {/* Popular Gateways */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Options</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {GATEWAY_TYPES.filter(type => type.popular).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{type.name}</h3>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Gateways */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Other Options</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {GATEWAY_TYPES.filter(type => !type.popular).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-left"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{type.name}</h3>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setStep(1)}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Configure {GATEWAY_TYPES.find(t => t.id === selectedType)?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  Enter your API credentials and gateway settings
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-2">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Internal Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., stripe-main"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used for internal identification</p>
                  </div>
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="display_name"
                      id="display_name"
                      required
                      value={formData.display_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., Stripe Payments"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shown to customers</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Brief description of this gateway configuration"
                  />
                </div>
              </div>

              {/* API Configuration */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">API Configuration</h4>
                <div className="space-y-4">
                  {configuration.fields.map((field) => (
                    <div key={field.key}>
                      <label htmlFor={field.key} className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={field.type}
                        name={field.key}
                        id={field.key}
                        required={field.required}
                        value={formData[field.key as keyof FormData] as string}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      {field.help && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <InformationCircleIcon className="h-3 w-3 mr-1" />
                          {field.help}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Configuration */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Fee Configuration</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="percentage_fee" className="block text-sm font-medium text-gray-700">
                      Percentage Fee (%)
                    </label>
                    <input
                      type="number"
                      name="percentage_fee"
                      id="percentage_fee"
                      step="0.01"
                      min="0"
                      value={formData.percentage_fee}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="fixed_fee" className="block text-sm font-medium text-gray-700">
                      Fixed Fee ($)
                    </label>
                    <input
                      type="number"
                      name="fixed_fee"
                      id="fixed_fee"
                      step="0.01"
                      min="0"
                      value={formData.fixed_fee}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Environment Settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Environment Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="is_sandbox"
                      name="is_sandbox"
                      type="checkbox"
                      checked={formData.is_sandbox}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_sandbox" className="ml-2 block text-sm text-gray-900">
                      Enable Sandbox/Test Mode
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    When enabled, the gateway will use test/sandbox credentials for transactions
                  </p>
                </div>
              </div>

              {/* Feature Support */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Feature Support</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="supports_recurring"
                      name="supports_recurring"
                      type="checkbox"
                      checked={formData.supports_recurring}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="supports_recurring" className="ml-2 block text-sm text-gray-900">
                      Supports Recurring Payments
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="supports_refunds"
                      name="supports_refunds"
                      type="checkbox"
                      checked={formData.supports_refunds}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="supports_refunds" className="ml-2 block text-sm text-gray-900">
                      Supports Refunds
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="supports_partial_refunds"
                      name="supports_partial_refunds"
                      type="checkbox"
                      checked={formData.supports_partial_refunds}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="supports_partial_refunds" className="ml-2 block text-sm text-gray-900">
                      Supports Partial Refunds
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="supports_webhooks"
                      name="supports_webhooks"
                      type="checkbox"
                      checked={formData.supports_webhooks}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="supports_webhooks" className="ml-2 block text-sm text-gray-900">
                      Supports Webhooks
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/payments/gateways"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Create Gateway
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
