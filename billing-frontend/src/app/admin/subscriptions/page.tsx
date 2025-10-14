'use client';

import { useState, useEffect } from 'react';
import { subscriptionsAPI, plansAPI } from '@/lib/api';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsResponse, plansResponse] = await Promise.all([
        subscriptionsAPI.list(),
        plansAPI.list()
      ]);
      setSubscriptions(subsResponse.data);
      setPlans(plansResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      await subscriptionsAPI.cancel(id, { cancel_at_period_end: true });
      alert('Subscription cancelled. It will remain active until the end of the billing period.');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to cancel subscription');
    }
  };

  const reactivateSubscription = async (id: string) => {
    try {
      await subscriptionsAPI.reactivate(id);
      alert('Subscription reactivated successfully!');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to reactivate subscription');
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your recurring subscriptions and billing
        </p>
      </div>

      {/* Active Subscriptions */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Active Subscriptions
          </h3>

          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No active subscriptions</p>
              <a
                href="/pricing"
                className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Subscribe to a Plan
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">Subscription #{sub.id.substring(0, 8)}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: <span className={`font-medium ${
                          sub.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        }`}>{sub.status}</span>
                      </p>
                      {sub.current_period_end && (
                        <p className="text-sm text-gray-600">
                          Next billing: {new Date(sub.current_period_end).toLocaleDateString()}
                        </p>
                      )}
                      {sub.cancel_at_period_end && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠️ Will be cancelled at period end
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {sub.cancel_at_period_end ? (
                        <button
                          onClick={() => reactivateSubscription(sub.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Upgrade
                          </button>
                          <button
                            onClick={() => cancelSubscription(sub.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Plans */}
      {plans.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Available Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-6">
                  <h4 className="font-bold text-xl mb-2">{plan.name}</h4>
                  <p className="text-3xl font-bold text-indigo-600 mb-4">
                    ${plan.price_monthly}<span className="text-base text-gray-600">/mo</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="text-sm">✓ {plan.max_accounts} Accounts</li>
                    <li className="text-sm">✓ {plan.max_domains} Domains</li>
                    <li className="text-sm">✓ {plan.max_databases} Databases</li>
                    <li className="text-sm">✓ {plan.max_emails} Email Accounts</li>
                  </ul>
                  <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Subscribe
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

