'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// Edit License Modal
export function EditLicenseModal({
  customerId,
  license,
  onClose,
  onSuccess,
}: {
  customerId: string;
  license: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    plan_id: '',
    extend_days: 0,
    status: license.status,
    max_accounts: license.max_accounts,
    max_domains: license.max_domains,
    max_databases: license.max_databases,
    max_emails: license.max_emails,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData: any = {};
      
      if (formData.plan_id) updateData.plan_id = formData.plan_id;
      if (formData.extend_days > 0) updateData.extend_days = formData.extend_days;
      if (formData.status !== license.status) updateData.status = formData.status;
      if (formData.max_accounts !== license.max_accounts) updateData.max_accounts = formData.max_accounts;
      if (formData.max_domains !== license.max_domains) updateData.max_domains = formData.max_domains;
      if (formData.max_databases !== license.max_databases) updateData.max_databases = formData.max_databases;
      if (formData.max_emails !== license.max_emails) updateData.max_emails = formData.max_emails;

      await api.put(`/customers/${customerId}/licenses/${license.id}`, updateData);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit License</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">License Key: {license.license_key}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Change Plan
            </label>
            <select
              value={formData.plan_id}
              onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Keep current plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price_monthly}/mo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Extend License (Days)
            </label>
            <input
              type="number"
              min="0"
              value={formData.extend_days}
              onChange={(e) => setFormData({ ...formData, extend_days: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Number of days to extend"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current expiry: {new Date(license.expiry_date || '').toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Accounts
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_accounts}
                onChange={(e) => setFormData({ ...formData, max_accounts: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Domains
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_domains}
                onChange={(e) => setFormData({ ...formData, max_domains: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Databases
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_databases}
                onChange={(e) => setFormData({ ...formData, max_databases: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Emails
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_emails}
                onChange={(e) => setFormData({ ...formData, max_emails: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Subscription Modal
export function EditSubscriptionModal({
  customerId,
  subscription,
  onClose,
  onSuccess,
}: {
  customerId: string;
  subscription: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    status: subscription.status,
    extend_period_days: 0,
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData: any = {};
      
      if (formData.status !== subscription.status) updateData.status = formData.status;
      if (formData.extend_period_days > 0) updateData.extend_period_days = formData.extend_period_days;
      if (formData.cancel_at_period_end !== subscription.cancel_at_period_end) {
        updateData.cancel_at_period_end = formData.cancel_at_period_end;
      }

      await api.put(`/customers/${customerId}/subscriptions/${subscription.id}`, updateData);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Subscription</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Subscription ID: {subscription.id}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="trialing">Trialing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Extend Period (Days)
            </label>
            <input
              type="number"
              min="0"
              value={formData.extend_period_days}
              onChange={(e) => setFormData({ ...formData, extend_period_days: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Number of days to extend period"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current period end: {new Date(subscription.current_period_end || '').toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="cancel_at_period_end"
              checked={formData.cancel_at_period_end}
              onChange={(e) => setFormData({ ...formData, cancel_at_period_end: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="cancel_at_period_end" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Cancel at period end
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

