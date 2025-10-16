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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDesign = headerDesigns.find(d => d.id === selectedDesign) || headerDesigns[0];

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
    <div className="flex gap-4 h-full">
      {/* Left Sidebar - Ultra Compact Options */}
      <div className="w-40 flex-shrink-0 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Header Editor</h2>
        
        {/* Available Elements - Compact */}
        <div className="bg-white rounded border border-gray-200 p-3">
          <h3 className="text-xs font-medium text-gray-900 mb-2">Elements</h3>
          <div className="space-y-1">
            {isClient ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={defaultElements.map(el => el.id)}>
                  {defaultElements.map((element) => (
                    <DraggableSidebarElement
                      key={element.id}
                      element={element}
                      onAddElement={addElement}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-1">
                {defaultElements.map((element) => (
                  <DraggableSidebarElement
                    key={element.id}
                    element={element}
                    onAddElement={addElement}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Header Settings - Compact */}
        <div className="bg-white rounded border border-gray-200 p-3">
          <h3 className="text-xs font-medium text-gray-900 mb-2">Header</h3>
          <div className="space-y-2">
            {/* Static Menu Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600">Static</label>
              <button
                onClick={() => onSettingsChange({ ...settings, headerIsStatic: !settings.headerIsStatic })}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  settings.headerIsStatic ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.headerIsStatic ? 'translate-x-3' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Background</label>
              <input
                type="color"
                value={settings.headerBackgroundColor || '#ffffff'}
                onChange={(e) => onSettingsChange({ ...settings, headerBackgroundColor: e.target.value })}
                className="h-6 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Text Color</label>
              <input
                type="color"
                value={settings.headerTextColor || '#374151'}
                onChange={(e) => onSettingsChange({ ...settings, headerTextColor: e.target.value })}
                className="h-6 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>

            {/* Padding */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Padding</label>
              <input
                type="range"
                min="8"
                max="32"
                value={settings.headerPadding || 16}
                onChange={(e) => onSettingsChange({ ...settings, headerPadding: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{settings.headerPadding || 16}px</div>
            </div>
          </div>
        </div>

        {/* Logo Specific Settings */}
        <div className="bg-white rounded border border-gray-200 p-3">
          <h3 className="text-xs font-medium text-gray-900 mb-2">Logo</h3>
          <div className="space-y-2">
            {/* Logo Type Toggle */}
            <div className="flex space-x-1">
              <button
                onClick={() => onSettingsChange({ ...settings, logo: null })}
                className={`px-2 py-1 text-xs rounded ${
                  !settings.logo ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => onSettingsChange({ ...settings, logo: 'https://via.placeholder.com/200x60' })}
                className={`px-2 py-1 text-xs rounded ${
                  settings.logo ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Image
              </button>
            </div>

            {/* Logo Text */}
            {!settings.logo && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text</label>
                <input
                  type="text"
                  value={settings.logoText || 'NextPanel'}
                  onChange={(e) => onSettingsChange({ ...settings, logoText: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                />
              </div>
            )}

            {/* Logo Image Upload */}
            {settings.logo && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                <input
                  type="url"
                  value={settings.logo || ''}
                  onChange={(e) => onSettingsChange({ ...settings, logo: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            )}

            {/* Logo Color */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Color</label>
              <input
                type="color"
                value={settings.logoColor || '#4f46e5'}
                onChange={(e) => onSettingsChange({ ...settings, logoColor: e.target.value })}
                className="h-6 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>

            {/* Logo Dimensions */}
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width</label>
                <input
                  type="number"
                  value={settings.logoWidth || 200}
                  onChange={(e) => onSettingsChange({ ...settings, logoWidth: parseInt(e.target.value) || 200 })}
                  className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                  min="50"
                  max="400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input
                  type="number"
                  value={settings.logoHeight || 60}
                  onChange={(e) => onSettingsChange({ ...settings, logoHeight: parseInt(e.target.value) || 60 })}
                  className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                  min="20"
                  max="120"
                />
              </div>
            </div>

            {/* Logo Spacing */}
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Padding</label>
                <input
                  type="number"
                  value={settings.logoPadding || 16}
                  onChange={(e) => onSettingsChange({ ...settings, logoPadding: parseInt(e.target.value) || 16 })}
                  className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                  min="0"
                  max="40"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Opacity</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.logoOpacity || 100}
                  onChange={(e) => onSettingsChange({ ...settings, logoOpacity: parseInt(e.target.value) || 100 })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{settings.logoOpacity || 100}%</div>
              </div>
            </div>

            {/* Logo Font Family */}
            {!settings.logo && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Family</label>
                <select
                  value={settings.logoFontFamily || 'Inter'}
                  onChange={(e) => onSettingsChange({ ...settings, logoFontFamily: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Source Sans Pro">Source Sans Pro</option>
                  <option value="Nunito">Nunito</option>
                </select>
              </div>
            )}

            {/* Logo Position */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Position</label>
              <div className="flex space-x-1">
                <button
                  onClick={() => onSettingsChange({ ...settings, logoPosition: 'left' })}
                  className={`px-2 py-1 text-xs rounded ${
                    settings.logoPosition === 'left' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Left
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, logoPosition: 'center' })}
                  className={`px-2 py-1 text-xs rounded ${
                    settings.logoPosition === 'center' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Center
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, logoPosition: 'right' })}
                  className={`px-2 py-1 text-xs rounded ${
                    settings.logoPosition === 'right' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Right
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Preview and Element Options */}
      <div className="flex-1 sticky top-4 h-fit">
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
            
            {/* Template Selection - Compact */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Template:</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 hover:border-gray-400"
                >
                  <span>{currentDesign.name}</span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu - Compact */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Templates</div>
                      <div className="space-y-1">
                        {headerDesigns.map((design) => (
                          <div
                            key={design.id}
                            onClick={() => handleDesignSelect(design.id)}
                            className={`p-2 border rounded cursor-pointer transition-all ${
                              selectedDesign === design.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-xs font-medium text-gray-700">{design.name}</div>
                            <div className="text-xs text-gray-500">{design.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
