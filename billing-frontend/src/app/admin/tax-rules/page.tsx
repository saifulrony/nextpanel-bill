'use client';

import { useState, useEffect } from 'react';
import { taxRulesAPI } from '@/lib/api';
import { PlusIcon, PencilIcon, CalculatorIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function TaxRulesPage() {
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [exemptions, setExemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExemptionModal, setShowExemptionModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tax_type: 'vat',
    rule_type: 'country',
    rate: 0,
    country_code: '',
    state_code: '',
    city: '',
    priority: '0',
    is_compound: false,
  });
  const [exemptionData, setExemptionData] = useState({
    user_id: '',
    tax_rule_id: '',
    exemption_reason: '',
    tax_id: '',
  });
  const [calculateData, setCalculateData] = useState({
    amount: 0,
    country_code: '',
    state_code: '',
    city: '',
    user_id: '',
  });
  const [calculateResult, setCalculateResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesResponse, exemptionsResponse] = await Promise.all([
        taxRulesAPI.list(),
        taxRulesAPI.listExemptions(),
      ]);
      setTaxRules(rulesResponse.data);
      setExemptions(exemptionsResponse.data);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      alert(`Failed to load data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await taxRulesAPI.create(formData);
      alert('Tax rule created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Failed to create tax rule:', error);
      alert(`Failed to create tax rule: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleCreateExemption = async () => {
    try {
      await taxRulesAPI.createExemption(exemptionData);
      alert('Tax exemption created successfully!');
      setShowExemptionModal(false);
      setExemptionData({ user_id: '', tax_rule_id: '', exemption_reason: '', tax_id: '' });
      loadData();
    } catch (error: any) {
      console.error('Failed to create exemption:', error);
      alert(`Failed to create exemption: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleCalculate = async () => {
    try {
      const params = new URLSearchParams();
      params.append('amount', calculateData.amount.toString());
      if (calculateData.country_code) params.append('country_code', calculateData.country_code);
      if (calculateData.state_code) params.append('state_code', calculateData.state_code);
      if (calculateData.city) params.append('city', calculateData.city);
      if (calculateData.user_id) params.append('user_id', calculateData.user_id);

      const response = await taxRulesAPI.calculate(params);
      setCalculateResult(response.data);
    } catch (error: any) {
      console.error('Failed to calculate tax:', error);
      alert(`Failed to calculate tax: ${error.response?.data?.detail || error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tax_type: 'vat',
      rule_type: 'country',
      rate: 0,
      country_code: '',
      state_code: '',
      city: '',
      priority: '0',
      is_compound: false,
    });
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
        <h1 className="text-3xl font-bold text-gray-900">Tax Rules & Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCalculateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CalculatorIcon className="h-5 w-5" />
            Calculate Tax
          </button>
          <button
            onClick={() => setShowExemptionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <ShieldExclamationIcon className="h-5 w-5" />
            Add Exemption
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5" />
            Create Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Tax Rules</h2>
          <div className="space-y-2">
            {taxRules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{rule.name}</p>
                    <p className="text-sm text-gray-900">
                      {rule.tax_type.toUpperCase()} - {rule.rate}%
                    </p>
                    <p className="text-xs text-gray-700">
                      {rule.country_code && `Country: ${rule.country_code}`}
                      {rule.state_code && ` | State: ${rule.state_code}`}
                      {rule.city && ` | City: ${rule.city}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Tax Exemptions</h2>
          <div className="space-y-2">
            {exemptions.map((exemption) => (
              <div key={exemption.id} className="border border-gray-200 rounded p-3">
                <p className="font-semibold text-gray-900">User: {exemption.user_id}</p>
                <p className="text-sm text-gray-900">{exemption.exemption_reason}</p>
                <p className="text-xs text-gray-700">
                  {exemption.tax_id && `Tax ID: ${exemption.tax_id}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Tax Rule</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Type *</label>
                  <select
                    value={formData.tax_type}
                    onChange={(e) => setFormData({ ...formData, tax_type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="vat">VAT</option>
                    <option value="gst">GST</option>
                    <option value="sales_tax">Sales Tax</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rule Type *</label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="country">Country</option>
                    <option value="state">State</option>
                    <option value="city">City</option>
                    <option value="product">Product</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country Code</label>
                  <input
                    type="text"
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    maxLength={2}
                    placeholder="US"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">State Code</label>
                  <input
                    type="text"
                    value={formData.state_code}
                    onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_compound}
                  onChange={(e) => setFormData({ ...formData, is_compound: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Compound tax (tax on tax)</label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exemption Modal */}
      {showExemptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create Tax Exemption</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID *</label>
                <input
                  type="text"
                  value={exemptionData.user_id}
                  onChange={(e) => setExemptionData({ ...exemptionData, user_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Rule ID</label>
                <input
                  type="text"
                  value={exemptionData.tax_rule_id}
                  onChange={(e) => setExemptionData({ ...exemptionData, tax_rule_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Exemption Reason</label>
                <textarea
                  value={exemptionData.exemption_reason}
                  onChange={(e) => setExemptionData({ ...exemptionData, exemption_reason: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                <input
                  type="text"
                  value={exemptionData.tax_id}
                  onChange={(e) => setExemptionData({ ...exemptionData, tax_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowExemptionModal(false);
                  setExemptionData({ user_id: '', tax_rule_id: '', exemption_reason: '', tax_id: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateExemption}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculate Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Calculate Tax</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={calculateData.amount}
                  onChange={(e) => setCalculateData({ ...calculateData, amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country Code</label>
                  <input
                    type="text"
                    value={calculateData.country_code}
                    onChange={(e) => setCalculateData({ ...calculateData, country_code: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">State Code</label>
                  <input
                    type="text"
                    value={calculateData.state_code}
                    onChange={(e) => setCalculateData({ ...calculateData, state_code: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              {calculateResult && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Tax Amount:</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${calculateResult.tax_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tax Rate: {calculateResult.tax_rate.toFixed(2)}%
                  </p>
                  {calculateResult.applicable_rules && calculateResult.applicable_rules.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold">Applicable Rules:</p>
                      {calculateResult.applicable_rules.map((rule: any, idx: number) => (
                        <p key={idx} className="text-xs text-gray-600">- {rule.name} ({rule.rate}%)</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCalculateModal(false);
                  setCalculateResult(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleCalculate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Calculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

