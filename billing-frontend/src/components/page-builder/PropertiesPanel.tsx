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
        {(component.type === 'domain-search' || component.type === 'products-grid' || component.type === 'product-search' || component.type === 'contact-form' || component.type === 'newsletter') && (
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

        {/* Header Component Properties */}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <input
                type="text"
                value={component.props?.logoUrl || ''}
                onChange={(e) => updateProp('logoUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="https://example.com/logo.png"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={component.props?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateProp('backgroundColor', e.target.value)}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.props?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateProp('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.props?.textColor || '#374151'}
                  onChange={(e) => updateProp('textColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
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
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={component.props?.backgroundColor || '#111827'}
                  onChange={(e) => updateProp('backgroundColor', e.target.value)}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.props?.backgroundColor || '#111827'}
                  onChange={(e) => updateProp('backgroundColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={component.props?.textColor || '#ffffff'}
                  onChange={(e) => updateProp('textColor', e.target.value)}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.props?.textColor || '#ffffff'}
                  onChange={(e) => updateProp('textColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
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
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={component.props?.buttonColor || '#4f46e5'}
                  onChange={(e) => updateProp('buttonColor', e.target.value)}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={component.props?.buttonColor || '#4f46e5'}
                  onChange={(e) => updateProp('buttonColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Editor */}
        {(component.type === 'text' || component.type === 'heading' || component.type === 'button') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={component.content || ''}
              onChange={(e) => updateContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Enter content..."
            />
          </div>
        )}

        {/* Image URL */}
        {component.type === 'image' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
            <input
              type="text"
              value={component.props.src || ''}
              onChange={(e) => updateProp('src', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="https://example.com/image.jpg"
            />
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
      </div>
    </div>
  );
}

