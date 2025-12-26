'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCartIcon, TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface CartComponentProps {
  style?: React.CSSProperties;
  className?: string;
  isEditor?: boolean;
  props?: {
    showHeader?: boolean;
    showCheckoutButton?: boolean;
    showEmptyState?: boolean;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    headerText?: string;
    emptyStateText?: string;
    checkoutButtonText?: string;
    showItemCount?: boolean;
    showTotal?: boolean;
    // Colors
    itemBackgroundColor?: string;
    borderColor?: string;
    headerTextColor?: string;
    priceColor?: string;
    totalTextColor?: string;
    clearButtonBackground?: string;
    clearButtonTextColor?: string;
    clearButtonBorderColor?: string;
    // Typography
    fontFamily?: string;
    headerFontSize?: string;
    headerFontWeight?: string;
    itemNameFontSize?: string;
    itemNameFontWeight?: string;
    priceFontSize?: string;
    priceFontWeight?: string;
    totalFontSize?: string;
    totalFontWeight?: string;
    buttonFontSize?: string;
    buttonFontWeight?: string;
    // Spacing
    padding?: string;
    margin?: string;
    itemGap?: string;
    itemPadding?: string;
    headerMarginBottom?: string;
    totalMarginTop?: string;
    // Borders
    itemBorderWidth?: string;
    itemBorderRadius?: string;
    containerBorderWidth?: string;
    containerBorderRadius?: string;
    // Button Styling
    buttonBorderRadius?: string;
    buttonPadding?: string;
    buttonHoverOpacity?: number;
    // Layout
    itemLayout?: 'horizontal' | 'vertical';
    headerAlignment?: 'left' | 'center' | 'right';
    buttonAlignment?: 'stretch' | 'left' | 'center' | 'right';
    maxWidth?: string;
    width?: string;
    // Effects
    itemHoverShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    itemTransitionDuration?: string;
    boxShadow?: string;
  };
}

