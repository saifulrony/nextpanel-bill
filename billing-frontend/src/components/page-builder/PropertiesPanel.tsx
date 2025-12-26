'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Component } from './types';
import { XMarkIcon, PhotoIcon, ArrowUpTrayIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { plansAPI } from '@/lib/api';

interface PropertiesPanelProps {
  component: Component | null;
  onUpdate: (component: Component) => void;
  onClose: () => void;
  maxCanvasWidth?: number; // Maximum canvas width in pixels
}

// Accordion Component
function Accordion({ title, children, defaultOpen = false, isOpen: controlledIsOpen, onToggle, leftIcon, rightIcon }: { title: string | React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; isOpen?: boolean; onToggle?: () => void; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode }) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors pr-20"
        >
          <div className="flex items-center space-x-3 flex-1">
            {leftIcon && (
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {leftIcon}
              </div>
            )}
            <div className="text-sm font-medium text-gray-700 text-left">
              {typeof title === 'string' ? <span>{title}</span> : title}
            </div>
          </div>
        </button>
        {/* Icons positioned on the right: chevron first, then delete icon */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-2">
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
          {rightIcon && (
            <div onClick={(e) => e.stopPropagation()}>
              {rightIcon}
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

// Products Grid Properties Component
function ProductsGridProperties({ component, updateProp }: { component: Component; updateProp: (key: string, value: any) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const selectedCategories = component.props?.categories || [];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await plansAPI.categories();
        let categoriesData = response.data?.categories || response.data || [];
        
        // Ensure server category is included
        if (!categoriesData.find((c: any) => c.id === 'server')) {
          categoriesData.push({ id: 'server', name: 'Server (Dedicated/VPS)' });
        }
        
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to default categories
        setCategories([
          { id: 'hosting', name: 'Hosting' },
          { id: 'domain', name: 'Domains' },
          { id: 'server', name: 'Server (Dedicated/VPS)' },
          { id: 'software', name: 'Software & Licenses' },
          { id: 'email', name: 'Email Services' },
          { id: 'ssl', name: 'SSL Certificates' },
          { id: 'backup', name: 'Backup Solutions' },
          { id: 'cdn', name: 'CDN Services' },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id: string) => id !== categoryId)
      : [...selectedCategories, categoryId];
    updateProp('categories', newCategories);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Categories
          <span className="text-xs text-gray-500 ml-2">(Select categories to show. Leave empty to show all)</span>
        </label>
        {loadingCategories ? (
          <div className="text-sm text-gray-500">Loading categories...</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {categories.length === 0 ? (
              <div className="text-sm text-gray-500">No categories available</div>
            ) : (
              categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))
            )}
          </div>
        )}
        {selectedCategories.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Selected: {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <input
          type="text"
          value={component.props?.title || 'Our Products'}
          onChange={(e) => updateProp('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Our Products"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
        <input
          type="text"
          value={component.props?.subtitle || 'Choose from our range of hosting solutions designed to meet your needs'}
          onChange={(e) => updateProp('subtitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Choose from our range of hosting solutions designed to meet your needs"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={component.props?.showPrices !== false}
          onChange={(e) => updateProp('showPrices', e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">Show Prices</label>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={component.props?.showFeatures !== false}
          onChange={(e) => updateProp('showFeatures', e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">Show Features</label>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={component.props?.showButtons !== false}
          onChange={(e) => updateProp('showButtons', e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">Show Buttons</label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Style</label>
        <select
          value={component.props?.cardStyle || 'default'}
          onChange={(e) => updateProp('cardStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value="default">Default</option>
          <option value="minimal">Minimal</option>
          <option value="elevated">Elevated</option>
          <option value="outlined">Outlined</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
        <input
          type="color"
          value={component.props?.backgroundColor || '#ffffff'}
          onChange={(e) => updateProp('backgroundColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Background Color</label>
        <input
          type="color"
          value={component.props?.cardBackgroundColor || '#ffffff'}
          onChange={(e) => updateProp('cardBackgroundColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
        <input
          type="color"
          value={component.props?.borderColor || '#e5e7eb'}
          onChange={(e) => updateProp('borderColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
        <input
          type="color"
          value={component.props?.textColor || '#374151'}
          onChange={(e) => updateProp('textColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Price Color</label>
        <input
          type="color"
          value={component.props?.priceColor || '#4f46e5'}
          onChange={(e) => updateProp('priceColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
        <input
          type="color"
          value={component.props?.buttonColor || '#4f46e5'}
          onChange={(e) => updateProp('buttonColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text Color</label>
        <input
          type="color"
          value={component.props?.buttonTextColor || '#ffffff'}
          onChange={(e) => updateProp('buttonTextColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
        <input
          type="text"
          value={component.props?.spacing || '1rem'}
          onChange={(e) => updateProp('spacing', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="1rem"
        />
      </div>
    </div>
  );
}

// Featured Products Properties Component
function FeaturedProductsProperties({ component, updateProp }: { component: Component; updateProp: (key: string, value: any) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const selectedCategories = component.props?.categories || [];

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await plansAPI.categories();
        let categoriesData = response.data?.categories || response.data || [];
        
        // Ensure server category is included
        if (!categoriesData.find((c: any) => c.id === 'server')) {
          categoriesData.push({ id: 'server', name: 'Server (Dedicated/VPS)' });
        }
        
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([
          { id: 'hosting', name: 'Hosting' },
          { id: 'domain', name: 'Domains' },
          { id: 'server', name: 'Server (Dedicated/VPS)' },
          { id: 'software', name: 'Software & Licenses' },
          { id: 'email', name: 'Email Services' },
          { id: 'ssl', name: 'SSL Certificates' },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id: string) => id !== categoryId)
      : [...selectedCategories, categoryId];
    updateProp('categories', newCategories);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
        <select
          value={component.props?.columns || 3}
          onChange={(e) => updateProp('columns', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value={1}>1 Column</option>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
          <option value={4}>4 Columns</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Categories
          <span className="text-xs text-gray-500 ml-2">(Select categories to show. Leave empty to show all)</span>
        </label>
        {loadingCategories ? (
          <div className="text-sm text-gray-500">Loading categories...</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {categories.length === 0 ? (
              <div className="text-sm text-gray-500">No categories available</div>
            ) : (
              categories.map((category) => (
                <label key={category.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))
            )}
          </div>
        )}
        {selectedCategories.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Selected: {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <input
          type="text"
          value={component.props?.title || 'Featured Products'}
          onChange={(e) => updateProp('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Featured Products"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
        <input
          type="text"
          value={component.props?.subtitle || 'Discover our most popular and recommended hosting solutions'}
          onChange={(e) => updateProp('subtitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          placeholder="Discover our most popular and recommended hosting solutions"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={component.props?.showPrices !== false}
          onChange={(e) => updateProp('showPrices', e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">Show Prices</label>
      </div>
    </div>
  );
}

export default function PropertiesPanel({ component, onUpdate, onClose, maxCanvasWidth }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'motion'>('content');
  const [highlightedFieldId, setHighlightedFieldId] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [localCustomFields, setLocalCustomFields] = useState<any[]>([]);
  const [widthWarning, setWidthWarning] = useState<string | null>(null);
  
  // Use ref to always get the latest component
  const componentRef = useRef(component);
  useEffect(() => {
    componentRef.current = component;
  }, [component]);

  // Remove highlight after 3 seconds
  React.useEffect(() => {
    if (highlightedFieldId) {
      const timer = setTimeout(() => {
        setHighlightedFieldId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedFieldId]);

  // Auto-initialize pricing table plans if missing
  React.useEffect(() => {
    if (component && component.type === 'pricing-table' && (!component.props?.plans || component.props.plans.length === 0)) {
      const defaultPlans = [
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
          popular: false,
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
          popular: false,
        },
      ];
      onUpdate({
        ...component,
        props: {
          ...component.props,
          plans: defaultPlans,
          popularPlanId: '2',
        },
      });
    }
  }, [component?.id]); // Only run once when component changes

  // Auto-initialize slider slides if missing
  React.useEffect(() => {
    if (component && component.type === 'slider' && (!component.props?.slides || component.props.slides.length === 0)) {
      const defaultSlide = {
        id: `slide-${Date.now()}`,
        image: '',
        title: '',
        description: '',
        buttonText: '',
        buttonLink: '#',
        overlay: true,
        overlayOpacity: 0.5,
      };
      onUpdate({
        ...component,
        props: {
          ...component.props,
          slides: [defaultSlide],
        },
      });
    }
  }, [component?.id, component?.type]); // Only run when component changes

  // Auto-initialize checkout custom fields if missing
  React.useEffect(() => {
    if (component && component.type === 'checkout' && (!component.props?.customFields || component.props.customFields.length === 0)) {
      const defaultFields = [
        {
          id: 'firstName',
          type: 'text',
          label: 'First Name',
          name: 'firstName',
          placeholder: 'Enter your first name',
          required: true,
          section: 'billing',
          order: 1,
          gridCols: 6,
          isImportant: true
        },
        {
          id: 'lastName',
          type: 'text',
          label: 'Last Name',
          name: 'lastName',
          placeholder: 'Enter your last name',
          required: true,
          section: 'billing',
          order: 2,
          gridCols: 6,
          isImportant: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          name: 'email',
          placeholder: 'Enter your email',
          required: true,
          section: 'billing',
          order: 3,
          gridCols: 12,
          isImportant: true
        },
        {
          id: 'phone',
          type: 'tel',
          label: 'Phone',
          name: 'phone',
          placeholder: 'Enter your phone number',
          required: false,
          section: 'billing',
          order: 4,
          gridCols: 12,
          isImportant: false
        },
        {
          id: 'address',
          type: 'text',
          label: 'Address',
          name: 'address',
          placeholder: 'Enter your address',
          required: true,
          section: 'billing',
          order: 5,
          gridCols: 12,
          isImportant: true
        },
        {
          id: 'city',
          type: 'text',
          label: 'City',
          name: 'city',
          placeholder: 'Enter your city',
          required: true,
          section: 'billing',
          order: 6,
          gridCols: 4,
          isImportant: true
        },
        {
          id: 'state',
          type: 'text',
          label: 'State',
          name: 'state',
          placeholder: 'Enter your state',
          required: true,
          section: 'billing',
          order: 7,
          gridCols: 4,
          isImportant: true
        },
        {
          id: 'zipCode',
          type: 'text',
          label: 'ZIP Code',
          name: 'zipCode',
          placeholder: 'Enter ZIP code',
          required: true,
          section: 'billing',
          order: 8,
          gridCols: 4,
          isImportant: true
        },
        {
          id: 'country',
          type: 'select',
          label: 'Country',
          name: 'country',
          placeholder: 'Select country',
          required: true,
          section: 'billing',
          order: 9,
          gridCols: 12,
          isImportant: true,
          options: [
            { label: 'United States', value: 'US' },
            { label: 'Canada', value: 'CA' },
            { label: 'United Kingdom', value: 'GB' },
            { label: 'Australia', value: 'AU' },
            { label: 'Germany', value: 'DE' },
            { label: 'France', value: 'FR' }
          ]
        }
      ];
      onUpdate({
        ...component,
        props: {
          ...component.props,
          customFields: defaultFields,
        },
      });
    }
  }, [component?.id]); // Only run once when component changes

  if (!component) {
    return (
      <div className="bg-white border-l border-gray-200 h-full flex items-center justify-center w-full">
        <div className="text-center text-gray-400 px-4">
          <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-sm font-medium">Select a component</p>
          <p className="text-xs mt-1">Click any component in the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  const updateProp = (key: string, value: any) => {
    onUpdate({
      ...component,
      props: {
        ...component.props,
        [key]: value,
      },
    });
  };

  const updateStyle = (key: string, value: string) => {
    let finalValue = value;
    let warning: string | null = null;
    
    // Validate and limit width to canvas width
    if (key === 'width' && maxCanvasWidth && value) {
      // Parse pixel values (e.g., "1500px" -> 1500)
      const pixelMatch = value.match(/(\d+\.?\d*)px/);
      if (pixelMatch) {
        const pixelValue = parseFloat(pixelMatch[1]);
        // Check if widget has left positioning that would cause overflow
        const currentLeft = parseFloat(String(component?.style?.left || '0'));
        const maxAllowedWidth = maxCanvasWidth - currentLeft;
        
        if (pixelValue > maxAllowedWidth) {
          finalValue = `${Math.max(100, maxAllowedWidth)}px`;
          warning = `Width limited to ${Math.max(100, maxAllowedWidth)}px to fit within canvas`;
        } else if (pixelValue > maxCanvasWidth) {
          finalValue = `${maxCanvasWidth}px`;
          warning = `Width limited to ${maxCanvasWidth}px (canvas width)`;
        }
      }
      // For percentage values, ensure they don't exceed 100%
      const percentMatch = value.match(/(\d+\.?\d*)%/);
      if (percentMatch) {
        const percentValue = parseFloat(percentMatch[1]);
        if (percentValue > 100) {
          finalValue = '100%';
          warning = 'Width limited to 100%';
        }
      }
    }
    
    // Also validate left positioning to prevent overflow
    if (key === 'left' && maxCanvasWidth && component) {
      const leftMatch = value.match(/(\d+\.?\d*)px/);
      if (leftMatch) {
        const leftValue = parseFloat(leftMatch[1]);
        const currentWidth = parseFloat(String(component.style?.width || '0').replace('px', '')) || 0;
        if (leftValue + currentWidth > maxCanvasWidth) {
          const maxLeft = Math.max(0, maxCanvasWidth - currentWidth);
          finalValue = `${maxLeft}px`;
          warning = `Position adjusted to prevent overflow`;
        }
      }
    }
    
    // Show warning if width was limited
    if (warning) {
      setWidthWarning(warning);
      setTimeout(() => setWidthWarning(null), 3000);
    }
    
    onUpdate({
      ...component,
      style: {
        ...component.style,
        [key]: finalValue,
      },
    });
  };

  const updateContent = (content: string) => {
    onUpdate({
      ...component,
      content,
    });
  };

  const componentTypeLabels: Record<string, string> = {
    heading: 'Heading',
    text: 'Text',
    button: 'Button',
    image: 'Image',
    section: 'Section',
    container: 'Container',
    spacer: 'Spacer',
    divider: 'Divider',
    card: 'Card',
    grid: 'Grid',
    video: 'Video',
    form: 'Form',
    'domain-search': 'Domain Search',
    'products-grid': 'Products Grid',
    'product-search': 'Product Search',
    'contact-form': 'Contact Form',
    newsletter: 'Newsletter',
    header: 'Header',
    footer: 'Footer',
    cart: 'Cart',
    slider: 'Slider',
    banner: 'Banner',
    'nav-menu': 'Navigation Menu',
    'pricing-table': 'Pricing Table',
    testimonials: 'Testimonials',
    faq: 'FAQ',
  };

  return (
    <>
    <div className="bg-white border-l border-gray-200 h-full flex flex-col w-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">{componentTypeLabels[component.type] || component.type}</h3>
            <p className="text-indigo-100 text-xs mt-0.5">Edit properties</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex">
          {[
            { id: 'content' as const, name: 'Content' },
            { id: 'style' as const, name: 'Style' },
            { id: 'motion' as const, name: 'Motion' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 min-h-0">
        {/* Dynamic Components Info - Show in Content tab */}
        {activeTab === 'content' && (component.type === 'domain-search' || component.type === 'products-grid' || component.type === 'featured-products' || component.type === 'product-search' || component.type === 'contact-form' || component.type === 'newsletter') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Dynamic Component</h4>
                <p className="text-xs text-blue-700 mb-3">
                  This component connects to your backend API. Customize its appearance using the styling options below.
                </p>
                {component.type === 'domain-search' && (
                  <p className="text-xs text-blue-600">API: /api/v1/domains/search</p>
                )}
                {component.type === 'products-grid' && (
                  <p className="text-xs text-blue-600">API: /api/v1/plans</p>
                )}
                {component.type === 'product-search' && (
                  <p className="text-xs text-blue-600">API: /api/v1/plans?search=</p>
                )}
                {component.type === 'contact-form' && (
                  <p className="text-xs text-blue-600">API: /api/v1/contact</p>
                )}
                {component.type === 'newsletter' && (
                  <p className="text-xs text-blue-600">API: /api/v1/newsletter</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Header Component Properties */}
        {component.type === 'header' && (
          <>
            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <Accordion title="Logo" defaultOpen={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Text</label>
              <input
                type="text"
                value={component.props?.logoText || 'NextPanel'}
                onChange={(e) => updateProp('logoText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Company Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Image URL</label>
              <input
                type="url"
                value={component.props?.logoImage || ''}
                onChange={(e) => updateProp('logoImage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="https://example.com/logo.png"
              />
            </div>
            </div>
                </Accordion>
                <Accordion title="Navigation">
                  <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Navigation Items (JSON)</label>
              <textarea
                value={JSON.stringify(component.props?.navigationItems || [
                  { name: 'Home', url: '/' },
                  { name: 'Products', url: '/products' },
                  { name: 'About', url: '/about' },
                  { name: 'Contact', url: '/contact' }
                ], null, 2)}
                onChange={(e) => {
                  try {
                    const items = JSON.parse(e.target.value);
                    updateProp('navigationItems', items);
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                rows={6}
                placeholder='[{ "name": "Home", "url": "/" }]'
              />
            </div>
                    <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showNavigation !== false}
                  onChange={(e) => updateProp('showNavigation', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Navigation</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showCart !== false}
                  onChange={(e) => updateProp('showCart', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Cart</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showUserMenu !== false}
                  onChange={(e) => updateProp('showUserMenu', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show User Menu</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showSearch || false}
                  onChange={(e) => updateProp('showSearch', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Search</span>
              </label>
            </div>
                  </div>
                </Accordion>
              </div>
            )}
            {/* Style Tab */}
            {activeTab === 'style' && (
              <div className="space-y-4">
                {/* Colors removed - available in account settings */}
                <Accordion title="Layout">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
            <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo Width</label>
                <input
                          type="text"
                          value={component.props?.logoWidth || '120px'}
                          onChange={(e) => updateProp('logoWidth', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="120px"
              />
            </div>
            <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo Height</label>
                <input
                          type="text"
                          value={component.props?.logoHeight || '40px'}
                          onChange={(e) => updateProp('logoHeight', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="40px"
              />
            </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo Position</label>
                      <select
                        value={component.props?.logoPosition || 'left'}
                        onChange={(e) => updateProp('logoPosition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </Accordion>
          </div>
            )}
            {/* Motion Tab */}
            {activeTab === 'motion' && (
              <div className="space-y-4">
                <div className="text-center text-gray-400 py-8">
                  <p className="text-sm">No motion settings available for this component</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Component Properties */}
        {component.type === 'footer' && (
          <>
            {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={component.props?.companyName || 'NextPanel Billing'}
                onChange={(e) => updateProp('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Company Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
              <input
                type="text"
                value={component.props?.copyrightText || 'All rights reserved.'}
                onChange={(e) => updateProp('copyrightText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Copyright text"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showLinks !== false}
                  onChange={(e) => updateProp('showLinks', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Links</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showSocial || false}
                  onChange={(e) => updateProp('showSocial', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Social</span>
              </label>
            </div>
            </div>
            )}
            {activeTab === 'style' && (
              <div className="space-y-4">
                {/* Colors removed - available in account settings */}
          </div>
            )}
          </>
        )}

        {/* Cart Component Properties */}
        {component.type === 'cart' && (
          <>
            {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Text</label>
              <input
                type="text"
                value={component.props?.headerText || 'Shopping Cart'}
                onChange={(e) => updateProp('headerText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Cart Header"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empty State Text</label>
              <input
                type="text"
                value={component.props?.emptyStateText || 'Your cart is empty'}
                onChange={(e) => updateProp('emptyStateText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Empty cart message"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Checkout Button Text</label>
              <input
                type="text"
                value={component.props?.checkoutButtonText || 'Proceed to Checkout'}
                onChange={(e) => updateProp('checkoutButtonText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Checkout button text"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showHeader !== false}
                  onChange={(e) => updateProp('showHeader', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Header</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showCheckoutButton !== false}
                  onChange={(e) => updateProp('showCheckoutButton', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Checkout Button</span>
              </label>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showItemCount !== false}
                  onChange={(e) => updateProp('showItemCount', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Item Count</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showTotal !== false}
                  onChange={(e) => updateProp('showTotal', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Total</span>
              </label>
            </div>
            </div>
            )}
            {activeTab === 'style' && (
              <div className="space-y-4">
                {/* Colors Section */}
                <Accordion title="Colors" defaultOpen={true}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.backgroundColor || '#ffffff'}
                          onChange={(e) => updateProp('backgroundColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.backgroundColor || '#ffffff'}
                          onChange={(e) => updateProp('backgroundColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.textColor || '#374151'}
                          onChange={(e) => updateProp('textColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.textColor || '#374151'}
                          onChange={(e) => updateProp('textColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#374151"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.buttonColor || '#4f46e5'}
                          onChange={(e) => updateProp('buttonColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.buttonColor || '#4f46e5'}
                          onChange={(e) => updateProp('buttonColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#4f46e5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.buttonTextColor || '#ffffff'}
                          onChange={(e) => updateProp('buttonTextColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.buttonTextColor || '#ffffff'}
                          onChange={(e) => updateProp('buttonTextColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Background Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.itemBackgroundColor || '#ffffff'}
                          onChange={(e) => updateProp('itemBackgroundColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.itemBackgroundColor || '#ffffff'}
                          onChange={(e) => updateProp('itemBackgroundColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.borderColor || '#e5e7eb'}
                          onChange={(e) => updateProp('borderColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.borderColor || '#e5e7eb'}
                          onChange={(e) => updateProp('borderColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#e5e7eb"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.headerTextColor || component.props?.textColor || '#111827'}
                          onChange={(e) => updateProp('headerTextColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.headerTextColor || component.props?.textColor || '#111827'}
                          onChange={(e) => updateProp('headerTextColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#111827"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.priceColor || component.props?.textColor || '#374151'}
                          onChange={(e) => updateProp('priceColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.priceColor || component.props?.textColor || '#374151'}
                          onChange={(e) => updateProp('priceColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#374151"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.totalTextColor || component.props?.textColor || '#111827'}
                          onChange={(e) => updateProp('totalTextColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.totalTextColor || component.props?.textColor || '#111827'}
                          onChange={(e) => updateProp('totalTextColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#111827"
                        />
                      </div>
                    </div>
                  </div>
                </Accordion>

                {/* Typography Section */}
                <Accordion title="Typography">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header Font Size</label>
                      <input
                        type="text"
                        value={component.props?.headerFontSize || '24px'}
                        onChange={(e) => updateProp('headerFontSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="24px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header Font Weight</label>
                      <select
                        value={component.props?.headerFontWeight || 'bold'}
                        onChange={(e) => updateProp('headerFontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="300">Light</option>
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Name Font Size</label>
                      <input
                        type="text"
                        value={component.props?.itemNameFontSize || '16px'}
                        onChange={(e) => updateProp('itemNameFontSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="16px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Name Font Weight</label>
                      <select
                        value={component.props?.itemNameFontWeight || '500'}
                        onChange={(e) => updateProp('itemNameFontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="300">Light</option>
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Font Size</label>
                      <input
                        type="text"
                        value={component.props?.priceFontSize || '16px'}
                        onChange={(e) => updateProp('priceFontSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="16px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Font Weight</label>
                      <select
                        value={component.props?.priceFontWeight || '600'}
                        onChange={(e) => updateProp('priceFontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Font Size</label>
                      <input
                        type="text"
                        value={component.props?.totalFontSize || '20px'}
                        onChange={(e) => updateProp('totalFontSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="20px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Font Weight</label>
                      <select
                        value={component.props?.totalFontWeight || '700'}
                        onChange={(e) => updateProp('totalFontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Font Size</label>
                      <input
                        type="text"
                        value={component.props?.buttonFontSize || '16px'}
                        onChange={(e) => updateProp('buttonFontSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="16px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Font Weight</label>
                      <select
                        value={component.props?.buttonFontWeight || '500'}
                        onChange={(e) => updateProp('buttonFontWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="400">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi Bold</option>
                        <option value="700">Bold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                      <select
                        value={component.props?.fontFamily || 'Inter'}
                        onChange={(e) => updateProp('fontFamily', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Source Sans Pro">Source Sans Pro</option>
                        <option value="Nunito">Nunito</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>
                  </div>
                </Accordion>

                {/* Spacing Section */}
                <Accordion title="Spacing">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
                        <input
                          type="text"
                          value={component.props?.padding || '24px'}
                          onChange={(e) => updateProp('padding', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="24px"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
                        <input
                          type="text"
                          value={component.style?.margin || component.props?.margin || '0'}
                          onChange={(e) => {
                            if (component.style) {
                              updateStyle('margin', e.target.value);
                            } else {
                              updateProp('margin', e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Gap</label>
                      <input
                        type="text"
                        value={component.props?.itemGap || '16px'}
                        onChange={(e) => updateProp('itemGap', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="16px"
                      />
                      <p className="text-xs text-gray-500 mt-1">Space between cart items</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Padding</label>
                      <input
                        type="text"
                        value={component.props?.itemPadding || '16px'}
                        onChange={(e) => updateProp('itemPadding', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="16px"
                      />
                      <p className="text-xs text-gray-500 mt-1">Internal padding for each cart item</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header Margin Bottom</label>
                      <input
                        type="text"
                        value={component.props?.headerMarginBottom || '24px'}
                        onChange={(e) => updateProp('headerMarginBottom', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="24px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Section Margin Top</label>
                      <input
                        type="text"
                        value={component.props?.totalMarginTop || '24px'}
                        onChange={(e) => updateProp('totalMarginTop', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="24px"
                      />
                    </div>
                  </div>
                </Accordion>

                {/* Borders Section */}
                <Accordion title="Borders">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Border Width</label>
                      <input
                        type="text"
                        value={component.props?.itemBorderWidth || '1px'}
                        onChange={(e) => updateProp('itemBorderWidth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="1px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Border Radius</label>
                      <input
                        type="text"
                        value={component.props?.itemBorderRadius || '8px'}
                        onChange={(e) => updateProp('itemBorderRadius', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="8px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Container Border Width</label>
                      <input
                        type="text"
                        value={component.props?.containerBorderWidth || '0px'}
                        onChange={(e) => updateProp('containerBorderWidth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="0px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Container Border Radius</label>
                      <input
                        type="text"
                        value={component.props?.containerBorderRadius || '0px'}
                        onChange={(e) => updateProp('containerBorderRadius', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="0px"
                      />
                    </div>
                  </div>
                </Accordion>

                {/* Button Styling Section */}
                <Accordion title="Button Styling">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Border Radius</label>
                      <input
                        type="text"
                        value={component.props?.buttonBorderRadius || '8px'}
                        onChange={(e) => updateProp('buttonBorderRadius', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="8px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Padding</label>
                      <input
                        type="text"
                        value={component.props?.buttonPadding || '12px 24px'}
                        onChange={(e) => updateProp('buttonPadding', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="12px 24px"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Hover Opacity</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={component.props?.buttonHoverOpacity || 0.9}
                        onChange={(e) => updateProp('buttonHoverOpacity', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">0.0 to 1.0 (0.9 = 90% opacity on hover)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clear Button Background</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.clearButtonBackground || '#ffffff'}
                          onChange={(e) => updateProp('clearButtonBackground', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.clearButtonBackground || '#ffffff'}
                          onChange={(e) => updateProp('clearButtonBackground', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clear Button Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.clearButtonTextColor || '#374151'}
                          onChange={(e) => updateProp('clearButtonTextColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.clearButtonTextColor || '#374151'}
                          onChange={(e) => updateProp('clearButtonTextColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#374151"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Clear Button Border Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={component.props?.clearButtonBorderColor || '#d1d5db'}
                          onChange={(e) => updateProp('clearButtonBorderColor', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                        />
                        <input
                          type="text"
                          value={component.props?.clearButtonBorderColor || '#d1d5db'}
                          onChange={(e) => updateProp('clearButtonBorderColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                          placeholder="#d1d5db"
                        />
                      </div>
                    </div>
                  </div>
                </Accordion>

                {/* Layout Section */}
                <Accordion title="Layout">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Layout</label>
                      <select
                        value={component.props?.itemLayout || 'horizontal'}
                        onChange={(e) => updateProp('itemLayout', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header Alignment</label>
                      <select
                        value={component.props?.headerAlignment || 'left'}
                        onChange={(e) => updateProp('headerAlignment', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Alignment</label>
                      <select
                        value={component.props?.buttonAlignment || 'stretch'}
                        onChange={(e) => updateProp('buttonAlignment', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="stretch">Stretch (Full Width)</option>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Width</label>
                      <input
                        type="text"
                        value={component.props?.maxWidth || ''}
                        onChange={(e) => updateProp('maxWidth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="1200px or 100%"
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum width of the cart container</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                      <input
                        type="text"
                        value={component.style?.width || component.props?.width || ''}
                        onChange={(e) => {
                          if (component.style) {
                            updateStyle('width', e.target.value);
                          } else {
                            updateProp('width', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="100%"
                      />
                    </div>
                  </div>
                </Accordion>

                {/* Effects Section */}
                <Accordion title="Effects">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Hover Shadow</label>
                      <select
                        value={component.props?.itemHoverShadow || 'sm'}
                        onChange={(e) => updateProp('itemHoverShadow', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="none">None</option>
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Transition Duration</label>
                      <input
                        type="text"
                        value={component.props?.itemTransitionDuration || '200ms'}
                        onChange={(e) => updateProp('itemTransitionDuration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="200ms"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Box Shadow</label>
                      <input
                        type="text"
                        value={component.props?.boxShadow || 'none'}
                        onChange={(e) => updateProp('boxShadow', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                        placeholder="0 1px 3px rgba(0,0,0,0.1)"
                      />
                      <p className="text-xs text-gray-500 mt-1">CSS box-shadow value</p>
                    </div>
                  </div>
                </Accordion>
          </div>
            )}
          </>
        )}

        {/* Slider Component Properties */}
        {activeTab === 'content' && component.type === 'slider' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Slides</label>
              <button
                type="button"
                onClick={() => {
                  const currentSlides = component.props?.slides || [];
                  const newSlide = {
                    id: `slide-${Date.now()}`,
                    image: '',
                    title: '',
                    description: '',
                    buttonText: '',
                    buttonLink: '#',
                    overlay: true,
                    overlayOpacity: 0.5,
                  };
                  updateProp('slides', [...currentSlides, newSlide]);
                }}
                className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                + Add Slide
              </button>
            </div>
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 -mr-2">
              {(!component.props?.slides || component.props.slides.length === 0) ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No slides yet. Click "+ Add Slide" to create your first slide.</p>
                </div>
              ) : (
                component.props.slides.map((slide: any, index: number) => (
                  <Accordion 
                    key={slide.id || index}
                    title={<span className="font-medium">Slide {index + 1}</span>}
                    defaultOpen={false}
                    rightIcon={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentSlides = component.props?.slides || [];
                          updateProp('slides', currentSlides.filter((_: any, i: number) => i !== index));
                        }}
                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                        title="Remove slide"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    }
                  >
                    <div className="space-y-3 pt-2">
                    
                    {/* Image Upload */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
                      {slide.image && (
                        <div className="mb-2 relative">
                          <img 
                            src={slide.image} 
                            alt={`Slide ${index + 1}`} 
                            className="w-full h-24 object-cover rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Don't hide the image, just show error overlay
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.image-error-overlay')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'image-error-overlay absolute inset-0 bg-red-50 border border-red-200 rounded flex items-center justify-center text-xs text-red-600 z-10';
                                errorDiv.textContent = 'Image failed to load';
                                parent.style.position = 'relative';
                                parent.appendChild(errorDiv);
                              }
                            }}
                            onLoad={(e) => {
                              // Remove error overlay if image loads successfully
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              const errorOverlay = parent?.querySelector('.image-error-overlay');
                              if (errorOverlay) {
                                errorOverlay.remove();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentSlides = component.props?.slides || [];
                              const updatedSlides = [...currentSlides];
                              updatedSlides[index] = { ...updatedSlides[index], image: '' };
                              updateProp('slides', updatedSlides);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="Remove image"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <ImageUploadButton
                        onUploadSuccess={(imageUrl) => {
                          // Use ref to get latest component to avoid stale closure
                          const latestComponent = componentRef.current;
                          const currentSlides = latestComponent.props?.slides || [];
                          
                          // Capture slide ID and index from current closure
                          const slideId = slide.id;
                          const slideIndex = index;
                          
                          console.log('Image upload success:', {
                            slideId,
                            slideIndex,
                            imageUrl,
                            currentSlidesCount: currentSlides.length,
                            currentSlides: currentSlides
                          });
                          
                          if (currentSlides.length === 0) {
                            // If no slides exist, create one with the image
                            const newSlide = {
                              id: slideId || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              image: imageUrl,
                              title: '',
                              description: '',
                              buttonText: '',
                              buttonLink: '#',
                              overlay: true,
                              overlayOpacity: 0.5,
                            };
                            console.log('Creating new slide with image:', newSlide);
                            updateProp('slides', [newSlide]);
                          } else {
                            // Find the slide to update - use the current slides array from ref
                            const slideToUpdateIndex = currentSlides.findIndex((s: any, i: number) => {
                              // Match by ID if available, otherwise match by index
                              return (slideId && s.id === slideId) || (!slideId && i === slideIndex);
                            });
                            
                            if (slideToUpdateIndex === -1) {
                              console.warn('Could not find slide to update, adding new slide');
                              // If slide not found, add it to the end
                              const newSlide = {
                                id: slideId || `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                image: imageUrl,
                                title: slide.title || '',
                                description: slide.description || '',
                                buttonText: slide.buttonText || '',
                                buttonLink: slide.buttonLink || '#',
                                overlay: slide.overlay !== undefined ? slide.overlay : true,
                                overlayOpacity: slide.overlayOpacity || 0.5,
                              };
                              updateProp('slides', [...currentSlides, newSlide]);
                            } else {
                              // Create a completely new array to ensure React detects the change
                              const updatedSlides = currentSlides.map((s: any, i: number) => {
                                if (i === slideToUpdateIndex) {
                                  const updated = { ...s, image: imageUrl };
                                  console.log(`Updating slide at index ${i}:`, s, '->', updated);
                                  return updated;
                                }
                                return { ...s }; // Create new object for each slide to ensure immutability
                              });
                              
                              console.log('Final slides array:', updatedSlides);
                              updateProp('slides', updatedSlides);
                            }
                          }
                        }}
                        currentImageUrl={slide.image}
                      />
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Or enter image URL</label>
                        <input
                          type="url"
                          value={slide.image || ''}
                          onChange={(e) => {
                            const currentSlides = component.props?.slides || [];
                            const updatedSlides = [...currentSlides];
                            updatedSlides[index] = { ...updatedSlides[index], image: e.target.value };
                            updateProp('slides', updatedSlides);
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={slide.title || ''}
                        onChange={(e) => {
                          const currentSlides = component.props?.slides || [];
                          const updatedSlides = [...currentSlides];
                          updatedSlides[index] = { ...updatedSlides[index], title: e.target.value };
                          updateProp('slides', updatedSlides);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Slide title"
                      />
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={slide.description || ''}
                        onChange={(e) => {
                          const currentSlides = component.props?.slides || [];
                          const updatedSlides = [...currentSlides];
                          updatedSlides[index] = { ...updatedSlides[index], description: e.target.value };
                          updateProp('slides', updatedSlides);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        rows={2}
                        placeholder="Slide description"
                      />
                    </div>
                    
                    {/* Button Text */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                      <input
                        type="text"
                        value={slide.buttonText || ''}
                        onChange={(e) => {
                          const currentSlides = component.props?.slides || [];
                          const updatedSlides = [...currentSlides];
                          updatedSlides[index] = { ...updatedSlides[index], buttonText: e.target.value };
                          updateProp('slides', updatedSlides);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Button text"
                      />
                    </div>
                    
                    {/* Button Link */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Button Link</label>
                      <input
                        type="text"
                        value={slide.buttonLink || '#'}
                        onChange={(e) => {
                          const currentSlides = component.props?.slides || [];
                          const updatedSlides = [...currentSlides];
                          updatedSlides[index] = { ...updatedSlides[index], buttonLink: e.target.value };
                          updateProp('slides', updatedSlides);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="#"
                      />
                    </div>
                    </div>
                  </Accordion>
                ))
              )}
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.autoplay !== false}
                  onChange={(e) => updateProp('autoplay', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Autoplay</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showArrows !== false}
                  onChange={(e) => updateProp('showArrows', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Arrows</span>
              </label>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showDots !== false}
                  onChange={(e) => updateProp('showDots', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Dots</span>
              </label>
            </div>
          </div>
        )}

        {/* Banner Component Properties */}
        {activeTab === 'content' && component.type === 'banner' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content (HTML)</label>
              <textarea
                value={component.props?.content || component.content || ''}
                onChange={(e) => {
                  updateProp('content', e.target.value);
                  updateContent(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                rows={6}
                placeholder="Enter banner content (HTML supported)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
              {component.props?.backgroundImage && (
                <div className="mb-2">
                  <img src={component.props.backgroundImage} alt="Banner background" className="w-full h-32 object-cover rounded border" />
                </div>
              )}
              <ImageUploadButton
                onUploadSuccess={(imageUrl) => updateProp('backgroundImage', imageUrl)}
                currentImageUrl={component.props?.backgroundImage}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Align</label>
              <select
                value={component.props?.textAlign || 'center'}
                onChange={(e) => updateProp('textAlign', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vertical Align</label>
              <select
                value={component.props?.verticalAlign || 'center'}
                onChange={(e) => updateProp('verticalAlign', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
              <input
                type="color"
                value={component.props?.textColor || '#ffffff'}
                onChange={(e) => updateProp('textColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Color</label>
              <input
                type="color"
                value={component.props?.overlayColor || '#000000'}
                onChange={(e) => updateProp('overlayColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={component.props?.overlayOpacity || 0.3}
                onChange={(e) => updateProp('overlayOpacity', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{component.props?.overlayOpacity || 0.3}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Padding</label>
              <input
                type="text"
                value={component.props?.contentPadding || '2rem'}
                onChange={(e) => updateProp('contentPadding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="2rem"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.overlay !== false}
                  onChange={(e) => updateProp('overlay', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Overlay</span>
              </label>
            </div>
          </div>
        )}

        {/* Nav Menu Component Properties */}
        {activeTab === 'content' && component.type === 'nav-menu' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Menu Items</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentItems = component.props?.items || [];
                    const newItem = {
                      id: `menu-${Date.now()}`,
                      label: 'New Menu Item',
                      link: '#',
                      icon: '',
                      iconType: 'heroicon',
                      openInNewTab: false,
                    };
                    updateProp('items', [...currentItems, newItem]);
                  }}
                  className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  + Add Item
                </button>
              </div>
              <div className="space-y-3">
                {(component.props?.items || [
                  {
                    id: '1',
                    label: 'Home',
                    link: '/',
                    icon: 'home',
                    iconType: 'heroicon',
                    openInNewTab: false,
                  },
                ]).map((item: any, index: number) => (
                  <div key={item.id || index} className="border border-gray-300 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentItems = component.props?.items || [];
                          updateProp('items', currentItems.filter((_: any, i: number) => i !== index));
                        }}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {/* Label */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                      <input
                        type="text"
                        value={item.label || ''}
                        onChange={(e) => {
                          const currentItems = component.props?.items || [];
                          const updatedItems = [...currentItems];
                          updatedItems[index] = { ...updatedItems[index], label: e.target.value };
                          updateProp('items', updatedItems);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Menu item label"
                      />
                    </div>
                    
                    {/* Link */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Link</label>
                      <input
                        type="text"
                        value={item.link || '#'}
                        onChange={(e) => {
                          const currentItems = component.props?.items || [];
                          const updatedItems = [...currentItems];
                          updatedItems[index] = { ...updatedItems[index], link: e.target.value };
                          updateProp('items', updatedItems);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="/page"
                      />
                    </div>
                    
                    {/* Icon Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Icon Type</label>
                      <select
                        value={item.iconType || 'heroicon'}
                        onChange={(e) => {
                          const currentItems = component.props?.items || [];
                          const updatedItems = [...currentItems];
                          updatedItems[index] = { ...updatedItems[index], iconType: e.target.value };
                          updateProp('items', updatedItems);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      >
                        <option value="heroicon">Heroicon</option>
                        <option value="emoji">Emoji</option>
                        <option value="image">Image URL</option>
                        <option value="">None</option>
                      </select>
                    </div>
                    
                    {/* Icon */}
                    {item.iconType && item.iconType !== '' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {item.iconType === 'heroicon' ? 'Icon Name' : item.iconType === 'emoji' ? 'Emoji' : 'Image URL'}
                        </label>
                        <input
                          type="text"
                          value={item.icon || ''}
                          onChange={(e) => {
                            const currentItems = component.props?.items || [];
                            const updatedItems = [...currentItems];
                            updatedItems[index] = { ...updatedItems[index], icon: e.target.value };
                            updateProp('items', updatedItems);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder={item.iconType === 'heroicon' ? 'home, about, contact, etc.' : item.iconType === 'emoji' ? '🏠' : 'https://example.com/icon.png'}
                        />
                        {item.iconType === 'heroicon' && (
                          <p className="text-xs text-gray-500 mt-1">Available: home, about, contact, services, products, blog</p>
                        )}
                      </div>
                    )}
                    
                    {/* Open in New Tab */}
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.openInNewTab || false}
                          onChange={(e) => {
                            const currentItems = component.props?.items || [];
                            const updatedItems = [...currentItems];
                            updatedItems[index] = { ...updatedItems[index], openInNewTab: e.target.checked };
                            updateProp('items', updatedItems);
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-xs text-gray-700">Open in new tab</span>
                      </label>
                    </div>
                    
                    {/* Submenu Items */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700">Submenu Items</label>
                        <button
                          type="button"
                          onClick={() => {
                            const currentItems = component.props?.items || [];
                            const updatedItems = [...currentItems];
                            if (!updatedItems[index].children) {
                              updatedItems[index].children = [];
                            }
                            updatedItems[index].children.push({
                              id: `submenu-${Date.now()}`,
                              label: 'Submenu Item',
                              link: '#',
                              icon: '',
                              iconType: 'heroicon',
                              openInNewTab: false,
                            });
                            updateProp('items', updatedItems);
                          }}
                          className="text-xs px-2 py-0.5 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          + Add Submenu
                        </button>
                      </div>
                      {item.children && item.children.length > 0 && (
                        <div className="ml-4 space-y-2 mt-2">
                          {item.children.map((child: any, childIndex: number) => (
                            <div key={child.id || childIndex} className="border border-gray-200 rounded p-2 bg-gray-50 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Submenu {childIndex + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentItems = component.props?.items || [];
                                    const updatedItems = [...currentItems];
                                    updatedItems[index].children = updatedItems[index].children.filter((_: any, i: number) => i !== childIndex);
                                    updateProp('items', updatedItems);
                                  }}
                                  className="text-xs px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                  ×
                                </button>
                              </div>
                              <input
                                type="text"
                                value={child.label || ''}
                                onChange={(e) => {
                                  const currentItems = component.props?.items || [];
                                  const updatedItems = [...currentItems];
                                  updatedItems[index].children[childIndex].label = e.target.value;
                                  updateProp('items', updatedItems);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="Label"
                              />
                              <input
                                type="text"
                                value={child.link || '#'}
                                onChange={(e) => {
                                  const currentItems = component.props?.items || [];
                                  const updatedItems = [...currentItems];
                                  updatedItems[index].children[childIndex].link = e.target.value;
                                  updateProp('items', updatedItems);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="Link"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Orientation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
              <select
                value={component.props?.orientation || 'horizontal'}
                onChange={(e) => updateProp('orientation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
            
            {/* Alignment */}
            {component.props?.orientation !== 'vertical' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
                <select
                  value={component.props?.alignment || 'left'}
                  onChange={(e) => updateProp('alignment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            )}
            
            {/* Mobile Settings */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Mobile Settings</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Breakpoint (px)</label>
                <input
                  type="number"
                  value={component.props?.mobileBreakpoint || 768}
                  onChange={(e) => updateProp('mobileBreakpoint', parseInt(e.target.value) || 768)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="768"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Menu Style</label>
                <select
                  value={component.props?.mobileMenuStyle || 'dropdown'}
                  onChange={(e) => updateProp('mobileMenuStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="dropdown">Dropdown</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
            </div>
            
            {/* Options */}
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={component.props?.showIcons !== false}
                  onChange={(e) => updateProp('showIcons', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Icons</span>
              </label>
            </div>
          </div>
        )}


        {/* Enhanced Button Component Properties */}
        {activeTab === 'content' && component.type === 'button' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                <input
                  type="text"
                value={component.content || ''}
                onChange={(e) => updateContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Click Me"
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variant</label>
              <select
                value={component.props?.variant || 'primary'}
                onChange={(e) => updateProp('variant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost</option>
                <option value="danger">Danger</option>
                <option value="success">Success</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <select
                value={component.props?.size || 'medium'}
                onChange={(e) => updateProp('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
              <input
                type="url"
                value={component.props?.link || ''}
                onChange={(e) => updateProp('link', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.fullWidth || false}
                onChange={(e) => updateProp('fullWidth', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Full Width</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.loading || false}
                onChange={(e) => updateProp('loading', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Loading State</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.disabled || false}
                onChange={(e) => updateProp('disabled', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Disabled</label>
            </div>
          </div>
        )}

        {/* Enhanced Heading Component Properties */}
        {activeTab === 'content' && component.type === 'heading' && (
          <div className="space-y-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heading Text</label>
              <input
                type="text"
                value={component.props?.text || 'Heading Text'}
                onChange={(e) => updateProp('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Heading Text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heading Level</label>
              <select
                value={component.props?.level || 'h1'}
                onChange={(e) => updateProp('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="h1">H1 (Largest)</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="h4">H4</option>
                <option value="h5">H5</option>
                <option value="h6">H6 (Smallest)</option>
              </select>
            </div>
          </div>
        )}

        {/* Enhanced Text Component Properties */}
        {activeTab === 'content' && component.type === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
            <textarea
                value={component.props?.text || 'Text content goes here...'}
                onChange={(e) => updateProp('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={4}
                placeholder="Text content goes here..."
              />
            </div>
          </div>
        )}

        {/* Enhanced Image Component Properties */}
        {activeTab === 'content' && component.type === 'image' && (
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <div className="space-y-2">
              {/* Image Preview */}
              {component.props?.src && component.props.src.trim() !== '' ? (
                <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                  <img
                    src={component.props.src}
                    alt={component.props?.alt || 'Preview'}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        target.style.display = 'none';
                        if (!parent.querySelector('.image-error-placeholder')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'image-error-placeholder flex items-center justify-center h-full bg-red-50 border border-red-200 text-red-600';
                          errorDiv.innerHTML = `
                            <div class="text-center">
                              <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <p class="text-xs font-medium">Image failed to load</p>
                              <p class="text-xs mt-1">Please check the URL or upload a new image</p>
                            </div>
                          `;
                          parent.appendChild(errorDiv);
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-sm font-medium">No image</p>
                    <p className="text-xs mt-1">Upload an image or enter a URL</p>
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <ImageUploadButton
                onUploadSuccess={(imageUrl) => {
                  updateProp('src', imageUrl);
                }}
                currentImageUrl={component.props?.src}
              />
              
              {/* URL Input (as fallback) */}
              <div className="relative">
            <input
                type="url"
                value={component.props?.src || ''}
              onChange={(e) => updateProp('src', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Or enter image URL"
            />
              </div>
            </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alt Text</label>
              <input
                type="text"
                value={component.props?.alt || ''}
                onChange={(e) => updateProp('alt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Image description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
              <input
                type="text"
                value={component.props?.caption || ''}
                onChange={(e) => updateProp('caption', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Image caption"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showCaption || false}
                onChange={(e) => updateProp('showCaption', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Caption</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption Position</label>
              <select
                value={component.props?.captionPosition || 'below'}
                onChange={(e) => updateProp('captionPosition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="below">Below</option>
                <option value="above">Above</option>
                <option value="overlay">Overlay</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.lazy || false}
                onChange={(e) => updateProp('lazy', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Lazy Loading</label>
            </div>
          </div>
        )}

        {/* Video URL */}
        {activeTab === 'content' && component.type === 'video' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
            <input
              type="text"
              value={component.props.src || ''}
              onChange={(e) => updateProp('src', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>
        )}


        {/* Container Columns */}
        {activeTab === 'content' && component.type === 'container' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Columns
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((cols) => (
                <button
                  key={cols}
                  onClick={() => updateProp('columns', cols)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    (component.props?.columns || 1) === cols
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {cols}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Drag elements from the left panel into the container to add them to columns.
            </p>
          </div>
        )}

        {/* Typography - Only show in Style tab */}
        {activeTab === 'style' && (
          <>
            {/* Spacing, Colors, Border, Size removed - available in account settings */}

        {/* Typography */}
        {(component.type === 'text' || component.type === 'heading') && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Typography</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                <input
                  type="text"
                  value={component.style?.fontSize || ''}
                  onChange={(e) => updateStyle('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="16px"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Weight</label>
                <select
                  value={component.style?.fontWeight || 'normal'}
                  onChange={(e) => updateStyle('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="600">Semi-bold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Align</label>
                <select
                  value={component.style?.textAlign || 'left'}
                  onChange={(e) => updateStyle('textAlign', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
            </div>
          </div>
        )}

            {/* Colors, Spacing, Border, Size removed - available in account settings */}
          </>
        )}

        {/* Sidebar Component Properties */}
        {activeTab === 'content' && component.type === 'sidebar' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={component.props?.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Sidebar Title"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showTitle || false}
                onChange={(e) => updateProp('showTitle', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Title</label>
            </div>
          </div>
        )}

        {/* Shortcode Component Properties */}
        {activeTab === 'content' && component.type === 'shortcode' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shortcode</label>
              <input
                type="text"
                value={component.props?.shortcode || component.content || ''}
                onChange={(e) => {
                  updateProp('shortcode', e.target.value);
                  updateContent(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                placeholder="[shortcode_example]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={component.props?.description || ''}
                onChange={(e) => updateProp('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Enter shortcode description"
              />
            </div>
          </div>
        )}

        {/* Alert Component Properties */}
        {activeTab === 'content' && component.type === 'alert' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
              <select
                value={component.props?.type || 'info'}
                onChange={(e) => updateProp('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={component.props?.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Alert Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={component.content || ''}
                onChange={(e) => updateContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Alert message content"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showCloseButton || false}
                onChange={(e) => updateProp('showCloseButton', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Close Button</label>
            </div>
          </div>
        )}

        {/* Social Icons Component Properties */}
        {activeTab === 'content' && component.type === 'social-icons' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
              <div className="space-y-2">
                {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'github'].map(platform => (
                  <label key={platform} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={component.props?.platforms?.includes(platform) || false}
                      onChange={(e) => {
                        const currentPlatforms = component.props?.platforms || [];
                        const newPlatforms = e.target.checked
                          ? [...currentPlatforms, platform]
                          : currentPlatforms.filter((p: string) => p !== platform);
                        updateProp('platforms', newPlatforms);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 block text-sm text-gray-700 capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <select
                value={component.props?.size || 'medium'}
                onChange={(e) => updateProp('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
              <select
                value={component.props?.style || 'rounded'}
                onChange={(e) => updateProp('style', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="circle">Circle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alignment</label>
              <select
                value={component.props?.alignment || 'center'}
                onChange={(e) => updateProp('alignment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showLabels || false}
                onChange={(e) => updateProp('showLabels', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Labels</label>
            </div>
          </div>
        )}

        {/* Domain Search Component Properties */}
        {activeTab === 'content' && component.type === 'domain-search' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder Text</label>
              <input
                type="text"
                value={component.props?.placeholder || ''}
                onChange={(e) => updateProp('placeholder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Search for domains..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                value={component.props?.buttonText || ''}
                onChange={(e) => updateProp('buttonText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Search"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showSuggestions || false}
                onChange={(e) => updateProp('showSuggestions', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Suggestions</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Suggestions</label>
              <input
                type="number"
                value={component.props?.maxSuggestions || 5}
                onChange={(e) => updateProp('maxSuggestions', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={component.props?.backgroundColor || '#ffffff'}
                onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
              <input
                type="color"
                value={component.props?.borderColor || '#d1d5db'}
                onChange={(e) => updateProp('borderColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
              <input
                type="color"
                value={component.props?.textColor || '#374151'}
                onChange={(e) => updateProp('textColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
              <input
                type="color"
                value={component.props?.buttonColor || '#4f46e5'}
                onChange={(e) => updateProp('buttonColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text Color</label>
              <input
                type="color"
                value={component.props?.buttonTextColor || '#ffffff'}
                onChange={(e) => updateProp('buttonTextColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
              <input
                type="text"
                value={component.props?.borderRadius || '0.375rem'}
                onChange={(e) => updateProp('borderRadius', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0.375rem"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
              <input
                type="text"
                value={component.props?.padding || '0.75rem'}
                onChange={(e) => updateProp('padding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0.75rem"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <input
                type="text"
                value={component.props?.fontSize || '1rem'}
                onChange={(e) => updateProp('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="1rem"
              />
            </div>
          </div>
        )}

        {/* Products Grid Component Properties */}
        {activeTab === 'content' && component.type === 'products-grid' && (
          <ProductsGridProperties 
            component={component} 
            updateProp={updateProp}
          />
        )}

        {/* Featured Products Component Properties */}
        {activeTab === 'content' && component.type === 'featured-products' && (
          <FeaturedProductsProperties 
            component={component} 
            updateProp={updateProp}
          />
        )}

        {/* Legacy Products Grid Component Properties (for backward compatibility) */}
        {activeTab === 'content' && component && component.type === 'products-grid' && false && component && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Products</label>
              <input
                type="number"
                min="1"
                max="20"
                 value={component!.props?.productCount || 6}
                onChange={(e) => updateProp('productCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={component!.props?.title || 'Our Products'}
                onChange={(e) => updateProp('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Our Products"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
              <input
                type="text"
                value={component!.props?.subtitle || 'Choose from our range of hosting solutions designed to meet your needs'}
                onChange={(e) => updateProp('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Choose from our range of hosting solutions designed to meet your needs"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component!.props?.showPrices || false}
                onChange={(e) => updateProp('showPrices', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Prices</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component!.props?.showFeatures || false}
                onChange={(e) => updateProp('showFeatures', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Features</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component!.props?.showButtons || false}
                onChange={(e) => updateProp('showButtons', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Buttons</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Style</label>
              <select
                value={component!.props?.cardStyle || 'default'}
                onChange={(e) => updateProp('cardStyle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="elevated">Elevated</option>
                <option value="outlined">Outlined</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={component!.props?.backgroundColor || '#ffffff'}
                onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Background Color</label>
              <input
                type="color"
                value={component!.props?.cardBackgroundColor || '#ffffff'}
                onChange={(e) => updateProp('cardBackgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
              <input
                type="color"
                value={component!.props?.borderColor || '#e5e7eb'}
                onChange={(e) => updateProp('borderColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
              <input
                type="color"
                value={component!.props?.textColor || '#374151'}
                onChange={(e) => updateProp('textColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Color</label>
              <input
                type="color"
                value={component!.props?.priceColor || '#4f46e5'}
                onChange={(e) => updateProp('priceColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
              <input
                type="color"
                value={component!.props?.buttonColor || '#4f46e5'}
                onChange={(e) => updateProp('buttonColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text Color</label>
              <input
                type="color"
                value={component!.props?.buttonTextColor || '#ffffff'}
                onChange={(e) => updateProp('buttonTextColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
              <input
                type="text"
                value={component!.props?.spacing || '1rem'}
                onChange={(e) => updateProp('spacing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="1rem"
              />
            </div>
          </div>
        )}

        {/* Legacy Featured Products Component Properties (for backward compatibility) */}
        {activeTab === 'content' && component && component.type === 'featured-products' && false && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
              <select
                value={component!.props?.columns || 3}
                onChange={(e) => updateProp('columns', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Products</label>
              <input
                type="number"
                min="1"
                max="10"
                value={component!.props?.productCount || 3}
                onChange={(e) => updateProp('productCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={component!.props?.title || 'Featured Products'}
                onChange={(e) => updateProp('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Featured Products"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
              <input
                type="text"
                value={component!.props?.subtitle || 'Discover our most popular and recommended hosting solutions'}
                onChange={(e) => updateProp('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Discover our most popular and recommended hosting solutions"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component!.props?.showPrices !== false}
                onChange={(e) => updateProp('showPrices', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Prices</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component!.props?.showButtons !== false}
                onChange={(e) => updateProp('showButtons', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Add to Cart Buttons</label>
            </div>
          </div>
        )}

        {/* Showcase Component Properties */}
        {activeTab === 'content' && component.type === 'showcase' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={component.props?.title || ''}
                onChange={(e) => updateProp('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Showcase Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
              <input
                type="text"
                value={component.props?.subtitle || ''}
                onChange={(e) => updateProp('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Showcase subtitle"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showTitle || false}
                onChange={(e) => updateProp('showTitle', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Title</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showSubtitle || false}
                onChange={(e) => updateProp('showSubtitle', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Subtitle</label>
            </div>
          </div>
        )}

        {/* Pricing Table Component Properties */}
        {activeTab === 'content' && component.type === 'pricing-table' && (
          <div className="space-y-4">
            {/* General Settings */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">General Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={component.props?.title || 'Choose Your Plan'}
                    onChange={(e) => updateProp('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Choose Your Plan"
                  />
        </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={component.props?.subtitle || 'Select the perfect plan for your needs'}
                    onChange={(e) => updateProp('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="Select the perfect plan for your needs"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showToggle !== false}
                    onChange={(e) => updateProp('showToggle', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Show Monthly/Yearly Toggle</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <input
                    type="text"
                    value={component.props?.currency || '$'}
                    onChange={(e) => updateProp('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="$"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Plans */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Pricing Plans</h4>
                <div className="flex items-center gap-2">
                  {(!component.props?.plans || component.props.plans.length === 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        const defaultPlans = [
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
                            popular: false,
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
                            popular: false,
                          },
                        ];
                        updateProp('plans', defaultPlans);
                        updateProp('popularPlanId', '2');
                      }}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      title="Initialize with default 3 plans"
                    >
                      Load Default Plans
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const currentPlans = component.props?.plans || [];
                      const newPlan = {
                        id: `plan-${Date.now()}`,
                        name: 'New Plan',
                        price: '0.00',
                        period: 'month',
                        description: '',
                        features: ['Feature 1', 'Feature 2'],
                        buttonText: 'Get Started',
                        buttonLink: '#',
                        popular: false,
                      };
                      updateProp('plans', [...currentPlans, newPlan]);
                    }}
                    className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    + Add Plan
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {(component.props?.plans && component.props.plans.length > 0 ? component.props.plans : [
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
                    popular: false,
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
                    popular: false,
                  },
                ]).map((plan: any, index: number) => (
                  <div key={plan.id || index} className="border border-gray-300 rounded-lg p-3 space-y-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">Plan {index + 1}: {plan.name || 'Unnamed'}</span>
                      <div className="flex items-center gap-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const currentPlans = component.props?.plans || [];
                              const newPlans = [...currentPlans];
                              [newPlans[index - 1], newPlans[index]] = [newPlans[index], newPlans[index - 1]];
                              updateProp('plans', newPlans);
                            }}
                            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            title="Move Up"
                          >
                            ↑
                          </button>
                        )}
                        {index < (component.props?.plans || []).length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const currentPlans = component.props?.plans || [];
                              const newPlans = [...currentPlans];
                              [newPlans[index], newPlans[index + 1]] = [newPlans[index + 1], newPlans[index]];
                              updateProp('plans', newPlans);
                            }}
                            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                            title="Move Down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const currentPlans = component.props?.plans || [];
                            updateProp('plans', currentPlans.filter((_: any, i: number) => i !== index));
                          }}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* Plan Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={plan.name || ''}
                        onChange={(e) => {
                          const currentPlans = component.props?.plans || [];
                          const updatedPlans = [...currentPlans];
                          updatedPlans[index] = { ...updatedPlans[index], name: e.target.value };
                          updateProp('plans', updatedPlans);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Basic"
                      />
                    </div>

                    {/* Price and Period */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                        <input
                          type="text"
                          value={plan.price || '0.00'}
                          onChange={(e) => {
                            const currentPlans = component.props?.plans || [];
                            const updatedPlans = [...currentPlans];
                            updatedPlans[index] = { ...updatedPlans[index], price: e.target.value };
                            updateProp('plans', updatedPlans);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="9.99"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                        <input
                          type="text"
                          value={plan.period || 'month'}
                          onChange={(e) => {
                            const currentPlans = component.props?.plans || [];
                            const updatedPlans = [...currentPlans];
                            updatedPlans[index] = { ...updatedPlans[index], period: e.target.value };
                            updateProp('plans', updatedPlans);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="month"
                        />
                      </div>
                    </div>

                    {/* Original Price (for yearly) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Original Price (Optional - for yearly discount)</label>
                      <input
                        type="text"
                        value={plan.originalPrice || ''}
                        onChange={(e) => {
                          const currentPlans = component.props?.plans || [];
                          const updatedPlans = [...currentPlans];
                          updatedPlans[index] = { ...updatedPlans[index], originalPrice: e.target.value };
                          updateProp('plans', updatedPlans);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="19.99"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={plan.description || ''}
                        onChange={(e) => {
                          const currentPlans = component.props?.plans || [];
                          const updatedPlans = [...currentPlans];
                          updatedPlans[index] = { ...updatedPlans[index], description: e.target.value };
                          updateProp('plans', updatedPlans);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder="Perfect for getting started"
                      />
                    </div>

                    {/* Features */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Features (one per line)</label>
                      <textarea
                        value={(plan.features || []).join('\n')}
                        onChange={(e) => {
                          const currentPlans = component.props?.plans || [];
                          const updatedPlans = [...currentPlans];
                          const features = e.target.value.split('\n').filter(f => f.trim());
                          updatedPlans[index] = { ...updatedPlans[index], features: features.length > 0 ? features : ['Feature 1'] };
                          updateProp('plans', updatedPlans);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        rows={4}
                        placeholder="10GB Storage&#10;100GB Bandwidth&#10;Email Support"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter each feature on a new line</p>
                    </div>

                    {/* Button */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                        <input
                          type="text"
                          value={plan.buttonText || 'Get Started'}
                          onChange={(e) => {
                            const currentPlans = component.props?.plans || [];
                            const updatedPlans = [...currentPlans];
                            updatedPlans[index] = { ...updatedPlans[index], buttonText: e.target.value };
                            updateProp('plans', updatedPlans);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Get Started"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Link</label>
                        <input
                          type="text"
                          value={plan.buttonLink || '#'}
                          onChange={(e) => {
                            const currentPlans = component.props?.plans || [];
                            const updatedPlans = [...currentPlans];
                            updatedPlans[index] = { ...updatedPlans[index], buttonLink: e.target.value };
                            updateProp('plans', updatedPlans);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="#"
                        />
                      </div>
                    </div>

                    {/* Plan Colors */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Color</label>
                        <input
                          type="color"
                          value={plan.buttonColor || component.props?.popularBadgeColor || '#4f46e5'}
                          onChange={(e) => {
                            const currentPlans = component.props?.plans || [];
                            const updatedPlans = [...currentPlans];
                            updatedPlans[index] = { ...updatedPlans[index], buttonColor: e.target.value };
                            updateProp('plans', updatedPlans);
                          }}
                          className="w-full h-8 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Text Color</label>
                        <input
                          type="color"
                          value={plan.buttonTextColor || '#ffffff'}
                          onChange={(e) => {
                            const currentPlans = component.props?.plans || [];
                            const updatedPlans = [...currentPlans];
                            updatedPlans[index] = { ...updatedPlans[index], buttonTextColor: e.target.value };
                            updateProp('plans', updatedPlans);
                          }}
                          className="w-full h-8 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    {/* Popular Plan */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={plan.popular || false}
                        onChange={(e) => {
                          const currentPlans = component.props?.plans || [];
                          const updatedPlans = [...currentPlans];
                          // Unset other popular plans
                          if (e.target.checked) {
                            updatedPlans.forEach((p: any, i: number) => {
                              if (i !== index) p.popular = false;
                            });
                          }
                          updatedPlans[index] = { ...updatedPlans[index], popular: e.target.checked };
                          updateProp('plans', updatedPlans);
                          // Also update popularPlanId
                          if (e.target.checked) {
                            updateProp('popularPlanId', plan.id);
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-xs text-gray-700">Mark as Popular Plan</label>
                    </div>

                    {/* Popular Badge Text */}
                    {plan.popular && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Popular Badge Text</label>
                        <input
                          type="text"
                          value={plan.badge || component.props?.popularBadgeText || 'Popular'}
                          onChange={(e) => {
                            const currentPlans = component.props?.plans || [];
                            const updatedPlans = [...currentPlans];
                            updatedPlans[index] = { ...updatedPlans[index], badge: e.target.value };
                            updateProp('plans', updatedPlans);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="Popular"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Style Settings */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Style Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Background Color</label>
                  <input
                    type="color"
                    value={component.props?.cardBackgroundColor || '#ffffff'}
                    onChange={(e) => updateProp('cardBackgroundColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Popular Badge Color</label>
                  <input
                    type="color"
                    value={component.props?.popularBadgeColor || '#4f46e5'}
                    onChange={(e) => updateProp('popularBadgeColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Style</label>
                  <select
                    value={component.props?.buttonStyle || 'solid'}
                    onChange={(e) => updateProp('buttonStyle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="solid">Solid</option>
                    <option value="outline">Outline</option>
                    <option value="ghost">Ghost</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Testimonials Component Properties */}
        {activeTab === 'content' && component.type === 'testimonials' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={component.props?.title || 'What Our Customers Say'}
                onChange={(e) => updateProp('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="What Our Customers Say"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
              <input
                type="text"
                value={component.props?.subtitle || "Don't just take our word for it"}
                onChange={(e) => updateProp('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Don't just take our word for it"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
              <select
                value={component.props?.layout || 'carousel'}
                onChange={(e) => updateProp('layout', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="carousel">Carousel</option>
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="masonry">Masonry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
              <select
                value={component.props?.columns || 3}
                onChange={(e) => updateProp('columns', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value={1}>1 Column</option>
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showRating !== false}
                onChange={(e) => updateProp('showRating', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Rating</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showAvatar !== false}
                onChange={(e) => updateProp('showAvatar', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Avatar</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.autoplay || false}
                onChange={(e) => updateProp('autoplay', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Autoplay Carousel</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Background Color</label>
              <input
                type="color"
                value={component.props?.cardBackgroundColor || '#ffffff'}
                onChange={(e) => updateProp('cardBackgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating Color</label>
              <input
                type="color"
                value={component.props?.ratingColor || '#fbbf24'}
                onChange={(e) => updateProp('ratingColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* FAQ Component Properties */}
        {activeTab === 'content' && component.type === 'checkout' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-xs text-blue-800 font-medium mb-1">Checkout Form Widget</p>
              <p className="text-xs text-blue-600">Highly customizable checkout form with dynamic field management</p>
            </div>
            
            {/* Dynamic Field Management - Summary */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Form Fields</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {(component.props?.customFields || []).length} field{(component.props?.customFields || []).length !== 1 ? 's' : ''} configured
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Initialize local state with current customFields when opening modal
                    setLocalCustomFields([...(component.props?.customFields || [])]);
                    setIsFormModalOpen(true);
                  }}
                  className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                >
                  Edit Form
                </button>
              </div>
            </div>
            
            {/* Layout & Display */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Layout & Display</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                  <select
                    value={component.props?.layout || 'two-column'}
                    onChange={(e) => updateProp('layout', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="two-column">Two Column</option>
                    <option value="single-column">Single Column</option>
                    <option value="split">Split View</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Width</label>
                    <input
                      type="text"
                      value={component.props?.maxWidth || '1200px'}
                      onChange={(e) => updateProp('maxWidth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="1200px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
                    <input
                      type="text"
                      value={component.props?.padding || '2rem'}
                      onChange={(e) => updateProp('padding', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="2rem"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                  <input
                    type="text"
                    value={component.props?.borderRadius || '0.5rem'}
                    onChange={(e) => updateProp('borderRadius', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="0.5rem"
                  />
                </div>
              </div>
            </div>
            
            {/* Titles & Labels */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Titles & Labels</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={component.props?.title || 'Checkout'}
                    onChange={(e) => updateProp('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={component.props?.subtitle || 'Complete your purchase securely'}
                    onChange={(e) => updateProp('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submit Button Text</label>
                  <input
                    type="text"
                    value={component.props?.submitButtonText || 'Complete Order'}
                    onChange={(e) => updateProp('submitButtonText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Form Sections */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Form Sections</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showOrderSummary !== false}
                    onChange={(e) => updateProp('showOrderSummary', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Order Summary</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showBillingInfo !== false}
                    onChange={(e) => updateProp('showBillingInfo', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Billing Information</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showShippingInfo !== false}
                    onChange={(e) => updateProp('showShippingInfo', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Shipping Information</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showPaymentInfo !== false}
                    onChange={(e) => updateProp('showPaymentInfo', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Payment Information</span>
                </label>
              </div>
            </div>
            
            {/* Features */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Features</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showProgressIndicator !== false}
                    onChange={(e) => updateProp('showProgressIndicator', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Progress Indicator</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.autoFillUserData !== false}
                    onChange={(e) => updateProp('autoFillUserData', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Auto-fill User Data</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showTermsCheckbox !== false}
                    onChange={(e) => updateProp('showTermsCheckbox', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Terms Checkbox</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showNewsletterCheckbox || false}
                    onChange={(e) => updateProp('showNewsletterCheckbox', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Newsletter Checkbox</span>
                </label>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Methods</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Payment Methods</label>
                  <div className="space-y-2">
                    {['stripe', 'paypal', 'manual', 'bank_transfer', 'crypto', 'apple_pay', 'google_pay'].map((method) => (
                      <label key={method} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={component.props?.paymentMethods?.includes(method) || (method === 'stripe' && !component.props?.paymentMethods)}
                          onChange={(e) => {
                            const current = component.props?.paymentMethods || ['stripe'];
                            const updated = e.target.checked
                              ? [...current, method]
                              : current.filter((m: string) => m !== method);
                            updateProp('paymentMethods', updated.length > 0 ? updated : ['stripe']);
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{method.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Payment Method</label>
                  <select
                    value={component.props?.defaultPaymentMethod || 'stripe'}
                    onChange={(e) => updateProp('defaultPaymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    {(component.props?.paymentMethods || ['stripe']).map((method: string) => (
                      <option key={method} value={method}>{method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Coupon Code Settings */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Coupon Code</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showCouponCode || false}
                    onChange={(e) => updateProp('showCouponCode', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Coupon Code</span>
                </label>
                {component.props?.showCouponCode && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code Label</label>
                      <input
                        type="text"
                        value={component.props?.couponCodeLabel || 'Coupon Code'}
                        onChange={(e) => updateProp('couponCodeLabel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code Placeholder</label>
                      <input
                        type="text"
                        value={component.props?.couponCodePlaceholder || 'Enter coupon code'}
                        onChange={(e) => updateProp('couponCodePlaceholder', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apply Button Text</label>
                      <input
                        type="text"
                        value={component.props?.couponApplyButtonText || 'Apply'}
                        onChange={(e) => updateProp('couponApplyButtonText', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Advanced Features */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Features</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.allowGuestCheckout || false}
                    onChange={(e) => updateProp('allowGuestCheckout', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow Guest Checkout</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.saveBillingInfo || false}
                    onChange={(e) => updateProp('saveBillingInfo', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Save Billing Info for Future</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showOrderNotes || false}
                    onChange={(e) => updateProp('showOrderNotes', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Order Notes/Comments</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showGiftOptions || false}
                    onChange={(e) => updateProp('showGiftOptions', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Gift Options</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showShippingOptions || false}
                    onChange={(e) => updateProp('showShippingOptions', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Shipping Options</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showRecurringOptions || false}
                    onChange={(e) => updateProp('showRecurringOptions', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Recurring Billing Options</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showOrderScheduling || false}
                    onChange={(e) => updateProp('showOrderScheduling', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Order Scheduling (Future Date)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showTaxExempt || false}
                    onChange={(e) => updateProp('showTaxExempt', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Tax Exempt Option</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showPONumber || false}
                    onChange={(e) => updateProp('showPONumber', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show PO Number Field</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showMultipleAddresses || false}
                    onChange={(e) => updateProp('showMultipleAddresses', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow Multiple Shipping Addresses</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={component.props?.showVATNumber || false}
                    onChange={(e) => updateProp('showVATNumber', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show VAT Number Field</span>
                </label>
              </div>
            </div>
            
          </div>
        )}

        {activeTab === 'content' && component.type === 'faq' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={component.props?.title || 'Frequently Asked Questions'}
                onChange={(e) => updateProp('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Frequently Asked Questions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
              <input
                type="text"
                value={component.props?.subtitle || 'Find answers to common questions'}
                onChange={(e) => updateProp('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Find answers to common questions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <select
                value={component.props?.icon || 'chevron'}
                onChange={(e) => updateProp('icon', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="chevron">Chevron</option>
                <option value="plus">Plus/Minus</option>
                <option value="arrow">Arrow</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon Position</label>
              <select
                value={component.props?.iconPosition || 'right'}
                onChange={(e) => updateProp('iconPosition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.allowMultiple !== false}
                onChange={(e) => updateProp('allowMultiple', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Allow Multiple Items Open</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.defaultOpenFirst || false}
                onChange={(e) => updateProp('defaultOpenFirst', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Open First Item by Default</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showSearch || false}
                onChange={(e) => updateProp('showSearch', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Search</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Animation</label>
              <select
                value={component.props?.animation || 'slide'}
                onChange={(e) => updateProp('animation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Background Color</label>
              <input
                type="color"
                value={component.props?.itemBackgroundColor || '#ffffff'}
                onChange={(e) => updateProp('itemBackgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon Color</label>
              <input
                type="color"
                value={component.props?.iconColor || '#6b7280'}
                onChange={(e) => updateProp('iconColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Style Tab - General styling for all components */}
        {activeTab === 'style' && component.type !== 'header' && (
          <div className="space-y-4">
            {/* Colors, Spacing, Border, Size removed - available in account settings */}
            <Accordion title="Typography">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                  <input
                    type="text"
                    value={component.style?.fontSize || component.props?.fontSize || ''}
                    onChange={(e) => {
                      if (component.style) {
                        updateStyle('fontSize', e.target.value);
                      } else {
                        updateProp('fontSize', e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="16px"
                  />
        </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
                  <select
                    value={component.style?.fontWeight || component.props?.fontWeight || 'normal'}
                    onChange={(e) => {
                      if (component.style) {
                        updateStyle('fontWeight', e.target.value);
                      } else {
                        updateProp('fontWeight', e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="300">Light</option>
                    <option value="400">Normal</option>
                    <option value="500">Medium</option>
                    <option value="600">Semi Bold</option>
                    <option value="700">Bold</option>
                    <option value="800">Extra Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                  <select
                    value={component.props?.fontFamily || 'Inter'}
                    onChange={(e) => updateProp('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                    <option value="Nunito">Nunito</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Alignment</label>
                  <select
                    value={component.props?.textAlign || 'left'}
                    onChange={(e) => updateProp('textAlign', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Line Height</label>
                  <input
                    type="text"
                    value={component.props?.lineHeight || ''}
                    onChange={(e) => updateProp('lineHeight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="1.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Letter Spacing</label>
                  <input
                    type="text"
                    value={component.props?.letterSpacing || ''}
                    onChange={(e) => updateProp('letterSpacing', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </Accordion>
            <Accordion title="Layout">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width
                    {maxCanvasWidth && (
                      <span className="text-xs text-gray-500 ml-2">(max: {maxCanvasWidth}px)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={component.style?.width || ''}
                    onChange={(e) => updateStyle('width', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="100%"
                  />
                  {widthWarning && (
                    <p className="text-xs text-amber-600 mt-1">{widthWarning}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    type="text"
                    value={component.style?.height || ''}
                    onChange={(e) => updateStyle('height', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="auto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Width</label>
                  <input
                    type="text"
                    value={component.props?.maxWidth || ''}
                    onChange={(e) => updateProp('maxWidth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display</label>
                  <select
                    value={component.style?.display || 'block'}
                    onChange={(e) => updateStyle('display', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="block">Block</option>
                    <option value="inline">Inline</option>
                    <option value="inline-block">Inline Block</option>
                    <option value="flex">Flex</option>
                    <option value="grid">Grid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Custom Grid Columns (CSS)</label>
                  <input
                    type="text"
                    value={component.style?.gridTemplateColumns || component.props?.gridTemplateColumns || ''}
                    onChange={(e) => {
                      if (component.style) {
                        updateStyle('gridTemplateColumns', e.target.value);
                      } else {
                        updateProp('gridTemplateColumns', e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                    placeholder="repeat(3, 1fr) or 1fr 2fr 1fr"
                  />
                  <p className="text-xs text-gray-500 mt-1">CSS grid-template-columns value (e.g., "repeat(3, 1fr)", "1fr 2fr 1fr", "200px 1fr")</p>
                </div>
              </div>
            </Accordion>
          </div>
        )}

        {/* Motion Tab - Animations and transitions */}
        {activeTab === 'motion' && component.type !== 'header' && (
          <div className="space-y-4">
            <Accordion title="Animation" defaultOpen={true}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Animation Type</label>
                  <select
                    value={component.props?.animation || 'none'}
                    onChange={(e) => updateProp('animation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="zoom">Zoom</option>
                    <option value="bounce">Bounce</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (ms)</label>
                  <input
                    type="number"
                    value={component.props?.animationDuration || 300}
                    onChange={(e) => updateProp('animationDuration', parseInt(e.target.value) || 300)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    min="0"
                    step="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delay (ms)</label>
                  <input
                    type="number"
                    value={component.props?.animationDelay || 0}
                    onChange={(e) => updateProp('animationDelay', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    min="0"
                    step="50"
                  />
                </div>
              </div>
            </Accordion>
            <Accordion title="Transitions">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transition Property</label>
                  <input
                    type="text"
                    value={component.style?.transition || ''}
                    onChange={(e) => updateStyle('transition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder="all 0.3s ease"
                  />
                </div>
              </div>
            </Accordion>
          </div>
        )}

      </div>
    </div>

      {/* Edit Form Modal */}
      {isFormModalOpen && component && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsFormModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Form Fields</h3>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">
                      {localCustomFields.length} field{localCustomFields.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFieldId = `field_${Date.now()}`;
                      const newField = {
                        id: newFieldId,
                        type: 'text',
                        label: 'New Field',
                        name: `field_${Date.now()}`,
                        placeholder: 'Enter value',
                        required: false,
                        section: 'billing',
                        order: 1,
                        gridCols: 12
                      };
                      const currentFields = localCustomFields;
                      // Add new field at the beginning and update order for existing fields
                      const updatedFields = currentFields.map((f: any, idx: number) => ({
                        ...f,
                        order: idx + 2
                      }));
                      setLocalCustomFields([newField, ...updatedFields]);
                      // Highlight and open the new field
                      setHighlightedFieldId(newFieldId);
                      setOpenAccordions(new Set([newFieldId]));
                    }}
                    className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium"
                  >
                    + Add Custom Field
                  </button>
                </div>
                
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {localCustomFields.map((field: any, index: number) => {
                    const isHighlighted = highlightedFieldId === field.id;
                    const isOpen = openAccordions.has(field.id);
                    const isDragging = draggedFieldId === field.id;
                    const isDragOver = dragOverIndex === index;
                    return (
                    <div
                      key={field.id || index}
                      draggable
                      onDragStart={(e) => {
                        setDraggedFieldId(field.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', field.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverIndex(index);
                      }}
                      onDragLeave={() => {
                        setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = e.dataTransfer.getData('text/plain');
                        if (draggedId && draggedId !== field.id) {
                          const fields = [...localCustomFields];
                          const draggedIndex = fields.findIndex((f: any) => f.id === draggedId);
                          if (draggedIndex !== -1) {
                            const [draggedField] = fields.splice(draggedIndex, 1);
                            fields.splice(index, 0, draggedField);
                            // Update order values
                            fields.forEach((f: any, idx: number) => {
                              f.order = idx + 1;
                            });
                            setLocalCustomFields(fields);
                          }
                        }
                        setDraggedFieldId(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedFieldId(null);
                        setDragOverIndex(null);
                      }}
                      className={`transition-all duration-300 cursor-move ${
                        isHighlighted 
                          ? 'ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50 rounded-lg p-1' 
                          : ''
                      } ${
                        isDragging ? 'opacity-50' : ''
                      } ${
                        isDragOver ? 'border-2 border-indigo-400 border-dashed rounded-lg' : ''
                      }`}
                    >
                      <Accordion 
                        title={field.label || `Field ${index + 1}`}
                        leftIcon={
                          <svg className="h-4 w-4 text-gray-400 cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        }
                        rightIcon={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const fields = [...localCustomFields];
                              fields.splice(index, 1);
                              setLocalCustomFields(fields);
                              // Close accordion if it was open
                              if (openAccordions.has(field.id)) {
                                setOpenAccordions(new Set());
                              }
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1 transition-colors"
                            title="Delete field"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        }
                        isOpen={isOpen}
                        onToggle={() => {
                          // If this accordion is already open, close it
                          // Otherwise, close all others and open only this one
                          if (openAccordions.has(field.id)) {
                            setOpenAccordions(new Set());
                          } else {
                            setOpenAccordions(new Set([field.id]));
                          }
                        }}
                      >
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Field Label</label>
                          <input
                            type="text"
                            value={field.label || ''}
                            onChange={(e) => {
                              const fields = [...localCustomFields];
                              fields[index] = { ...fields[index], label: e.target.value };
                              setLocalCustomFields(fields);
                            }}
                            placeholder="Field Label"
                            className="w-full px-2 py-1 text-sm font-medium border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Type</label>
                            <select
                              value={field.type || 'text'}
                              onChange={(e) => {
                                const fields = [...localCustomFields];
                                fields[index] = { ...fields[index], type: e.target.value };
                                setLocalCustomFields(fields);
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone</option>
                              <option value="number">Number</option>
                              <option value="select">Select/Dropdown</option>
                              <option value="textarea">Textarea</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="radio">Radio</option>
                              <option value="date">Date</option>
                              <option value="file">File Upload</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Section</label>
                            <select
                              value={field.section || 'billing'}
                              onChange={(e) => {
                                const fields = [...localCustomFields];
                                fields[index] = { ...fields[index], section: e.target.value };
                                setLocalCustomFields(fields);
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="billing">Billing</option>
                              <option value="shipping">Shipping</option>
                              <option value="payment">Payment</option>
                              <option value="custom">Custom</option>
                              <option value="order">Order</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Field Name</label>
                            <input
                              type="text"
                              value={field.name || ''}
                              onChange={(e) => {
                                const fields = [...localCustomFields];
                                fields[index] = { ...fields[index], name: e.target.value };
                                setLocalCustomFields(fields);
                              }}
                              placeholder="fieldName"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Order</label>
                            <input
                              type="number"
                              value={field.order || index + 1}
                              onChange={(e) => {
                                const fields = [...localCustomFields];
                                fields[index] = { ...fields[index], order: parseInt(e.target.value) || index + 1 };
                                setLocalCustomFields(fields);
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => {
                              const fields = [...localCustomFields];
                              fields[index] = { ...fields[index], placeholder: e.target.value };
                              setLocalCustomFields(fields);
                            }}
                            placeholder="Enter placeholder text"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Help Text (Optional)</label>
                          <input
                            type="text"
                            value={field.helpText || ''}
                            onChange={(e) => {
                              const fields = [...localCustomFields];
                              fields[index] = { ...fields[index], helpText: e.target.value };
                              setLocalCustomFields(fields);
                            }}
                            placeholder="Helper text shown below field"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Default Value (Optional)</label>
                          <input
                            type="text"
                            value={field.defaultValue || ''}
                            onChange={(e) => {
                              const fields = [...localCustomFields];
                              fields[index] = { ...fields[index], defaultValue: e.target.value };
                              setLocalCustomFields(fields);
                            }}
                            placeholder="Default value for this field"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Grid Columns (1-12)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={field.gridCols || 12}
                            onChange={(e) => {
                              const fields = [...localCustomFields];
                              fields[index] = { ...fields[index], gridCols: parseInt(e.target.value) || 12 };
                              setLocalCustomFields(fields);
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <p className="text-xs text-gray-400 mt-1">Controls field width in grid layout</p>
                        </div>
                        
                        {(field.type === 'select' || field.type === 'radio') && (
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Options (one per line, format: Label|Value)</label>
                            <textarea
                              value={field.options ? field.options.map((opt: any) => `${opt.label}|${opt.value}`).join('\n') : ''}
                              onChange={(e) => {
                                const options = e.target.value.split('\n').filter(Boolean).map(line => {
                                  const [label, value] = line.split('|');
                                  return { label: label?.trim() || line.trim(), value: value?.trim() || line.trim().toLowerCase().replace(/\s+/g, '_') };
                                });
                                const fields = [...localCustomFields];
                                fields[index] = { ...fields[index], options };
                                setLocalCustomFields(fields);
                              }}
                              placeholder="Option 1|value1&#10;Option 2|value2"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                              rows={3}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) => {
                                const fields = [...localCustomFields];
                                fields[index] = { ...fields[index], required: e.target.checked };
                                setLocalCustomFields(fields);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-xs text-gray-700">Required</span>
                          </label>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (index > 0) {
                                  const fields = [...localCustomFields];
                                  [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
                                  setLocalCustomFields(fields);
                                }
                              }}
                              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const fields = [...localCustomFields];
                                if (index < fields.length - 1) {
                                  [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
                                  setLocalCustomFields(fields);
                                }
                              }}
                              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </div>
                      </Accordion>
                    </div>
                    );
                  })}
                  
                  {localCustomFields.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <p>No custom fields yet.</p>
                      <p className="text-xs mt-1">Click "Add Custom Field" above to create your first field</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
              <button
                type="button"
                onClick={() => {
                  // Save the local state to the component
                  updateProp('customFields', localCustomFields);
                  setIsFormModalOpen(false);
                }}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  // Cancel without saving - reset local state and close
                  setLocalCustomFields([...(component.props?.customFields || [])]);
                  setIsFormModalOpen(false);
                }}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}

// Image Upload Component
function ImageUploadButton({ 
  onUploadSuccess, 
  currentImageUrl 
}: { 
  onUploadSuccess: (url: string) => void;
  currentImageUrl?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');

      console.log('Uploading image to:', `${apiUrl}/api/v1/customization/image`);
      
      // Helper to normalize image URL to relative path if from our backend
      const normalizeImageUrl = (url: string): string => {
        // If it's a full URL from our backend, convert to relative path
        if (url.startsWith(apiUrl + '/uploads/')) {
          return url.replace(apiUrl, '');
        }
        // If it's already a relative path starting with /uploads, use it
        if (url.startsWith('/uploads/')) {
          return url;
        }
        // If it's a full external URL, use it as-is
        if (url.startsWith('http')) {
          return url;
        }
        // Otherwise, construct full URL
        return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      };

      const response = await fetch(`${apiUrl}/api/v1/customization/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Upload failed:', errorData);
        throw new Error(errorData.detail || `Failed to upload image: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);
      
      // Handle different response formats - use full backend URL for images
      // The backend is serving images correctly, so use the full URL
      let relativePath: string;
      if (data.image_url) {
        relativePath = data.image_url;
      } else if (data.url) {
        relativePath = data.url;
      } else {
        throw new Error('Invalid response format: missing image_url or url');
      }

      // Construct full URL if it's a relative path
      const imageUrl = relativePath.startsWith('http') 
        ? relativePath 
        : `${apiUrl}${relativePath}`;

      console.log('Image URL (full URL):', imageUrl);
      
      // Call success with full backend URL - backend CORS allows this
      onUploadSuccess(imageUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      
      // Fallback: Use base64 data URL if server upload fails
      try {
        console.log('Using base64 fallback for image');
        const reader = new FileReader();
        reader.onloadend = () => {
          onUploadSuccess(reader.result as string);
          setError(null); // Clear error since we have a fallback
        };
        reader.onerror = () => {
          setError('Failed to process image file');
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        console.error('Base64 fallback also failed:', fallbackErr);
        setError(errorMessage + '. Also failed to use local fallback.');
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload-input"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>{currentImageUrl ? 'Replace Image' : 'Upload Image'}</span>
          </>
        )}
      </button>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
}

