'use client';

import { useState, useEffect } from 'react';
import { ordersAPI, plansAPI } from '@/lib/api';
import { XMarkIcon, PlusIcon, TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

interface LineItem {
  description: string;
  quantity: number;
  amount: number;
  unit_price: number;
  product_id?: string;
  billing_period?: 'monthly' | 'yearly';
}

interface Product {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  is_active: boolean;
}

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderModal({ onClose, onSuccess }: CreateOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [items, setItems] = useState<LineItem[]>([
    { description: '', quantity: 1, amount: 0, unit_price: 0 }
  ]);
  const [formData, setFormData] = useState({
    due_date: '',
    tax_rate: 0,
    discount_percent: 0,
    discount_amount: 0,
    currency: 'USD',
    notes: '',
    terms: '',
    payment_instructions: '',
    customer_po_number: '',
    is_recurring: false,
    recurring_interval: 'monthly',
    send_email: false,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await plansAPI.list({ is_active: true });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const addProduct = (product: Product, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    const price = billingCycle === 'monthly' ? product.price_monthly : product.price_yearly;
    const description = `${product.name} (${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'})`;
    
    const newItem: LineItem = {
      description,
      quantity: 1,
      unit_price: price,
      amount: price,
      product_id: product.id,
      billing_period: billingCycle,
    };

    setItems([...items, newItem]);
    setShowProductPicker(false);
  };

  const addCustomLineItem = () => {
    setItems([...items, { description: '', quantity: 1, amount: 0, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate amount if quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
      const unit_price = field === 'unit_price' ? parseFloat(value) || 0 : newItems[index].unit_price;
      newItems[index].amount = quantity * unit_price;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    
    let discount = 0;
    if (formData.discount_percent > 0) {
      discount = subtotal * (formData.discount_percent / 100);
    } else if (formData.discount_amount > 0) {
      discount = formData.discount_amount;
    }
    
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (formData.tax_rate / 100);
    const total = afterDiscount + tax;
    
    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate line items
      const validItems = items.filter(item => item.description.trim() !== '');
      if (validItems.length === 0) {
        alert('Please add at least one line item or product');
        setLoading(false);
        return;
      }

      // Determine billing period from items
      // If all items have the same billing_period, use that; otherwise default to monthly
      const billingPeriods = validItems
        .map(item => item.billing_period)
        .filter((bp): bp is 'monthly' | 'yearly' => bp !== undefined);
      
      const billingPeriod = billingPeriods.length > 0 
        ? (billingPeriods.every(bp => bp === billingPeriods[0]) ? billingPeriods[0] : 'monthly')
        : 'monthly';

      // Calculate totals
      const subtotal = validItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discountAmount = formData.discount_percent > 0 
        ? (subtotal * formData.discount_percent / 100)
        : formData.discount_amount;
      const afterDiscount = subtotal - discountAmount;
      const tax = afterDiscount * (formData.tax_rate / 100);
      const total = afterDiscount + tax;

      // Prepare order data
      const orderData = {
        customer_id: 'temp', // This needs to be selected from a customer list
        items: validItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          amount: item.unit_price,
          unit_price: item.unit_price,
          product_id: item.product_id,
        })),
        subtotal,
        tax,
        total,
        payment_method: 'manual',
        billing_info: {},
        billing_period: billingPeriod,
      };

      await ordersAPI.create(orderData);
      alert('Order created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create order:', error);
      alert(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white mb-20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Create New Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Items Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Order Items
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ShoppingBagIcon className="h-4 w-4 mr-2" />
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={addCustomLineItem}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Custom Item
                </button>
              </div>
            </div>

            {/* Product Picker */}
            {showProductPicker && (
              <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4 max-h-80 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Select Products</h4>
                {productsLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No products available</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.description}</p>
                          <div className="mt-1 flex space-x-4">
                            <span className="text-xs text-gray-600">
                              Monthly: ${product.price_monthly}
                            </span>
                            <span className="text-xs text-gray-600">
                              Yearly: ${product.price_yearly}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => addProduct(product, 'monthly')}
                            className="px-3 py-1 text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            + Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() => addProduct(product, 'yearly')}
                            className="px-3 py-1 text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            + Yearly
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Line Items List */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-start bg-white p-3 rounded-lg border border-gray-200">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      min="1"
                      step="1"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <input
                      type="text"
                      value={`$${item.amount.toFixed(2)}`}
                      disabled
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm font-medium text-gray-900 cursor-not-allowed"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="p-2 text-red-600 hover:text-red-900 disabled:opacity-50"
                      disabled={items.length === 1}
                      title="Remove item"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Pricing Adjustments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount (% or fixed amount)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0, discount_amount: 0 })}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Discount %"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0, discount_percent: 0 })}
                  min="0"
                  step="0.01"
                  placeholder="Discount $"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              {totals.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                  <span className="font-medium text-gray-900">${totals.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-indigo-600">${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Internal notes (visible to customer)"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Recurring Order</span>
              </label>

              {formData.is_recurring && (
                <select
                  value={formData.recurring_interval}
                  onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value })}
                  className="appearance-none px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.send_email}
                  onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Send Email to Customer</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

