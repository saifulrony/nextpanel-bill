'use client';

import { useState, useEffect } from 'react';
import { affiliatesAPI } from '@/lib/api';
import { UserGroupIcon, CurrencyDollarIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      setLoading(true);
      const response = await affiliatesAPI.list();
      setAffiliates(response.data);
    } catch (error: any) {
      console.error('Failed to load affiliates:', error);
      alert(`Failed to load affiliates: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this affiliate?')) return;
    
    try {
      await affiliatesAPI.approve(id);
      alert('Affiliate approved successfully!');
      loadAffiliates();
    } catch (error: any) {
      console.error('Failed to approve affiliate:', error);
      alert(`Failed to approve affiliate: ${error.response?.data?.detail || error.message}`);
    }
  };

  const loadCommissions = async (affiliateId: string) => {
    try {
      const response = await affiliatesAPI.getCommissions(affiliateId);
      setCommissions(response.data);
      setSelectedAffiliate(affiliates.find(a => a.id === affiliateId));
    } catch (error: any) {
      console.error('Failed to load commissions:', error);
      alert(`Failed to load commissions: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Affiliates & Referrals</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Affiliates</p>
              <p className="text-3xl font-bold">{affiliates.length}</p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Commissions</p>
              <p className="text-3xl font-bold">
                ${affiliates.reduce((sum, a) => sum + (a.total_commission_earned || 0), 0).toFixed(2)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payouts</p>
              <p className="text-3xl font-bold">
                ${affiliates.reduce((sum, a) => sum + (a.total_commission_pending || 0), 0).toFixed(2)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {affiliates.map((affiliate) => (
              <tr key={affiliate.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{affiliate.referral_code}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{affiliate.user_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{affiliate.commission_rate}%</td>
                <td className="px-6 py-4 whitespace-nowrap">{affiliate.total_referrals}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${affiliate.total_commission_earned.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    affiliate.status === 'active' ? 'bg-green-100 text-green-800' :
                    affiliate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {affiliate.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {affiliate.status === 'pending' && (
                    <button
                      onClick={() => handleApprove(affiliate.id)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      <CheckIcon className="h-5 w-5 inline" />
                    </button>
                  )}
                  <button
                    onClick={() => loadCommissions(affiliate.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Commissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commissions Modal */}
      {selectedAffiliate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Commissions - {selectedAffiliate.referral_code}</h2>
              <button
                onClick={() => {
                  setSelectedAffiliate(null);
                  setCommissions([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold">${selectedAffiliate.total_commission_earned.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">${selectedAffiliate.total_commission_pending.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold">${selectedAffiliate.total_commission_paid.toFixed(2)}</p>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earned At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.map((commission) => (
                  <tr key={commission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${commission.order_amount.toFixed(2)} {commission.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${commission.commission_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                        commission.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {commission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(commission.earned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

