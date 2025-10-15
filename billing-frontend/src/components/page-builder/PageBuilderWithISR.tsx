'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ComponentLibrary from './ComponentLibrary';
import ComponentRenderer from './ComponentRenderer';
import PropertiesPanel from './PropertiesPanel';
import { Component, ComponentType } from './types';
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
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

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
  onColumnClick,
}: {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onColumnClick: (containerId: string, columnIndex: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative group">
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
          className={`transition-all cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
        >
          <ComponentRenderer
            component={component}
            isSelected={isSelected}
            isHovered={isHovered}
            onClick={() => {}} // Empty handler, click is handled by parent div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onAddToContainer={(containerId, type) => {}}
            onColumnClick={onColumnClick}
          />
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
        return { ...baseComponent, content: '<h1>Heading Text</h1>' };
      case 'text':
        return { ...baseComponent, content: '<p>Text content goes here...</p>' };
      case 'button':
        return { ...baseComponent, content: 'Click Me' };
      case 'image':
        return { ...baseComponent, props: { src: 'https://via.placeholder.com/800x400?text=Image' } };
      case 'section':
        return { ...baseComponent, children: [] };
      case 'container':
        return { 
          ...baseComponent, 
          children: [],
          props: { columns: 1 } // Default to 1 column
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
      case 'header':
        return { 
          ...baseComponent, 
          props: { 
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          } 
        };
      case 'footer':
        return { 
          ...baseComponent, 
          props: { 
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
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
      default:
        return baseComponent;
    }
  };

  const handleColumnClick = (containerId: string, columnIndex: number) => {
    setTargetContainer({ id: containerId, columnIndex });
    setShowComponentSelector(true);
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
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
      alert(`Failed to save page: ${error.message}`);
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
    desktop: '100%',
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
      <div className="flex flex-1 overflow-hidden">
        {/* Component Library */}
        {!previewMode && <ComponentLibrary onAddComponent={handleAddComponent} />}

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div
            className="bg-white shadow-lg mx-auto transition-all duration-300"
            style={{
              width: deviceWidths[deviceView],
              maxWidth: '100%',
              minHeight: '600px',
            }}
          >
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="p-8 space-y-4">
                  {components.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                      <PlusIcon className="h-16 w-16 mb-4" />
                      <p className="text-lg font-medium">Start building your page</p>
                      <p className="text-sm">Add components from the left panel</p>
                    </div>
                  ) : (
                    components.map((component) => (
                      <SortableComponent
                        key={component.id}
                        component={component}
                        isSelected={selectedComponent === component.id}
                        isHovered={hoveredComponent === component.id}
                        onClick={() => setSelectedComponent(component.id)}
                        onMouseEnter={() => setHoveredComponent(component.id)}
                        onMouseLeave={() => setHoveredComponent(null)}
                        onColumnClick={handleColumnClick}
                      />
                    ))
                  )}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <ComponentRenderer
                    component={components.find((c) => c.id === activeId)!}
                    isSelected={false}
                    isHovered={false}
                    onClick={() => {}}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* Properties Panel */}
        {!previewMode && (
          <>
            {selectedComponentData ? (
              <div className="relative">
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
          </>
        )}
      </div>

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
    </div>
  );
}

