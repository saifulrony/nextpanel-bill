'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ordersAPI } from '@/lib/api';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Order {
  id: string;
  customer_id: string;
  status: string;
  invoice_number?: string;
  order_number?: string;
  items: any[];
  subtotal: number;
  discount_amount: number;
  discount_percent?: number;
  tax: number;
  tax_rate?: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  payment_method?: string;
  billing_info?: any;
  billing_period?: string;
  due_date: string;
  order_date?: string;
  invoice_date?: string;
  paid_at: string | null;
  notes: string | null;
  terms?: string | null;
  payment_instructions?: string | null;
  is_recurring: boolean;
  recurring_interval?: string | null;
  sent_to_customer: boolean;
  reminder_count?: number;
  created_at: string;
  updated_at?: string;
  customer?: any;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.get(orderId);
      setOrder(response.data);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    // Refresh the order data after update
    fetchOrder();
  };

  const handleClose = () => {
    // Navigate back to orders list
    router.push('/admin/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading order...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Orders
            </button>
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {error || 'The order you are looking for does not exist or has been deleted.'}
              </p>
              <button
                onClick={handleClose}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Orders
        </button>

        {/* Order Details - Render as page */}
        <OrderDetailsModal
          order={order}
          onClose={handleClose}
          onUpdate={handleUpdate}
          asPage={true}
        />
      </div>
    </div>
  );
}

