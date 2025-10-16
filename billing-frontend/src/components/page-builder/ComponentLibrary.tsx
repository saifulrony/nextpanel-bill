'use client';

import React from 'react';
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
} from '@heroicons/react/24/outline';
import { ComponentType } from './types';

interface ComponentLibraryProps {
  onAddComponent: (type: ComponentType) => void;
}

const components = [
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
  { type: 'product-search' as ComponentType, label: 'Product Search', icon: MagnifyingGlassIcon, color: 'text-blue-600' },
  { type: 'contact-form' as ComponentType, label: 'Contact Form', icon: EnvelopeIcon, color: 'text-indigo-600' },
  { type: 'newsletter' as ComponentType, label: 'Newsletter', icon: NewspaperIcon, color: 'text-purple-600' },
];

export default function ComponentLibrary({ onAddComponent }: ComponentLibraryProps) {
  return (
    <div className="w-full bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <h2 className="text-white font-bold text-sm">Components</h2>
        <p className="text-indigo-100 text-xs mt-1">Drag to add</p>
      </div>
      
      <div className="p-3 space-y-2">
        {components.map((component) => {
          const Icon = component.icon;
          return (
            <button
              key={component.type}
              onClick={() => onAddComponent(component.type)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group cursor-grab active:cursor-grabbing"
            >
              <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-indigo-100 transition-colors flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${component.color}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 flex-1 text-left">
                {component.label}
              </span>
              <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">💡 Tips:</p>
          <p>• Click or drag to add</p>
          <p>• Click component to edit</p>
          <p>• Drag handle to reorder</p>
          <p>• Hover to see drag icon</p>
        </div>
      </div>
    </div>
  );
}

