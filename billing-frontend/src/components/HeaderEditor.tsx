'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Bars3Icon, 
  MagnifyingGlassIcon, 
  ShoppingCartIcon, 
  BellIcon, 
  UserCircleIcon,
  XMarkIcon,
  PlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface CustomizationSettings {
  // Logo settings
  logo: string | null;
  logoWidth: number;
  logoHeight: number;
  logoPosition: 'left' | 'center' | 'right';
  logoPadding: number;
  logoOpacity: number;
  logoMaxWidth: string;
  logoText: string;
  logoColor: string;
  logoFontFamily: string;
  
  // Header settings
  headerBackgroundColor: string;
  headerTextColor: string;
  headerPadding: number;
  headerBorderRadius: number;
  headerShadow: string;
  headerMarginTop: number;
  headerMarginBottom: number;
  headerMarginLeft: number;
  headerMarginRight: number;
  headerIsStatic: boolean;
  
  // Navigation settings
  showNavigation: boolean;
  showCart: boolean;
  showUserMenu: boolean;
  
  // Header design
  headerDesign?: {
    selectedDesign: string;
    elements: any[];
    deviceType: string;
    timestamp: string;
  } | null;
}

interface HeaderElement {
  id: string;
  type: 'logo' | 'navigation' | 'search' | 'cart' | 'notifications' | 'user-menu';
  label: string;
  icon?: any;
  content?: string;
  visible: boolean;
  order: number;
}

interface HeaderEditorProps {
  settings: CustomizationSettings;
  onSettingsChange: (settings: CustomizationSettings) => void;
}

// Default elements for the sidebar
const defaultElements: HeaderElement[] = [
  { id: 'logo', type: 'logo', label: 'Logo', visible: true, order: 1 },
  { id: 'navigation', type: 'navigation', label: 'Navigation', visible: true, order: 2 },
  { id: 'search', type: 'search', label: 'Search', icon: MagnifyingGlassIcon, visible: true, order: 3 },
  { id: 'cart', type: 'cart', label: 'Cart', icon: ShoppingCartIcon, visible: true, order: 4 },
  { id: 'notifications', type: 'notifications', label: 'Notifications', icon: BellIcon, visible: true, order: 5 },
  { id: 'user-menu', type: 'user-menu', label: 'User Menu', icon: UserCircleIcon, visible: true, order: 6 },
];

// Draggable Element Component for sidebar
function DraggableSidebarElement({ 
  element, 
  onAddElement 
}: { 
  element: HeaderElement; 
  onAddElement: (type: HeaderElement['type']) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
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
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 bg-gray-50 border border-gray-200 rounded cursor-move hover:bg-gray-100 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center space-x-2">
        {element.icon && <element.icon className="w-4 h-4 text-gray-500" />}
        <span className="text-xs text-gray-700">{element.label}</span>
      </div>
    </div>
  );
}

