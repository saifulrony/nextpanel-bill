'use client';

import { useState, useEffect } from 'react';
import { plansAPI } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditProductModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
}

export default function EditProductModal({ product, onClose, onSuccess, categories }: EditProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: product.name || '',
    description: product.description || '',
    price_monthly: product.price_monthly?.toString() || '',
    price_yearly: product.price_yearly?.toString() || '',
    max_accounts: product.max_accounts?.toString() || '0',
    max_domains: product.max_domains?.toString() || '0',
    max_databases: product.max_databases?.toString() || '0',
    max_emails: product.max_emails?.toString() || '0',
    category: product.features?.category || 'hosting',
    subcategory: product.features?.subcategory || product.features?.user_type || '',
    // Advanced features
    storage: product.features?.storage || '',
    bandwidth: product.features?.bandwidth || '',
    cpu: product.features?.cpu || '',
    ram: product.features?.ram || '',
    ssl: product.features?.ssl || false,
    backups: product.features?.backups || 'weekly',
    support: product.features?.support || '24/7 Email',
    uptime: product.features?.uptime || '99.9%',
    is_active: product.is_active || true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name || !formData.price_monthly || !formData.price_yearly) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.price_monthly) < 0 || parseFloat(formData.price_yearly) < 0) {
      setError('Prices must be positive numbers');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build features object based on category
      const features: any = {
        category: formData.category,
      };

      // Add subcategory for hosting products
      if (formData.category === 'hosting' && formData.subcategory) {
        features.subcategory = formData.subcategory;
        features.user_type = formData.subcategory; // Also store as user_type for easier access
      }

      // Add category-specific features
      if (formData.category === 'hosting') {
        if (formData.storage) features.storage = formData.storage;
        if (formData.bandwidth) features.bandwidth = formData.bandwidth;
        if (formData.cpu) features.cpu = formData.cpu;
        if (formData.ram) features.ram = formData.ram;
        features.ssl = formData.ssl;
        if (formData.backups) features.backups = formData.backups;
        if (formData.support) features.support = formData.support;
        if (formData.uptime) features.uptime = formData.uptime;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
        max_accounts: parseInt(formData.max_accounts) || 0,
        max_domains: parseInt(formData.max_domains) || 0,
        max_databases: parseInt(formData.max_databases) || 0,
        max_emails: parseInt(formData.max_emails) || 0,
        is_active: formData.is_active,
        features,
      };

      await plansAPI.update(product.id, payload);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setError(err.response?.data?.detail || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Edit Product
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* User Type Subcategory - Only show for hosting category */}
                    {formData.category === 'hosting' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          User Type *
                        </label>
                        <select
                          name="subcategory"
                          value={formData.subcategory}
                          onChange={handleChange}
                          required
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select User Type...</option>
                          <option value="regular-user">🌐 Regular User (Panel Account)</option>
                          <option value="reseller-user">💼 Reseller User (Can create sub-accounts)</option>
                          <option value="master-reseller-user">👑 Master Reseller User (Full admin access)</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          This determines the type of NextPanel account created for customers
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Pricing</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Monthly Price ($) *
                      </label>
                      <input
                        type="number"
                        name="price_monthly"
                        value={formData.price_monthly}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Yearly Price ($) *
                      </label>
                      <input
                        type="number"
                        name="price_yearly"
                        value={formData.price_yearly}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Resource Limits */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Resource Limits</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Max Accounts
                      </label>
                      <input
                        type="number"
                        name="max_accounts"
                        value={formData.max_accounts}
                        onChange={handleChange}
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Max Domains
                      </label>
                      <input
                        type="number"
                        name="max_domains"
                        value={formData.max_domains}
                        onChange={handleChange}
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Max Databases
                      </label>
                      <input
                        type="number"
                        name="max_databases"
                        value={formData.max_databases}
                        onChange={handleChange}
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Max Emails
                      </label>
                      <input
                        type="number"
                        name="max_emails"
                        value={formData.max_emails}
                        onChange={handleChange}
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Category-specific features */}
                {formData.category === 'hosting' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Hosting Features</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Storage
                        </label>
                        <input
                          type="text"
                          name="storage"
                          value={formData.storage}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., 50 GB SSD"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bandwidth
                        </label>
                        <input
                          type="text"
                          name="bandwidth"
                          value={formData.bandwidth}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., Unlimited"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          CPU
                        </label>
                        <input
                          type="text"
                          name="cpu"
                          value={formData.cpu}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., 2 vCPU"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          RAM
                        </label>
                        <input
                          type="text"
                          name="ram"
                          value={formData.ram}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., 4 GB"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Backups
                        </label>
                        <select
                          name="backups"
                          value={formData.backups}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="none">None</option>
                          <option value="weekly">Weekly</option>
                          <option value="daily">Daily</option>
                          <option value="hourly">Hourly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Support Level
                        </label>
                        <input
                          type="text"
                          name="support"
                          value={formData.support}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Uptime Guarantee
                        </label>
                        <input
                          type="text"
                          name="uptime"
                          value={formData.uptime}
                          onChange={handleChange}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="ssl"
                          checked={formData.ssl}
                          onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Free SSL Certificate
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