export default function CartComponent({ 
  style = {}, 
  className = '',
  isEditor = false,
  props = {}
}: CartComponentProps) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const {
    showHeader = true,
    showCheckoutButton = true,
    showEmptyState = true,
    backgroundColor = '#ffffff',
    textColor = '#374151',
    buttonColor = '#4f46e5',
    buttonTextColor = '#ffffff',
    headerText = 'Shopping Cart',
    emptyStateText = 'Your cart is empty',
    checkoutButtonText = 'Proceed to Checkout',
    showItemCount = true,
    showTotal = true,
    // Colors
    itemBackgroundColor = '#ffffff',
    borderColor = '#e5e7eb',
    headerTextColor,
    priceColor,
    totalTextColor,
    clearButtonBackground = '#ffffff',
    clearButtonTextColor = '#374151',
    clearButtonBorderColor = '#d1d5db',
    // Typography
    fontFamily = 'Inter',
    headerFontSize = '24px',
    headerFontWeight = 'bold',
    itemNameFontSize = '16px',
    itemNameFontWeight = '500',
    priceFontSize = '16px',
    priceFontWeight = '600',
    totalFontSize = '20px',
    totalFontWeight = '700',
    buttonFontSize = '16px',
    buttonFontWeight = '500',
    // Spacing
    padding = '24px',
    margin,
    itemGap = '16px',
    itemPadding = '16px',
    headerMarginBottom = '24px',
    totalMarginTop = '24px',
    // Borders
    itemBorderWidth = '1px',
    itemBorderRadius = '8px',
    containerBorderWidth = '0px',
    containerBorderRadius = '0px',
    // Button Styling
    buttonBorderRadius = '8px',
    buttonPadding = '12px 24px',
    buttonHoverOpacity = 0.9,
    // Layout
    itemLayout = 'horizontal',
    headerAlignment = 'left',
    buttonAlignment = 'stretch',
    maxWidth,
    width,
    // Effects
    itemHoverShadow = 'sm',
    itemTransitionDuration = '200ms',
    boxShadow = 'none',
  } = props;

  // Shadow mapping
  const shadowMap = {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  };

  const hoverShadow = shadowMap[itemHoverShadow] || shadowMap.sm;

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
        className={`text-center ${className}`}
        style={{
          backgroundColor,
          color: textColor,
          padding,
          margin,
          fontFamily,
          borderWidth: containerBorderWidth,
          borderStyle: containerBorderWidth !== '0px' ? 'solid' : 'none',
          borderColor: containerBorderWidth !== '0px' ? borderColor : 'transparent',
          borderRadius: containerBorderRadius,
          boxShadow: boxShadow !== 'none' ? boxShadow : undefined,
          maxWidth,
          width,
          ...style
        }}
      >
        <ShoppingCartIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">{emptyStateText}</h3>
        <p className="text-gray-500 mb-6">Add some items to get started</p>
        <button
          onClick={isEditor ? undefined : () => router.push('/shop')}
          className={`font-medium transition ${isEditor ? 'cursor-default' : 'cursor-pointer'}`}
          style={{
            backgroundColor: buttonColor,
            color: buttonTextColor,
            fontSize: buttonFontSize,
            fontWeight: buttonFontWeight,
            padding: buttonPadding,
            borderRadius: buttonBorderRadius,
            fontFamily,
            ...(isEditor ? {} : { opacity: 1, transition: `opacity ${itemTransitionDuration}` }),
          }}
          onMouseEnter={(e) => {
            if (!isEditor) {
              e.currentTarget.style.opacity = String(buttonHoverOpacity);
            }
          }}
          onMouseLeave={(e) => {
            if (!isEditor) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const headerAlignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[headerAlignment] || 'justify-between';

  const buttonAlignClass = {
    stretch: 'flex-1',
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
  }[buttonAlignment] || 'flex-1';

  return (
    <div 
      className={className}
      style={{
        backgroundColor,
        color: textColor,
        padding,
        margin,
        fontFamily,
        borderWidth: containerBorderWidth,
        borderStyle: containerBorderWidth !== '0px' ? 'solid' : 'none',
        borderColor: containerBorderWidth !== '0px' ? borderColor : 'transparent',
        borderRadius: containerBorderRadius,
        boxShadow: boxShadow !== 'none' ? boxShadow : undefined,
        maxWidth,
        width,
        ...style
      }}
    >
      {showHeader && (
        <div 
          className={`flex items-center ${headerAlignClass === 'justify-between' ? 'justify-between' : headerAlignClass} mb-6`}
          style={{ marginBottom: headerMarginBottom }}
        >
          <h2 
            style={{
              fontSize: headerFontSize,
              fontWeight: headerFontWeight,
              color: headerTextColor || textColor,
              fontFamily,
            }}
          >
            {headerText}
          </h2>
          {showItemCount && (
            <span className="text-sm text-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: itemGap }}>
        {items.map((item) => (
          <div 
            key={item.id}
            className={itemLayout === 'horizontal' ? 'flex items-center' : 'flex flex-col'}
            style={{
              gap: itemLayout === 'horizontal' ? '16px' : '12px',
              padding: itemPadding,
              backgroundColor: itemBackgroundColor,
              borderWidth: itemBorderWidth,
              borderStyle: itemBorderWidth !== '0px' ? 'solid' : 'none',
              borderColor: itemBorderWidth !== '0px' ? borderColor : 'transparent',
              borderRadius: itemBorderRadius,
              transition: `box-shadow ${itemTransitionDuration}, transform ${itemTransitionDuration}`,
              fontFamily,
            }}
            onMouseEnter={(e) => {
              if (itemHoverShadow !== 'none') {
                e.currentTarget.style.boxShadow = hoverShadow;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex-1">
              <h3 
                style={{
                  fontSize: itemNameFontSize,
                  fontWeight: itemNameFontWeight,
                  fontFamily,
                }}
              >
                {item.name}
              </h3>
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

            <div className={`flex items-center ${itemLayout === 'horizontal' ? 'space-x-3' : 'justify-between w-full'}`}>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  disabled={isUpdating === item.id}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  style={{ fontFamily }}
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-medium" style={{ fontFamily }}>{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  disabled={isUpdating === item.id}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  style={{ fontFamily }}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="text-right" style={{ fontFamily }}>
                <div 
                  style={{
                    fontSize: priceFontSize,
                    fontWeight: priceFontWeight,
                    color: priceColor || textColor,
                  }}
                >
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
                style={{ fontFamily }}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showTotal && items.length > 0 && (
        <div 
          style={{ 
            marginTop: totalMarginTop, 
            paddingTop: '16px', 
            borderTop: `1px solid ${borderColor}` 
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <span 
              style={{
                fontSize: totalFontSize,
                fontWeight: totalFontWeight,
                color: totalTextColor || textColor,
                fontFamily,
              }}
            >
              Total:
            </span>
            <span 
              style={{
                fontSize: totalFontSize,
                fontWeight: totalFontWeight,
                color: totalTextColor || textColor,
                fontFamily,
              }}
            >
              ${getTotal().toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div 
          className="flex space-x-3 mt-6"
          style={{ 
            justifyContent: buttonAlignment === 'stretch' ? 'stretch' : 
                         buttonAlignment === 'center' ? 'center' :
                         buttonAlignment === 'right' ? 'flex-end' : 'flex-start'
          }}
        >
          {showCheckoutButton && (
            <button
              onClick={isEditor ? undefined : handleCheckout}
              className={`${buttonAlignClass} font-medium transition ${isEditor ? 'cursor-default' : 'cursor-pointer'}`}
              style={{
                backgroundColor: buttonColor,
                color: buttonTextColor,
                fontSize: buttonFontSize,
                fontWeight: buttonFontWeight,
                padding: buttonPadding,
                borderRadius: buttonBorderRadius,
                fontFamily,
                ...(isEditor ? {} : { opacity: 1, transition: `opacity ${itemTransitionDuration}` }),
              }}
              onMouseEnter={(e) => {
                if (!isEditor) {
                  e.currentTarget.style.opacity = String(buttonHoverOpacity);
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditor) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              {checkoutButtonText}
            </button>
          )}
          <button
            onClick={handleClearCart}
            className="px-4 py-3 rounded-lg transition"
            style={{
              backgroundColor: clearButtonBackground,
              color: clearButtonTextColor,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: clearButtonBorderColor,
              fontFamily,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = clearButtonBackground;
            }}
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
}
