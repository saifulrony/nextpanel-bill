'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ComponentLibrary from './ComponentLibrary';
import ComponentRenderer from './ComponentRenderer';
import PropertiesPanel from './PropertiesPanel';
import { DropZone } from './DropZone';
import { ContextMenu } from './ContextMenu';
import { Component, ComponentType } from './types';
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
  CodeBracketIcon,
  StarIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import {
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  PlusIcon,
  RocketLaunchIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Local components array for the modal
const availableComponents = [
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
  { type: 'code-block' as ComponentType, label: 'Code Block', icon: CodeBracketIcon, color: 'text-gray-700' },
  { type: 'sidebar' as ComponentType, label: 'Sidebar', icon: Bars3Icon, color: 'text-amber-600' },
  { type: 'shortcode' as ComponentType, label: 'Shortcode', icon: CommandLineIcon, color: 'text-violet-600' },
  { type: 'alert' as ComponentType, label: 'Alert', icon: ExclamationTriangleIcon, color: 'text-red-500' },
  { type: 'social-icons' as ComponentType, label: 'Social Icons', icon: ShareIcon, color: 'text-blue-500' },
  { type: 'showcase' as ComponentType, label: 'Showcase', icon: StarIcon, color: 'text-yellow-500' },
];

interface PageBuilderWithISRProps {
  initialComponents?: Component[];
  pageId?: string;
  pageTitle?: string;
  pageDescription?: string;
  onSave?: (components: Component[]) => void;
  onClose?: () => void;
}

function SortableComponent({
  component,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onAddToContainer,
  onColumnClick,
  onAddColumn,
  onRemoveColumn,
  onAddAfter,
  onContextMenu,
  onUpdate,
}: {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddToContainer: (type: ComponentType, containerId?: string, columnIndex?: number) => void;
  onColumnClick: (containerId: string, columnIndex: number) => void;
  onAddColumn: (containerId: string) => void;
  onRemoveColumn: (containerId: string) => void;
  onAddAfter: (componentId: string, type: ComponentType) => void;
  onContextMenu?: (e: React.MouseEvent, componentId: string) => void;
  onUpdate?: (component: Component) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: component.id,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `component-${component.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();
      resizeStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      };
    }
  };

  useEffect(() => {
    if (!isResizing || !resizeHandle || !onUpdate) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;

      let newWidth = resizeStartPos.current.width;
      let newHeight = resizeStartPos.current.height;

      if (resizeHandle.includes('right')) {
        newWidth = Math.max(100, resizeStartPos.current.width + deltaX);
      }
      if (resizeHandle.includes('left')) {
        newWidth = Math.max(100, resizeStartPos.current.width - deltaX);
      }
      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(50, resizeStartPos.current.height + deltaY);
      }
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(50, resizeStartPos.current.height - deltaY);
      }

      onUpdate({
        ...component,
        style: {
          ...component.style,
          width: `${newWidth}px`,
          height: `${newHeight}px`,
        },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizeHandle, component, onUpdate]);

  return (
    <div ref={setDroppableRef} className={isOver ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}>
      <div ref={setNodeRef} style={style}>
        <div 
          ref={componentRef}
          className="relative group"
          style={{
            ...component.style,
            border: isSelected || isHovered ? '2px solid #6366f1' : '2px solid transparent',
            position: 'relative',
          }}
        >
        {/* Drag Handle */}
        <div 
          {...listeners}
          {...attributes}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
        
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e, component.id);
            }
          }}
          className={`transition-all cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        >
          <ComponentRenderer
            component={component}
            isSelected={isSelected}
            isHovered={isHovered}
            onClick={() => {}} // Empty handler, click is handled by parent div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onAddToContainer={onAddToContainer}
            onColumnClick={onColumnClick}
            onAddColumn={onAddColumn}
            onRemoveColumn={onRemoveColumn}
            onAddAfter={onAddAfter}
          />
        </div>

        {/* Resize Handles - Always visible when selected or hovered */}
        {(isSelected || isHovered) && onUpdate && (
          <>
            {/* Corner Handles */}
            <div
              className={`absolute -top-3 -left-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'top-left' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'top-left');
              }}
              title="Resize from top-left"
            />
            <div
              className={`absolute -top-3 -right-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'top-right' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'top-right');
              }}
              title="Resize from top-right"
            />
            <div
              className={`absolute -bottom-3 -left-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'bottom-left' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'bottom-left');
              }}
              title="Resize from bottom-left"
            />
            <div
              className={`absolute -bottom-3 -right-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'bottom-right' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'bottom-right');
              }}
              title="Resize from bottom-right"
            />
            
            {/* Edge Handles */}
            <div
              className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-indigo-500 border-2 border-white rounded-full cursor-ns-resize transition-all z-50 hover:bg-indigo-600 hover:scale-y-150 shadow-xl ${
                isResizing && resizeHandle === 'top' ? 'bg-indigo-700 scale-y-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'top');
              }}
              title="Resize height from top"
            />
            <div
              className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-indigo-500 border-2 border-white rounded-full cursor-ns-resize transition-all z-50 hover:bg-indigo-600 hover:scale-y-150 shadow-xl ${
                isResizing && resizeHandle === 'bottom' ? 'bg-indigo-700 scale-y-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'bottom');
              }}
              title="Resize height from bottom"
            />
            <div
              className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-5 h-16 bg-indigo-500 border-2 border-white rounded-full cursor-ew-resize transition-all z-50 hover:bg-indigo-600 hover:scale-x-150 shadow-xl ${
                isResizing && resizeHandle === 'left' ? 'bg-indigo-700 scale-x-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'left');
              }}
              title="Resize width from left"
            />
            <div
              className={`absolute -right-3 top-1/2 transform -translate-y-1/2 w-5 h-16 bg-indigo-500 border-2 border-white rounded-full cursor-ew-resize transition-all z-50 hover:bg-indigo-600 hover:scale-x-150 shadow-xl ${
                isResizing && resizeHandle === 'right' ? 'bg-indigo-700 scale-x-150 ring-2 ring-indigo-300' : ''
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeMouseDown(e, 'right');
              }}
              title="Resize width from right"
            />
          </>
        )}
        </div>
      </div>
    </div>
  );
}

export function PageBuilderWithISR({
  initialComponents = [],
  pageId,
  pageTitle = 'Untitled Page',
  pageDescription = '',
  onSave,
  onClose,
}: PageBuilderWithISRProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<Component[][]>([initialComponents]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [title, setTitle] = useState(pageTitle);
  const [description, setDescription] = useState(pageDescription);
  const [currentPageId, setCurrentPageId] = useState(pageId || '');
  const [setAsHomepage, setSetAsHomepage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [availablePages, setAvailablePages] = useState<Array<{id: string, title: string}>>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComponentSelector, setShowComponentSelector] = useState(false);
  const [targetContainer, setTargetContainer] = useState<{id: string, columnIndex: number} | null>(null);
  const [pageType, setPageType] = useState<string>('custom');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [pageCode, setPageCode] = useState({ html: '', css: '', js: '' });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    componentId: string;
  } | null>(null);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('pageBuilderLeftSidebarWidth') || '280');
    }
    return 280;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('pageBuilderRightSidebarWidth') || '320');
    }
    return 320;
  });
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(localStorage.getItem('pageBuilderCanvasZoom') || '0.6');
    }
    return 0.6;
  });
  const [autoZoom, setAutoZoom] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pageBuilderAutoZoom') !== 'false';
    }
    return true;
  });
  const [canvasRef, setCanvasRef] = useState<HTMLDivElement | null>(null);
  const [showAfterComponentPicker, setShowAfterComponentPicker] = useState(false);
  const [afterComponentId, setAfterComponentId] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('pageBuilderCustomWidth') || '1200');
    }
    return 1200;
  });
  const [customHeight, setCustomHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('pageBuilderCustomHeight') || '800');
    }
    return 800;
  });
  const [useCustomDimensions, setUseCustomDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pageBuilderUseCustomDimensions') === 'true';
    }
    return false;
  });

  // Default templates for each page type
  const getDefaultComponents = (pageId: string): Component[] => {
    const templates: Record<string, Component[]> = {
      home: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Find Your Perfect Domain</h1>',
          props: {},
          style: { textAlign: 'center', fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p>Search for the perfect domain name for your business</p>',
          props: {},
          style: { textAlign: 'center', fontSize: '18px', color: '#666', marginBottom: '32px' }
        },
        {
          id: 'domain-search-1',
          type: 'domain-search',
          props: {},
          style: { marginBottom: '48px' }
        },
        {
          id: 'heading-2',
          type: 'heading',
          content: '<h2>Featured Hosting Plans</h2>',
          props: {},
          style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold', marginBottom: '24px' }
        },
        {
          id: 'text-2',
          type: 'text',
          content: '<p>Choose the perfect plan for your needs</p>',
          props: {},
          style: { textAlign: 'center', fontSize: '16px', color: '#666', marginBottom: '32px' }
        },
        {
          id: 'products-grid-1',
          type: 'products-grid',
          props: {},
          style: { marginBottom: '48px' }
        },
        {
          id: 'heading-3',
          type: 'heading',
          content: '<h2>Why Choose Us?</h2>',
          props: {},
          style: { textAlign: 'center', fontSize: '36px', fontWeight: 'bold', marginBottom: '32px' }
        },
        {
          id: 'container-1',
          type: 'container',
          props: { columns: 3 },
          children: [
            {
              id: 'text-3',
              type: 'text',
              content: '<h3>99.9% Uptime</h3><p>Reliable hosting with guaranteed uptime</p>',
              props: {},
              style: { textAlign: 'center' }
            },
            {
              id: 'text-4',
              type: 'text',
              content: '<h3>24/7 Support</h3><p>Expert support whenever you need it</p>',
              props: {},
              style: { textAlign: 'center' }
            },
            {
              id: 'text-5',
              type: 'text',
              content: '<h3>Easy Setup</h3><p>Get started in minutes, not hours</p>',
              props: {},
              style: { textAlign: 'center' }
            }
          ],
          style: { marginBottom: '48px' }
        },
        {
          id: 'newsletter-1',
          type: 'newsletter',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      cart: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Shopping Cart</h1>',
          props: {},
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p>Review your items and proceed to checkout.</p>',
          props: {},
          style: { color: '#666', marginBottom: '32px' }
        },
        {
          id: 'cart-1',
          type: 'cart',
          props: {
            showHeader: true,
            showCheckoutButton: true,
            showEmptyState: true,
            showItemCount: true,
            showTotal: true,
            headerText: 'Shopping Cart',
            emptyStateText: 'Your cart is empty',
            checkoutButtonText: 'Proceed to Checkout',
            buttonColor: '#4f46e5'
          },
          style: { marginBottom: '32px' }
        },
        {
          id: 'products-grid-1',
          type: 'products-grid',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      checkout: [
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Checkout</h1>',
          props: {},
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'container-1',
          type: 'container',
          props: { columns: 2 },
          children: [
            {
              id: 'text-1',
              type: 'text',
              content: '<h3>Order Summary</h3><p>Review your order details here.</p>',
              props: {},
              style: {}
            },
            {
              id: 'text-2',
              type: 'text',
              content: '<h3>Payment Information</h3><p>Enter your payment details.</p>',
              props: {},
              style: {}
            }
          ],
          style: { marginBottom: '32px' }
        },
        {
          id: 'button-1',
          type: 'button',
          content: 'Complete Order',
          props: {},
          style: { padding: '16px 32px', fontSize: '18px' }
        }
      ],
      'order-confirmation': [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Order Confirmed!</h1>',
          props: {},
          style: { textAlign: 'center', fontSize: '48px', color: '#10b981', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p style="text-align: center; font-size: 18px;">Thank you for your order. Your order has been successfully placed.</p>',
          props: {},
          style: { textAlign: 'center', marginBottom: '32px' }
        },
        {
          id: 'text-2',
          type: 'text',
          content: '<p style="text-align: center;">Order ID: <strong>#12345</strong></p><p style="text-align: center;">You will receive a confirmation email shortly.</p>',
          props: {},
          style: { textAlign: 'center', marginBottom: '32px' }
        },
        {
          id: 'button-1',
          type: 'button',
          content: 'Continue Shopping',
          props: {},
          style: { display: 'block', margin: '0 auto', padding: '16px 32px', fontSize: '18px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      shop: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Our Products</h1>',
          props: {},
          style: { textAlign: 'center', fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p>Discover our range of hosting and domain services</p>',
          props: {},
          style: { textAlign: 'center', fontSize: '18px', color: '#666', marginBottom: '32px' }
        },
        {
          id: 'products-grid-1',
          type: 'products-grid',
          props: {},
          style: { marginBottom: '48px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      'about-us': [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>About Us</h1>',
          props: {},
          style: { textAlign: 'center', fontSize: '48px', fontWeight: 'bold', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p style="text-align: center; font-size: 18px; color: #666; max-width: 800px; margin: 0 auto;">We are a leading provider of hosting and domain services, committed to helping businesses establish their online presence with reliable, secure, and scalable solutions.</p>',
          props: {},
          style: { textAlign: 'center', marginBottom: '48px' }
        },
        {
          id: 'container-1',
          type: 'container',
          props: { columns: 3 },
          children: [
            {
              id: 'text-2',
              type: 'text',
              content: '<h3 style="text-align: center; margin-bottom: 16px;">Our Mission</h3><p style="text-align: center;">To provide reliable hosting solutions that help businesses grow online.</p>',
              props: {},
              style: { textAlign: 'center' }
            },
            {
              id: 'text-3',
              type: 'text',
              content: '<h3 style="text-align: center; margin-bottom: 16px;">Our Vision</h3><p style="text-align: center;">To be the most trusted hosting provider in the industry.</p>',
              props: {},
              style: { textAlign: 'center' }
            },
            {
              id: 'text-4',
              type: 'text',
              content: '<h3 style="text-align: center; margin-bottom: 16px;">Our Values</h3><p style="text-align: center;">Reliability, security, and customer satisfaction are our core values.</p>',
              props: {},
              style: { textAlign: 'center' }
            }
          ],
          style: { marginBottom: '48px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      contact: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Contact Us</h1>',
          props: {},
          style: { textAlign: 'center', fontSize: '48px', fontWeight: 'bold', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p style="text-align: center; font-size: 18px; color: #666;">Get in touch with our team for any questions or support needs.</p>',
          props: {},
          style: { textAlign: 'center', marginBottom: '48px' }
        },
        {
          id: 'container-1',
          type: 'container',
          props: { columns: 2 },
          children: [
            {
              id: 'text-2',
              type: 'text',
              content: '<h3>Contact Information</h3><p><strong>Email:</strong> support@nextpanel.com</p><p><strong>Phone:</strong> +1 (555) 123-4567</p><p><strong>Address:</strong> 123 Business St, City, State 12345</p>',
              props: {},
              style: {}
            },
            {
              id: 'text-3',
              type: 'text',
              content: '<h3>Business Hours</h3><p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM</p><p><strong>Saturday:</strong> 10:00 AM - 4:00 PM</p><p><strong>Sunday:</strong> Closed</p>',
              props: {},
              style: {}
            }
          ],
          style: { marginBottom: '48px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      privacy: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Privacy Policy</h1>',
          props: {},
          style: { fontSize: '48px', fontWeight: 'bold', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;"><strong>Last updated:</strong> January 1, 2024</p>',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'text-2',
          type: 'text',
          content: '<h2 style="font-size: 24px; margin-bottom: 16px;">Information We Collect</h2><p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'text-3',
          type: 'text',
          content: '<h2 style="font-size: 24px; margin-bottom: 16px;">How We Use Your Information</h2><p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      terms: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: '<h1>Terms of Service</h1>',
          props: {},
          style: { fontSize: '48px', fontWeight: 'bold', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: '<p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;"><strong>Last updated:</strong> January 1, 2024</p>',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'text-2',
          type: 'text',
          content: '<h2 style="font-size: 24px; margin-bottom: 16px;">Acceptance of Terms</h2><p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.</p>',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'text-3',
          type: 'text',
          content: '<h2 style="font-size: 24px; margin-bottom: 16px;">Service Description</h2><p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">We provide hosting and domain services. The specific services you receive depend on the plan you choose.</p>',
          props: {},
          style: { marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ]
    };
    
    return templates[pageId] || [];
  };

  // Predefined pages
  const predefinedPages = [
    { id: 'home', title: 'Home Page', description: 'Main landing page with hero, products, and features' },
    { id: 'cart', title: 'Cart Page', description: 'Shopping cart with items and checkout button' },
    { id: 'shop', title: 'Shop Page', description: 'Product catalog and browsing page' },
    { id: 'checkout', title: 'Checkout Page', description: 'Order checkout and payment page' },
    { id: 'order-confirmation', title: 'Order Confirmation', description: 'Order success confirmation page' },
    { id: 'about-us', title: 'About Us Page', description: 'Company information and mission' },
    { id: 'contact', title: 'Contact Page', description: 'Contact information and business hours' },
    { id: 'privacy', title: 'Privacy Policy', description: 'Privacy policy and data protection' },
    { id: 'terms', title: 'Terms of Service', description: 'Terms and conditions page' },
  ];

  const filteredPages = predefinedPages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToHistory = useCallback((newComponents: Component[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newComponents);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setComponents(history[newIndex]);
      setSelectedComponent(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setComponents(history[newIndex]);
      setSelectedComponent(null);
    }
  };

  const createComponent = (type: ComponentType): Component => {
    const id = `${type}-${Date.now()}`;
    const baseComponent: Component = {
      id,
      type,
      props: {},
      style: {},
    };

    switch (type) {
      case 'heading':
        return { 
          ...baseComponent, 
          content: '<h1>Heading Text</h1>',
          props: {
            level: 'h1',
            text: 'Heading Text',
            color: '#111827',
            fontSize: '2.25rem',
            fontWeight: '700',
            fontFamily: 'Inter',
            textAlign: 'left',
            lineHeight: '1.2',
            letterSpacing: '-0.025em',
            margin: '0',
            padding: '0',
            textDecoration: 'none',
            textTransform: 'none'
          }
        };
      case 'text':
        return { 
          ...baseComponent, 
          content: '<p>Text content goes here...</p>',
          props: {
            text: 'Text content goes here...',
            color: '#374151',
            fontSize: '1rem',
            fontWeight: '400',
            fontFamily: 'Inter',
            textAlign: 'left',
            lineHeight: '1.5',
            letterSpacing: '0',
            margin: '0',
            padding: '0',
            textDecoration: 'none',
            textTransform: 'none',
            maxWidth: 'none',
            whiteSpace: 'normal'
          }
        };
      case 'button':
        return { 
          ...baseComponent, 
          content: 'Click Me',
          props: {
            variant: 'primary',
            size: 'medium',
            backgroundColor: '#4f46e5',
            textColor: '#ffffff',
            borderColor: '#4f46e5',
            borderRadius: '0.375rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            hoverBackgroundColor: '#3730a3',
            hoverTextColor: '#ffffff',
            disabledBackgroundColor: '#9ca3af',
            disabledTextColor: '#ffffff',
            icon: '',
            iconPosition: 'left',
            fullWidth: false,
            loading: false,
            disabled: false
          }
        };
      case 'image':
        return { 
          ...baseComponent, 
          props: { 
            src: 'https://via.placeholder.com/800x400?text=Image',
            alt: 'Image description',
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            objectFit: 'cover',
            borderRadius: '0',
            shadow: 'none',
            border: 'none',
            borderColor: '#e5e7eb',
            borderWidth: '0',
            margin: '0',
            padding: '0',
            backgroundColor: 'transparent',
            caption: '',
            showCaption: false,
            captionPosition: 'below',
            captionColor: '#6b7280',
            captionFontSize: '0.875rem',
            lazy: true,
            loading: 'lazy'
          } 
        };
      case 'section':
        return { ...baseComponent, children: [] };
      case 'container':
        return { 
          ...baseComponent, 
          children: [],
          props: { columns: 2 } // Default to 2 columns
        };
      case 'spacer':
        return { ...baseComponent, props: { height: '50px' } };
      case 'divider':
        return baseComponent;
      case 'card':
        return { ...baseComponent, children: [] };
      case 'grid':
        return { ...baseComponent, children: [] };
      case 'video':
        return { ...baseComponent, props: { src: 'https://www.youtube.com/embed/dQw4w9WgXcQ' } };
      case 'form':
        return baseComponent;
      case 'domain-search':
        return { 
          ...baseComponent, 
          props: { 
            placeholder: 'Search for domains...',
            buttonText: 'Search',
            showSuggestions: true,
            maxSuggestions: 5,
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            textColor: '#374151',
            buttonColor: '#4f46e5',
            buttonTextColor: '#ffffff',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            fontSize: '1rem'
          }
        };
      case 'products-grid':
        return { 
          ...baseComponent, 
          props: { 
            columns: 3,
            productCount: 6,
            title: 'Our Products',
            subtitle: 'Choose from our range of hosting solutions designed to meet your needs',
            showPrices: true,
            showFeatures: true,
            showButtons: true,
            cardStyle: 'default',
            backgroundColor: '#ffffff',
            cardBackgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            textColor: '#374151',
            priceColor: '#4f46e5',
            buttonColor: '#4f46e5',
            buttonTextColor: '#ffffff',
            spacing: '1rem'
          }
        };
      case 'featured-products':
        return { 
          ...baseComponent, 
          props: { 
            columns: 3,
            productCount: 3,
            title: 'Featured Products',
            subtitle: 'Discover our most popular and recommended hosting solutions',
            showPrices: true,
            showButtons: true
          }
        };
      case 'product-search':
        return { 
          ...baseComponent, 
          props: { 
            placeholder: 'Search products...',
            showFilters: true,
            showSorting: true,
            resultsPerPage: 12,
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            textColor: '#374151',
            buttonColor: '#4f46e5',
            buttonTextColor: '#ffffff'
          }
        };
      case 'contact-form':
        return { 
          ...baseComponent, 
          props: { 
            showNameField: true,
            showEmailField: true,
            showPhoneField: false,
            showSubjectField: true,
            showMessageField: true,
            submitButtonText: 'Send Message',
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            textColor: '#374151',
            buttonColor: '#4f46e5',
            buttonTextColor: '#ffffff',
            requiredFields: ['name', 'email', 'message']
          }
        };
      case 'newsletter':
        return { 
          ...baseComponent, 
          props: { 
            title: 'Subscribe to our newsletter',
            description: 'Get the latest updates and news delivered to your inbox.',
            placeholder: 'Enter your email address',
            buttonText: 'Subscribe',
            showTitle: true,
            showDescription: true,
            backgroundColor: '#f8fafc',
            textColor: '#374151',
            buttonColor: '#4f46e5',
            buttonTextColor: '#ffffff',
            borderColor: '#e5e7eb'
          }
        };
      case 'header':
        return { 
          ...baseComponent, 
          props: { 
            logoText: 'NextPanel',
            logoImage: '',
            logoWidth: '120px',
            logoHeight: '40px',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            showSearch: false,
            navigationItems: [
              { name: 'Home', url: '/' },
              { name: 'Products', url: '/products' },
              { name: 'About', url: '/about' },
              { name: 'Contact', url: '/contact' }
            ],
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5',
            navigationColor: '#374151',
            cartColor: '#4f46e5',
            borderColor: '#e5e7eb',
            borderWidth: '1px',
            padding: '1rem',
            sticky: false,
            shadow: 'none',
            borderRadius: '0'
          } 
        };
      case 'footer':
        return { 
          ...baseComponent, 
          props: { 
            companyName: 'NextPanel Billing',
            companyDescription: 'Professional billing and hosting management platform.',
            copyrightText: '© 2024 NextPanel Billing. All rights reserved.',
            showCompanyInfo: true,
            showLinks: true,
            showSocial: false,
            showNewsletter: false,
            linkColumns: [
              {
                title: 'Products',
                links: [
                  { name: 'Hosting Plans', url: '/hosting' },
                  { name: 'Domain Names', url: '/domains' },
                  { name: 'SSL Certificates', url: '/ssl' }
                ]
              },
              {
                title: 'Support',
                links: [
                  { name: 'Help Center', url: '/help' },
                  { name: 'Contact Us', url: '/contact' },
                  { name: 'Status', url: '/status' }
                ]
              }
            ],
            socialLinks: [
              { platform: 'facebook', url: 'https://facebook.com' },
              { platform: 'twitter', url: 'https://twitter.com' },
              { platform: 'linkedin', url: 'https://linkedin.com' }
            ],
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af',
            headingColor: '#ffffff',
            borderColor: '#374151',
            padding: '2rem',
            borderTop: '1px solid #374151'
          } 
        };
      case 'cart':
        return { 
          ...baseComponent, 
          props: { 
            showHeader: true,
            showCheckoutButton: true,
            showEmptyState: true,
            showItemCount: true,
            showTotal: true,
            headerText: 'Shopping Cart',
            emptyStateText: 'Your cart is empty',
            checkoutButtonText: 'Proceed to Checkout',
            buttonColor: '#4f46e5'
          } 
        };
      case 'code-block':
        return { 
          ...baseComponent, 
          content: '<!-- Your HTML, CSS, or JS code here -->',
          props: { language: 'HTML' }
        };
      case 'sidebar':
        return { 
          ...baseComponent, 
          props: { 
            position: 'right',
            width: '300px',
            backgroundColor: '#f8fafc',
            title: 'Sidebar',
            showTitle: true
          }
        };
      case 'shortcode':
        return { 
          ...baseComponent, 
          content: '[shortcode_example]',
          props: { 
            shortcode: '[shortcode_example]',
            description: 'Enter your shortcode here'
          }
        };
      case 'alert':
        return { 
          ...baseComponent, 
          content: 'This is an alert message',
          props: { 
            type: 'info',
            title: 'Alert',
            showCloseButton: true,
            backgroundColor: '#dbeafe',
            textColor: '#1e40af',
            borderColor: '#3b82f6'
          }
        };
      case 'social-icons':
        return { 
          ...baseComponent, 
          props: { 
            platforms: ['facebook', 'twitter', 'instagram', 'linkedin'],
            size: 'medium',
            style: 'rounded',
            showLabels: false,
            alignment: 'center'
          }
        };
      case 'showcase':
        return { 
          ...baseComponent, 
          props: { 
            title: 'Showcase',
            subtitle: 'Showcase your best work',
            items: [],
            layout: 'grid',
            columns: 3,
            showTitle: true,
            showSubtitle: true
          }
        };
      default:
        return baseComponent;
    }
  };

  const handleColumnClick = (containerId: string, columnIndex: number) => {
    setTargetContainer({ id: containerId, columnIndex });
    setShowComponentSelector(true);
  };

  const handleAddColumn = (containerId: string) => {
    console.log('Adding column to container:', containerId);
    const newComponents = components.map(comp => {
      if (comp.id === containerId && comp.type === 'container') {
        const currentColumns = comp.props?.columns || 2;
        console.log('Current columns:', currentColumns);
        const newColumns = currentColumns + 1;
        console.log('New columns:', newColumns);
        return {
          ...comp,
          props: {
            ...comp.props,
            columns: newColumns
          }
        };
      }
      return comp;
    });
    console.log('Updated components:', newComponents);
    setComponents(newComponents);
    addToHistory(newComponents);
  };

  const handleRemoveColumn = (containerId: string) => {
    const newComponents = components.map(comp => {
      if (comp.id === containerId && comp.type === 'container') {
        const currentColumns = comp.props?.columns || 2;
        const newColumns = Math.max(currentColumns - 1, 1);
        return {
          ...comp,
          props: {
            ...comp.props,
            columns: newColumns
          }
        };
      }
      return comp;
    });
    setComponents(newComponents);
    addToHistory(newComponents);
  };

  const handleAddComponent = (type: ComponentType, containerId?: string) => {
    const newComponent = createComponent(type);
    
    if (containerId) {
      // Add to specific container
      const addToContainer = (comps: Component[]): Component[] => {
        return comps.map(comp => {
          if (comp.id === containerId) {
            return {
              ...comp,
              children: [...(comp.children || []), newComponent]
            };
          }
          if (comp.children) {
            return {
              ...comp,
              children: addToContainer(comp.children)
            };
          }
          return comp;
        });
      };
      const newComponents = addToContainer(components);
      setComponents(newComponents);
      addToHistory(newComponents);
      setSelectedComponent(newComponent.id);
      setShowComponentSelector(false);
      setTargetContainer(null);
    } else {
      // Add to root
      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      addToHistory(newComponents);
      setSelectedComponent(newComponent.id);
    }
  };

  const handleAddAfter = (componentId: string, type: ComponentType) => {
    const newComponent = createComponent(type);
    
    // Check if the component is within a container column
    const containerComponent = components.find(comp => 
      comp.type === 'container' && 
      comp.children?.some(child => child.id === componentId)
    );
    
    if (containerComponent) {
      // Add component within container column
      const newComponents = components.map(comp => {
        if (comp.id === containerComponent.id) {
          const updatedChildren = [...(comp.children || [])];
          const childIndex = updatedChildren.findIndex(child => child.id === componentId);
          if (childIndex !== -1) {
            updatedChildren.splice(childIndex + 1, 0, newComponent);
          }
          return { ...comp, children: updatedChildren };
        }
        return comp;
      });
      setComponents(newComponents);
      addToHistory(newComponents);
      setSelectedComponent(newComponent.id);
    } else {
      // Add component to main canvas
      const componentIndex = components.findIndex(comp => comp.id === componentId);
      
      if (componentIndex !== -1) {
        const newComponents = [
          ...components.slice(0, componentIndex + 1),
          newComponent,
          ...components.slice(componentIndex + 1)
        ];
        setComponents(newComponents);
        addToHistory(newComponents);
        setSelectedComponent(newComponent.id);
      }
    }
    
    setShowAfterComponentPicker(false);
    setAfterComponentId(null);
  };

  const handleSelectComponentForColumn = (type: ComponentType) => {
    if (targetContainer) {
      handleAddComponent(type, targetContainer.id);
    }
  };

  const handleUpdateComponent = (updatedComponent: Component) => {
    const newComponents = components.map((comp) =>
      comp.id === updatedComponent.id ? updatedComponent : comp
    );
    setComponents(newComponents);
    addToHistory(newComponents);
  };

  const handleDeleteComponent = (id: string) => {
    const newComponents = components.filter((comp) => comp.id !== id);
    setComponents(newComponents);
    addToHistory(newComponents);
    setSelectedComponent(null);
  };

  const handleDuplicateComponent = (id: string) => {
    const componentToDuplicate = components.find((comp) => comp.id === id);
    if (!componentToDuplicate) return;
    
    // Deep clone function for nested children
    const deepCloneComponent = (comp: Component): Component => {
      const newId = `${comp.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        ...comp,
        id: newId,
        children: comp.children
          ? comp.children.map((child) => deepCloneComponent(child))
          : undefined,
      };
    };
    
    const newComponent = deepCloneComponent(componentToDuplicate);
    const componentIndex = components.findIndex((comp) => comp.id === id);
    
    if (componentIndex === -1) return;
    
    const newComponents = [
      ...components.slice(0, componentIndex + 1),
      newComponent,
      ...components.slice(componentIndex + 1),
    ];
    
    setComponents(newComponents);
    addToHistory(newComponents);
    setSelectedComponent(newComponent.id);
  };

  const handleCopyComponent = (id: string) => {
    const componentToCopy = components.find((comp) => comp.id === id);
    if (componentToCopy) {
      // Store in clipboard (localStorage for now, could use Clipboard API)
      localStorage.setItem('pageBuilderClipboard', JSON.stringify(componentToCopy));
    }
  };

  const handleMoveComponentUp = (id: string) => {
    const componentIndex = components.findIndex((comp) => comp.id === id);
    if (componentIndex <= 0) return;
    
    const newComponents = [...components];
    // Swap with previous component
    const temp = newComponents[componentIndex - 1];
    newComponents[componentIndex - 1] = newComponents[componentIndex];
    newComponents[componentIndex] = temp;
    
    setComponents(newComponents);
    addToHistory(newComponents);
    // Keep the same component selected
    setSelectedComponent(id);
  };

  const handleMoveComponentDown = (id: string) => {
    const componentIndex = components.findIndex((comp) => comp.id === id);
    if (componentIndex < 0 || componentIndex >= components.length - 1) return;
    
    const newComponents = [...components];
    // Swap with next component
    const temp = newComponents[componentIndex + 1];
    newComponents[componentIndex + 1] = newComponents[componentIndex];
    newComponents[componentIndex] = temp;
    
    setComponents(newComponents);
    addToHistory(newComponents);
    // Keep the same component selected
    setSelectedComponent(id);
  };

  const handleContextMenu = (e: React.MouseEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId,
    });
    setSelectedComponent(componentId);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu on Escape key or outside click
  React.useEffect(() => {
    if (!contextMenu) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    const handleClickOutside = () => {
      closeContextMenu();
    };

    document.addEventListener('keydown', handleEscape);
    // Small delay to avoid closing immediately when opening
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [contextMenu]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Handle library component drop
    if (active.id.toString().startsWith('library-')) {
      const componentType = active.data.current?.componentType as ComponentType;
      if (componentType && over) {
        // Check if dropping on a drop zone
        if (over.id.toString().startsWith('drop-zone-')) {
          const dropIndex = parseInt(over.id.toString().replace('drop-zone-', ''));
          const newComponent = createComponent(componentType);
          const newComponents = [
            ...components.slice(0, dropIndex),
            newComponent,
            ...components.slice(dropIndex),
          ];
          setComponents(newComponents);
          addToHistory(newComponents);
          setSelectedComponent(newComponent.id);
        } else if (over.id.toString().startsWith('component-')) {
          // Drop on existing component - insert after it
          const targetId = over.id.toString().replace('component-', '');
          const targetIndex = components.findIndex((c) => c.id === targetId);
          if (targetIndex !== -1) {
            const newComponent = createComponent(componentType);
            const newComponents = [
              ...components.slice(0, targetIndex + 1),
              newComponent,
              ...components.slice(targetIndex + 1),
            ];
            setComponents(newComponents);
            addToHistory(newComponents);
            setSelectedComponent(newComponent.id);
          }
        } else {
          // Drop on canvas - add to end
          const newComponent = createComponent(componentType);
          const newComponents = [...components, newComponent];
          setComponents(newComponents);
          addToHistory(newComponents);
          setSelectedComponent(newComponent.id);
        }
      }
    } else if (over && active.id !== over.id) {
      // Handle reordering existing components
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        addToHistory(newItems);
        return newItems;
      });
    }

    setActiveId(null);
  };

  const handleSave = async () => {
    if (!currentPageId.trim()) {
      alert('Please enter a page ID');
      return;
    }
    
    if (!title.trim()) {
      alert('Please enter a page title');
      return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to save pages. You can log in from the admin panel.');
      return;
    }
    
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      // Check if page exists first
      let isNewPage = true;
      try {
        const checkResponse = await fetch(`${apiUrl}/api/v1/pages/${currentPageId.trim()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        isNewPage = !checkResponse.ok;
      } catch (error) {
        // Assume it's a new page if check fails
        isNewPage = true;
      }
      
      const method = isNewPage ? 'POST' : 'PUT';
      const endpoint = isNewPage ? `${apiUrl}/api/v1/pages/` : `${apiUrl}/api/v1/pages/${currentPageId.trim()}`;
      
      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slug: currentPageId.trim(),
          title: title.trim(),
          description: description.trim(),
          components,
          is_homepage: setAsHomepage,
          metadata: {
            createdAt: isNewPage ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          }
        }),
      });

      if (response.ok) {
        const savedPage = await response.json();
        
        // If setting as homepage, make additional request to set homepage
        if (setAsHomepage) {
          try {
            const homepageResponse = await fetch(`${apiUrl}/api/v1/pages/homepage/${currentPageId.trim()}`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (homepageResponse.ok) {
              alert(`Page ${isNewPage ? 'created' : 'saved'} and set as homepage successfully!\n\nView at: / (homepage) or /dynamic-page/${currentPageId.trim()}`);
            } else {
              alert(`Page ${isNewPage ? 'created' : 'saved'} successfully, but failed to set as homepage.\n\nView at: /dynamic-page/${currentPageId.trim()}`);
            }
          } catch (error) {
            alert(`Page ${isNewPage ? 'created' : 'saved'} successfully, but failed to set as homepage.\n\nView at: /dynamic-page/${currentPageId.trim()}`);
          }
        } else {
          alert(`Page ${isNewPage ? 'created' : 'saved'} successfully!\n\nView at: /dynamic-page/${currentPageId.trim()}`);
        }
        
        if (onSave) {
          onSave(components);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to ${isNewPage ? 'create' : 'save'} page`);
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert(`Failed to save page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentPageId.trim()) {
      alert('Please enter a page ID');
      return;
    }
    
    setIsPublishing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      // Get auth token
      const token = localStorage.getItem('access_token');
      
      // Save the page
      const saveResponse = await fetch(`${apiUrl}/api/v1/pages/${currentPageId.trim()}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          components,
          is_active: 'active',
          metadata: {
            updatedAt: new Date().toISOString(),
          }
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save page');
      }

      alert(`Page published successfully!\n\nView at: /dynamic-page/${currentPageId.trim()}`);
    } catch (error) {
      console.error('Error publishing page:', error);
      alert('Failed to publish page');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(components, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'page-layout.json';
    link.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedComponents = JSON.parse(event.target?.result as string);
            setComponents(importedComponents);
            addToHistory(importedComponents);
            alert('Page imported successfully!');
          } catch (error) {
            alert('Failed to import page. Invalid JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const loadAvailablePages = async () => {
    setLoadingPages(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/pages`);
      if (response.ok) {
        const pages = await response.json();
        setAvailablePages(pages.map((p: any) => ({ id: p.slug, title: p.title })));
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const loadPage = async (pageId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/pages/${pageId}`);
      if (response.ok) {
        const pageData = await response.json();
        setCurrentPageId(pageData.slug);
        setTitle(pageData.title);
        setDescription(pageData.description || '');
        setComponents(pageData.components || []);
        setHistory([pageData.components || []]);
        setHistoryIndex(0);
        setShowPageSelector(false);
        setSearchQuery('');
      } else {
        // If page doesn't exist, create a new one with default template
        const predefinedPage = predefinedPages.find(p => p.id === pageId);
        if (predefinedPage) {
          const defaultComponents = getDefaultComponents(pageId);
          setCurrentPageId(predefinedPage.id);
          setTitle(predefinedPage.title);
          setDescription(predefinedPage.description || '');
          setComponents(defaultComponents);
          setHistory([defaultComponents]);
          setHistoryIndex(0);
          setShowPageSelector(false);
          setSearchQuery('');
        } else {
          alert('Failed to load page');
        }
      }
    } catch (error) {
      console.error('Error loading page:', error);
      // If API fails, use predefined page data with default template
      const predefinedPage = predefinedPages.find(p => p.id === pageId);
      if (predefinedPage) {
        const defaultComponents = getDefaultComponents(pageId);
        setCurrentPageId(predefinedPage.id);
        setTitle(predefinedPage.title);
        setDescription(predefinedPage.description || '');
        setComponents(defaultComponents);
        setHistory([defaultComponents]);
        setHistoryIndex(0);
        setShowPageSelector(false);
        setSearchQuery('');
      } else {
        alert('Failed to load page');
      }
    }
  };

  const selectedComponentData = components.find((c) => c.id === selectedComponent);

  const deviceWidths = {
    desktop: '1200px',
    tablet: '768px',
    mobile: '375px',
  };

  // Generate HTML, CSS, and JS code from components
  const generateCodeFromComponents = () => {
    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>' + title + '</title>\n  <style>\n';
    let css = '';
    let js = '';

    // Generate CSS
    components.forEach(component => {
      if (component.style && Object.keys(component.style).length > 0) {
        css += `\n/* ${component.type} component styles */\n`;
        css += `#${component.id} {\n`;
        Object.entries(component.style).forEach(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
          css += `  ${cssKey}: ${value};\n`;
        });
        css += '}\n';
      }
    });

    // Generate HTML
    html += css + '\n  </style>\n</head>\n<body>\n';
    
    components.forEach(component => {
      html += `  <div id="${component.id}" class="component ${component.type}">\n`;
      
      switch (component.type) {
        case 'heading':
          const headingLevel = component.props?.level || 'h1';
          html += `    <${headingLevel}>${component.content || 'Heading'}</${headingLevel}>\n`;
          break;
        case 'text':
          html += `    <div>${component.content || 'Text content'}</div>\n`;
          break;
        case 'button':
          html += `    <button>${component.content || 'Button'}</button>\n`;
          break;
        case 'image':
          html += `    <img src="${component.props?.src || 'https://via.placeholder.com/300x200'}" alt="${component.props?.alt || 'Image'}" />\n`;
          break;
        case 'header':
          html += `    <header>\n      <div class="logo">${component.props?.logoText || 'Logo'}</div>\n      <nav>Navigation</nav>\n    </header>\n`;
          break;
        case 'footer':
          html += `    <footer>\n      <div>Footer content</div>\n    </footer>\n`;
          break;
        case 'cart':
          html += `    <div class="cart">\n      <h3>${component.props?.headerText || 'Shopping Cart'}</h3>\n      <div class="cart-items">Cart items will appear here</div>\n    </div>\n`;
          break;
        case 'code-block':
          const language = component.props?.language || 'HTML';
          html += `    <div class="code-block">\n      <h4>${language} Code Block</h4>\n      <pre><code>${component.content || '<!-- Your code here -->'}</code></pre>\n    </div>\n`;
          break;
        case 'sidebar':
          html += `    <div class="sidebar" style="width: ${component.props?.width || '300px'}; background-color: ${component.props?.backgroundColor || '#f8fafc'}; padding: 1rem;">\n      ${component.props?.showTitle ? `<h3>${component.props?.title || 'Sidebar'}</h3>` : ''}\n      <div>Sidebar content</div>\n    </div>\n`;
          break;
        case 'shortcode':
          html += `    <div class="shortcode">\n      <p>Shortcode: ${component.props?.shortcode || component.content || '[shortcode_example]'}</p>\n    </div>\n`;
          break;
        case 'alert':
          const alertType = component.props?.type || 'info';
          html += `    <div class="alert alert-${alertType}" style="background-color: ${component.props?.backgroundColor || '#dbeafe'}; color: ${component.props?.textColor || '#1e40af'}; border: 1px solid ${component.props?.borderColor || '#3b82f6'}; padding: 1rem; border-radius: 0.5rem;">\n      ${component.props?.title ? `<h4>${component.props.title}</h4>` : ''}\n      <p>${component.content || 'Alert message'}</p>\n    </div>\n`;
          break;
        case 'social-icons':
          const platforms = component.props?.platforms || ['facebook', 'twitter', 'instagram'];
          const iconHtml = platforms.map((platform: any) => `      <a href="#" class="social-icon social-${platform}">${platform}</a>`).join('\n');
          html += `    <div class="social-icons" style="text-align: ${component.props?.alignment || 'center'}; display: flex; gap: 1rem; justify-content: center;">\n${iconHtml}\n    </div>\n`;
          break;
        case 'showcase':
          html += `    <div class="showcase">\n      ${component.props?.showTitle ? `<h2>${component.props?.title || 'Showcase'}</h2>` : ''}\n      ${component.props?.showSubtitle ? `<p>${component.props?.subtitle || 'Showcase your best work'}</p>` : ''}\n      <div class="showcase-grid" style="display: grid; grid-template-columns: repeat(${component.props?.columns || 3}, 1fr); gap: 1rem;">\n        <div class="showcase-item">Showcase item 1</div>\n        <div class="showcase-item">Showcase item 2</div>\n        <div class="showcase-item">Showcase item 3</div>\n      </div>\n    </div>\n`;
          break;
        default:
          html += `    <div>${component.type} component</div>\n`;
      }
      
      html += '  </div>\n';
    });

    html += '</body>\n</html>';

    setPageCode({ html, css, js });
  };

  // Apply code changes back to components (simplified version)
  const applyCodeToComponents = () => {
    // This is a simplified implementation
    // In a real implementation, you would parse the HTML and update components accordingly
    alert('Code changes applied! (This is a simplified implementation)');
  };

  // Sidebar resize handlers
  const handleLeftSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  };

  const handleRightSidebarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingLeft) {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setLeftSidebarWidth(newWidth);
        localStorage.setItem('pageBuilderLeftSidebarWidth', newWidth.toString());
      }
    }
    if (isDraggingRight) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setRightSidebarWidth(newWidth);
        localStorage.setItem('pageBuilderRightSidebarWidth', newWidth.toString());
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  };

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      // Add visual feedback
      document.body.classList.add('select-none');
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('select-none');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('select-none');
    };
  }, [isDraggingLeft, isDraggingRight]);

  // Calculate optimal zoom level to fit content
  const calculateOptimalZoom = () => {
    if (!canvasRef) return 0.6;
    
    const canvasRect = canvasRef.getBoundingClientRect();
    const availableWidth = canvasRect.width - 16; // Account for padding
    const availableHeight = canvasRect.height - 16; // Account for padding
    
    // Calculate content dimensions based on device view or custom dimensions
    let contentWidth = 1200; // Default desktop width
    if (useCustomDimensions) {
      contentWidth = customWidth;
    } else {
      if (deviceView === 'tablet') contentWidth = 768;
      if (deviceView === 'mobile') contentWidth = 375;
    }
    
    // Estimate content height based on components
    const baseHeight = 400; // Minimum height
    const componentHeight = components.length * 80; // Average component height
    const contentHeight = Math.max(baseHeight, componentHeight);
    
    // Calculate zoom to fit width and height
    const widthZoom = availableWidth / contentWidth;
    const heightZoom = availableHeight / contentHeight;
    
    // Use the smaller zoom to ensure everything fits, with some margin
    const margin = 0.9; // 10% margin
    const optimalZoom = Math.min(widthZoom * margin, heightZoom * margin, 1.2); // Max 120%
    
    return Math.max(0.2, optimalZoom); // Min 20%
  };

  // Auto-zoom effect
  React.useEffect(() => {
    if (autoZoom && canvasRef) {
      const optimalZoom = calculateOptimalZoom();
      setCanvasZoom(optimalZoom);
    }
  }, [leftSidebarWidth, rightSidebarWidth, components.length, autoZoom, canvasRef, deviceView, useCustomDimensions, customWidth, customHeight]);

  // ResizeObserver for canvas size changes
  React.useEffect(() => {
    if (!canvasRef || !autoZoom) return;

    const resizeObserver = new ResizeObserver(() => {
      if (autoZoom) {
        const optimalZoom = calculateOptimalZoom();
        setCanvasZoom(optimalZoom);
      }
    });

    resizeObserver.observe(canvasRef);

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasRef, autoZoom]);

  // Save zoom level to localStorage
  React.useEffect(() => {
    if (!autoZoom) {
      localStorage.setItem('pageBuilderCanvasZoom', canvasZoom.toString());
    }
  }, [canvasZoom, autoZoom]);

  // Save auto-zoom setting to localStorage
  React.useEffect(() => {
    localStorage.setItem('pageBuilderAutoZoom', autoZoom.toString());
  }, [autoZoom]);

  // Save custom dimensions to localStorage
  React.useEffect(() => {
    localStorage.setItem('pageBuilderCustomWidth', customWidth.toString());
  }, [customWidth]);

  React.useEffect(() => {
    localStorage.setItem('pageBuilderCustomHeight', customHeight.toString());
  }, [customHeight]);

  React.useEffect(() => {
    localStorage.setItem('pageBuilderUseCustomDimensions', useCustomDimensions.toString());
  }, [useCustomDimensions]);

  // Listen for component picker events
  React.useEffect(() => {
    const handleShowComponentPicker = (event: CustomEvent) => {
      const { afterComponentId } = event.detail;
      setAfterComponentId(afterComponentId);
      setShowAfterComponentPicker(true);
    };

    window.addEventListener('showComponentPicker', handleShowComponentPicker as EventListener);
    
    return () => {
      window.removeEventListener('showComponentPicker', handleShowComponentPicker as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Page Builder</h1>
            <div className="h-6 w-px bg-gray-300" />
            <span className="text-sm text-gray-500">Build and customize your pages</span>
            {pageType !== 'custom' && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-indigo-600">
                    {predefinedPages.find(p => p.id === pageType)?.title || 'Custom Page'}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {pageType}
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <ArrowUturnLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <ArrowUturnRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-2 rounded transition-colors ${
                deviceView === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="Desktop View"
            >
              <ComputerDesktopIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-2 rounded transition-colors ${
                deviceView === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="Tablet View"
            >
              <DeviceTabletIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-2 rounded transition-colors ${
                deviceView === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
              title="Mobile View"
            >
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoZoom(!autoZoom)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                autoZoom 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={autoZoom ? "Disable Auto Zoom" : "Enable Auto Zoom"}
            >
              {autoZoom ? 'Auto' : 'Manual'}
            </button>
            <button
              onClick={() => setCanvasZoom(Math.max(0.3, canvasZoom - 0.1))}
              disabled={autoZoom}
              className={`p-2 rounded transition-colors ${
                autoZoom 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="Zoom Out"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button
              onClick={() => setCanvasZoom(Math.min(1.2, canvasZoom + 0.1))}
              disabled={autoZoom}
              className={`p-2 rounded transition-colors ${
                autoZoom 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="Zoom In"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={() => {
                setAutoZoom(false);
                setCanvasZoom(0.6);
              }}
              className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              title="Reset to Manual Zoom"
            >
              Reset
            </button>
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUseCustomDimensions(!useCustomDimensions)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                useCustomDimensions 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Toggle Custom Dimensions"
            >
              Custom
            </button>
            {useCustomDimensions && (
              <>
                <div className="flex items-center space-x-1">
                  <label className="text-xs text-gray-600">W:</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1200)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    min="200"
                    max="2000"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <label className="text-xs text-gray-600">H:</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 800)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                    min="200"
                    max="2000"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowPageSelector(!showPageSelector)}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              title="Select page to edit"
            >
              <span>📄 Select Page</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPageSelector && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-xl z-50">
                {/* Info Banner */}
                <div className="p-3 bg-blue-50 border-b border-blue-200">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">About Page Builder</p>
                      <p>This creates templates. Your actual homepage at <code className="bg-blue-100 px-1 rounded">/</code> is a separate React component with dynamic data.</p>
                    </div>
                  </div>
                </div>
                
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pages..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                
                {/* Pages List */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredPages.length > 0 ? (
                    filteredPages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => loadPage(page.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{page.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{page.description}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {page.id}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No pages found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Page Type Selector */}
          <select
            value={pageType}
            onChange={(e) => {
              setPageType(e.target.value);
              if (e.target.value !== 'custom') {
                // Load default template for the selected page type
                const defaultComponents = getDefaultComponents(e.target.value);
                setComponents(defaultComponents);
                setHistory([defaultComponents]);
                setHistoryIndex(0);
                setCurrentPageId(e.target.value);
                setTitle(predefinedPages.find(p => p.id === e.target.value)?.title || 'Untitled Page');
                setDescription(predefinedPages.find(p => p.id === e.target.value)?.description || '');
              }
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            title="Select page type"
          >
            <option value="custom">Custom Page</option>
            <option value="home">🏠 Homepage</option>
            <option value="cart">🛒 Cart Page</option>
            <option value="shop">🛍️ Shop Page</option>
            <option value="checkout">💳 Checkout Page</option>
            <option value="order-confirmation">✅ Order Success</option>
            <option value="about-us">ℹ️ About Us</option>
            <option value="contact">📞 Contact Page</option>
            <option value="privacy">🔒 Privacy Policy</option>
            <option value="terms">📋 Terms of Service</option>
          </select>
          
          <input
            type="text"
            value={currentPageId}
            onChange={(e) => setCurrentPageId(e.target.value)}
            placeholder="Page ID (e.g., my-page)"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 w-48"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page Title"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={setAsHomepage}
              onChange={(e) => setSetAsHomepage(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Set as Homepage</span>
          </label>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleImport}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowCodeEditor(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CodeBracketIcon className="h-4 w-4" />
            <span>Edit Code</span>
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {previewMode ? (
              <>
                <EyeSlashIcon className="h-4 w-4" />
                <span>Exit Preview</span>
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                <span>Preview</span>
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RocketLaunchIcon className="h-4 w-4" />
            <span>{isPublishing ? 'Publishing...' : 'Publish & Rebuild'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Component Library */}
          {!previewMode && (
            <div 
              className="bg-white border-r border-gray-200 flex-shrink-0"
              style={{ width: `${leftSidebarWidth}px` }}
            >
              <ComponentLibrary onAddComponent={handleAddComponent} />
            </div>
          )}

          {/* Left Resize Handle */}
          {!previewMode && (
            <div
              className={`w-1 ${isDraggingLeft ? 'bg-indigo-500' : 'bg-gray-300 hover:bg-indigo-400'} cursor-col-resize flex-shrink-0 transition-colors relative group`}
              onMouseDown={handleLeftSidebarMouseDown}
              title={`Drag to resize left sidebar (${leftSidebarWidth}px)`}
            >
              <div className="absolute inset-y-0 -left-1 w-3 bg-transparent hover:bg-indigo-100 transition-colors" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col space-y-1">
                  <div className="w-0.5 h-1 bg-indigo-400"></div>
                  <div className="w-0.5 h-1 bg-indigo-400"></div>
                  <div className="w-0.5 h-1 bg-indigo-400"></div>
                </div>
              </div>
              {isDraggingLeft && (
                <div className="absolute top-4 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg z-50">
                  {leftSidebarWidth}px
                </div>
              )}
            </div>
          )}

          {/* Canvas */}
          <div 
            ref={setCanvasRef}
            className="flex-1 overflow-auto bg-gray-100"
          >
            <div
              className="bg-white shadow-lg transition-all duration-300"
              style={{
                width: useCustomDimensions ? `${customWidth}px` : deviceWidths[deviceView],
                height: useCustomDimensions ? `${customHeight}px` : 'auto',
                maxWidth: '100%',
                minHeight: useCustomDimensions ? `${customHeight}px` : '400px',
                transform: `scale(${canvasZoom})`,
                transformOrigin: 'top center',
              }}
            >
              <SortableContext
                items={components.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0">
                  {components.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                      <PlusIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">Start building your page</p>
                      <p className="text-sm">Drag components from the left panel or click to add</p>
                    </div>
                  ) : (
                    <>
                      {/* Drop zone at the beginning */}
                      <DropZone id="drop-zone-0" index={0} />
                      {components.map((component, index) => (
                        <React.Fragment key={component.id}>
                          <SortableComponent
                            component={component}
                            isSelected={selectedComponent === component.id}
                            isHovered={hoveredComponent === component.id}
                            onClick={() => setSelectedComponent(component.id)}
                            onMouseEnter={() => setHoveredComponent(component.id)}
                            onMouseLeave={() => setHoveredComponent(null)}
                            onAddToContainer={handleAddComponent}
                            onColumnClick={handleColumnClick}
                            onAddColumn={handleAddColumn}
                            onRemoveColumn={handleRemoveColumn}
                            onAddAfter={handleAddAfter}
                            onContextMenu={handleContextMenu}
                            onUpdate={handleUpdateComponent}
                          />
                          {/* Drop zone after each component */}
                          <DropZone id={`drop-zone-${index + 1}`} index={index + 1} />
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Right Resize Handle */}
          {!previewMode && (
            <div
              className={`w-1 ${isDraggingRight ? 'bg-indigo-500' : 'bg-gray-300 hover:bg-indigo-400'} cursor-col-resize flex-shrink-0 transition-colors relative group`}
              onMouseDown={handleRightSidebarMouseDown}
              title={`Drag to resize right sidebar (${rightSidebarWidth}px)`}
            >
              <div className="absolute inset-y-0 -right-1 w-3 bg-transparent hover:bg-indigo-100 transition-colors" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col space-y-1">
                  <div className="w-0.5 h-1 bg-indigo-400"></div>
                  <div className="w-0.5 h-1 bg-indigo-400"></div>
                  <div className="w-0.5 h-1 bg-indigo-400"></div>
                </div>
              </div>
              {isDraggingRight && (
                <div className="absolute top-4 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg z-50">
                  {rightSidebarWidth}px
                </div>
              )}
            </div>
          )}

          {/* Properties Panel */}
          {!previewMode && (
            <div 
              className="bg-white border-l border-gray-200 flex-shrink-0"
              style={{ width: `${rightSidebarWidth}px` }}
            >
              {selectedComponentData ? (
                <div className="relative h-full">
                  <PropertiesPanel
                    component={selectedComponentData}
                    onUpdate={handleUpdateComponent}
                    onClose={() => setSelectedComponent(null)}
                  />
                  <button
                    onClick={() => handleDeleteComponent(selectedComponentData.id)}
                    className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg z-20"
                    title="Delete Component"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <PropertiesPanel
                  component={null}
                  onUpdate={() => {}}
                  onClose={() => {}}
                />
              )}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeId ? (
            activeId.toString().startsWith('library-') ? (
              <div className="bg-white border-2 border-indigo-500 rounded-lg p-4 shadow-lg">
                <p className="text-sm font-medium text-indigo-600">
                  {activeId.toString().replace('library-', '').replace(/-/g, ' ')}
                </p>
              </div>
            ) : (
              <ComponentRenderer
                component={components.find((c) => c.id === activeId)!}
                isSelected={false}
                isHovered={false}
                onClick={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onAddToContainer={() => {}}
                onColumnClick={() => {}}
                onAddColumn={() => {}}
                onRemoveColumn={() => {}}
              />
            )
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onEdit={() => {
            setSelectedComponent(contextMenu.componentId);
            closeContextMenu();
          }}
          onDelete={() => {
            handleDeleteComponent(contextMenu.componentId);
            closeContextMenu();
          }}
          onDuplicate={() => {
            handleDuplicateComponent(contextMenu.componentId);
            closeContextMenu();
          }}
          onCopy={() => {
            handleCopyComponent(contextMenu.componentId);
            closeContextMenu();
          }}
          onMoveUp={() => {
            handleMoveComponentUp(contextMenu.componentId);
            closeContextMenu();
          }}
          onMoveDown={() => {
            handleMoveComponentDown(contextMenu.componentId);
            closeContextMenu();
          }}
          canMoveUp={components.findIndex((c) => c.id === contextMenu.componentId) > 0}
          canMoveDown={components.findIndex((c) => c.id === contextMenu.componentId) < components.length - 1}
        />
      )}

      {/* Component Selector Modal */}
      {showComponentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowComponentSelector(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Component to Add</h3>
              <button
                onClick={() => setShowComponentSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { type: 'heading' as ComponentType, label: 'Heading', icon: '📝' },
                { type: 'text' as ComponentType, label: 'Text', icon: '📄' },
                { type: 'button' as ComponentType, label: 'Button', icon: '🔘' },
                { type: 'image' as ComponentType, label: 'Image', icon: '🖼️' },
                { type: 'card' as ComponentType, label: 'Card', icon: '🎴' },
                { type: 'form' as ComponentType, label: 'Form', icon: '📋' },
                { type: 'video' as ComponentType, label: 'Video', icon: '🎥' },
                { type: 'spacer' as ComponentType, label: 'Spacer', icon: '↕️' },
                { type: 'divider' as ComponentType, label: 'Divider', icon: '➖' },
                { type: 'header' as ComponentType, label: 'Header', icon: '📋' },
                { type: 'footer' as ComponentType, label: 'Footer', icon: '⬇️' },
                { type: 'cart' as ComponentType, label: 'Cart', icon: '🛒' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleSelectComponentForColumn(item.type)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <span className="text-3xl mb-2">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Code Editor Modal */}
      {showCodeEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Page Code</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Generate code from components
                    generateCodeFromComponents();
                  }}
                  className="px-3 py-1 text-sm text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                >
                  Generate from Components
                </button>
                <button
                  onClick={() => setShowCodeEditor(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex">
              {/* Code Tabs */}
              <div className="w-1/4 bg-gray-50 border-r border-gray-200">
                <div className="p-4">
                  <nav className="space-y-1">
                    <button className="w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded">
                      HTML
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
                      CSS
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded">
                      JavaScript
                    </button>
                  </nav>
                </div>
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4">
                  <textarea
                    value={pageCode.html}
                    onChange={(e) => setPageCode(prev => ({ ...prev, html: e.target.value }))}
                    className="w-full h-full font-mono text-sm border border-gray-300 rounded p-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="HTML code will appear here..."
                    spellCheck={false}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-500">
                    Edit the source code directly. Changes will be applied to the page.
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCodeEditor(false)}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Apply code changes to components
                        applyCodeToComponents();
                        setShowCodeEditor(false);
                      }}
                      className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Picker Modal for "Add After" */}
      {showAfterComponentPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Component After</h3>
                <button
                  onClick={() => {
                    setShowAfterComponentPicker(false);
                    setAfterComponentId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {availableComponents.map((comp) => {
                  const Icon = comp.icon;
                  return (
                    <button
                      key={comp.type}
                      onClick={() => afterComponentId && handleAddAfter(afterComponentId, comp.type)}
                      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                    >
                      <div className={`p-2 rounded-lg bg-gray-50 flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${comp.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{comp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

