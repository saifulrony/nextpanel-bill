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
} from '@heroicons/react/24/outline';

interface PageBuilderProps {
  initialComponents?: Component[];
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
}: {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddToContainer?: (type: ComponentType, containerId?: string, columnIndex?: number) => void;
  onColumnClick?: (containerId: string, columnIndex: number) => void;
  onAddColumn?: (containerId: string) => void;
  onRemoveColumn?: (containerId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ComponentRenderer
        component={component}
        isSelected={isSelected}
        isHovered={isHovered}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onAddToContainer={onAddToContainer}
        onColumnClick={onColumnClick}
        onAddColumn={onAddColumn}
        onRemoveColumn={onRemoveColumn}
      />
    </div>
  );
}

export default function PageBuilder({ initialComponents = [], onSave, onClose }: PageBuilderProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [history, setHistory] = useState<Component[][]>([initialComponents]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);

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
        return { ...baseComponent, props: { columns: 2 }, children: [] };
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
      default:
        return baseComponent;
    }
  };

  const handleAddComponent = (type: ComponentType, containerId?: string, columnIndex?: number) => {
    const newComponent = createComponent(type);
    
    if (containerId && columnIndex !== undefined) {
      // Add component to specific container column
      const newComponents = components.map(comp => {
        if (comp.id === containerId) {
          const updatedChildren = [...(comp.children || [])];
          updatedChildren[columnIndex] = newComponent;
          return { ...comp, children: updatedChildren };
        }
        return comp;
      });
      setComponents(newComponents);
      addToHistory(newComponents);
      setShowComponentPicker(false);
      setSelectedContainerId(null);
      setSelectedColumnIndex(null);
    } else {
      // Add component to main canvas
      const newComponents = [...components, newComponent];
      setComponents(newComponents);
      addToHistory(newComponents);
    }
    
    setSelectedComponent(newComponent.id);
  };

  const handleUpdateComponent = (updatedComponent: Component) => {
    const newComponents = components.map((comp) =>
      comp.id === updatedComponent.id ? updatedComponent : comp
    );
    setComponents(newComponents);
    addToHistory(newComponents);
  };

  const handleAddColumn = (containerId: string) => {
    console.log('Adding column to container:', containerId);
    const newComponents = components.map(comp => {
      if (comp.id === containerId && comp.type === 'container') {
        const currentColumns = comp.props?.columns || 2;
        console.log('Current columns:', currentColumns);
        const newColumns = Math.min(currentColumns + 1, 4);
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
        const newColumns = Math.max(currentColumns - 1, 1); // Min 1 column
        
        // Remove components from the last column if it exists
        const updatedChildren = comp.children?.slice(0, newColumns) || [];
        
        return {
          ...comp,
          props: {
            ...comp.props,
            columns: newColumns
          },
          children: updatedChildren
        };
      }
      return comp;
    });
    setComponents(newComponents);
    addToHistory(newComponents);
  };

  const handleColumnClick = (containerId: string, columnIndex: number) => {
    setSelectedContainerId(containerId);
    setSelectedColumnIndex(columnIndex);
    setShowComponentPicker(true);
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

  const handleSave = () => {
    if (onSave) {
      onSave(components);
    }
    alert('Page saved successfully!');
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

  const selectedComponentData = components.find((c) => c.id === selectedComponent);
  
  // Debug: Log components when they change
  React.useEffect(() => {
    console.log('Components updated:', components);
  }, [components]);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-gray-900">Page Builder</h1>
          <div className="h-6 w-px bg-gray-300" />
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
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Page
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
      </div>

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
                        onAddToContainer={handleAddComponent}
                        onColumnClick={handleColumnClick}
                        onAddColumn={handleAddColumn}
                        onRemoveColumn={handleRemoveColumn}
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

      {/* Component Picker Modal */}
      {showComponentPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Component to Column</h3>
                <button
                  onClick={() => {
                    setShowComponentPicker(false);
                    setSelectedContainerId(null);
                    setSelectedColumnIndex(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'heading' as ComponentType, label: 'Heading', icon: '📝' },
                  { type: 'text' as ComponentType, label: 'Text', icon: '📄' },
                  { type: 'button' as ComponentType, label: 'Button', icon: '🔘' },
                  { type: 'image' as ComponentType, label: 'Image', icon: '🖼️' },
                  { type: 'card' as ComponentType, label: 'Card', icon: '🎴' },
                  { type: 'spacer' as ComponentType, label: 'Spacer', icon: '📏' },
                ].map((comp) => (
                  <button
                    key={comp.type}
                    onClick={() => handleAddComponent(comp.type, selectedContainerId!, selectedColumnIndex!)}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                  >
                    <span className="text-2xl">{comp.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{comp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

