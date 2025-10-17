'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { paymentGatewaysAPI } from '@/lib/api';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  display_name: string;
  description?: string;
  status: string;
  is_default: boolean;
  supports_recurring: boolean;
  supports_refunds: boolean;
  supports_partial_refunds: boolean;
  supports_webhooks: boolean;
  fixed_fee: number;
  percentage_fee: number;
  api_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  is_sandbox: boolean;
  sandbox_api_key?: string;
  sandbox_secret_key?: string;
}

export default function EditPaymentGatewayPage() {
  const router = useRouter();
  const params = useParams();
  const gatewayId = params.id as string;
  
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    supports_recurring: false,
    supports_refunds: true,
    supports_partial_refunds: true,
    supports_webhooks: true,
    fixed_fee: 0,
    percentage_fee: 0,
    api_key: '',
    secret_key: '',
    webhook_secret: '',
    is_sandbox: true,
    sandbox_api_key: '',
    sandbox_secret_key: '',
  });

  useEffect(() => {
    if (gatewayId) {
      loadGateway();
    }
  }, [gatewayId]);

  const loadGateway = async () => {
    try {
      setIsLoading(true);
      const response = await paymentGatewaysAPI.get(gatewayId);
      const gatewayData = response.data;
      
      setGateway(gatewayData);
      setFormData({
        name: gatewayData.name || '',
        display_name: gatewayData.display_name || '',
        description: gatewayData.description || '',
        supports_recurring: gatewayData.supports_recurring || false,
        supports_refunds: gatewayData.supports_refunds || true,
        supports_partial_refunds: gatewayData.supports_partial_refunds || true,
        supports_webhooks: gatewayData.supports_webhooks || true,
        fixed_fee: gatewayData.fixed_fee || 0,
        percentage_fee: gatewayData.percentage_fee || 0,
        api_key: gatewayData.api_key || '',
        secret_key: gatewayData.secret_key || '',
        webhook_secret: gatewayData.webhook_secret || '',
        is_sandbox: gatewayData.is_sandbox || true,
        sandbox_api_key: gatewayData.sandbox_api_key || '',
        sandbox_secret_key: gatewayData.sandbox_secret_key || '',
      });
    } catch (error: any) {
      console.error('Failed to load gateway:', error);
      setError('Failed to load payment gateway details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await paymentGatewaysAPI.update(gatewayId, formData);
      setSuccess('Payment gateway updated successfully!');
      
      // Redirect back to gateways list after a short delay
      setTimeout(() => {
        router.push('/admin/payments/gateways');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update gateway:', error);
      
      let errorMessage = 'Failed to update payment gateway';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment gateway...</p>
        </div>
      </div>
    );
  }

  if (!gateway) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Gateway Not Found</h1>
          <p className="mt-2 text-gray-600">The payment gateway you're looking for doesn't exist.</p>
          <Link
            href="/admin/payments/gateways"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Gateways
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Payment Gateway</h1>
              <p className="mt-2 text-gray-600">
                Update configuration for {gateway.display_name}
              </p>
            </div>
            <Link
              href="/admin/payments/gateways"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Gateways
            </Link>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
              {success}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            </div>
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Gateway Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    id="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">API Configuration</h3>
            </div>
            <div className="px-6 py-4 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="api_key" className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <input
                    type="password"
                    name="api_key"
                    id="api_key"
                    value={formData.api_key}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter API key"
                  />
                </div>
                <div>
                  <label htmlFor="secret_key" className="block text-sm font-medium text-gray-700">
                    Secret Key
                  </label>
                  <input
                    type="password"
                    name="secret_key"
                    id="secret_key"
                    value={formData.secret_key}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter secret key"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="webhook_secret" className="block text-sm font-medium text-gray-700">
                  Webhook Secret
                </label>
                <input
                  type="password"
                  name="webhook_secret"
                  id="webhook_secret"
                  value={formData.webhook_secret}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter webhook secret"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_sandbox"
                  id="is_sandbox"
                  checked={formData.is_sandbox}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_sandbox" className="ml-2 block text-sm text-gray-900">
                  Use Sandbox/Test Mode
                </label>
              </div>

              {formData.is_sandbox && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="sandbox_api_key" className="block text-sm font-medium text-gray-700">
                      Sandbox API Key
                    </label>
                    <input
                      type="password"
                      name="sandbox_api_key"
                      id="sandbox_api_key"
                      value={formData.sandbox_api_key}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter sandbox API key"
                    />
                  </div>
                  <div>
                    <label htmlFor="sandbox_secret_key" className="block text-sm font-medium text-gray-700">
                      Sandbox Secret Key
                    </label>
                    <input
                      type="password"
                      name="sandbox_secret_key"
                      id="sandbox_secret_key"
                      value={formData.sandbox_secret_key}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter sandbox secret key"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Supported Features</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="supports_recurring"
                  id="supports_recurring"
                  checked={formData.supports_recurring}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="supports_recurring" className="ml-2 block text-sm text-gray-900">
                  Supports Recurring Payments
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="supports_refunds"
                  id="supports_refunds"
                  checked={formData.supports_refunds}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="supports_refunds" className="ml-2 block text-sm text-gray-900">
                  Supports Refunds
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="supports_partial_refunds"
                  id="supports_partial_refunds"
                  checked={formData.supports_partial_refunds}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="supports_partial_refunds" className="ml-2 block text-sm text-gray-900">
                  Supports Partial Refunds
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="supports_webhooks"
                  id="supports_webhooks"
                  checked={formData.supports_webhooks}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="supports_webhooks" className="ml-2 block text-sm text-gray-900">
                  Supports Webhooks
                </label>
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Fee Configuration</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="fixed_fee" className="block text-sm font-medium text-gray-700">
                    Fixed Fee ($)
                  </label>
                  <input
                    type="number"
                    name="fixed_fee"
                    id="fixed_fee"
                    value={formData.fixed_fee}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="percentage_fee" className="block text-sm font-medium text-gray-700">
                    Percentage Fee (%)
                  </label>
                  <input
                    type="number"
                    name="percentage_fee"
                    id="percentage_fee"
                    value={formData.percentage_fee}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/payments/gateways"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