// Draggable Element Component for preview
function DraggablePreviewElement({ 
  element, 
  onRemove 
}: { 
  element: HeaderElement; 
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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
  };

  const renderElement = () => {
    switch (element.type) {
      case 'logo':
        return (
          <div className="flex items-center">
            <div 
              className="font-bold text-lg"
              style={{ 
                color: '#4f46e5', 
                fontSize: '24px', 
                fontWeight: 'bold',
                fontFamily: 'Inter'
              }}
            >
              Logo
            </div>
          </div>
        );
      case 'navigation':
        return (
          <nav className="flex space-x-4">
            <span className="hover:opacity-75 transition-opacity text-sm" style={{ color: '#374151' }}>Home</span>
            <span className="hover:opacity-75 transition-opacity text-sm" style={{ color: '#374151' }}>Products</span>
            <span className="hover:opacity-75 transition-opacity text-sm" style={{ color: '#374151' }}>About</span>
          </nav>
        );
      case 'search':
        return (
          <div className="relative">
            <input 
              placeholder="Search..." 
              className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm pointer-events-none"
              style={{ 
                backgroundColor: '#f9fafb', 
                color: '#6b7280', 
                padding: '8px', 
                borderRadius: '6px', 
                fontSize: '12px' 
              }}
              readOnly
            />
          </div>
        );
      case 'cart':
        return (
          <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">0</span>
          </button>
        );
      case 'notifications':
        return (
          <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 pointer-events-none" style={{ color: '#6b7280' }}>
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">3</span>
          </button>
        );
      case 'user-menu':
        return (
          <div className="relative pointer-events-none">
            <div className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4f46e5' }}>U</div>
              <span className="font-medium hidden sm:block">User</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center">
        {renderElement()}
      </div>
      <button
        onClick={() => onRemove(element.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ width: '20px', height: '20px' }}
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function HeaderEditor({ settings, onSettingsChange }: HeaderEditorProps) {
  const [elements, setElements] = useState<HeaderElement[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<HeaderElement | null>(null);
  const [isClient, setIsClient] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Initialize elements from settings or use defaults
    if (settings.headerDesign?.elements) {
      setElements(settings.headerDesign.elements);
    } else {
      setElements(defaultElements);
    }
  }, [settings.headerDesign]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
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
    if (active.id !== over?.id && active.data.current?.type !== 'preview-element') {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addElement = (type: HeaderElement['type']) => {
    const newElement: HeaderElement = {
      id: `${type}-${Date.now()}`,
      type,
      label: defaultElements.find(el => el.type === type)?.label || type,
      icon: defaultElements.find(el => el.type === type)?.icon,
      visible: true,
      order: elements.length + 1,
    };
    
    setElements(prev => [...prev, newElement]);
    
    // Update settings
    onSettingsChange({
      ...settings,
      headerDesign: {
        selectedDesign: 'custom',
        elements: [...elements, newElement],
        deviceType: 'desktop',
        timestamp: new Date().toISOString(),
      }
    });
  };

  const removeElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    
    // Update settings
    const updatedElements = elements.filter(el => el.id !== elementId);
    onSettingsChange({
      ...settings,
      headerDesign: {
        selectedDesign: 'custom',
        elements: updatedElements,
        deviceType: 'desktop',
        timestamp: new Date().toISOString(),
      }
    });
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Left Sidebar - Editing Options */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Header Editor</h2>
        
        {/* Available Elements */}
        <div className="bg-white rounded border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Elements</h3>
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
        <div className="bg-white rounded border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Header Settings</h3>
          <div className="space-y-4">
            {/* Static Menu Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Static Header</label>
              <button
                onClick={() => onSettingsChange({ ...settings, headerIsStatic: !settings.headerIsStatic })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.headerIsStatic ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.headerIsStatic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={settings.headerBackgroundColor || '#ffffff'}
                onChange={(e) => onSettingsChange({ ...settings, headerBackgroundColor: e.target.value })}
                className="h-10 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Text Color</label>
              <input
                type="color"
                value={settings.headerTextColor || '#374151'}
                onChange={(e) => onSettingsChange({ ...settings, headerTextColor: e.target.value })}
                className="h-10 w-full rounded border border-gray-300 cursor-pointer"
              />
            </div>

            {/* Padding */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Padding: {settings.headerPadding || 16}px</label>
              <input
                type="range"
                min="8"
                max="32"
                value={settings.headerPadding || 16}
                onChange={(e) => onSettingsChange({ ...settings, headerPadding: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Logo Settings */}
        <div className="bg-white rounded border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Logo Settings</h3>
          
          {/* Logo Type Toggle */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => onSettingsChange({ ...settings, logo: null })}
              className={`px-3 py-2 text-sm rounded ${
                !settings.logo ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Text
            </button>
            <button
              onClick={() => onSettingsChange({ ...settings, logo: 'https://via.placeholder.com/200x60' })}
              className={`px-3 py-2 text-sm rounded ${
                settings.logo ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Image
            </button>
          </div>

          {/* Logo Text */}
          {!settings.logo && (
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Logo Text</label>
              <input
                type="text"
                value={settings.logoText || 'NextPanel'}
                onChange={(e) => onSettingsChange({ ...settings, logoText: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Logo Image Upload */}
          {settings.logo && (
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={settings.logo || ''}
                onChange={(e) => onSettingsChange({ ...settings, logo: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://example.com/logo.png"
              />
            </div>
          )}

          {/* Logo Color */}
          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-2">Logo Color</label>
            <input
              type="color"
              value={settings.logoColor || '#4f46e5'}
              onChange={(e) => onSettingsChange({ ...settings, logoColor: e.target.value })}
              className="h-10 w-full rounded border border-gray-300 cursor-pointer"
            />
          </div>

          {/* Logo Dimensions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Width</label>
              <input
                type="number"
                value={settings.logoWidth || 200}
                onChange={(e) => onSettingsChange({ ...settings, logoWidth: parseInt(e.target.value) || 200 })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                min="50"
                max="400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Height</label>
              <input
                type="number"
                value={settings.logoHeight || 60}
                onChange={(e) => onSettingsChange({ ...settings, logoHeight: parseInt(e.target.value) || 60 })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                min="20"
                max="120"
              />
            </div>
          </div>

          {/* Logo Font Family */}
          {!settings.logo && (
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Font Family</label>
              <select
                value={settings.logoFontFamily || 'Inter'}
                onChange={(e) => onSettingsChange({ ...settings, logoFontFamily: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
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
            <label className="block text-sm text-gray-700 mb-2">Position</label>
            <div className="flex space-x-2">
              <button
                onClick={() => onSettingsChange({ ...settings, logoPosition: 'left' })}
                className={`px-3 py-2 text-sm rounded ${
                  settings.logoPosition === 'left' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Left
              </button>
              <button
                onClick={() => onSettingsChange({ ...settings, logoPosition: 'center' })}
                className={`px-3 py-2 text-sm rounded ${
                  settings.logoPosition === 'center' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Center
              </button>
              <button
                onClick={() => onSettingsChange({ ...settings, logoPosition: 'right' })}
                className={`px-3 py-2 text-sm rounded ${
                  settings.logoPosition === 'right' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Right
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Preview */}
      <div className="flex-1">
        <div className="bg-white rounded border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Header Preview</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Desktop</span>
            </div>
          </div>

          {/* Live Preview with Drag and Drop */}
          <div className="bg-gray-50 rounded border p-4">
            {isClient ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div 
                  className="flex items-center justify-between px-4 py-3 rounded"
                  style={{
                    backgroundColor: settings.headerBackgroundColor || '#ffffff',
                    color: settings.headerTextColor || '#374151',
                    padding: `${settings.headerPadding || 16}px`,
                    borderRadius: '0px',
                    boxShadow: 'none',
                    margin: '0px',
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <SortableContext items={elements.map(el => el.id)} strategy={verticalListSortingStrategy}>
                      {elements.map((element) => (
                        <DraggablePreviewElement
                          key={element.id}
                          element={element}
                          onRemove={removeElement}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </div>
                <DragOverlay>
                  {activeId ? (
                    <div className="opacity-50">
                      {elements.find(el => el.id === activeId) && (
                        <DraggablePreviewElement
                          element={elements.find(el => el.id === activeId)!}
                          onRemove={() => {}}
                        />
                      )}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 rounded bg-white">
                <div className="flex items-center space-x-4">
                  <div className="font-bold text-lg text-indigo-600">Logo</div>
                  <nav className="flex space-x-4">
                    <span className="text-sm text-gray-600">Home</span>
                    <span className="text-sm text-gray-600">Products</span>
                    <span className="text-sm text-gray-600">About</span>
                  </nav>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600">
                    <ShoppingCartIcon className="h-6 w-6" />
                  </button>
                  <button className="p-2 text-gray-600">
                    <BellIcon className="h-6 w-6" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">U</div>
                    <span className="font-medium">User</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
