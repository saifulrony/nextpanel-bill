'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

interface FAQComponentProps {
  style?: React.CSSProperties;
  props?: {
    title?: string;
    subtitle?: string;
    items?: FAQItem[];
    layout?: 'accordion' | 'tabs' | 'grid';
    allowMultiple?: boolean;
    defaultOpenFirst?: boolean;
    icon?: 'chevron' | 'plus' | 'arrow' | 'none';
    iconPosition?: 'left' | 'right';
    backgroundColor?: string;
    itemBackgroundColor?: string;
    itemHoverColor?: string;
    itemBorderColor?: string;
    itemBorderRadius?: string;
    itemPadding?: string;
    titleColor?: string;
    questionColor?: string;
    questionFontSize?: string;
    questionFontWeight?: string;
    answerColor?: string;
    answerFontSize?: string;
    iconColor?: string;
    spacing?: string;
    gap?: string;
    alignment?: 'left' | 'center' | 'right';
    showSearch?: boolean;
    searchPlaceholder?: string;
    animation?: 'slide' | 'fade' | 'none';
    animationDuration?: number;
  };
}

export const FAQComponent = React.memo(function FAQComponent({
  style,
  props: componentProps
}: FAQComponentProps) {
  const defaultItems: FAQItem[] = [
    {
      id: '1',
      question: 'What is your refund policy?',
      answer: 'We offer a 30-day money-back guarantee on all our plans. If you\'re not satisfied with our service, you can request a full refund within 30 days of your purchase.',
      defaultOpen: false,
    },
    {
      id: '2',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from your account settings. Simply go to the "Billing" section and click "Cancel Subscription". Your access will continue until the end of your current billing period.',
      defaultOpen: false,
    },
    {
      id: '3',
      question: 'Do you offer customer support?',
      answer: 'Yes, we offer 24/7 customer support via email, live chat, and phone. Our support team is always ready to help you with any questions or issues you may have.',
      defaultOpen: false,
    },
    {
      id: '4',
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time from your account dashboard. Changes will be prorated, and you\'ll only pay the difference for the remaining billing period.',
      defaultOpen: false,
    },
    {
      id: '5',
      question: 'Is there a setup fee?',
      answer: 'No, there are no setup fees. All plans include instant setup and activation. You can start using our service immediately after signing up.',
      defaultOpen: false,
    },
  ];

  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    const defaultOpen = new Set<string>();
    if (componentProps?.defaultOpenFirst && defaultItems.length > 0) {
      defaultOpen.add(defaultItems[0].id);
    }
    defaultItems.forEach(item => {
      if (item.defaultOpen) {
        defaultOpen.add(item.id);
      }
    });
    return defaultOpen;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const title = componentProps?.title || 'Frequently Asked Questions';
  const subtitle = componentProps?.subtitle || 'Find answers to common questions';
  const items = componentProps?.items || defaultItems;
  const layout = componentProps?.layout || 'accordion';
  const allowMultiple = componentProps?.allowMultiple !== false;
  const icon = componentProps?.icon || 'chevron';
  const iconPosition = componentProps?.iconPosition || 'right';
  const backgroundColor = componentProps?.backgroundColor || '#ffffff';
  const itemBackgroundColor = componentProps?.itemBackgroundColor || '#ffffff';
  const itemHoverColor = componentProps?.itemHoverColor || '#f9fafb';
  const itemBorderColor = componentProps?.itemBorderColor || '#e5e7eb';
  const itemBorderRadius = componentProps?.itemBorderRadius || '0.5rem';
  const itemPadding = componentProps?.itemPadding || '1.5rem';
  const titleColor = componentProps?.titleColor || '#111827';
  const questionColor = componentProps?.questionColor || '#111827';
  const questionFontSize = componentProps?.questionFontSize || '1.125rem';
  const questionFontWeight = componentProps?.questionFontWeight || '600';
  const answerColor = componentProps?.answerColor || '#6b7280';
  const answerFontSize = componentProps?.answerFontSize || '1rem';
  const iconColor = componentProps?.iconColor || '#6b7280';
  const spacing = componentProps?.spacing || '3rem';
  const gap = componentProps?.gap || '1rem';
  const alignment = componentProps?.alignment || 'left';
  const showSearch = componentProps?.showSearch || false;
  const searchPlaceholder = componentProps?.searchPlaceholder || 'Search FAQs...';
  const animation = componentProps?.animation || 'slide';
  const animationDuration = componentProps?.animationDuration || 300;

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query)
    );
  });

  const renderIcon = (isOpen: boolean) => {
    const iconClass = `w-5 h-5 transition-transform duration-${animationDuration}`;
    
    switch (icon) {
      case 'chevron':
        return isOpen ? (
          <ChevronUpIcon className={iconClass} style={{ color: iconColor }} />
        ) : (
          <ChevronDownIcon className={iconClass} style={{ color: iconColor }} />
        );
      case 'plus':
        return isOpen ? (
          <MinusIcon className={iconClass} style={{ color: iconColor }} />
        ) : (
          <PlusIcon className={iconClass} style={{ color: iconColor }} />
        );
      case 'arrow':
        return (
          <ChevronDownIcon
            className={iconClass}
            style={{
              color: iconColor,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        );
      default:
        return null;
    }
  };

  const getAnimationStyle = (isOpen: boolean) => {
    if (animation === 'none') return {};
    
    if (animation === 'fade') {
      return {
        opacity: isOpen ? 1 : 0,
        transition: `opacity ${animationDuration}ms ease-in-out`,
      };
    }

    // slide animation (default)
    return {
      maxHeight: isOpen ? '1000px' : '0',
      overflow: 'hidden',
      transition: `max-height ${animationDuration}ms ease-in-out`,
    };
  };

  const renderAccordionItem = (item: FAQItem) => {
    const isOpen = openItems.has(item.id);

    const itemStyle: React.CSSProperties = {
      backgroundColor: itemBackgroundColor,
      border: `1px solid ${itemBorderColor}`,
      borderRadius: itemBorderRadius,
      marginBottom: gap,
    };

    return (
      <div key={item.id} style={itemStyle}>
        <button
          onClick={() => toggleItem(item.id)}
          className="w-full text-left flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          style={{
            padding: itemPadding,
            backgroundColor: isOpen ? itemHoverColor : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = itemHoverColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <div
            className="flex-1"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexDirection: iconPosition === 'left' ? 'row-reverse' : 'row',
            }}
          >
            {iconPosition === 'left' && renderIcon(isOpen)}
            <h3
              className="font-semibold"
              style={{
                color: questionColor,
                fontSize: questionFontSize,
                fontWeight: questionFontWeight,
              }}
            >
              {item.question}
            </h3>
            {iconPosition === 'right' && renderIcon(isOpen)}
          </div>
        </button>
        <div style={getAnimationStyle(isOpen)}>
          <div
            style={{
              padding: `0 ${itemPadding} ${itemPadding} ${itemPadding}`,
              color: answerColor,
              fontSize: answerFontSize,
              lineHeight: '1.6',
            }}
          >
            {item.answer}
          </div>
        </div>
      </div>
    );
  };

  const containerStyle: React.CSSProperties = {
    ...style,
    backgroundColor,
    padding: spacing,
  };

  return (
    <div style={containerStyle} className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-12" style={{ textAlign: alignment }}>
          {title && (
            <h2 className="text-4xl font-bold mb-4" style={{ color: titleColor }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xl max-w-3xl" style={{ color: answerColor }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="mb-8">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            style={{
              fontSize: '1rem',
            }}
          />
          {filteredItems.length === 0 && searchQuery && (
            <p className="mt-4 text-center" style={{ color: answerColor }}>
              No FAQs found matching "{searchQuery}"
            </p>
          )}
        </div>
      )}

      {/* FAQ Items */}
      <div>
        {filteredItems.map(renderAccordionItem)}
      </div>

      {filteredItems.length === 0 && !searchQuery && (
        <p className="text-center" style={{ color: answerColor }}>
          No FAQs available at this time.
        </p>
      )}
    </div>
  );
});

