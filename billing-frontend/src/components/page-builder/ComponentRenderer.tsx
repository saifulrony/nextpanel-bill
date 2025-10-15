'use client';

import React from 'react';
import { Component, ComponentType } from './types';
import {
  DomainSearchComponent,
  ProductsGridComponent,
  ProductSearchComponent,
  ContactFormComponent,
  NewsletterComponent,
} from './DynamicComponents';
import HeaderComponent from './HeaderComponent';
import FooterComponent from './FooterComponent';
import CartComponent from './CartComponent';

interface ComponentRendererProps {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddToContainer?: (containerId: string, type: any) => void;
  onColumnClick?: (containerId: string, columnIndex: number) => void;
  containerId?: string;
  columnIndex?: number;
}

export default function ComponentRenderer({
  component,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onAddToContainer,
  onColumnClick,
  containerId,
  columnIndex,
}: ComponentRendererProps) {
  const baseClasses = `
    relative transition-all
    ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
    ${isHovered && !isSelected ? 'ring-2 ring-indigo-300 ring-offset-2' : ''}
  `;

  const renderComponent = () => {
    switch (component.type) {
      case 'heading':
        return (
          <h2
            style={component.style}
            className={component.className}
            dangerouslySetInnerHTML={{ __html: component.content || 'Heading Text' }}
          />
        );

      case 'text':
        return (
          <p
            style={component.style}
            className={component.className}
            dangerouslySetInnerHTML={{ __html: component.content || 'Text content goes here...' }}
          />
        );

      case 'button':
        return (
          <button
            style={component.style}
            className={`px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${component.className || ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {component.content || 'Button'}
          </button>
        );

      case 'image':
        return (
          <div className="relative">
            <img
              src={component.props.src || 'https://via.placeholder.com/800x400?text=Image'}
              alt={component.props.alt || 'Image'}
              style={component.style}
              className={`w-full h-auto ${component.className || ''}`}
            />
          </div>
        );

      case 'section':
        return (
          <div
            style={component.style}
            className={`min-h-[200px] p-6 ${component.className || ''}`}
          >
            {component.children?.map((child) => (
              <ComponentRenderer
                key={child.id}
                component={child}
                isSelected={false}
                isHovered={false}
                onClick={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
              />
            ))}
          </div>
        );

      case 'container':
        const columns = component.props?.columns || 1;
        const gridCols = {
          1: 'grid-cols-1',
          2: 'grid-cols-2',
          3: 'grid-cols-3',
          4: 'grid-cols-4',
        }[columns] || 'grid-cols-1';
        
        return (
          <div
            style={component.style}
            className={`p-4 ${component.className || ''} ${isHovered ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
          >
            <div className={`grid ${gridCols} gap-4`}>
              {component.children && component.children.length > 0 ? (
                component.children.map((child, index) => (
                  <div key={child.id} className="min-h-[100px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <ComponentRenderer
                      component={child}
                      isSelected={false}
                      isHovered={false}
                      onClick={() => {}}
                      onMouseEnter={() => {}}
                      onMouseLeave={() => {}}
                      onAddToContainer={onAddToContainer}
                      onColumnClick={onColumnClick}
                      containerId={component.id}
                      columnIndex={index}
                    />
                  </div>
                ))
              ) : (
                // Empty container - show clickable placeholder columns
                Array.from({ length: columns }).map((_, index) => (
                  <div 
                    key={index} 
                    onClick={() => onColumnClick?.(component.id, index)}
                    className="min-h-[100px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-center group"
                  >
                    <div className="text-center text-gray-400 group-hover:text-indigo-600">
                      <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-xs font-medium">Click to Add Component</p>
                      <p className="text-xs mt-1 opacity-75">or drag from left panel</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div
            style={{
              height: component.props.height || '50px',
              ...component.style,
            }}
            className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${component.className || ''}`}
          >
            <span className="text-xs text-gray-400">Spacer</span>
          </div>
        );

      case 'divider':
        return (
          <hr
            style={component.style}
            className={`my-4 border-gray-300 ${component.className || ''}`}
          />
        );

      case 'card':
        return (
          <div
            style={component.style}
            className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${component.className || ''}`}
          >
            {component.content && (
              <div dangerouslySetInnerHTML={{ __html: component.content }} />
            )}
            {component.children?.map((child) => (
              <ComponentRenderer
                key={child.id}
                component={child}
                isSelected={false}
                isHovered={false}
                onClick={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
              />
            ))}
          </div>
        );

      case 'grid':
        return (
          <div
            style={component.style}
            className={`grid gap-4 ${component.className || 'grid-cols-3'}`}
          >
            {component.children?.map((child) => (
              <ComponentRenderer
                key={child.id}
                component={child}
                isSelected={false}
                isHovered={false}
                onClick={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
              />
            ))}
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={component.props.src || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'form':
        return (
          <form
            style={component.style}
            className={`bg-white p-6 rounded-lg border border-gray-200 ${component.className || ''}`}
            onSubmit={(e) => e.preventDefault()}
          >
            <h3 className="text-lg font-semibold mb-4">Contact Form</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your message"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </form>
        );

      case 'domain-search':
        return <DomainSearchComponent style={component.style} />;

      case 'products-grid':
        return <ProductsGridComponent style={component.style} />;

      case 'product-search':
        return <ProductSearchComponent style={component.style} />;

      case 'contact-form':
        return <ContactFormComponent style={component.style} />;

      case 'newsletter':
        return <NewsletterComponent style={component.style} />;

      case 'header':
        return (
          <HeaderComponent 
            style={component.style} 
            className={component.className}
            props={component.props}
          />
        );

      case 'footer':
        return (
          <FooterComponent 
            style={component.style} 
            className={component.className}
            props={component.props}
          />
        );

      case 'cart':
        return (
          <CartComponent 
            style={component.style} 
            className={component.className}
            props={component.props}
          />
        );

      default:
        return (
          <div className="p-4 bg-gray-100 border border-gray-300 rounded">
            <p className="text-sm text-gray-600">Unknown component type: {component.type}</p>
          </div>
        );
    }
  };

  return (
    <div
      className={baseClasses}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {renderComponent()}
      {isSelected && (
        <div className="absolute -top-8 left-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
          {component.type}
        </div>
      )}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 border-2 border-dashed border-indigo-300 bg-indigo-50/30 pointer-events-none" />
      )}
    </div>
  );
}

