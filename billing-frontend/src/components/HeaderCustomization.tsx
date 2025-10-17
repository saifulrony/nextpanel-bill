'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  PhotoIcon, 
  PlusIcon, 
  TrashIcon, 
  Cog6ToothIcon,
  Bars3Icon,
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface HeaderElement {
  id: string;
  type: 'logo' | 'navigation' | 'cart' | 'user-menu' | 'search' | 'wishlist' | 'notifications' | 'mobile-menu';
  label: string;
  icon?: React.ComponentType<any>;
  visible: boolean;
  position: number;
  settings: {
    color?: string;
    size?: string;
    backgroundColor?: string;
    padding?: number;
    margin?: number;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: string;
  };
}

interface HeaderDesign {
  id: string;
  name: string;
  description: string;
  preview: string;
  elements: HeaderElement[];
  layout: 'horizontal' | 'vertical' | 'centered' | 'split';
  style: 'minimal' | 'modern' | 'classic' | 'bold' | 'elegant';
}

const defaultElements: HeaderElement[] = [
  {
    id: 'logo',
    type: 'logo',
    label: 'Logo',
    visible: true,
    position: 0,
    icon: PhotoIcon,
    settings: {
      color: '#4f46e5',
      size: 'large',
      fontSize: 24,
      fontWeight: 'bold'
    }
  },
  {
    id: 'navigation',
    type: 'navigation',
    label: 'Navigation',
    visible: true,
    position: 1,
    icon: Bars3Icon,
    settings: {
      color: '#374151',
      fontSize: 16,
      fontWeight: 'medium'
    }
  },
  {
    id: 'search',
    type: 'search',
    label: 'Search',
    icon: MagnifyingGlassIcon,
    visible: true,
    position: 2,
    settings: {
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      padding: 8,
      borderRadius: 6
    }
  },
  {
    id: 'wishlist',
    type: 'wishlist',
    label: 'Wishlist',
    icon: HeartIcon,
    visible: false,
    position: 3,
    settings: {
      color: '#ef4444',
      size: 'medium'
    }
  },
  {
    id: 'notifications',
    type: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    visible: true,
    position: 4,
    settings: {
      color: '#6b7280',
      size: 'medium'
    }
  },
  {
    id: 'cart',
    type: 'cart',
    label: 'Cart',
    icon: ShoppingCartIcon,
    visible: true,
    position: 5,
    settings: {
      color: '#6b7280',
      backgroundColor: '#ffffff',
      padding: 8,
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 'medium'
    }
  },
  {
    id: 'user-menu',
    type: 'user-menu',
    label: 'User Menu',
    icon: UserIcon,
    visible: true,
    position: 6,
    settings: {
      color: '#374151',
      size: 'medium'
    }
  },
  {
    id: 'mobile-menu',
    type: 'mobile-menu',
    label: 'Mobile Menu',
    icon: Bars3Icon,
    visible: false,
    position: 7,
    settings: {
      color: '#374151',
      size: 'medium'
    }
  }
];

const headerDesigns: HeaderDesign[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple design with essential elements',
    preview: 'minimal-preview.jpg',
    layout: 'horizontal',
    style: 'minimal',
    elements: [
      { ...defaultElements[0], position: 0 }, // logo
      { ...defaultElements[1], position: 1 }, // navigation
      { ...defaultElements[5], position: 2 }, // cart
      { ...defaultElements[6], position: 3 }  // user-menu
    ]
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with search and notifications',
    preview: 'modern-preview.jpg',
    layout: 'horizontal',
    style: 'modern',
    elements: [
      { ...defaultElements[0], position: 0 }, // logo
      { ...defaultElements[1], position: 1 }, // navigation
      { ...defaultElements[2], position: 2 }, // search
      { ...defaultElements[4], position: 3, visible: true }, // notifications
      { ...defaultElements[5], position: 4 }, // cart
      { ...defaultElements[6], position: 5 }  // user-menu
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Full-featured design for online stores',
    preview: 'ecommerce-preview.jpg',
    layout: 'horizontal',
    style: 'bold',
    elements: [
      { ...defaultElements[0], position: 0 }, // logo
      { ...defaultElements[1], position: 1 }, // navigation
      { ...defaultElements[2], position: 2 }, // search
      { ...defaultElements[3], position: 3, visible: true }, // wishlist
      { ...defaultElements[4], position: 4, visible: true }, // notifications
      { ...defaultElements[5], position: 5 }, // cart
      { ...defaultElements[6], position: 6 }  // user-menu
    ]
  },
  {
    id: 'centered',
    name: 'Centered',
    description: 'Logo centered with navigation on sides',
    preview: 'centered-preview.jpg',
    layout: 'centered',
    style: 'elegant',
    elements: [
      { ...defaultElements[1], position: 0 }, // navigation (left)
      { ...defaultElements[0], position: 1 }, // logo (center)
      { ...defaultElements[5], position: 2 }, // cart (right)
      { ...defaultElements[6], position: 3 }  // user-menu (right)
    ]
  },
  {
    id: 'mobile-first',
    name: 'Mobile First',
    description: 'Responsive design optimized for mobile devices',
    preview: 'mobile-preview.jpg',
    layout: 'horizontal',
    style: 'modern',
    elements: [
      { ...defaultElements[0], position: 0 }, // logo
      { ...defaultElements[2], position: 1 }, // search
      { ...defaultElements[5], position: 2 }, // cart
      { ...defaultElements[7], position: 3, visible: true } // mobile-menu
    ]
  }
];

