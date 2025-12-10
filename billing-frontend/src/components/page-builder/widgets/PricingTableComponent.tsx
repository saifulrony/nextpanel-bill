'use client';

import React, { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  currency?: string;
  originalPrice?: string;
  description?: string;
  features: string[];
  buttonText: string;
  buttonLink?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  popular?: boolean;
  badge?: string;
  icon?: string;
}

interface PricingTableComponentProps {
  style?: React.CSSProperties;
  props?: {
    title?: string;
    subtitle?: string;
    plans?: PricingPlan[];
    columns?: number;
    layout?: 'default' | 'minimal' | 'modern' | 'classic';
    showToggle?: boolean;
    toggleLabel1?: string;
    toggleLabel2?: string;
    currency?: string;
    currencyPosition?: 'before' | 'after';
    backgroundColor?: string;
    cardBackgroundColor?: string;
    cardBorderColor?: string;
    cardBorderWidth?: string;
    cardBorderRadius?: string;
    cardPadding?: string;
    cardShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    popularPlanId?: string;
    popularBadgeText?: string;
    popularBadgeColor?: string;
    popularBadgeTextColor?: string;
    popularCardColor?: string;
    popularCardBorderColor?: string;
    titleColor?: string;
    priceColor?: string;
    priceFontSize?: string;
    periodColor?: string;
    descriptionColor?: string;
    featureIcon?: 'check' | 'dot' | 'number' | 'none';
    featureIconColor?: string;
    featureColor?: string;
    featureFontSize?: string;
    buttonStyle?: 'solid' | 'outline' | 'ghost' | 'gradient';
    buttonBorderRadius?: string;
    buttonPadding?: string;
    buttonFontSize?: string;
    buttonFontWeight?: string;
    spacing?: string;
    gap?: string;
    alignment?: 'left' | 'center' | 'right';
    responsiveColumns?: {
      desktop?: number;
      tablet?: number;
      mobile?: number;
    };
  };
}

