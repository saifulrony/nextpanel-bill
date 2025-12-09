'use client';

import { useState, useEffect } from 'react';
import { currenciesAPI } from '@/lib/api';
import { PlusIcon, PencilIcon, BanknotesIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    symbol_position: 'before',
    exchange_rate_to_usd: 1.0,
    is_base_currency: false,
    decimal_places: '2',
  });
  const [convertData, setConvertData] = useState({
    amount: 0,
    from_currency: 'USD',
    to_currency: 'EUR',
  });
  const [convertResult, setConvertResult] = useState<any>(null);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const response = await currenciesAPI.list();
      setCurrencies(response.data);
    } catch (error: any) {
      console.error('Failed to load currencies:', error);
      alert(`Failed to load currencies: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await currenciesAPI.create(formData);
      alert('Currency created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadCurrencies();
    } catch (error: any) {
      console.error('Failed to create currency:', error);
      alert(`Failed to create currency: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleUpdate = async () => {
    try {
      await currenciesAPI.update(editingCurrency.id, formData);
      alert('Currency updated successfully!');
      setEditingCurrency(null);
      resetForm();
      loadCurrencies();
    } catch (error: any) {
      console.error('Failed to update currency:', error);
      alert(`Failed to update currency: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleConvert = async () => {
    try {
      const response = await currenciesAPI.convert(convertData);
      setConvertResult(response.data);
    } catch (error: any) {
      console.error('Failed to convert currency:', error);
      alert(`Failed to convert: ${error.response?.data?.detail || error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      symbol_position: 'before',
      exchange_rate_to_usd: 1.0,
      is_base_currency: false,
      decimal_places: '2',
    });
  };

  const startEdit = (currency: any) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      symbol_position: currency.symbol_position,
      exchange_rate_to_usd: currency.exchange_rate_to_usd,
      is_base_currency: currency.is_base_currency,
      decimal_places: currency.decimal_places,
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
        <h1 className="text-3xl font-bold text-gray-900">Currencies</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConvertModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <ArrowsRightLeftIcon className="h-5 w-5" />
            Convert
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingCurrency(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add Currency
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate to USD</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currencies.map((currency) => (
              <tr key={currency.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{currency.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency.symbol}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency.exchange_rate_to_usd.toFixed(4)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {currency.is_base_currency && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Base</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    currency.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {currency.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => startEdit(currency)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <PencilIcon className="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCurrency) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCurrency ? 'Edit Currency' : 'Add Currency'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    maxLength={3}
                    disabled={!!editingCurrency}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symbol *</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Symbol Position</label>
                  <select
                    value={formData.symbol_position}
                    onChange={(e) => setFormData({ ...formData, symbol_position: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="before">Before</option>
                    <option value="after">After</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Exchange Rate to USD *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.exchange_rate_to_usd}
                  onChange={(e) => setFormData({ ...formData, exchange_rate_to_usd: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_base_currency}
                  onChange={(e) => setFormData({ ...formData, is_base_currency: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Set as base currency</label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCurrency(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingCurrency ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingCurrency ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Currency Converter</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={convertData.amount}
                  onChange={(e) => setConvertData({ ...convertData, amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">From</label>
                  <select
                    value={convertData.from_currency}
                    onChange={(e) => setConvertData({ ...convertData, from_currency: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {currencies.filter(c => c.is_active).map(c => (
                      <option key={c.id} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">To</label>
                  <select
                    value={convertData.to_currency}
                    onChange={(e) => setConvertData({ ...convertData, to_currency: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {currencies.filter(c => c.is_active).map(c => (
                      <option key={c.id} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {convertResult && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Converted Amount:</p>
                  <p className="text-2xl font-bold text-green-700">
                    {convertResult.converted_amount.toFixed(2)} {convertResult.to_currency}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Rate: {convertResult.exchange_rate.toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setConvertResult(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleConvert}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

