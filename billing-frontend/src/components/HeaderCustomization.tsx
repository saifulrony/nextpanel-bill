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
      className="p-2 border border-gray-200 rounded cursor-move hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm"
    >
      <div className="flex items-center space-x-2">
        {element.icon && typeof element.icon === 'function' && <element.icon className="h-4 w-4 text-gray-500" />}
        <div className="font-medium text-gray-900">{element.label}</div>
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
    <div className="flex gap-6 h-full">
      {/* Left Sidebar - Compact Options */}
      <div className="w-48 flex-shrink-0 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Header Customization</h2>
        
        {/* Available Elements */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add Elements</h3>
          <div className="space-y-2">
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
              <div className="space-y-2">
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

        {/* Global Header Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Header Settings</h3>
          <div className="space-y-3">
            {/* Static Menu Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-600">Static Menu</label>
              <button
                onClick={() => onSettingsChange({ ...settings, headerIsStatic: !settings.headerIsStatic })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.headerIsStatic ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.headerIsStatic ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Header Margin Controls */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Header Margins</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="number"
                    value={settings.headerMarginTop || 0}
                    onChange={(e) => onSettingsChange({ ...settings, headerMarginTop: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="number"
                    value={settings.headerMarginBottom || 0}
                    onChange={(e) => onSettingsChange({ ...settings, headerMarginBottom: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="number"
                    value={settings.headerMarginLeft || 0}
                    onChange={(e) => onSettingsChange({ ...settings, headerMarginLeft: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="number"
                    value={settings.headerMarginRight || 0}
                    onChange={(e) => onSettingsChange({ ...settings, headerMarginRight: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Element Settings - Compact */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Settings</h3>
          <div className="space-y-3">
            {elements.slice(0, 3).map((element) => (
              <div key={element.id} className="p-2 bg-gray-50 rounded text-xs">
                <div className="font-medium mb-2">{element.label}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Color</label>
                    <input
                      type="color"
                      value={element.settings.color || '#374151'}
                      onChange={(e) => updateElementSettings(element.id, { color: e.target.value })}
                      className="h-6 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Size</label>
                    <input
                      type="number"
                      value={element.settings.fontSize || 14}
                      onChange={(e) => updateElementSettings(element.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full rounded border border-gray-300 px-1 py-1 text-xs"
                      min="10"
                      max="32"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Preview and Element Options */}
      <div className="flex-1 sticky top-4 h-fit">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-medium text-gray-700">Header Preview</h3>
              
              {/* Device Type Selection */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDeviceType('desktop')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    deviceType === 'desktop'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                  title="Desktop View"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
                  </svg>
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setDeviceType('tablet')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    deviceType === 'tablet'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                  title="Tablet View"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-2 14H5V6h14v12z"/>
                  </svg>
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => setDeviceType('mobile')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    deviceType === 'mobile'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                  title="Mobile View"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zm-5-5h2v2h-2v-2z"/>
                  </svg>
                  <span>Mobile</span>
                </button>
              </div>
            </div>
            
            {/* Template Selection Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Template:</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 bg-white border border-gray-300 rounded px-3 py-1 text-xs text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <span>{currentDesign.name}</span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">Choose Template</div>
                      <div className="grid grid-cols-1 gap-2">
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
                            <div className="mt-1 h-6 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                              {design.layout === 'centered' && 'Logo | Nav | Cart'}
                              {design.layout === 'split' && 'Logo | Nav | Cart | User'}
                              {design.layout === 'minimal' && 'Logo | Nav'}
                              {design.layout === 'compact' && 'Logo | Nav | Search'}
                              {design.layout === 'modern' && 'Logo | Nav | Icons'}
                            </div>
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
          <div className="bg-gray-50 rounded border p-3">
            <div className="text-xs text-gray-500 mb-2">Live Preview - {currentDesign.name} ({deviceType})</div>
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

          {/* Element Options - Outside Preview Box */}
          {selectedElement && (
            <div className="mt-6">
              <div className="text-xs text-gray-500 mb-3">Element Settings - {selectedElement.label}</div>
              <div className="bg-gray-50 rounded p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedElement.settings.color || '#374151'}
                      onChange={(e) => updateElementSettings(selectedElement.id, { color: e.target.value })}
                      className="h-8 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                    <input
                      type="color"
                      value={selectedElement.settings.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElementSettings(selectedElement.id, { backgroundColor: e.target.value })}
                      className="h-8 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                    <input
                      type="number"
                      value={selectedElement.settings.fontSize || 14}
                      onChange={(e) => updateElementSettings(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
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
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      min="0"
                      max="32"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleElementVisibility(selectedElement.id)}
                      className={`px-3 py-1 text-xs rounded ${
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
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove Element
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drag Options - Show when dragging or after drag */}
          {draggedElement && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-500">Quick Edit - {draggedElement.label}</div>
                <button
                  onClick={() => setDraggedElement(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={draggedElement.settings.color || '#374151'}
                      onChange={(e) => updateElementSettings(draggedElement.id, { color: e.target.value })}
                      className="h-8 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                    <input
                      type="color"
                      value={draggedElement.settings.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElementSettings(draggedElement.id, { backgroundColor: e.target.value })}
                      className="h-8 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                    <input
                      type="number"
                      value={draggedElement.settings.fontSize || 14}
                      onChange={(e) => updateElementSettings(draggedElement.id, { fontSize: parseInt(e.target.value) })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      min="10"
                      max="32"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>
                    <input
                      type="number"
                      value={draggedElement.settings.padding || 8}
                      onChange={(e) => updateElementSettings(draggedElement.id, { padding: parseInt(e.target.value) })}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                      min="0"
                      max="32"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleElementVisibility(draggedElement.id)}
                      className={`px-3 py-1 text-xs rounded ${
                        draggedElement.visible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {draggedElement.visible ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                  <button
                    onClick={() => removeElement(draggedElement.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove Element
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Reset Design
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium"
            >
              Save Header Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
