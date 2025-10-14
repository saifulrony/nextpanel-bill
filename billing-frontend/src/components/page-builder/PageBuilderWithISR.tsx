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
}: {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [availablePages, setAvailablePages] = useState<Array<{id: string, title: string}>>([]);
  const [loadingPages, setLoadingPages] = useState(false);

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
        return { ...baseComponent, children: [] };
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

  const handleAddComponent = (type: ComponentType) => {
    const newComponent = createComponent(type);
    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    addToHistory(newComponents);
    setSelectedComponent(newComponent.id);
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
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentPageId.trim(),
          title,
          description,
          components,
          metadata: {
            updatedAt: new Date().toISOString(),
          }
        }),
      });

      if (response.ok) {
        alert(`Page saved successfully!\n\nView at: /pages/${currentPageId.trim()}`);
        if (onSave) {
          onSave(components);
        }
      } else {
        throw new Error('Failed to save page');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page');
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
      // First save the page
      const saveResponse = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentPageId.trim(),
          title,
          description,
          components,
          metadata: {
            updatedAt: new Date().toISOString(),
          }
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save page');
      }

      // Then revalidate
      const revalidateResponse = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: currentPageId.trim(),
        }),
      });

      if (revalidateResponse.ok) {
        alert(`Page published and regenerated successfully!\n\nView at: /pages/${currentPageId.trim()}`);
      } else {
        throw new Error('Failed to revalidate page');
      }
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
      const response = await fetch('/api/pages');
      if (response.ok) {
        const pages = await response.json();
        setAvailablePages(pages.map((p: any) => ({ id: p.id, title: p.title })));
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const loadPage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages?id=${pageId}`);
      if (response.ok) {
        const pageData = await response.json();
        setCurrentPageId(pageData.id);
        setTitle(pageData.title);
        setDescription(pageData.description || '');
        setComponents(pageData.components || []);
        setHistory([pageData.components || []]);
        setHistoryIndex(0);
        alert(`Loaded page: ${pageData.title}`);
      } else {
        alert('Failed to load page');
      }
    } catch (error) {
      console.error('Error loading page:', error);
      alert('Failed to load page');
    }
  };

  const selectedComponentData = components.find((c) => c.id === selectedComponent);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
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
              onClick={loadAvailablePages}
              disabled={loadingPages}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Load existing page"
            >
              {loadingPages ? 'Loading...' : '📂 Load Page'}
            </button>
            {availablePages.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {availablePages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => loadPage(page.id)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{page.title}</div>
                    <div className="text-xs text-gray-500">{page.id}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
    </div>
  );
}

