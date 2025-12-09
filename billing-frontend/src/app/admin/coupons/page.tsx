'use client';

import { useState, useEffect } from 'react';
import { couponsAPI } from '@/lib/api';
import { KeyIcon, PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    coupon_type: 'percentage',
    discount_value: 0,
    minimum_purchase: 0,
    maximum_discount: null,
    usage_limit: null,
    usage_limit_per_user: 1,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: null,
    applicable_to_products: '',
    applicable_to_categories: '',
    first_time_customers_only: false,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponsAPI.list();
      setCoupons(response.data);
    } catch (error: any) {
      console.error('Failed to load coupons:', error);
      alert(`Failed to load coupons: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const data = {
        ...formData,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        maximum_discount: formData.maximum_discount || null,
        usage_limit: formData.usage_limit || null,
      };
      await couponsAPI.create(data);
      alert('Coupon created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error('Failed to create coupon:', error);
      alert(`Failed to create coupon: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleUpdate = async () => {
    try {
      const data = {
        ...formData,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : undefined,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
      };
      await couponsAPI.update(editingCoupon.id, data);
      alert('Coupon updated successfully!');
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error('Failed to update coupon:', error);
      alert(`Failed to update coupon: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await couponsAPI.delete(id);
      alert('Coupon deleted successfully!');
      loadCoupons();
    } catch (error: any) {
      console.error('Failed to delete coupon:', error);
      alert(`Failed to delete coupon: ${error.response?.data?.detail || error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      coupon_type: 'percentage',
      discount_value: 0,
      minimum_purchase: 0,
      maximum_discount: null,
      usage_limit: null,
      usage_limit_per_user: 1,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: null,
      applicable_to_products: '',
      applicable_to_categories: '',
      first_time_customers_only: false,
    });
  };

  const startEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      coupon_type: coupon.coupon_type,
      discount_value: coupon.discount_value,
      minimum_purchase: coupon.minimum_purchase,
      maximum_discount: coupon.maximum_discount,
      usage_limit: coupon.usage_limit,
      usage_limit_per_user: coupon.usage_limit_per_user,
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().split('T')[0] : '',
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : null,
      applicable_to_products: coupon.applicable_to_products || '',
      applicable_to_categories: coupon.applicable_to_categories || '',
      first_time_customers_only: coupon.first_time_customers_only || false,
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
        <h1 className="text-3xl font-bold text-gray-900">Coupons & Promotional Codes</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{coupon.code}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{coupon.name}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{coupon.coupon_type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {coupon.coupon_type === 'percentage' 
                    ? `${coupon.discount_value}%`
                    : `$${coupon.discount_value}`
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {coupon.usage_count} / {coupon.usage_limit || '∞'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    coupon.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {coupon.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => startEdit(coupon)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <PencilIcon className="h-5 w-5 inline" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCoupon) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  disabled={!!editingCoupon}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select
                    value={formData.coupon_type}
                    onChange={(e) => setFormData({ ...formData, coupon_type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Purchase</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_purchase}
                    onChange={(e) => setFormData({ ...formData, minimum_purchase: parseFloat(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Discount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maximum_discount || ''}
                    onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value ? parseFloat(e.target.value) : null })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valid From *</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until || ''}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || null })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.first_time_customers_only}
                  onChange={(e) => setFormData({ ...formData, first_time_customers_only: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">First-time customers only</label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingCoupon ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingCoupon ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