export const PricingTableComponent = React.memo(function PricingTableComponent({
  style,
  props: componentProps
}: PricingTableComponentProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const title = componentProps?.title || 'Choose Your Plan';
  const subtitle = componentProps?.subtitle || 'Select the perfect plan for your needs';
  const defaultPlans: PricingPlan[] = [
    {
      id: '1',
      name: 'Basic',
      price: '9.99',
      period: 'month',
      description: 'Perfect for getting started',
      features: [
        '10GB Storage',
        '100GB Bandwidth',
        'Email Support',
        'Basic Analytics'
      ],
      buttonText: 'Get Started',
      buttonLink: '#',
    },
    {
      id: '2',
      name: 'Professional',
      price: '29.99',
      period: 'month',
      description: 'Best for growing businesses',
      features: [
        '100GB Storage',
        '1TB Bandwidth',
        'Priority Support',
        'Advanced Analytics',
        'API Access',
        'Custom Domain'
      ],
      buttonText: 'Get Started',
      buttonLink: '#',
      popular: true,
      badge: 'Most Popular'
    },
    {
      id: '3',
      name: 'Enterprise',
      price: '99.99',
      period: 'month',
      description: 'For large organizations',
      features: [
        'Unlimited Storage',
        'Unlimited Bandwidth',
        '24/7 Support',
        'Custom Analytics',
        'Full API Access',
        'White Label',
        'Dedicated Server',
        'SLA Guarantee'
      ],
      buttonText: 'Contact Sales',
      buttonLink: '#',
    },
  ];
  
  const plans = componentProps?.plans || defaultPlans;
  const columns = componentProps?.columns || plans.length || 3;
  const layout = componentProps?.layout || 'default';
  const showToggle = componentProps?.showToggle !== false;
  const currency = componentProps?.currency || '$';
  const currencyPosition = componentProps?.currencyPosition || 'before';
  const backgroundColor = componentProps?.backgroundColor || '#ffffff';
  const cardBackgroundColor = componentProps?.cardBackgroundColor || '#ffffff';
  const cardBorderColor = componentProps?.cardBorderColor || '#e5e7eb';
  const cardBorderWidth = componentProps?.cardBorderWidth || '1px';
  const cardBorderRadius = componentProps?.cardBorderRadius || '0.5rem';
  const cardPadding = componentProps?.cardPadding || '2rem';
  const cardShadow = componentProps?.cardShadow || 'md';
  const popularBadgeText = componentProps?.popularBadgeText || 'Popular';
  const popularBadgeColor = componentProps?.popularBadgeColor || '#4f46e5';
  const popularBadgeTextColor = componentProps?.popularBadgeTextColor || '#ffffff';
  const popularCardColor = componentProps?.popularCardColor || cardBackgroundColor;
  const popularCardBorderColor = componentProps?.popularCardBorderColor || popularBadgeColor;
  const titleColor = componentProps?.titleColor || '#111827';
  const priceColor = componentProps?.priceColor || '#111827';
  const priceFontSize = componentProps?.priceFontSize || '3rem';
  const periodColor = componentProps?.periodColor || '#6b7280';
  const descriptionColor = componentProps?.descriptionColor || '#6b7280';
  const featureIcon = componentProps?.featureIcon || 'check';
  const featureIconColor = componentProps?.featureIconColor || '#10b981';
  const featureColor = componentProps?.featureColor || '#374151';
  const featureFontSize = componentProps?.featureFontSize || '1rem';
  const buttonStyle = componentProps?.buttonStyle || 'solid';
  const buttonBorderRadius = componentProps?.buttonBorderRadius || '0.5rem';
  const buttonPadding = componentProps?.buttonPadding || '0.75rem 1.5rem';
  const buttonFontSize = componentProps?.buttonFontSize || '1rem';
  const buttonFontWeight = componentProps?.buttonFontWeight || '600';
  const spacing = componentProps?.spacing || '3rem';
  const gap = componentProps?.gap || '1.5rem';
  const alignment = componentProps?.alignment || 'center';
  const responsiveColumns = componentProps?.responsiveColumns || {
    desktop: columns,
    tablet: Math.min(2, columns),
    mobile: 1
  };

  const getShadowStyle = () => {
    switch (cardShadow) {
      case 'none': return 'none';
      case 'sm': return '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      case 'md': return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      case 'lg': return '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
      case 'xl': return '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      default: return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }
  };

  const getButtonStyles = (plan: PricingPlan) => {
    const baseStyles: React.CSSProperties = {
      width: '100%',
      padding: buttonPadding,
      fontSize: buttonFontSize,
      fontWeight: buttonFontWeight,
      borderRadius: buttonBorderRadius,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: 'none',
      textDecoration: 'none',
      display: 'inline-block',
      textAlign: 'center',
    };

    const buttonColor = plan.buttonColor || popularBadgeColor;
    const buttonTextColor = plan.buttonTextColor || '#ffffff';

    switch (buttonStyle) {
      case 'solid':
        return {
          ...baseStyles,
          backgroundColor: buttonColor,
          color: buttonTextColor,
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: buttonColor,
          border: `2px solid ${buttonColor}`,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: buttonColor,
        };
      case 'gradient':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${buttonColor} 0%, ${plan.buttonColor || popularBadgeColor}dd 100%)`,
          color: buttonTextColor,
        };
      default:
        return baseStyles;
    }
  };

  const renderFeatureIcon = (index: number) => {
    switch (featureIcon) {
      case 'check':
        return (
          <CheckIcon 
            className="w-5 h-5 flex-shrink-0" 
            style={{ color: featureIconColor }}
          />
        );
      case 'dot':
        return (
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0" 
            style={{ backgroundColor: featureIconColor }}
          />
        );
      case 'number':
        return (
          <span 
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ 
              backgroundColor: featureIconColor + '20',
              color: featureIconColor 
            }}
          >
            {index + 1}
          </span>
        );
      default:
        return null;
    }
  };

  const getCardClasses = (plan: PricingPlan) => {
    const isPopular = plan.popular || componentProps?.popularPlanId === plan.id;
    const baseClasses = "relative transition-all duration-300 flex flex-col";
    
    if (layout === 'minimal') {
      return `${baseClasses} border-b-2 ${isPopular ? `border-[${popularBadgeColor}]` : 'border-transparent'}`;
    }
    
    return baseClasses;
  };

  const containerStyle: React.CSSProperties = {
    ...style,
    backgroundColor,
    padding: spacing,
  };

  return (
    <div style={containerStyle} className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      {(title || subtitle) && (
        <div className="text-center mb-12" style={{ textAlign: alignment }}>
          {title && (
            <h2 className="text-4xl font-bold mb-4" style={{ color: titleColor }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xl max-w-3xl mx-auto" style={{ color: descriptionColor }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Billing Toggle */}
      {showToggle && (
        <div className="flex justify-center mb-8">
          <div className="relative inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {componentProps?.toggleLabel1 || 'Monthly'}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {componentProps?.toggleLabel2 || 'Yearly'}
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div 
        className="grid gap-6"
        style={{
          gridTemplateColumns: `
            repeat(${responsiveColumns.desktop || columns}, 1fr)
          `,
          gap,
        }}
      >
        {plans.map((plan) => {
          const isPopular = plan.popular || componentProps?.popularPlanId === plan.id;
          const displayPrice = billingPeriod === 'yearly' && plan.originalPrice 
            ? (parseFloat(plan.price) * 10).toFixed(2) 
            : plan.price;
          
          const cardStyle: React.CSSProperties = {
            backgroundColor: isPopular ? popularCardColor : cardBackgroundColor,
            border: `${cardBorderWidth} solid ${isPopular ? popularCardBorderColor : cardBorderColor}`,
            borderRadius: cardBorderRadius,
            padding: cardPadding,
            boxShadow: isPopular && cardShadow !== 'none' ? getShadowStyle() : getShadowStyle(),
            transform: isPopular && layout !== 'minimal' ? 'scale(1.05)' : 'scale(1)',
            position: 'relative',
          };

          return (
            <div key={plan.id} className={getCardClasses(plan)} style={cardStyle}>
              {/* Popular Badge */}
              {isPopular && layout !== 'minimal' && (
                <div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: popularBadgeColor,
                    color: popularBadgeTextColor,
                  }}
                >
                  {plan.badge || popularBadgeText}
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                {plan.icon && (
                  <div className="mb-4 text-4xl">{plan.icon}</div>
                )}
                <h3 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>
                  {plan.name}
                </h3>
                {plan.description && (
                  <p className="text-sm mb-4" style={{ color: descriptionColor }}>
                    {plan.description}
                  </p>
                )}
                <div className="flex items-baseline">
                  {currencyPosition === 'before' && (
                    <span className="text-2xl font-semibold" style={{ color: priceColor }}>
                      {currency}
                    </span>
                  )}
                  <span 
                    className="text-5xl font-bold" 
                    style={{ color: priceColor, fontSize: priceFontSize }}
                  >
                    {displayPrice}
                  </span>
                  {currencyPosition === 'after' && (
                    <span className="text-2xl font-semibold" style={{ color: priceColor }}>
                      {currency}
                    </span>
                  )}
                  <span className="ml-2 text-lg" style={{ color: periodColor }}>
                    /{plan.period}
                  </span>
                </div>
                {plan.originalPrice && billingPeriod === 'yearly' && (
                  <p className="text-sm mt-2 line-through" style={{ color: periodColor }}>
                    {currency}{plan.originalPrice}/{plan.period}
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="flex-grow mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {renderFeatureIcon(index)}
                      <span 
                        className="ml-3"
                        style={{ 
                          color: featureColor,
                          fontSize: featureFontSize 
                        }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                <a
                  href={plan.buttonLink || '#'}
                  style={getButtonStyles(plan)}
                  onMouseEnter={(e) => {
                    if (buttonStyle === 'solid' || buttonStyle === 'gradient') {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    } else {
                      e.currentTarget.style.backgroundColor = (plan.buttonColor || popularBadgeColor) + '10';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (buttonStyle === 'solid' || buttonStyle === 'gradient') {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(0)';
                    } else {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {plan.buttonText}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: repeat(${responsiveColumns.tablet || 2}, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: repeat(${responsiveColumns.mobile || 1}, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
});

