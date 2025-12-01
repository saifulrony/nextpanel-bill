'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  DocumentTextIcon,
  PhotoIcon,
  CursorArrowRaysIcon,
  RectangleStackIcon,
  Bars3Icon,
  Square3Stack3DIcon,
  VideoCameraIcon,
  TableCellsIcon,
  PaintBrushIcon,
  CubeIcon,
  ArrowsPointingOutIcon,
  FilmIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  EnvelopeIcon,
  NewspaperIcon,
  Bars3BottomLeftIcon,
  ArrowDownTrayIcon,
  StarIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { ComponentType } from './types';

interface ComponentLibraryProps {
  onAddComponent: (type: ComponentType) => void;
  onEditComponent?: (type: ComponentType) => void;
  onDeleteComponent?: (type: ComponentType) => void;
}

export const components = [
  { type: 'heading' as ComponentType, label: 'Heading', icon: DocumentTextIcon, color: 'text-blue-600' },
  { type: 'text' as ComponentType, label: 'Text', icon: DocumentTextIcon, color: 'text-gray-600' },
  { type: 'button' as ComponentType, label: 'Button', icon: CursorArrowRaysIcon, color: 'text-green-600' },
  { type: 'image' as ComponentType, label: 'Image', icon: PhotoIcon, color: 'text-purple-600' },
  { type: 'section' as ComponentType, label: 'Section', icon: RectangleStackIcon, color: 'text-indigo-600' },
  { type: 'container' as ComponentType, label: 'Container', icon: Square3Stack3DIcon, color: 'text-orange-600' },
  { type: 'spacer' as ComponentType, label: 'Spacer', icon: ArrowsPointingOutIcon, color: 'text-gray-500' },
  { type: 'divider' as ComponentType, label: 'Divider', icon: Bars3Icon, color: 'text-gray-400' },
  { type: 'card' as ComponentType, label: 'Card', icon: CubeIcon, color: 'text-cyan-600' },
  { type: 'grid' as ComponentType, label: 'Grid', icon: TableCellsIcon, color: 'text-pink-600' },
  { type: 'video' as ComponentType, label: 'Video', icon: VideoCameraIcon, color: 'text-red-600' },
  { type: 'form' as ComponentType, label: 'Form', icon: FilmIcon, color: 'text-yellow-600' },
  { type: 'header' as ComponentType, label: 'Header', icon: Bars3BottomLeftIcon, color: 'text-slate-600' },
  { type: 'footer' as ComponentType, label: 'Footer', icon: ArrowDownTrayIcon, color: 'text-slate-500' },
  { type: 'cart' as ComponentType, label: 'Cart', icon: ShoppingCartIcon, color: 'text-orange-500' },
  { type: 'domain-search' as ComponentType, label: 'Domain Search', icon: MagnifyingGlassIcon, color: 'text-teal-600' },
  { type: 'products-grid' as ComponentType, label: 'Products Grid', icon: ShoppingCartIcon, color: 'text-emerald-600' },
  { type: 'featured-products' as ComponentType, label: 'Featured Products', icon: StarIcon, color: 'text-yellow-600' },
  { type: 'product-search' as ComponentType, label: 'Product Search', icon: MagnifyingGlassIcon, color: 'text-blue-600' },
  { type: 'contact-form' as ComponentType, label: 'Contact Form', icon: EnvelopeIcon, color: 'text-indigo-600' },
  { type: 'newsletter' as ComponentType, label: 'Newsletter', icon: NewspaperIcon, color: 'text-purple-600' },
  { type: 'slider' as ComponentType, label: 'Slider', icon: FilmIcon, color: 'text-rose-600' },
  { type: 'banner' as ComponentType, label: 'Banner', icon: RectangleStackIcon, color: 'text-indigo-500' },
  { type: 'nav-menu' as ComponentType, label: 'Nav Menu', icon: Bars3Icon, color: 'text-blue-500' },
  { type: 'pricing-table' as ComponentType, label: 'Pricing Table', icon: CurrencyDollarIcon, color: 'text-green-600' },
  { type: 'testimonials' as ComponentType, label: 'Testimonials', icon: ChatBubbleLeftRightIcon, color: 'text-purple-600' },
  { type: 'faq' as ComponentType, label: 'FAQ', icon: QuestionMarkCircleIcon, color: 'text-orange-600' },
];

// Draggable Component Item
function DraggableComponentItem({
  component,
  onAddComponent,
  onEditComponent,
  onDeleteComponent,
}: {
  component: typeof components[0];
  onAddComponent: (type: ComponentType) => void;
  onEditComponent?: (type: ComponentType) => void;
  onDeleteComponent?: (type: ComponentType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${component.type}`,
    data: {
      type: 'library-component',
      componentType: component.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const Icon = component.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Control Bar - Top Middle */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-1 bg-gray-800 dark:bg-gray-700 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
        <div
          className="p-1 text-white rounded"
          title="Drag to add to canvas"
        >
          <Bars3Icon className="h-4 w-4" />
        </div>
        {onEditComponent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEditComponent(component.type);
            }}
            className="p-1 text-white hover:bg-gray-700 rounded"
            title="Edit component"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
        {onDeleteComponent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (confirm(`Are you sure you want to delete "${component.label}"?`)) {
                onDeleteComponent(component.type);
              }
            }}
            className="p-1 text-red-400 hover:bg-red-600 rounded"
            title="Delete component"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Component Button - Draggable Only */}
      <div
        {...listeners}
        {...attributes}
        className="w-full flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-grab active:cursor-grabbing min-h-[80px] relative select-none"
        title={`Drag ${component.label} to canvas`}
      >
        <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-indigo-100 transition-colors mb-2`}>
          <Icon className={`h-5 w-5 ${component.color}`} />
        </div>
        <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-700 text-center line-clamp-2">
          {component.label}
        </span>
        <svg className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
}

export default function ComponentLibrary({ 
  onAddComponent, 
  onEditComponent, 
  onDeleteComponent 
}: ComponentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate number of columns based on container width
  const columns = useMemo(() => {
    if (containerWidth === 0) return 2; // Default to 2 columns
    
    // Minimum 2 columns, maximum 4 columns
    // Adjust based on actual container width
    if (containerWidth < 200) return 2;      // Very narrow: 2 columns
    if (containerWidth < 280) return 2;      // Narrow: 2 columns (minimum)
    if (containerWidth < 360) return 3;      // Medium: 3 columns
    return 4;                                 // Wide: 4 columns (maximum)
  }, [containerWidth]);

  // Observe container width changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) {
      return components;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return components.filter((component) =>
      component.label.toLowerCase().includes(query) ||
      component.type.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div 
      ref={containerRef}
      className="w-full bg-white border-r border-gray-200 h-full overflow-y-auto flex flex-col"
    >
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0">
        <h2 className="text-white font-bold text-sm">Components</h2>
        <p className="text-indigo-100 text-xs mt-1">Drag to canvas to add</p>
      </div>
      
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredComponents.length} {filteredComponents.length === 1 ? 'component' : 'components'} found
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          {filteredComponents.length > 0 ? (
            <div 
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {filteredComponents.map((component) => {
            return (
              <DraggableComponentItem
                key={component.type}
                component={component}
                onAddComponent={onAddComponent}
                onEditComponent={onEditComponent}
                onDeleteComponent={onDeleteComponent}
              />
          );
        })}
      </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm font-medium text-gray-900">No components found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try searching for "{searchQuery}"
              </p>
              <button
                onClick={clearSearch}
                className="mt-4 text-xs text-indigo-600 hover:text-indigo-700"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

