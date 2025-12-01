'use client';

import { useState, useEffect } from 'react';
import { ordersAPI, api, plansAPI } from '@/lib/api';
import AutomationRules from './AutomationRules';

interface Customer {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
}

interface Order {
  id: string;
  order_number?: string;
  invoice_number?: string;
  customer_id?: string;
  customer?: Customer;
  status: string;
  subtotal: number;
  discount_amount: number;
  discount_percent?: number;
  tax: number;
  tax_rate?: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  order_date?: string;
  invoice_date?: string;
  due_date: string;
  paid_at: string | null;
  items: any[];
  notes: string | null;
  terms?: string | null;
  payment_instructions?: string | null;
  is_recurring: boolean;
  recurring_interval?: string | null;
  sent_to_customer: boolean;
  reminder_count?: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  category?: string;
  is_active?: boolean;
}

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
}

export default function OrderDetailsModal({ order, onClose, onUpdate }: OrderDetailsModalProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadCustomerDetails();
    setEditedItems(order.items || []);
    if (isEditing) {
      loadProducts();
    }
  }, [order.id, isEditing]);

  const loadCustomerDetails = async () => {
    try {
      // Check if customer data is already in the order object
      console.log('Order data:', order);
      
      // Try different possible field names
      const customerId = (order as any).customer_id || (order as any).user_id;
      const customerData = (order as any).customer || (order as any).user;
      
      console.log('Customer ID:', customerId);
      console.log('Customer data in order:', customerData);
      
      if (customerData) {
        // Customer data is already in the order
        setCustomer(customerData);
        return;
      }
      
      if (customerId) {
        // Fetch customer details from API
        try {
          const response = await api.get(`/customers/${customerId}`);
          console.log('Customer data from API:', response.data);
          setCustomer(response.data);
        } catch (apiError) {
          console.error('Failed to fetch customer from API:', apiError);
          // Try to get from user endpoint as fallback
          try {
            const userResponse = await api.get(`/auth/users/${customerId}`);
            console.log('Customer data from users API:', userResponse.data);
            setCustomer(userResponse.data);
          } catch (userError) {
            console.error('Failed to fetch customer from users API:', userError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load customer details:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await plansAPI.list({ is_active: true });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAddProductFromShop = (product: Product) => {
    const selectedPrice = billingPeriod === 'yearly' ? product.price_yearly : product.price_monthly;
    const billingPeriodLabel = billingPeriod === 'yearly' ? 'Yearly' : 'Monthly';
    
    setEditedItems([
      ...editedItems,
      {
        description: `${product.name} (${billingPeriodLabel})`,
        product_name: product.name,
        product_id: product.id,
        billing_period: billingPeriod,
        quantity: 1,
        unit_price: selectedPrice,
        price: selectedPrice,
      },
    ]);
    setShowProductSelector(false);
    setProductSearch('');
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const downloadPDF = async () => {
    try {
      const response = await ordersAPI.downloadPDF(order.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${order.order_number || order.invoice_number || order.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download PDF');
    }
  };

  const sendOrder = async () => {
    if (!confirm('Send this order via email?')) return;
    
    setSendingEmail(true);
    try {
      // OFFLINE MODE: Simulate sending email
      // In production, this would call the backend API
      console.log('=== EMAIL SENT (OFFLINE MODE) ===');
      console.log('To:', customer?.email || 'customer@example.com');
      console.log('Subject: Order Confirmation - Order #' + (order.order_number || order.invoice_number || order.id));
      console.log('Body:');
      console.log(`
Dear ${customer?.full_name || 'Customer'},

Thank you for your order!

Order Details:
- Order Number: ${order.order_number || order.invoice_number || order.id}
- Date: ${new Date(order.order_date || order.invoice_date || order.created_at).toLocaleDateString()}
- Total: $${order.total.toFixed(2)}

Items:
${order.items?.map((item: any) => `- ${item.description || item.product_name}: $${(item.unit_price || item.amount).toFixed(2)}`).join('\n')}

Total Amount: $${order.total.toFixed(2)}

Thank you for your business!

Best regards,
NextPanel Team
      `);
      console.log('================================');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Order sent successfully! (Offline mode - check console for details)');
      onUpdate();
    } catch (error: any) {
      console.error('Failed to send order:', error);
      
      // Handle different error response formats
      let errorMessage = 'Failed to send order';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (Array.isArray(errorData)) {
          errorMessage = errorData.map((err: any) => 
            err.msg || err.message || 'Validation error'
          ).join(', ');
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.msg) {
          errorMessage = errorData.msg;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      // Calculate new totals
      const newSubtotal = editedItems.reduce((sum, item) => {
        const unitPrice = item.unit_price || item.amount || item.price || 0;
        const quantity = item.quantity || 1;
        return sum + (unitPrice * quantity);
      }, 0);
      
      const newTax = newSubtotal * ((order.tax_rate || 0) / 100);
      const newTotal = newSubtotal + newTax;
      
      console.log('Saving order with data:', {
        orderId: order.id,
        items: editedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      });
      
      // Update order via API
      const response = await ordersAPI.update(order.id, {
        items: editedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      });
      
      console.log('Order updated successfully:', response.data);
      alert('Order updated successfully!');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating order:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Authentication failed. Please login again.');
        // Don't redirect here, let the interceptor handle it
      } else {
        // Handle different error response formats
        let errorMessage = 'Failed to update order';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          if (Array.isArray(errorData)) {
            errorMessage = errorData.map((err: any) => 
              err.msg || err.message || 'Validation error'
            ).join(', ');
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.msg) {
            errorMessage = errorData.msg;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedItems(order.items || []);
    setIsEditing(false);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...editedItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setEditedItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(updatedItems);
  };

  const handleAddItem = () => {
    setEditedItems([
      ...editedItems,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'void': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
            <p className="mt-1 text-sm text-gray-500">Order {order.order_number || order.invoice_number || order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
            <div className="flex space-x-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Edit Order
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    Download PDF
                  </button>
                  {!order.sent_to_customer && (
                    <button
                      onClick={sendOrder}
                      disabled={sendingEmail}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {sendingEmail ? 'Sending...' : 'Send Email'}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveOrder}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Customer Details */}
          {customer && (
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Customer Name</h5>
                  <p className="mt-1 text-sm text-gray-900">{customer.full_name}</p>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Email</h5>
                  <p className="mt-1 text-sm text-gray-900">{customer.email}</p>
                </div>
                {customer.company_name && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">Company</h5>
                    <p className="mt-1 text-sm text-gray-900">{customer.company_name}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Order Date</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(order.order_date || order.invoice_date || order.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(order.due_date)}</p>
            </div>
            {order.paid_at && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Paid Date</h4>
                <p className="mt-1 text-sm text-gray-900">{formatDate(order.paid_at)}</p>
              </div>
            )}
            {order.is_recurring && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Recurring</h4>
                <p className="mt-1 text-sm text-gray-900">{order.recurring_interval}</p>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-900">Line Items</h4>
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowProductSelector(!showProductSelector)}
                    className="px-3 py-1 text-sm text-green-600 hover:text-green-900 border border-green-600 rounded-md hover:bg-green-50"
                  >
                    🛍️ Add from Shop
                  </button>
                  <button
                    onClick={handleAddItem}
                    className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded-md hover:bg-indigo-50"
                  >
                    + Add Custom Item
                  </button>
                </div>
              )}
            </div>

            {/* Product Selector */}
            {isEditing && showProductSelector && (
              <div className="mb-4 border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-900">Select Product from Shop</h5>
                  <button
                    onClick={() => setShowProductSelector(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Billing Period Selector */}
                <div className="mb-3 flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Billing Period:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBillingPeriod('monthly')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        billingPeriod === 'monthly'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod('yearly')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        billingPeriod === 'yearly'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-3"
                />
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md hover:border-green-500 cursor-pointer"
                        onClick={() => handleAddProductFromShop(product)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500 mt-1">{product.description}</div>
                          )}
                          {product.category && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              {product.category}
                            </span>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <div className="font-semibold text-sm text-gray-900">
                            ${billingPeriod === 'yearly' 
                              ? (product.price_yearly?.toFixed(2) || '0.00') 
                              : (product.price_monthly?.toFixed(2) || '0.00')
                            }/{billingPeriod === 'yearly' ? 'yr' : 'mo'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {billingPeriod === 'yearly' ? (
                              <>${product.price_monthly?.toFixed(2) || '0.00'}/mo</>
                            ) : (
                              <>${product.price_yearly?.toFixed(2) || '0.00'}/yr</>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddProductFromShop(product);
                            }}
                            className="mt-1 px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      {productSearch ? 'No products found' : 'No products available'}
                    </div>
                  )}
                </div>
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  {isEditing && <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editedItems.map((item: any, index: number) => {
                  const unitPrice = item.unit_price || item.amount || item.price || 0;
                  const quantity = item.quantity || 1;
                  return (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.description || item.product_name || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            placeholder="Item description"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.description || item.product_name || 'Item'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm text-right"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 text-right block">{quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="number"
                            value={unitPrice}
                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm text-right"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 text-right block">${unitPrice.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 text-right block">${(unitPrice * quantity).toFixed(2)}</span>
                      </td>
                      {isEditing && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="space-y-2 text-sm max-w-xs ml-auto">
              {(() => {
                const newSubtotal = editedItems.reduce((sum, item) => {
                  const unitPrice = item.unit_price || item.amount || item.price || 0;
                  const quantity = item.quantity || 1;
                  return sum + (unitPrice * quantity);
                }, 0);
                const newTax = newSubtotal * ((order.tax_rate || 0) / 100);
                const newTotal = newSubtotal + newTax;
                
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">${newSubtotal.toFixed(2)}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>
                          Discount {order.discount_percent && order.discount_percent > 0 && `(${order.discount_percent}%)`}:
                        </span>
                        <span>-${order.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {newTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Tax {order.tax_rate && order.tax_rate > 0 && `(${order.tax_rate}%)`}:
                        </span>
                        <span className="font-medium text-gray-900">${newTax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${newTotal.toFixed(2)}</span>
                    </div>
                    {order.amount_paid > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Amount Paid:</span>
                          <span>-${order.amount_paid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span className="text-gray-900">Amount Due:</span>
                          <span className="text-gray-900">${(newTotal - order.amount_paid).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>


          {/* Notes and Terms */}
          {(order.notes || order.terms || order.payment_instructions) && (
            <div className="space-y-4 pt-4 border-t">
              {order.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </div>
              )}
              {order.terms && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Terms</h4>
                  <p className="text-sm text-gray-600">{order.terms}</p>
                </div>
              )}
              {order.payment_instructions && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Payment Instructions</h4>
                  <p className="text-sm text-gray-600">{order.payment_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* Automation Rules */}
          <div className="pt-4 border-t">
            <AutomationRules orderId={order.id} />
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

