'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCartIcon, TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface CartComponentProps {
  style?: React.CSSProperties;
  className?: string;
  props?: {
    showHeader?: boolean;
    showCheckoutButton?: boolean;
    showEmptyState?: boolean;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    headerText?: string;
    emptyStateText?: string;
    checkoutButtonText?: string;
    showItemCount?: boolean;
    showTotal?: boolean;
  };
}

export default function CartComponent({ 
  style = {}, 
  className = '',
  props = {}
}: CartComponentProps) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const {
    showHeader = true,
    showCheckoutButton = true,
    showEmptyState = true,
    backgroundColor = '#ffffff',
    textColor = '#374151',
    buttonColor = '#4f46e5',
    headerText = 'Shopping Cart',
    emptyStateText = 'Your cart is empty',
    checkoutButtonText = 'Proceed to Checkout',
    showItemCount = true,
    showTotal = true,
  } = props;

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setIsUpdating(itemId);
    try {
      updateQuantity(itemId, newQuantity);
    } finally {
      setTimeout(() => setIsUpdating(null), 300);
    }
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (items.length === 0 && showEmptyState) {
    return (
      <div 
        className={`p-8 text-center ${className}`}
        style={{
          backgroundColor,
          color: textColor,
          ...style
        }}
      >
        <ShoppingCartIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">{emptyStateText}</h3>
        <p className="text-gray-500 mb-6">Add some items to get started</p>
        <button
          onClick={() => router.push('/shop')}
          className="px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition"
          style={{ backgroundColor: buttonColor }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`p-6 ${className}`}
      style={{
        backgroundColor,
        color: textColor,
        ...style
      }}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{headerText}</h2>
          {showItemCount && (
            <span className="text-sm text-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id}
            className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition"
          >
            <div className="flex-1">
              <h3 className="font-medium">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-500">
                  {item.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
                </span>
                {item.category && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500 capitalize">{item.category}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  disabled={isUpdating === item.id}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  disabled={isUpdating === item.id}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="text-right">
                <div className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  ${item.price.toFixed(2)} each
                </div>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                title="Remove item"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showTotal && items.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex space-x-3 mt-6">
          {showCheckoutButton && (
            <button
              onClick={handleCheckout}
              className="flex-1 px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition"
              style={{ backgroundColor: buttonColor }}
            >
              {checkoutButtonText}
            </button>
          )}
          <button
            onClick={handleClearCart}
            className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
}
