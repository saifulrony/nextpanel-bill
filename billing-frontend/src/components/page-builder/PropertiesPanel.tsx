'use client';

import React from 'react';
import { Component } from './types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PropertiesPanelProps {
  component: Component | null;
  onUpdate: (component: Component) => void;
  onClose: () => void;
}

export default function PropertiesPanel({ component, onUpdate, onClose }: PropertiesPanelProps) {
  if (!component) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 h-full flex items-center justify-center">
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
    onUpdate({
      ...component,
      style: {
        ...component.style,
        [key]: value,
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
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Dynamic Components Info */}
        {(component.type === 'domain-search' || component.type === 'products-grid' || component.type === 'featured-products' || component.type === 'product-search' || component.type === 'contact-form' || component.type === 'newsletter') && (
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
                  <p className="text-xs text-blue-600">API: /api/v1/domains/check</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Color</label>
              <input
                type="color"
                value={component.props?.logoColor || '#4f46e5'}
                onChange={(e) => updateProp('logoColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
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
            <div className="flex items-center space-x-4">
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
            </div>
            <div className="flex items-center space-x-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                <input
                  type="color"
                  value={component.props?.textColor || '#374151'}
                  onChange={(e) => updateProp('textColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Footer Component Properties */}
        {component.type === 'footer' && (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <input
                  type="color"
                  value={component.props?.backgroundColor || '#111827'}
                  onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
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
          </div>
        )}

        {/* Cart Component Properties */}
        {component.type === 'cart' && (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Color</label>
                <input
                  type="color"
                  value={component.props?.buttonColor || '#4f46e5'}
                  onChange={(e) => updateProp('buttonColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Code Block Component Properties */}
        {component.type === 'code-block' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={component.props?.language || 'HTML'}
                onChange={(e) => updateProp('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="HTML">HTML</option>
                <option value="CSS">CSS</option>
                <option value="JavaScript">JavaScript</option>
                <option value="JSON">JSON</option>
                <option value="Python">Python</option>
                <option value="PHP">PHP</option>
                <option value="SQL">SQL</option>
                <option value="XML">XML</option>
                <option value="Markdown">Markdown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code Content</label>
              <textarea
                value={component.content || ''}
                onChange={(e) => updateContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                rows={8}
                placeholder="Enter your code here..."
                spellCheck={false}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your {component.props?.language || 'HTML'} code above. This will be displayed in a syntax-highlighted code block.
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Button Component Properties */}
        {component.type === 'button' && (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={component.props?.backgroundColor || '#4f46e5'}
                onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Color</label>
              <input
                type="color"
                value={component.props?.borderColor || '#4f46e5'}
                onChange={(e) => updateProp('borderColor', e.target.value)}
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
                value={component.props?.padding || '0.75rem 1.5rem'}
                onChange={(e) => updateProp('padding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0.75rem 1.5rem"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
              <select
                value={component.props?.fontWeight || '500'}
                onChange={(e) => updateProp('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="300">Light</option>
                <option value="400">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hover Background Color</label>
              <input
                type="color"
                value={component.props?.hoverBackgroundColor || '#3730a3'}
                onChange={(e) => updateProp('hoverBackgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hover Text Color</label>
              <input
                type="color"
                value={component.props?.hoverTextColor || '#ffffff'}
                onChange={(e) => updateProp('hoverTextColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
        {component.type === 'heading' && (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="color"
                value={component.props?.color || '#111827'}
                onChange={(e) => updateProp('color', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <input
                type="text"
                value={component.props?.fontSize || '2.25rem'}
                onChange={(e) => updateProp('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="2.25rem"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
              <select
                value={component.props?.fontWeight || '700'}
                onChange={(e) => updateProp('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="300">Light</option>
                <option value="400">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
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
                <option value="Playfair Display">Playfair Display</option>
                <option value="Merriweather">Merriweather</option>
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
                value={component.props?.lineHeight || '1.2'}
                onChange={(e) => updateProp('lineHeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="1.2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Letter Spacing</label>
              <input
                type="text"
                value={component.props?.letterSpacing || '-0.025em'}
                onChange={(e) => updateProp('letterSpacing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="-0.025em"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
              <input
                type="text"
                value={component.props?.margin || '0'}
                onChange={(e) => updateProp('margin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
              <input
                type="text"
                value={component.props?.padding || '0'}
                onChange={(e) => updateProp('padding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Enhanced Text Component Properties */}
        {component.type === 'text' && (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <input
                type="color"
                value={component.props?.color || '#374151'}
                onChange={(e) => updateProp('color', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Weight</label>
              <select
                value={component.props?.fontWeight || '400'}
                onChange={(e) => updateProp('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="300">Light</option>
                <option value="400">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
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
                value={component.props?.lineHeight || '1.5'}
                onChange={(e) => updateProp('lineHeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="1.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Letter Spacing</label>
              <input
                type="text"
                value={component.props?.letterSpacing || '0'}
                onChange={(e) => updateProp('letterSpacing', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
              <input
                type="text"
                value={component.props?.margin || '0'}
                onChange={(e) => updateProp('margin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
              <input
                type="text"
                value={component.props?.padding || '0'}
                onChange={(e) => updateProp('padding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Width</label>
              <input
                type="text"
                value={component.props?.maxWidth || 'none'}
                onChange={(e) => updateProp('maxWidth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">White Space</label>
              <select
                value={component.props?.whiteSpace || 'normal'}
                onChange={(e) => updateProp('whiteSpace', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="normal">Normal</option>
                <option value="nowrap">No Wrap</option>
                <option value="pre">Pre</option>
                <option value="pre-line">Pre Line</option>
                <option value="pre-wrap">Pre Wrap</option>
              </select>
            </div>
          </div>
        )}

        {/* Enhanced Image Component Properties */}
        {component.type === 'image' && (
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input
                type="url"
                value={component.props?.src || ''}
              onChange={(e) => updateProp('src', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="https://example.com/image.jpg"
            />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
              <input
                type="text"
                value={component.props?.width || 'auto'}
                onChange={(e) => updateProp('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
              <input
                type="text"
                value={component.props?.height || 'auto'}
                onChange={(e) => updateProp('height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Width</label>
              <input
                type="text"
                value={component.props?.maxWidth || '100%'}
                onChange={(e) => updateProp('maxWidth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="100%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Object Fit</label>
              <select
                value={component.props?.objectFit || 'cover'}
                onChange={(e) => updateProp('objectFit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="scale-down">Scale Down</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
              <input
                type="text"
                value={component.props?.borderRadius || '0'}
                onChange={(e) => updateProp('borderRadius', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shadow</label>
              <select
                value={component.props?.shadow || 'none'}
                onChange={(e) => updateProp('shadow', e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Border</label>
              <select
                value={component.props?.border || 'none'}
                onChange={(e) => updateProp('border', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="none">None</option>
                <option value="1px solid">1px Solid</option>
                <option value="2px solid">2px Solid</option>
                <option value="1px dashed">1px Dashed</option>
                <option value="1px dotted">1px Dotted</option>
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Border Width</label>
              <input
                type="text"
                value={component.props?.borderWidth || '0'}
                onChange={(e) => updateProp('borderWidth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
              <input
                type="text"
                value={component.props?.margin || '0'}
                onChange={(e) => updateProp('margin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
              <input
                type="text"
                value={component.props?.padding || '0'}
                onChange={(e) => updateProp('padding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={component.props?.backgroundColor || 'transparent'}
                onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption Color</label>
              <input
                type="color"
                value={component.props?.captionColor || '#6b7280'}
                onChange={(e) => updateProp('captionColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption Font Size</label>
              <input
                type="text"
                value={component.props?.captionFontSize || '0.875rem'}
                onChange={(e) => updateProp('captionFontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="0.875rem"
              />
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
        {component.type === 'video' && (
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

        {/* Spacer Height */}
        {component.type === 'spacer' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height: {component.props.height || '50px'}
            </label>
            <input
              type="range"
              min="20"
              max="200"
              value={parseInt(component.props.height || '50')}
              onChange={(e) => updateProp('height', `${e.target.value}px`)}
              className="w-full"
            />
          </div>
        )}

        {/* Container Columns */}
        {component.type === 'container' && (
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

        {/* Spacing */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Spacing</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Padding</label>
              <input
                type="text"
                value={component.style?.padding || ''}
                onChange={(e) => updateStyle('padding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="16px"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Margin</label>
              <input
                type="text"
                value={component.style?.margin || ''}
                onChange={(e) => updateStyle('margin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="16px"
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Colors</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Background Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={component.style?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.style?.backgroundColor || ''}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Text Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={component.style?.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.style?.color || ''}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        </div>

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

        {/* Border */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Border</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Border Width</label>
              <input
                type="text"
                value={component.style?.borderWidth || ''}
                onChange={(e) => updateStyle('borderWidth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="1px"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Border Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={component.style?.borderColor || '#000000'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.style?.borderColor || ''}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Border Radius</label>
              <input
                type="text"
                value={component.style?.borderRadius || ''}
                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="8px"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Size</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="text"
                value={component.style?.width || ''}
                onChange={(e) => updateStyle('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="100%"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="text"
                value={component.style?.height || ''}
                onChange={(e) => updateStyle('height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="auto"
              />
            </div>
          </div>
        </div>

        {/* Custom CSS */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom CSS Class</h4>
          <input
            type="text"
            value={component.className || ''}
            onChange={(e) => onUpdate({ ...component, className: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            placeholder="custom-class"
          />
        </div>

        {/* Code Editor */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Code Editor</h4>
          <div className="space-y-4">
            {/* HTML Editor */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">HTML</label>
              <textarea
                value={component.props?.htmlCode || ''}
                onChange={(e) => updateProp('htmlCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                rows={4}
                placeholder="<div>Custom HTML code</div>"
                spellCheck={false}
              />
            </div>
            
            {/* CSS Editor */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">CSS</label>
              <textarea
                value={component.props?.cssCode || ''}
                onChange={(e) => updateProp('cssCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                rows={4}
                placeholder=".custom-style { color: red; }"
                spellCheck={false}
              />
            </div>
            
            {/* JavaScript Editor */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">JavaScript</label>
              <textarea
                value={component.props?.jsCode || ''}
                onChange={(e) => updateProp('jsCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                rows={4}
                placeholder="console.log('Custom JavaScript');"
                spellCheck={false}
              />
            </div>
          </div>
        {/* Sidebar Component Properties */}
        {component.type === 'sidebar' && (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
              <input
                type="text"
                value={component.props?.width || ''}
                onChange={(e) => updateProp('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="300px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={component.props?.backgroundColor || '#f8fafc'}
                onChange={(e) => updateProp('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
        {component.type === 'shortcode' && (
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
        {component.type === 'alert' && (
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
        {component.type === 'social-icons' && (
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
        {component.type === 'domain-search' && (
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
        {component.type === 'products-grid' && (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Products</label>
              <input
                type="number"
                min="1"
                max="20"
                value={component.props?.productCount || 6}
                onChange={(e) => updateProp('productCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="6"
              />
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
                checked={component.props?.showPrices || false}
                onChange={(e) => updateProp('showPrices', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Prices</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showFeatures || false}
                onChange={(e) => updateProp('showFeatures', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Features</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showButtons || false}
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
        )}

        {/* Featured Products Component Properties */}
        {component.type === 'featured-products' && (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Products</label>
              <input
                type="number"
                min="1"
                max="10"
                value={component.props?.productCount || 3}
                onChange={(e) => updateProp('productCount', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="3"
              />
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
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={component.props?.showButtons !== false}
                onChange={(e) => updateProp('showButtons', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Show Add to Cart Buttons</label>
            </div>
          </div>
        )}

        {/* Showcase Component Properties */}
        {component.type === 'showcase' && (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
              <select
                value={component.props?.layout || 'grid'}
                onChange={(e) => updateProp('layout', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="carousel">Carousel</option>
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
        </div>
      </div>
    </div>
  );
}