interface HeaderCustomizationProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

// Droppable Preview Area Component
function DroppablePreviewArea({ children, className, style }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'preview-area',
    data: {
      type: 'preview',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}`}
      style={style}
    >
      {children}
    </div>
  );
}

// Draggable Element Component for sidebar
function DraggableSidebarElement({ element, onAddElement }: {
  element: HeaderElement;
  onAddElement: (type: HeaderElement['type']) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: element.id,
    data: {
      type: 'sidebar-element',
      element: element,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-1.5 border border-gray-200 rounded cursor-move hover:border-indigo-300 hover:bg-indigo-50 transition-all text-xs"
    >
      <div className="flex items-center space-x-1.5">
        {element.icon && typeof element.icon === 'function' && <element.icon className="h-3 w-3 text-gray-500" />}
        <div className="font-medium text-gray-900 text-xs">{element.label}</div>
      </div>
    </div>
  );
}

// Draggable Element Component for preview area
function DraggableElement({ element, onToggleVisibility, onRemoveElement, onSelectElement, isSelected, isDragging }: {
  element: HeaderElement;
  onToggleVisibility: (id: string) => void;
  onRemoveElement: (id: string) => void;
  onSelectElement: (element: HeaderElement) => void;
  isSelected: boolean;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: element.id,
    data: {
      type: 'preview-element',
      element: element,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const renderElement = (element: HeaderElement) => {
    const IconComponent = element.icon;
    
    // Safety check to ensure IconComponent is a valid React component
    const isValidIcon = IconComponent && typeof IconComponent === 'function';
    
    switch (element.type) {
      case 'logo':
        return (
          <div className="flex items-center">
            <div 
              className="font-bold text-lg"
              style={{ 
                color: element.settings.color || '#4f46e5',
                fontSize: `${element.settings.fontSize || 18}px`,
                fontWeight: element.settings.fontWeight || 'bold'
              }}
            >
              Logo
            </div>
          </div>
        );
      
      case 'navigation':
        return (
          <nav className="flex space-x-4">
            <span className="hover:opacity-75 transition-opacity text-sm" style={{ color: element.settings.color }}>
              Home
            </span>
            <span className="hover:opacity-75 transition-opacity text-sm" style={{ color: element.settings.color }}>
              Products
            </span>
            <span className="hover:opacity-75 transition-opacity text-sm" style={{ color: element.settings.color }}>
              About
            </span>
          </nav>
        );
      
      case 'search':
        return (
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm pointer-events-none"
              style={{
                backgroundColor: element.settings.backgroundColor,
                color: element.settings.color,
                padding: `${element.settings.padding || 4}px`,
                borderRadius: `${element.settings.borderRadius || 4}px`,
                fontSize: `${element.settings.fontSize || 12}px`
              }}
              readOnly
            />
            {isValidIcon && (
              <IconComponent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            )}
          </div>
        );
      
      case 'cart':
        return (
          <button
            className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors pointer-events-none"
            style={{ color: element.settings.color || '#6b7280' }}
          >
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              0
            </span>
          </button>
        );
      
      case 'user-menu':
        return (
          <div className="relative pointer-events-none">
            <div className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
              <div 
                className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: element.settings.backgroundColor || '#4f46e5' }}
              >
                U
              </div>
              <span className="font-medium hidden sm:block">User</span>
            </div>
          </div>
        );
      
      case 'wishlist':
        return (
          <div
            className="flex items-center space-x-1 p-1 rounded hover:bg-gray-100 transition-colors pointer-events-none"
            style={{ color: element.settings.color }}
          >
            {isValidIcon && <IconComponent className="h-4 w-4" />}
            <span className="text-sm">Wishlist</span>
          </div>
        );
      
      case 'notifications':
        return (
          <button
            className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none"
            style={{ color: element.settings.color || '#6b7280' }}
          >
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">3</span>
          </button>
        );
      
      case 'mobile-menu':
        return (
          <div
            className="flex items-center space-x-1 p-1 rounded hover:bg-gray-100 transition-colors pointer-events-none"
            style={{ color: element.settings.color }}
          >
            {isValidIcon && <IconComponent className="h-4 w-4" />}
          </div>
        );
      
      default:
        return <div className="text-sm">{element.label}</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSelected ? 'ring-2 ring-indigo-500 rounded' : ''} ${isDragging ? 'ring-2 ring-red-500 rounded' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelectElement(element);
      }}
    >
      {/* Element Content */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move"
        title="Drag to reorder"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {renderElement(element)}
      </div>
    </div>
  );
}

export default function HeaderCustomization({ settings, onSettingsChange }: HeaderCustomizationProps) {
  const [selectedDesign, setSelectedDesign] = useState<string>('minimal');
  const [elements, setElements] = useState<HeaderElement[]>(defaultElements);
  const [selectedElement, setSelectedElement] = useState<HeaderElement | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [draggedElement, setDraggedElement] = useState<HeaderElement | null>(null);
  const [deviceType, setDeviceType] = useState<string>('desktop');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<string>('minimal');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDesign = headerDesigns.find(d => d.id === selectedDesign) || headerDesigns[0];

  // Template functions
  const getTemplatesForDevice = (device: string) => {
    if (device === 'mobile') {
      return [
        {
          id: 'mobile-burger',
          name: 'Burger Menu',
          description: 'Mobile-first with burger menu',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'thin',
          showNavigation: false,
          showCart: true,
          showUserMenu: true,
          showSearch: false,
          showNotifications: true,
          showMobileMenu: true,
          layout: 'mobile-burger',
        },
        {
          id: 'mobile-compact',
          name: 'Compact Mobile',
          description: 'Minimal mobile design',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'thin',
          showNavigation: false,
          showCart: true,
          showUserMenu: true,
          showSearch: false,
          showNotifications: false,
          showMobileMenu: true,
          layout: 'mobile-compact',
        },
        {
          id: 'mobile-search',
          name: 'Mobile Search',
          description: 'Mobile with search bar',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'medium',
          showNavigation: false,
          showCart: true,
          showUserMenu: true,
          showSearch: true,
          showNotifications: false,
          showMobileMenu: true,
          layout: 'mobile-search',
        },
        {
          id: 'mobile-full',
          name: 'Full Mobile',
          description: 'Complete mobile header',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'medium',
          showNavigation: false,
          showCart: true,
          showUserMenu: true,
          showSearch: true,
          showNotifications: true,
          showMobileMenu: true,
          layout: 'mobile-full',
        }
      ];
    } else if (device === 'tablet') {
      return [
        {
          id: 'tablet-responsive',
          name: 'Tablet Responsive',
          description: 'Optimized for tablet screens',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'medium',
          showNavigation: true,
          showCart: true,
          showUserMenu: true,
          showSearch: false,
          showNotifications: false,
          showMobileMenu: false,
          layout: 'horizontal',
        },
        {
          id: 'tablet-compact',
          name: 'Tablet Compact',
          description: 'Compact tablet design',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'thin',
          showNavigation: true,
          showCart: true,
          showUserMenu: true,
          showSearch: false,
          showNotifications: false,
          showMobileMenu: false,
          layout: 'horizontal',
        },
        {
          id: 'tablet-centered',
          name: 'Tablet Centered',
          description: 'Centered tablet layout',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'medium',
          showNavigation: true,
          showCart: true,
          showUserMenu: true,
          showSearch: true,
          showNotifications: false,
          showMobileMenu: false,
          layout: 'centered',
        }
      ];
    } else {
      // Desktop templates
      return [
        {
          id: 'minimal',
          name: 'Minimal',
          description: 'Clean and simple design',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'thin',
          showNavigation: true,
          showCart: false,
          showUserMenu: false,
          showSearch: false,
          showNotifications: false,
          showMobileMenu: false,
          layout: 'horizontal',
        },
        {
          id: 'thick',
          name: 'Thick Header',
          description: 'Bold header with more height',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'thick',
          showNavigation: true,
          showCart: true,
          showUserMenu: true,
          showSearch: false,
          showNotifications: false,
          showMobileMenu: false,
          layout: 'horizontal',
        },
        {
          id: 'centered',
          name: 'Centered Layout',
          description: 'Logo centered with side elements',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'medium',
          showNavigation: true,
          showCart: true,
          showUserMenu: true,
          showSearch: false,
          showNotifications: false,
          showMobileMenu: false,
          layout: 'centered',
        },
        {
          id: 'split',
          name: 'Split Layout',
          description: 'Split design with different sections',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'medium',
          showNavigation: true,
          showCart: true,
          showUserMenu: true,
          showSearch: true,
          showNotifications: false,
          showMobileMenu: false,
          layout: 'split',
        },
        {
          id: 'vertical',
          name: 'Vertical Stack',
          description: 'Vertical stacked elements',
          logoText: 'Logo',
          logoColor: '#4f46e5',
          textColor: '#374151',
          backgroundColor: '#ffffff',
          height: 'tall',
          showNavigation: true,
          showCart: true,
          showUserMenu: true,
          showSearch: true,
          showNotifications: true,
          showMobileMenu: false,
          layout: 'vertical',
        }
      ];
    }
  };

  const applyTemplate = (templateId: string) => {
    setCurrentTemplate(templateId);
    const templates = getTemplatesForDevice(deviceType);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedDesign(templateId);
      // Apply template settings
      onSettingsChange({
        ...settings,
        headerDesign: templateId,
        headerBackgroundColor: template.backgroundColor,
        headerTextColor: template.textColor,
        logoColor: template.logoColor,
        logoText: template.logoText,
      });
      
      // Update elements based on template features
      const updatedElements = elements.map(el => {
        if (el.type === 'navigation') return { ...el, visible: template.showNavigation };
        if (el.type === 'cart') return { ...el, visible: template.showCart };
        if (el.type === 'user-menu') return { ...el, visible: template.showUserMenu };
        if (el.type === 'search') return { ...el, visible: template.showSearch };
        if (el.type === 'notifications') return { ...el, visible: template.showNotifications };
        if (el.type === 'mobile-menu') return { ...el, visible: template.showMobileMenu };
        return el;
      });
      setElements(updatedElements);
    }
  };

  // Set client state to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved header design on mount
  useEffect(() => {
    if (settings?.headerDesign) {
      const { selectedDesign: savedDesign, elements: savedElements, deviceType: savedDeviceType } = settings.headerDesign;
      if (savedDesign) setSelectedDesign(savedDesign);
      if (savedElements) setElements(savedElements);
      if (savedDeviceType) setDeviceType(savedDeviceType);
    }
  }, [settings?.headerDesign]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDesignSelect = (designId: string) => {
    setSelectedDesign(designId);
    setIsDropdownOpen(false);
    const design = headerDesigns.find(d => d.id === designId);
    if (design) {
      setElements(design.elements);
    }
  };

  const handleReset = () => {
    setSelectedDesign('minimal');
    setElements(defaultElements);
    setSelectedElement(null);
  };

  const handleSave = () => {
    // Save the current header design to settings
    const headerDesign = {
      selectedDesign,
      elements: elements.filter(el => el.visible),
      deviceType,
      timestamp: new Date().toISOString()
    };
    
    // Update the settings with the new header design
    onSettingsChange({
      ...settings,
      headerDesign
    });
    
    // Show success message (you can replace this with a toast notification)
    alert('Header design saved successfully!');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    const draggedEl = elements.find(el => el.id === event.active.id);
    if (draggedEl) {
      setDraggedElement(draggedEl);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    // Check if dragging from sidebar to preview
    if (active.data.current?.type === 'sidebar-element' && over?.data.current?.type === 'preview') {
      const elementType = active.data.current.element.type;
      addElement(elementType);
      return;
    }

    // Handle reordering within preview
    if (active.id !== over?.id && active.data.current?.type !== 'sidebar-element') {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newElements = arrayMove(items, oldIndex, newIndex);
        
        // Update positions
        return newElements.map((element, index) => ({
          ...element,
          position: index
        }));
      });
    }
    
    // Keep dragged element selected for options (don't clear)
    // setDraggedElement(null);
  };

  const toggleElementVisibility = (elementId: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, visible: !el.visible } : el
    ));
    
    // Update selectedElement if it's the one being modified
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(prev => prev ? { ...prev, visible: !prev.visible } : null);
    }
    
    // Update draggedElement if it's the one being modified
    if (draggedElement && draggedElement.id === elementId) {
      setDraggedElement(prev => prev ? { ...prev, visible: !prev.visible } : null);
    }
  };

  const updateElementSettings = (elementId: string, newSettings: Partial<HeaderElement['settings']>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, settings: { ...el.settings, ...newSettings } }
        : el
    ));
    
    // Update selectedElement if it's the one being modified
    if (selectedElement && selectedElement.id === elementId) {
      setSelectedElement(prev => prev ? { ...prev, settings: { ...prev.settings, ...newSettings } } : null);
    }
    
    // Update draggedElement if it's the one being modified
    if (draggedElement && draggedElement.id === elementId) {
      setDraggedElement(prev => prev ? { ...prev, settings: { ...prev.settings, ...newSettings } } : null);
    }
  };

  const addElement = (type: HeaderElement['type']) => {
    const newElement: HeaderElement = {
      id: `${type}-${Date.now()}`,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
      visible: true,
      position: elements.length,
      settings: defaultElements.find(el => el.type === type)?.settings || {}
    };
    setElements(prev => [...prev, newElement]);
  };

  const removeElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
  };


  return (
    <div className="w-full">
      {/* Preview and Templates */}
      <div className="w-full">
        <div className="bg-white rounded border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <h3 className="text-xs font-medium text-gray-700">Preview</h3>
              
              {/* Device Type Selection - Compact */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setDeviceType('desktop')}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    deviceType === 'desktop'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Desktop"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setDeviceType('tablet')}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    deviceType === 'tablet'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Tablet"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H5V6h14v12z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setDeviceType('mobile')}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    deviceType === 'mobile'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Mobile"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5-5h2v2h-2v-2z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Edit with Header Editor Button */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.open('/admin/header-editor', '_blank')}
                className="flex items-center space-x-1 bg-indigo-600 text-white border border-indigo-600 rounded px-3 py-1 text-xs hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit with Header Editor</span>
              </button>
            </div>
          </div>

          {/* Live Preview with Drag and Drop */}
          <div className="bg-gray-50 rounded border p-2">
            <div className="text-xs text-gray-500 mb-1">{currentDesign.name} ({deviceType})</div>
            {isClient ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <DroppablePreviewArea
                  className={`mx-auto ${
                    deviceType === 'desktop' ? 'max-w-4xl' : 
                    deviceType === 'tablet' ? 'max-w-2xl' : 
                    'max-w-sm'
                  }`}
                >
                  <SortableContext
                    items={elements.filter(el => el.visible).map(el => el.id)}
                    strategy={verticalListSortingStrategy}
                  >
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded"
                    style={{
                      backgroundColor: settings.headerBackgroundColor || '#ffffff',
                      color: settings.headerTextColor || '#374151',
                      padding: `${Math.max((settings.headerPadding || 16) * 0.6, 8)}px`,
                      borderRadius: `${settings.headerBorderRadius || 0}px`,
                      boxShadow: settings.headerShadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 
                                 settings.headerShadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                                 settings.headerShadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                      marginTop: `${settings.headerMarginTop || 0}px`,
                      marginBottom: `${settings.headerMarginBottom || 0}px`,
                      marginLeft: `${settings.headerMarginLeft || 0}px`,
                      marginRight: `${settings.headerMarginRight || 0}px`
                    }}
                  >
                    {currentDesign.layout === 'centered' ? (
                      <>
                        <div className="flex items-center space-x-3">
                          {elements
                            .filter(el => el.visible && el.position < 2)
                            .sort((a, b) => a.position - b.position)
                            .map(el => (
                              <DraggableElement
                                key={el.id}
                                element={el}
                                onToggleVisibility={toggleElementVisibility}
                                onRemoveElement={removeElement}
                                onSelectElement={setSelectedElement}
                                isSelected={selectedElement?.id === el.id}
                                isDragging={draggedElement?.id === el.id}
                              />
                            ))}
                        </div>
                        <div className="flex items-center">
                          {elements
                            .filter(el => el.visible && el.position === 2)
                            .map(el => (
                              <DraggableElement
                                key={el.id}
                                element={el}
                                onToggleVisibility={toggleElementVisibility}
                                onRemoveElement={removeElement}
                                onSelectElement={setSelectedElement}
                                isSelected={selectedElement?.id === el.id}
                                isDragging={draggedElement?.id === el.id}
                              />
                            ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          {elements
                            .filter(el => el.visible && el.position > 2)
                            .sort((a, b) => a.position - b.position)
                            .map(el => (
                              <DraggableElement
                                key={el.id}
                                element={el}
                                onToggleVisibility={toggleElementVisibility}
                                onRemoveElement={removeElement}
                                onSelectElement={setSelectedElement}
                                isSelected={selectedElement?.id === el.id}
                                isDragging={draggedElement?.id === el.id}
                              />
                            ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          {elements
                            .filter(el => el.visible && el.position < 3)
                            .sort((a, b) => a.position - b.position)
                            .map(el => (
                              <DraggableElement
                                key={el.id}
                                element={el}
                                onToggleVisibility={toggleElementVisibility}
                                onRemoveElement={removeElement}
                                onSelectElement={setSelectedElement}
                                isSelected={selectedElement?.id === el.id}
                                isDragging={draggedElement?.id === el.id}
                              />
                            ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          {elements
                            .filter(el => el.visible && el.position >= 3)
                            .sort((a, b) => a.position - b.position)
                            .map(el => (
                              <DraggableElement
                                key={el.id}
                                element={el}
                                onToggleVisibility={toggleElementVisibility}
                                onRemoveElement={removeElement}
                                onSelectElement={setSelectedElement}
                                isSelected={selectedElement?.id === el.id}
                                isDragging={draggedElement?.id === el.id}
                              />
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                  </SortableContext>
                </DroppablePreviewArea>
              </DndContext>
            ) : (
              <div
                className={`mx-auto ${
                  deviceType === 'desktop' ? 'max-w-4xl' : 
                  deviceType === 'tablet' ? 'max-w-2xl' : 
                  'max-w-sm'
                }`}
              >
                <div
                  className="flex items-center justify-between px-3 py-2 rounded"
                  style={{
                    backgroundColor: settings.headerBackgroundColor || '#ffffff',
                    color: settings.headerTextColor || '#374151',
                    padding: `${Math.max((settings.headerPadding || 16) * 0.6, 8)}px`,
                    borderRadius: `${settings.headerBorderRadius || 0}px`,
                    boxShadow: settings.headerShadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 
                               settings.headerShadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                               settings.headerShadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                    marginTop: `${settings.headerMarginTop || 0}px`,
                    marginBottom: `${settings.headerMarginBottom || 0}px`,
                    marginLeft: `${settings.headerMarginLeft || 0}px`,
                    marginRight: `${settings.headerMarginRight || 0}px`
                  }}
                >
                  {currentDesign.layout === 'centered' ? (
                    <>
                      <div className="flex items-center space-x-3">
                        {elements
                          .filter(el => el.visible && el.position < 2)
                          .sort((a, b) => a.position - b.position)
                          .map(el => (
                            <DraggableElement
                              key={el.id}
                              element={el}
                              onToggleVisibility={toggleElementVisibility}
                              onRemoveElement={removeElement}
                              onSelectElement={setSelectedElement}
                              isSelected={selectedElement?.id === el.id}
                              isDragging={draggedElement?.id === el.id}
                            />
                          ))}
                      </div>
                      <div className="flex items-center">
                        {elements
                          .filter(el => el.visible && el.position === 2)
                          .map(el => (
                            <DraggableElement
                              key={el.id}
                              element={el}
                              onToggleVisibility={toggleElementVisibility}
                              onRemoveElement={removeElement}
                              onSelectElement={setSelectedElement}
                              isSelected={selectedElement?.id === el.id}
                              isDragging={draggedElement?.id === el.id}
                            />
                          ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        {elements
                          .filter(el => el.visible && el.position > 2)
                          .sort((a, b) => a.position - b.position)
                          .map(el => (
                            <DraggableElement
                              key={el.id}
                              element={el}
                              onToggleVisibility={toggleElementVisibility}
                              onRemoveElement={removeElement}
                              onSelectElement={setSelectedElement}
                              isSelected={selectedElement?.id === el.id}
                              isDragging={draggedElement?.id === el.id}
                            />
                          ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        {elements
                          .filter(el => el.visible && el.position < 3)
                          .sort((a, b) => a.position - b.position)
                          .map(el => (
                            <DraggableElement
                              key={el.id}
                              element={el}
                              onToggleVisibility={toggleElementVisibility}
                              onRemoveElement={removeElement}
                              onSelectElement={setSelectedElement}
                              isSelected={selectedElement?.id === el.id}
                              isDragging={draggedElement?.id === el.id}
                            />
                          ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        {elements
                          .filter(el => el.visible && el.position >= 3)
                          .sort((a, b) => a.position - b.position)
                          .map(el => (
                            <DraggableElement
                              key={el.id}
                              element={el}
                              onToggleVisibility={toggleElementVisibility}
                              onRemoveElement={removeElement}
                              onSelectElement={setSelectedElement}
                              isSelected={selectedElement?.id === el.id}
                              isDragging={draggedElement?.id === el.id}
                            />
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Choose Template</h4>
            <div className="grid grid-cols-2 gap-3">
              {getTemplatesForDevice(deviceType).map((template, index) => (
                <div
                  key={index}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    currentTemplate === template.id 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => applyTemplate(template.id)}
                >
                  {/* Radio Button and Template Name */}
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={currentTemplate === template.id}
                      onChange={() => applyTemplate(template.id)}
                      className="w-3 h-3 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-gray-700">{template.name}</span>
                  </div>
                  
                  {/* Compact Template Design Preview */}
                  <div className="w-full">
                    <div
                      className={`rounded ${
                        template.layout === 'vertical' ? 'flex flex-col space-y-1' : 'flex items-center justify-between'
                      }`}
                      style={{
                        backgroundColor: 'rgb(243, 239, 239)',
                        color: template.textColor || '#374151',
                        padding: template.height === 'thin' ? '3px 6px' : 
                                 template.height === 'medium' ? '4px 8px' : 
                                 template.height === 'thick' ? '6px 10px' : 
                                 template.height === 'tall' ? '8px 12px' : '4px',
                        borderRadius: '0px',
                        boxShadow: 'none',
                        margin: '0px',
                        fontSize: '8px'
                      }}
                    >
                      {/* Compact layouts based on template */}
                      {template.layout === 'centered' ? (
                        <>
                          <div className="flex items-center space-x-2">
                            {template.showNavigation && (
                              <nav className="flex space-x-2">
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Home</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Products</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>About</span>
                              </nav>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {template.showCart && (
                              <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors pointer-events-none" style={{ color: '#6b7280' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                              </button>
                            )}
                            {template.showUserMenu && (
                              <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                <span className="font-medium hidden sm:block text-xs">User</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : template.layout === 'split' ? (
                        <>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                            {template.showSearch && (
                              <div className="relative">
                                <input 
                                  placeholder="Search..." 
                                  className="px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs pointer-events-none" 
                                  readOnly 
                                  type="text" 
                                  style={{
                                    backgroundColor: '#f9fafb',
                                    color: '#6b7280',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    fontSize: '8px'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {template.showNavigation && (
                              <nav className="flex space-x-2">
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Home</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Products</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>About</span>
                              </nav>
                            )}
                            {template.showCart && (
                              <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors pointer-events-none" style={{ color: '#6b7280' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                              </button>
                            )}
                            {template.showUserMenu && (
                              <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                <span className="font-medium hidden sm:block text-xs">User</span>
                              </div>
                            )}
                          </div>
                        </>
                      ) : template.layout === 'vertical' ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                            <div className="flex items-center space-x-1">
                              {template.showNotifications && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center text-[6px]">3</span>
                                </button>
                              )}
                              {template.showCart && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                                </button>
                              )}
                              {template.showUserMenu && (
                                <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                  <span className="font-medium hidden sm:block text-xs">User</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            {template.showNavigation && (
                              <nav className="flex space-x-2">
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Home</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Products</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>About</span>
                              </nav>
                            )}
                            {template.showSearch && (
                              <div className="relative">
                                <input 
                                  placeholder="Search..." 
                                  className="px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs pointer-events-none" 
                                  readOnly 
                                  type="text" 
                                  style={{
                                    backgroundColor: '#f9fafb',
                                    color: '#6b7280',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    fontSize: '8px'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      ) : template.layout === 'mobile-burger' ? (
                        // Mobile burger menu layout
                        <>
                          <div className="flex items-center justify-between w-full">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                            <div className="flex items-center space-x-1">
                              {template.showNotifications && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center text-[6px]">3</span>
                                </button>
                              )}
                              {template.showCart && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                                </button>
                              )}
                              {template.showUserMenu && (
                                <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                </div>
                              )}
                              {template.showMobileMenu && (
                                <button className="p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : template.layout === 'mobile-compact' ? (
                        // Mobile compact layout
                        <>
                          <div className="flex items-center justify-between w-full">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                            <div className="flex items-center space-x-1">
                              {template.showCart && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                                </button>
                              )}
                              {template.showUserMenu && (
                                <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                </div>
                              )}
                              {template.showMobileMenu && (
                                <button className="p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : template.layout === 'mobile-search' ? (
                        // Mobile search layout
                        <>
                          <div className="flex items-center justify-between w-full">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                            <div className="flex items-center space-x-1">
                              {template.showSearch && (
                                <div className="relative">
                                  <input 
                                    placeholder="Search..." 
                                    className="px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs pointer-events-none" 
                                    readOnly 
                                    type="text" 
                                    style={{
                                      backgroundColor: '#f9fafb',
                                      color: '#6b7280',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      fontSize: '8px',
                                      width: '60px'
                                    }}
                                  />
                                </div>
                              )}
                              {template.showCart && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                                </button>
                              )}
                              {template.showUserMenu && (
                                <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                </div>
                              )}
                              {template.showMobileMenu && (
                                <button className="p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : template.layout === 'mobile-full' ? (
                        // Mobile full layout
                        <>
                          <div className="flex items-center justify-between w-full">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                            <div className="flex items-center space-x-1">
                              {template.showSearch && (
                                <div className="relative">
                                  <input 
                                    placeholder="Search..." 
                                    className="px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs pointer-events-none" 
                                    readOnly 
                                    type="text" 
                                    style={{
                                      backgroundColor: '#f9fafb',
                                      color: '#6b7280',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      fontSize: '8px',
                                      width: '50px'
                                    }}
                                  />
                                </div>
                              )}
                              {template.showNotifications && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center text-[6px]">3</span>
                                </button>
                              )}
                              {template.showCart && (
                                <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                  </svg>
                                  <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                                </button>
                              )}
                              {template.showUserMenu && (
                                <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                </div>
                              )}
                              {template.showMobileMenu && (
                                <button className="p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        // Default horizontal layout
                        <>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="font-bold"
                              style={{ 
                                color: template.logoColor || '#4f46e5',
                                fontSize: template.height === 'thick' ? '14px' : template.height === 'tall' ? '16px' : '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {template.logoText || 'Logo'}
                            </div>
                            {template.showNavigation && (
                              <nav className="flex space-x-2">
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Home</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>Products</span>
                                <span className="text-xs hover:opacity-75 transition-opacity" style={{ color: template.textColor || '#374151' }}>About</span>
                              </nav>
                            )}
                            {template.showSearch && (
                              <div className="relative">
                                <input 
                                  placeholder="Search..." 
                                  className="px-1 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs pointer-events-none" 
                                  readOnly 
                                  type="text" 
                                  style={{
                                    backgroundColor: '#f9fafb',
                                    color: '#6b7280',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    fontSize: '8px'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {template.showNotifications && (
                              <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                </svg>
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full h-3 w-3 flex items-center justify-center">3</span>
                              </button>
                            )}
                            {template.showCart && (
                              <button className="relative p-1 text-gray-600 hover:text-gray-900 transition-colors pointer-events-none" style={{ color: '#6b7280' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-3 w-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full h-2 w-2 flex items-center justify-center animate-pulse text-[6px]">0</span>
                              </button>
                            )}
                            {template.showUserMenu && (
                              <div className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
                                <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5', fontSize: '8px' }}>U</div>
                                <span className="font-medium hidden sm:block text-xs">User</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Element Options - Compact and Specific */}
          {selectedElement && (
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">Element: {selectedElement.label}</div>
              <div className="bg-gray-50 rounded p-3">
                {/* Element-specific settings based on type */}
                {selectedElement.type === 'logo' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                        <input
                          type="text"
                          value={settings.logoText || 'NextPanel'}
                          onChange={(e) => onSettingsChange({ ...settings, logoText: e.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={settings.logoColor || '#4f46e5'}
                          onChange={(e) => onSettingsChange({ ...settings, logoColor: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={selectedElement.settings.fontSize || 24}
                          onChange={(e) => updateElementSettings(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="12"
                          max="48"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Weight</label>
                        <select
                          value={selectedElement.settings.fontWeight || 'bold'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { fontWeight: e.target.value })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="semibold">Semi Bold</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Padding</label>
                        <input
                          type="number"
                          value={settings.logoPadding || 16}
                          onChange={(e) => onSettingsChange({ ...settings, logoPadding: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="0"
                          max="40"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'navigation' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={selectedElement.settings.color || '#4b5563'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { color: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={selectedElement.settings.fontSize || 16}
                          onChange={(e) => updateElementSettings(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="12"
                          max="24"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                        <select
                          value={selectedElement.settings.fontWeight || 'medium'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { fontWeight: e.target.value })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="semibold">Semi Bold</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Spacing</label>
                        <input
                          type="number"
                          value={selectedElement.settings.padding || 8}
                          onChange={(e) => updateElementSettings(selectedElement.id, { padding: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="0"
                          max="32"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'search' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                        <input
                          type="color"
                          value={selectedElement.settings.backgroundColor || '#ffffff'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { backgroundColor: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                        <input
                          type="color"
                          value={selectedElement.settings.color || '#374151'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { color: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={selectedElement.settings.fontSize || 14}
                          onChange={(e) => updateElementSettings(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="10"
                          max="20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Padding</label>
                        <input
                          type="number"
                          value={selectedElement.settings.padding || 8}
                          onChange={(e) => updateElementSettings(selectedElement.id, { padding: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="4"
                          max="20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Radius</label>
                        <input
                          type="number"
                          value={selectedElement.settings.borderRadius || 6}
                          onChange={(e) => updateElementSettings(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="0"
                          max="20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type === 'cart' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={selectedElement.settings.color || '#6b7280'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { color: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                        <input
                          type="number"
                          value={selectedElement.settings.fontSize || 16}
                          onChange={(e) => updateElementSettings(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="12"
                          max="24"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
                        <input
                          type="number"
                          value={selectedElement.settings.padding || 8}
                          onChange={(e) => updateElementSettings(selectedElement.id, { padding: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="4"
                          max="20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                        <input
                          type="color"
                          value={selectedElement.settings.backgroundColor || '#ffffff'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { backgroundColor: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Default settings for other elements */}
                {!['logo', 'navigation', 'search', 'cart'].includes(selectedElement.type) && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={selectedElement.settings.color || '#374151'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { color: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                        <input
                          type="color"
                          value={selectedElement.settings.backgroundColor || '#ffffff'}
                          onChange={(e) => updateElementSettings(selectedElement.id, { backgroundColor: e.target.value })}
                          className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={selectedElement.settings.fontSize || 14}
                          onChange={(e) => updateElementSettings(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="10"
                          max="32"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
                        <input
                          type="number"
                          value={selectedElement.settings.padding || 8}
                          onChange={(e) => updateElementSettings(selectedElement.id, { padding: parseInt(e.target.value) })}
                          className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                          min="0"
                          max="32"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleElementVisibility(selectedElement.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedElement.visible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {selectedElement.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <button
                    onClick={() => removeElement(selectedElement.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drag Options - Compact Quick Edit */}
          {draggedElement && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-gray-500">Quick Edit: {draggedElement.label}</div>
                <button
                  onClick={() => setDraggedElement(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Color</label>
                    <input
                      type="color"
                      value={draggedElement.settings.color || '#374151'}
                      onChange={(e) => updateElementSettings(draggedElement.id, { color: e.target.value })}
                      className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Background</label>
                    <input
                      type="color"
                      value={draggedElement.settings.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElementSettings(draggedElement.id, { backgroundColor: e.target.value })}
                      className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Size</label>
                    <input
                      type="number"
                      value={draggedElement.settings.fontSize || 14}
                      onChange={(e) => updateElementSettings(draggedElement.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                      min="10"
                      max="32"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Padding</label>
                    <input
                      type="number"
                      value={draggedElement.settings.padding || 8}
                      onChange={(e) => updateElementSettings(draggedElement.id, { padding: parseInt(e.target.value) })}
                      className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                      min="0"
                      max="32"
                    />
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={() => toggleElementVisibility(draggedElement.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      draggedElement.visible
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {draggedElement.visible ? 'Visible' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => removeElement(draggedElement.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Compact */}
          <div className="mt-3 flex justify-between">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium"
            >
              Save Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
