'use client';

import { useState, useEffect } from 'react';
import { subscriptionsAPI, plansAPI } from '@/lib/api';
import {
  XMarkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  max_accounts?: number;
  max_domains?: number;
  max_databases?: number;
  max_emails?: number;
  features?: any;
}

interface Subscription {
  id: string;
  plan_id: string;
  plan?: Plan;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
}

interface UpgradeDowngradeModalProps {
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpgradeDowngradeModal({
  subscription,
  onClose,
  onSuccess,
}: UpgradeDowngradeModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [changeTiming, setChangeTiming] = useState<'immediate' | 'next_period'>('immediate');
  const [prorationDetails, setProrationDetails] = useState<any>(null);
  const [error, setError] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId && subscription.plan_id) {
      calculateProration();
    }
  }, [selectedPlanId, billingCycle, changeTiming]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await plansAPI.list();
      const allPlans = Array.isArray(response.data) ? response.data : [];
      setPlans(allPlans);
      
      // Pre-select current plan
      if (subscription.plan_id) {
        setSelectedPlanId(subscription.plan_id);
      }
    } catch (error: any) {
      console.error('Failed to load plans:', error);
      setError('Failed to load plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProration = async () => {
    if (!selectedPlanId || selectedPlanId === subscription.plan_id) {
      setProrationDetails(null);
      return;
    }

    try {
      const currentPlan = plans.find(p => p.id === subscription.plan_id);
      const newPlan = plans.find(p => p.id === selectedPlanId);
      
      if (!currentPlan || !newPlan) return;

      const currentPrice = billingCycle === 'monthly' 
        ? currentPlan.price_monthly 
        : (currentPlan.price_yearly || currentPlan.price_monthly * 12);
      const newPrice = billingCycle === 'monthly'
        ? newPlan.price_monthly
        : (newPlan.price_yearly || newPlan.price_monthly * 12);

      // Calculate days remaining in current period
      let daysRemaining = 0;
      if (subscription.current_period_end && subscription.current_period_start) {
        const endDate = new Date(subscription.current_period_end);
        const startDate = new Date(subscription.current_period_start);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const now = new Date();
        const daysUsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, totalDays - daysUsed);
      }

      // Calculate proration (simplified - in production, use backend API)
      const dailyRate = currentPrice / 30; // Simplified: assume 30 days per month
      const unusedCredit = dailyRate * daysRemaining;
      const priceDifference = newPrice - currentPrice;
      const proratedCharge = changeTiming === 'immediate' 
        ? (priceDifference / 30) * daysRemaining
        : 0;

      setProrationDetails({
        currentPlan: currentPlan.name,
        newPlan: newPlan.name,
        currentPrice,
        newPrice,
        priceDifference,
        daysRemaining,
        unusedCredit,
        proratedCharge: changeTiming === 'immediate' ? proratedCharge : 0,
        nextBillingAmount: newPrice,
        effectiveDate: changeTiming === 'immediate' ? 'Immediately' : subscription.current_period_end,
      });
    } catch (error) {
      console.error('Failed to calculate proration:', error);
    }
  };

  const handleUpgradeDowngrade = async () => {
    if (!selectedPlanId || selectedPlanId === subscription.plan_id) {
      setError('Please select a different plan');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      // Determine if it's upgrade or downgrade
      const currentPlan = plans.find(p => p.id === subscription.plan_id);
      const newPlan = plans.find(p => p.id === selectedPlanId);
      
      if (!currentPlan || !newPlan) {
        setError('Invalid plan selection');
        return;
      }

      const currentPrice = currentPlan.price_monthly;
      const newPrice = newPlan.price_monthly;
      const isUpgrade = newPrice > currentPrice;

      // Update subscription
      await subscriptionsAPI.update(subscription.id, {
        new_plan_id: selectedPlanId,
        billing_cycle: billingCycle,
        prorate: changeTiming === 'immediate',
      });

      alert(`Subscription ${isUpgrade ? 'upgraded' : 'downgraded'} successfully!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update subscription:', error);
      setError(error.response?.data?.detail || 'Failed to update subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const currentPlan = plans.find(p => p.id === subscription.plan_id);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const isUpgrade = selectedPlan && currentPlan 
    ? (billingCycle === 'monthly' ? selectedPlan.price_monthly : (selectedPlan.price_yearly || selectedPlan.price_monthly * 12)) >
      (billingCycle === 'monthly' ? currentPlan.price_monthly : (currentPlan.price_yearly || currentPlan.price_monthly * 12))
    : false;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isUpgrade ? 'Upgrade' : 'Change'} Subscription Plan
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Current plan: {currentPlan?.name || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billing Cycle
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                  billingCycle === 'monthly'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                  billingCycle === 'yearly'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Yearly
                {selectedPlan && (
                  <span className="ml-2 text-xs text-green-600">
                    (Save {Math.round((1 - (selectedPlan.price_yearly || selectedPlan.price_monthly * 12) / (selectedPlan.price_monthly * 12)) * 100)}%)
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Plan
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const price = billingCycle === 'monthly'
                  ? plan.price_monthly
                  : (plan.price_yearly || plan.price_monthly * 12);
                const isSelected = plan.id === selectedPlanId;
                const isCurrentPlan = plan.id === subscription.plan_id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => !isCurrentPlan && setSelectedPlanId(plan.id)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50'
                        : isCurrentPlan
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Current
                        </span>
                      </div>
                    )}
                    {isSelected && !isCurrentPlan && (
                      <div className="absolute top-2 right-2">
                        <CheckIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1">{plan.name}</h3>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                    )}
                    {plan.features && (
                      <ul className="text-xs text-gray-600 space-y-1">
                        {plan.max_accounts && (
                          <li>• {plan.max_accounts} accounts</li>
                        )}
                        {plan.max_domains && (
                          <li>• {plan.max_domains} domains</li>
                        )}
                        {plan.max_databases && (
                          <li>• {plan.max_databases} databases</li>
                        )}
                        {plan.max_emails && (
                          <li>• {plan.max_emails} emails</li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Change Timing */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              When should the change take effect?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setChangeTiming('immediate')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  changeTiming === 'immediate'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">Immediately</span>
                </div>
                <p className="text-sm text-gray-600">
                  Change takes effect now with prorated billing
                </p>
              </button>
              <button
                type="button"
                onClick={() => setChangeTiming('next_period')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  changeTiming === 'next_period'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDaysIcon className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">Next Billing Period</span>
                </div>
                <p className="text-sm text-gray-600">
                  Change takes effect at the start of next billing cycle
                </p>
              </button>
            </div>
          </div>

          {/* Comparison Toggle */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
            >
              {showComparison ? 'Hide' : 'Show'} Plan Comparison
            </button>
          </div>

          {/* Plan Comparison */}
          {showComparison && currentPlan && selectedPlan && selectedPlanId !== subscription.plan_id && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Plan Comparison</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Feature</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">{currentPlan.name}</th>
                      <th className="text-center py-2 px-4 font-medium text-gray-700">{selectedPlan.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-4 text-gray-600">Monthly Price</td>
                      <td className="py-2 px-4 text-center">${currentPlan.price_monthly.toFixed(2)}</td>
                      <td className="py-2 px-4 text-center">${selectedPlan.price_monthly.toFixed(2)}</td>
                    </tr>
                    {currentPlan.max_accounts !== undefined && (
                      <tr className="border-b">
                        <td className="py-2 px-4 text-gray-600">Max Accounts</td>
                        <td className="py-2 px-4 text-center">{currentPlan.max_accounts}</td>
                        <td className="py-2 px-4 text-center">
                          {selectedPlan.max_accounts}
                          {selectedPlan.max_accounts > currentPlan.max_accounts && (
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 inline ml-1" />
                          )}
                          {selectedPlan.max_accounts < currentPlan.max_accounts && (
                            <ArrowTrendingDownIcon className="h-4 w-4 text-orange-600 inline ml-1" />
                          )}
                        </td>
                      </tr>
                    )}
                    {currentPlan.max_domains !== undefined && (
                      <tr className="border-b">
                        <td className="py-2 px-4 text-gray-600">Max Domains</td>
                        <td className="py-2 px-4 text-center">{currentPlan.max_domains}</td>
                        <td className="py-2 px-4 text-center">
                          {selectedPlan.max_domains}
                          {selectedPlan.max_domains > currentPlan.max_domains && (
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 inline ml-1" />
                          )}
                          {selectedPlan.max_domains < currentPlan.max_domains && (
                            <ArrowTrendingDownIcon className="h-4 w-4 text-orange-600 inline ml-1" />
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Proration Details */}
          {prorationDetails && selectedPlanId !== subscription.plan_id && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                Billing Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Plan:</span>
                  <span className="font-medium">{prorationDetails.currentPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Plan:</span>
                  <span className="font-medium">{prorationDetails.newPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Difference:</span>
                  <span className={`font-medium ${
                    prorationDetails.priceDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${Math.abs(prorationDetails.priceDifference).toFixed(2)}
                    {prorationDetails.priceDifference >= 0 ? ' more' : ' less'} per {billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {changeTiming === 'immediate' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Remaining:</span>
                      <span className="font-medium">{prorationDetails.daysRemaining} days</span>
                    </div>
                    {prorationDetails.proratedCharge !== 0 && (
                      <div className="flex justify-between pt-2 border-t border-blue-300">
                        <span className="text-gray-900 font-medium">Prorated Charge Today:</span>
                        <span className={`font-bold ${
                          prorationDetails.proratedCharge >= 0 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {prorationDetails.proratedCharge >= 0 ? '+' : ''}${Math.abs(prorationDetails.proratedCharge).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="text-gray-900 font-medium">Next Billing Amount:</span>
                  <span className="font-bold text-gray-900">
                    ${prorationDetails.nextBillingAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Effective Date:</span>
                  <span className="font-medium">{prorationDetails.effectiveDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpgradeDowngrade}
              disabled={processing || !selectedPlanId || selectedPlanId === subscription.plan_id}
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                processing || !selectedPlanId || selectedPlanId === subscription.plan_id
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isUpgrade
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                <>
                  {isUpgrade ? (
                    <>
                      <ArrowTrendingUpIcon className="h-4 w-4 inline mr-2" />
                      Upgrade Plan
                    </>
                  ) : (
                    <>
                      <ArrowTrendingDownIcon className="h-4 w-4 inline mr-2" />
                      Change Plan
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

