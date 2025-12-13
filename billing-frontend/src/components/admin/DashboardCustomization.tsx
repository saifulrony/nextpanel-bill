'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardBlockEditModal from './DashboardBlockEditModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  XMarkIcon,
  Bars3Icon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

export interface SidebarSubmenuItem {
  id: string;
  name: string;
  href: string;
  visible: boolean;
  order: number;
  isCustom?: boolean;
}

export interface SidebarItem {
  id: string;
  name: string;
  href: string;
  icon?: string;
  visible: boolean;
  order: number;
  isCustom?: boolean;
  children?: SidebarSubmenuItem[];
}

export interface DashboardButton {
  id: string;
  label: string;
  icon?: string;
  link: string;
}

export interface DashboardElement {
  id: string;
  name: string;
  type: 'stat' | 'chart' | 'widget' | 'gauge' | 'table' | 'custom';
  visible: boolean;
  order: number;
  width?: 'full' | '1/2' | '1/3' | '1/4' | '2/3' | '3/4';
  config?: any;
  isCustom?: boolean;
  link?: string;
  description?: string;
  buttons?: DashboardButton[];
}

interface DashboardCustomizationProps {
  isOpen: boolean;
  onClose: () => void;
  sidebarItems: SidebarItem[];
  dashboardElements: DashboardElement[];
  defaultSidebarItems?: SidebarItem[];
  defaultDashboardElements?: DashboardElement[];
  onSidebarUpdate: (items: SidebarItem[]) => void;
  onDashboardUpdate: (elements: DashboardElement[]) => void;
}

// Sortable Sidebar Item Component
function SortableSidebarItem({
  item,
  index,
  onToggleVisibility,
  onRename,
  onDelete,
  onToggleSubmenu,
  onSubmenuUpdate,
  editingItem,
  setEditingItem,
  editingValue,
  setEditingValue,
  expandedSubmenus,
}: {
  item: SidebarItem;
  index: number;
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onToggleSubmenu: (id: string) => void;
  onSubmenuUpdate: (parentId: string, submenus: SidebarSubmenuItem[]) => void;
  editingItem: string | null;
  setEditingItem: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
  expandedSubmenus: Set<string>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasSubmenus = item.children && item.children.length > 0;
  const submenuExpanded = expandedSubmenus.has(item.id);

  const handleRename = () => {
    if (editingValue.trim()) {
      onRename(item.id, editingValue.trim());
    }
    setEditingItem(null);
    setEditingValue('');
  };

  return (
    <div ref={setNodeRef} style={style} className={`${!item.visible ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between p-2 border rounded-lg bg-white mb-1.5 text-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <Bars3Icon className="h-4 w-4" />
          </div>
          
          {hasSubmenus && (
            <button
              onClick={() => onToggleSubmenu(item.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {submenuExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          )}
          
          {editingItem === item.id ? (
            <input
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleRename}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  setEditingItem(null);
                  setEditingValue('');
                }
              }}
              className="flex-1 px-2 py-1 text-xs border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
          ) : (
            <>
              <span className="font-medium text-gray-900 truncate">{item.name}</span>
              <span className="text-xs text-gray-500 truncate ml-1">{item.href}</span>
            </>
          )}
          {item.isCustom && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded flex-shrink-0">Custom</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={() => {
              setEditingItem(item.id);
              setEditingValue(item.name);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Rename"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onToggleVisibility(item.id)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={item.visible ? 'Hide' : 'Show'}
          >
            {item.visible ? (
              <EyeIcon className="h-3.5 w-3.5" />
            ) : (
              <EyeSlashIcon className="h-3.5 w-3.5" />
            )}
          </button>
          {item.isCustom && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Submenu Items */}
      {hasSubmenus && submenuExpanded && (
        <SubmenuDndContext
          parentId={item.id}
          children={item.children!}
          onSubmenuUpdate={onSubmenuUpdate}
          onRename={(id, name) => {
            const updated = item.children!.map(c => c.id === id ? { ...c, name } : c);
            onSubmenuUpdate(item.id, updated);
          }}
          onToggleVisibility={(id) => {
            const updated = item.children!.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
            onSubmenuUpdate(item.id, updated);
          }}
          onDelete={(id) => {
            const updated = item.children!.filter(c => c.id !== id);
            onSubmenuUpdate(item.id, updated);
          }}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          editingValue={editingValue}
          setEditingValue={setEditingValue}
        />
      )}
    </div>
  );
}

// Submenu DnD Context Component
function SubmenuDndContext({
  parentId,
  children,
  onSubmenuUpdate,
  onRename,
  onToggleVisibility,
  onDelete,
  editingItem,
  setEditingItem,
  editingValue,
  setEditingValue,
}: {
  parentId: string;
  children: SidebarSubmenuItem[];
  onSubmenuUpdate: (parentId: string, submenus: SidebarSubmenuItem[]) => void;
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  editingItem: string | null;
  setEditingItem: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = children.findIndex(c => c.id === active.id);
      const newIndex = children.findIndex(c => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = arrayMove(children, oldIndex, newIndex);
        const reordered = updated.map((c, idx) => ({ ...c, order: idx }));
        onSubmenuUpdate(parentId, reordered);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={children.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="ml-8 mb-2 space-y-2">
          {children.map((submenu) => (
            <SortableSubmenuItem
              key={submenu.id}
              submenu={submenu}
              parentId={parentId}
              onRename={onRename}
              onToggleVisibility={onToggleVisibility}
              onDelete={onDelete}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Sortable Submenu Item Component
function SortableSubmenuItem({
  submenu,
  parentId,
  onRename,
  onToggleVisibility,
  onDelete,
  editingItem,
  setEditingItem,
  editingValue,
  setEditingValue,
}: {
  submenu: SidebarSubmenuItem;
  parentId: string;
  onRename: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  editingItem: string | null;
  setEditingItem: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: submenu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = () => {
    if (editingValue.trim()) {
      onRename(submenu.id, editingValue.trim());
    }
    setEditingItem(null);
    setEditingValue('');
  };

  return (
    <div ref={setNodeRef} style={style} className={`${!submenu.visible ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between p-1.5 border rounded bg-gray-50 text-xs">
        <div className="flex items-center space-x-2 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <Bars3Icon className="h-4 w-4" />
          </div>
          
          {editingItem === submenu.id ? (
            <input
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleRename}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  setEditingItem(null);
                  setEditingValue('');
                }
              }}
              className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
          ) : (
            <span className="text-sm font-medium text-gray-700">{submenu.name}</span>
          )}
          
          <span className="text-xs text-gray-500">{submenu.href}</span>
          {submenu.isCustom && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Custom</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setEditingItem(submenu.id);
              setEditingValue(submenu.name);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Rename"
          >
            <PencilIcon className="h-3 w-3" />
          </button>
          <button
            onClick={() => onToggleVisibility(submenu.id)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={submenu.visible ? 'Hide' : 'Show'}
          >
            {submenu.visible ? (
              <EyeIcon className="h-3 w-3" />
            ) : (
              <EyeSlashIcon className="h-3 w-3" />
            )}
          </button>
          {submenu.isCustom && (
            <button
              onClick={() => onDelete(submenu.id)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Sortable Dashboard Element Component
function SortableDashboardElement({
  element,
  onToggleVisibility,
  onRename,
  onDelete,
  onUpdateWidth,
  onEdit,
  editingItem,
  setEditingItem,
  editingValue,
  setEditingValue,
}: {
  element: DashboardElement;
  onToggleVisibility: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onUpdateWidth: (id: string, width: DashboardElement['width']) => void;
  onEdit?: (element: DashboardElement) => void;
  editingItem: string | null;
  setEditingItem: (id: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = () => {
    if (editingValue.trim()) {
      onRename(element.id, editingValue.trim());
    }
    setEditingItem(null);
    setEditingValue('');
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${!element.visible ? 'opacity-60' : ''}`}
    >
      <div 
        className="flex items-center justify-between p-2 border rounded-lg bg-white mb-1.5 text-sm"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <Bars3Icon className="h-4 w-4" />
          </div>
          
          {editingItem === element.id ? (
            <input
              type="text"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleRename}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  setEditingItem(null);
                  setEditingValue('');
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-2 py-1 text-xs border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
          ) : (
            <span className="font-medium text-gray-900 truncate">{element.name}</span>
          )}
          
          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded flex-shrink-0">{element.type}</span>
          <select
            value={element.width || 'full'}
            onChange={(e) => onUpdateWidth(element.id, e.target.value as DashboardElement['width'])}
            className="px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="full">Full</option>
            <option value="1/2">1/2</option>
            <option value="1/3">1/3</option>
            <option value="1/4">1/4</option>
            <option value="2/3">2/3</option>
            <option value="3/4">3/4</option>
          </select>
          {element.isCustom && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded flex-shrink-0">Custom</span>
          )}
        </div>
        
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(element);
              } else {
                setEditingItem(element.id);
                setEditingValue(element.name);
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={onEdit ? "Edit" : "Rename"}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(element.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={element.visible ? 'Hide' : 'Show'}
          >
            {element.visible ? (
              <EyeIcon className="h-3.5 w-3.5" />
            ) : (
              <EyeSlashIcon className="h-3.5 w-3.5" />
            )}
          </button>
          {element.isCustom && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(element.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardCustomization({
  isOpen,
  onClose,
  sidebarItems,
  dashboardElements,
  defaultSidebarItems,
  defaultDashboardElements,
  onSidebarUpdate,
  onDashboardUpdate,
}: DashboardCustomizationProps) {
  const [activeTab, setActiveTab] = useState<'sidebar' | 'dashboard'>('sidebar');
  const [localSidebarItems, setLocalSidebarItems] = useState<SidebarItem[]>(sidebarItems);
  const [localDashboardElements, setLocalDashboardElements] = useState<DashboardElement[]>(dashboardElements);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set());
  const [storedDefaultSidebarItems, setStoredDefaultSidebarItems] = useState<SidebarItem[]>([]);
  const [storedDefaultDashboardElements, setStoredDefaultDashboardElements] = useState<DashboardElement[]>([]);
  const [defaultTimePeriod, setDefaultTimePeriod] = useState<string>('week');
  const [showAddSidebarForm, setShowAddSidebarForm] = useState<boolean>(false);
  const [showAddDashboardBlockForm, setShowAddDashboardBlockForm] = useState<boolean>(false);
  const [newItemForm, setNewItemForm] = useState<{ name: string; href: string; visible: boolean; isSubmenu: boolean; parentId?: string }>({
    name: '',
    href: '',
    visible: true,
    isSubmenu: false,
  });
  const [newBlockForm, setNewBlockForm] = useState<{ 
    name: string; 
    width: DashboardElement['width'];
    buttons: Array<{ id: string; label: string; icon: string; link: string }> 
  }>({
    name: '',
    width: 'full',
    buttons: [{ id: `btn-${Date.now()}`, label: '', icon: '', link: '' }],
  });
  const [editingBlock, setEditingBlock] = useState<DashboardElement | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Refs to track pending updates (to avoid updating parent during render)
  const pendingSidebarUpdate = useRef<SidebarItem[] | null>(null);
  const pendingDashboardUpdate = useRef<DashboardElement[] | null>(null);

  // Apply pending sidebar updates after render
  useEffect(() => {
    if (pendingSidebarUpdate.current) {
      const update = pendingSidebarUpdate.current;
      pendingSidebarUpdate.current = null;
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        onSidebarUpdate(update);
      }, 0);
    }
  });

  // Apply pending dashboard updates after render and auto-save
  useEffect(() => {
    if (pendingDashboardUpdate.current) {
      const update = pendingDashboardUpdate.current;
      pendingDashboardUpdate.current = null;
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        onDashboardUpdate(update);
        // Auto-save to localStorage
        localStorage.setItem('dashboard_elements_customization', JSON.stringify(update));
        // Trigger event for dashboard page
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboardCustomizationUpdated'));
        }
      }, 0);
    }
  });

  useEffect(() => {
    if (isOpen) {
      // Store defaults when modal opens (use provided defaults or current items)
      const defaultSidebar = defaultSidebarItems || JSON.parse(JSON.stringify(sidebarItems));
      const defaultDashboard = defaultDashboardElements || JSON.parse(JSON.stringify(dashboardElements));
      setStoredDefaultSidebarItems(defaultSidebar);
      setStoredDefaultDashboardElements(defaultDashboard);
      
      // Use provided items, or defaults if empty
      const sidebarToUse = sidebarItems.length > 0 ? sidebarItems : (defaultSidebarItems || []);
      const dashboardToUse = dashboardElements.length > 0 ? dashboardElements : (defaultDashboardElements || []);
      
      setLocalSidebarItems(sidebarToUse);
      setLocalDashboardElements(dashboardToUse);
      setEditingItem(null);
      setEditingValue('');
      setExpandedSubmenus(new Set());
      setShowAddSidebarForm(false);
      setShowAddDashboardBlockForm(false);
      
      // Load default time period
      const savedTimePeriod = localStorage.getItem('dashboard_default_time_period');
      if (savedTimePeriod) {
        setDefaultTimePeriod(savedTimePeriod);
      }
    }
  }, [isOpen, sidebarItems, dashboardElements, defaultSidebarItems, defaultDashboardElements]);

  if (!isOpen) return null;

  const handleSidebarDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setLocalSidebarItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order
        const updated = newItems.map((item, index) => ({ ...item, order: index }));
        // Schedule update for after render
        pendingSidebarUpdate.current = updated;
        return updated;
      });
    }
  };

  const handleDashboardDragStart = (event: DragStartEvent) => {
    console.log('Dashboard drag START:', { activeId: event.active.id });
  };

  const handleDashboardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Dashboard drag end event:', { activeId: active.id, overId: over?.id });
    
    if (!over) {
      console.log('No over target, drag cancelled');
      return;
    }
    
    if (active.id === over.id) {
      console.log('Same position, no change needed');
      return;
    }
    
    setLocalDashboardElements((elements) => {
      console.log('Current elements before sort:', elements.map(e => ({ id: e.id, name: e.name, order: e.order })));
      
      // Sort elements by order first to match the displayed order
      const sorted = [...elements].sort((a, b) => a.order - b.order);
      console.log('Sorted elements:', sorted.map(e => ({ id: e.id, name: e.name, order: e.order })));
      
      const oldIndex = sorted.findIndex((el) => el.id === active.id);
      const newIndex = sorted.findIndex((el) => el.id === over.id);
      
      console.log('Indices:', { oldIndex, newIndex, activeId: active.id, overId: over.id });
      
      if (oldIndex === -1 || newIndex === -1) {
        console.warn('Could not find element in sorted array', { 
          activeId: active.id, 
          overId: over.id, 
          sortedIds: sorted.map(e => e.id),
          oldIndex,
          newIndex
        });
        return elements;
      }
      
      console.log('Dashboard drag - moving from index', oldIndex, 'to', newIndex);
      const newElements = arrayMove(sorted, oldIndex, newIndex);
      // Update order based on new positions
      const updated = newElements.map((el, index) => ({ ...el, order: index }));
      console.log('Dashboard drag end - reordered:', updated.map(e => ({ id: e.id, name: e.name, order: e.order })));
      // Schedule update for after render
      pendingDashboardUpdate.current = updated;
      return updated;
    });
  };

  const handleToggleVisibility = (id: string, type: 'sidebar' | 'dashboard') => {
    if (type === 'sidebar') {
      setLocalSidebarItems(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            return { ...item, visible: !item.visible };
          }
          // Check submenus
          if (item.children) {
            const updatedChildren = item.children.map(child =>
              child.id === id ? { ...child, visible: !child.visible } : child
            );
            if (updatedChildren.some(c => c.id === id)) {
              return { ...item, children: updatedChildren };
            }
          }
          return item;
        });
        // Schedule update for after render
        pendingSidebarUpdate.current = updated;
        return updated;
      });
    } else {
      setLocalDashboardElements(elements => {
        const updated = elements.map(el => el.id === id ? { ...el, visible: !el.visible } : el);
        // Schedule update for after render
        pendingDashboardUpdate.current = updated;
        return updated;
      });
    }
  };

  const handleRename = (id: string, newName: string, type: 'sidebar' | 'dashboard') => {
    if (type === 'sidebar') {
      setLocalSidebarItems(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            return { ...item, name: newName };
          }
          // Check submenus
          if (item.children) {
            const updatedChildren = item.children.map(child =>
              child.id === id ? { ...child, name: newName } : child
            );
            if (updatedChildren.some(c => c.id === id)) {
              return { ...item, children: updatedChildren };
            }
          }
          return item;
        });
        // Schedule update for after render
        pendingSidebarUpdate.current = updated;
        return updated;
      });
    } else {
      setLocalDashboardElements(elements => {
        const updated = elements.map(el => el.id === id ? { ...el, name: newName } : el);
        // Schedule update for after render
        pendingDashboardUpdate.current = updated;
        return updated;
      });
    }
  };

  const handleUpdateWidth = (id: string, width: DashboardElement['width']) => {
    setLocalDashboardElements(elements => {
      const updated = elements.map(el => el.id === id ? { ...el, width } : el);
      // Schedule update for after render
      pendingDashboardUpdate.current = updated;
      return updated;
    });
  };

  const handleEditBlock = (element: DashboardElement) => {
    setEditingBlock(element);
    setIsEditModalOpen(true);
  };

  const handleUpdateBlock = (updatedElement: DashboardElement) => {
    setLocalDashboardElements(elements => {
      const updated = elements.map(el => 
        el.id === updatedElement.id ? updatedElement : el
      );
      // Schedule update for after render
      pendingDashboardUpdate.current = updated;
      return updated;
    });
    setIsEditModalOpen(false);
    setEditingBlock(null);
  };

  const handleAddCustomSidebarItem = () => {
    console.log('Adding custom sidebar item:', newItemForm);
    
    if (!newItemForm.name || !newItemForm.href) {
      alert('Please enter both name and link for the sidebar item.');
      return;
    }

    if (newItemForm.isSubmenu && newItemForm.parentId) {
      // Add as submenu at the first position (order 0)
      setLocalSidebarItems(items => {
        const updated = items.map(item => {
          if (item.id === newItemForm.parentId) {
            // Shift existing submenus' orders up by 1
            const existingChildren = (item.children || []).map(child => ({
              ...child,
              order: child.order + 1,
            }));
            
            const newSubmenu: SidebarSubmenuItem = {
              id: `custom-submenu-${Date.now()}`,
              name: newItemForm.name,
              href: newItemForm.href,
              visible: newItemForm.visible,
              order: 0,
              isCustom: true,
            };
            
            return {
              ...item,
              children: [newSubmenu, ...existingChildren],
            };
          }
          return item;
        });
        // Schedule update for after render
        pendingSidebarUpdate.current = updated;
        return updated;
      });
    } else if (newItemForm.isSubmenu && !newItemForm.parentId) {
      alert('Please select a parent menu for the submenu item.');
      return;
    } else {
      // Add as main item at the first position (order 0)
      // Shift all existing items' orders up by 1
      const updated = localSidebarItems.map(item => ({
        ...item,
        order: item.order + 1,
      }));
      
      const newItem: SidebarItem = {
        id: `custom-${Date.now()}`,
        name: newItemForm.name,
        href: newItemForm.href,
        visible: newItemForm.visible,
        order: 0,
        isCustom: true,
      };
      
      const finalUpdated = [newItem, ...updated];
      console.log('Added new sidebar item at first position:', newItem);
      console.log('Updated sidebar items:', finalUpdated);
      setLocalSidebarItems(finalUpdated);
      // Schedule update for after render
      pendingSidebarUpdate.current = finalUpdated;
    }
    
    // Reset form
    setNewItemForm({ name: '', href: '', visible: true, isSubmenu: false, parentId: undefined });
    console.log('Form reset, new item should appear in list');
  };

  const handleAddCustomDashboardBlock = () => {
    if (!newBlockForm.name || newBlockForm.buttons.length === 0) {
      alert('Please enter block name and at least one button.');
      return;
    }

    // Validate buttons
    const validButtons = newBlockForm.buttons.filter(btn => btn.label && btn.link);
    if (validButtons.length === 0) {
      alert('Please add at least one button with label and link.');
      return;
    }

    // Add at the first position (order 0)
    // Shift all existing elements' orders up by 1
    const updated = localDashboardElements.map(el => ({
      ...el,
      order: el.order + 1,
    }));

    const newElement: DashboardElement = {
      id: `custom-block-${Date.now()}`,
      name: newBlockForm.name,
      type: 'custom',
      visible: true,
      order: 0,
      width: newBlockForm.width,
      isCustom: true,
      buttons: validButtons.map(btn => ({
        id: btn.id,
        label: btn.label,
        icon: btn.icon || undefined,
        link: btn.link,
      })),
      description: `Custom block with ${validButtons.length} button(s)`,
    };

    const finalUpdated = [newElement, ...updated];
    console.log('Added new dashboard block at first position:', newElement);
    setLocalDashboardElements(finalUpdated);
    // Schedule update for after render
    pendingDashboardUpdate.current = finalUpdated;
    
    // Reset form
    setNewBlockForm({
      name: '',
      width: 'full',
      buttons: [{ id: `btn-${Date.now()}`, label: '', icon: '', link: '' }],
    });
    setShowAddDashboardBlockForm(false);
  };

  const handleAddButtonToBlock = () => {
    setNewBlockForm({
      ...newBlockForm,
      buttons: [...newBlockForm.buttons, { id: `btn-${Date.now()}`, label: '', icon: '', link: '' }],
    });
  };

  const handleRemoveButtonFromBlock = (buttonId: string) => {
    if (newBlockForm.buttons.length > 1) {
      setNewBlockForm({
        ...newBlockForm,
        buttons: newBlockForm.buttons.filter(btn => btn.id !== buttonId),
      });
    }
  };

  const handleUpdateButtonInBlock = (buttonId: string, field: 'label' | 'icon' | 'link', value: string) => {
    setNewBlockForm({
      ...newBlockForm,
      buttons: newBlockForm.buttons.map(btn =>
        btn.id === buttonId ? { ...btn, [field]: value } : btn
      ),
    });
  };

  const handleDelete = (id: string, type: 'sidebar' | 'dashboard') => {
    if (type === 'sidebar') {
      // Check if it's a submenu
      let found = false;
      setLocalSidebarItems(items => {
        const updated = items.map(item => {
          if (item.children) {
            const filtered = item.children.filter(child => child.id !== id);
            if (filtered.length !== item.children.length) {
              found = true;
              return { ...item, children: filtered };
            }
          }
          return item;
        }).filter(item => item.id !== id || !found);
        // Schedule update for after render
        pendingSidebarUpdate.current = updated;
        return updated;
      });
    } else {
      setLocalDashboardElements(elements => {
        const updated = elements.filter(el => el.id !== id);
        // Schedule update for after render
        pendingDashboardUpdate.current = updated;
        return updated;
      });
    }
  };

  const handleSubmenuUpdate = (parentId: string, submenus: SidebarSubmenuItem[]) => {
    setLocalSidebarItems(items => {
      const updated = items.map(item =>
        item.id === parentId ? { ...item, children: submenus } : item
      );
      // Schedule update for after render
      pendingSidebarUpdate.current = updated;
      return updated;
    });
  };

  const handleToggleSubmenu = (id: string) => {
    setExpandedSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    // All changes are already auto-saved, but ensure everything is synced
    localStorage.setItem('dashboard_sidebar_customization', JSON.stringify(localSidebarItems));
    localStorage.setItem('dashboard_elements_customization', JSON.stringify(localDashboardElements));
    localStorage.setItem('dashboard_default_time_period', defaultTimePeriod);
    // Trigger custom event to notify dashboard page of changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dashboardCustomizationUpdated'));
    }
    onClose();
  };

  const handleResetSidebar = () => {
    if (confirm('Are you sure you want to reset sidebar to default? This will discard all your customizations.')) {
      const resetItems = storedDefaultSidebarItems.length > 0 
        ? JSON.parse(JSON.stringify(storedDefaultSidebarItems))
        : (defaultSidebarItems || JSON.parse(JSON.stringify(sidebarItems)));
      setLocalSidebarItems(resetItems);
      localStorage.removeItem('dashboard_sidebar_customization');
      // Also update the parent immediately
      onSidebarUpdate(resetItems);
    }
  };

  const handleResetDashboard = () => {
    if (confirm('Are you sure you want to reset dashboard to default? This will discard all your customizations.')) {
      const resetElements = storedDefaultDashboardElements.length > 0
        ? JSON.parse(JSON.stringify(storedDefaultDashboardElements))
        : (defaultDashboardElements || JSON.parse(JSON.stringify(dashboardElements)));
      setLocalDashboardElements(resetElements);
      localStorage.removeItem('dashboard_elements_customization');
      // Also update the parent immediately
      onDashboardUpdate(resetElements);
    }
  };

  const sortedSidebarItems = [...localSidebarItems].sort((a, b) => a.order - b.order);
  const sortedDashboardElements = [...localDashboardElements].sort((a, b) => a.order - b.order);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay - subtle */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-gray-900">Customize Dashboard</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4 sticky top-0 bg-white z-10">
              <nav className="-mb-px flex space-x-4">
                <button
                  onClick={() => setActiveTab('sidebar')}
                  className={`${
                    activeTab === 'sidebar'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm flex-1`}
                >
                  Sidebar
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${
                    activeTab === 'dashboard'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm flex-1`}
                >
                  Dashboard
                </button>
              </nav>
            </div>

            {/* Sidebar Tab */}
            {activeTab === 'sidebar' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">Sidebar Customization</h4>
                  <button
                    onClick={handleResetSidebar}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-md transition-colors"
                    title="Reset to default sidebar"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Reset to Default</span>
                  </button>
                </div>
                
                {/* Add Custom Sidebar Item Section */}
                <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-900">Add Custom Item</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddSidebarForm(!showAddSidebarForm)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      <span>{showAddSidebarForm ? 'Cancel' : 'Add New'}</span>
                    </button>
                  </div>
                  
                  {showAddSidebarForm && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-300">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newItemForm.isSubmenu}
                          onChange={(e) => setNewItemForm({ 
                            ...newItemForm, 
                            isSubmenu: e.target.checked,
                            parentId: e.target.checked ? newItemForm.parentId : undefined
                          })}
                          className="rounded border-gray-300"
                          id="isSubmenu"
                        />
                        <label htmlFor="isSubmenu" className="text-xs text-gray-700">Add as submenu</label>
                      </div>
                      
                      {newItemForm.isSubmenu && (
                        <select
                          value={newItemForm.parentId || ''}
                          onChange={(e) => setNewItemForm({ ...newItemForm, parentId: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select parent menu</option>
                          {sortedSidebarItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      )}
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={newItemForm.name}
                          onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Link (e.g., /admin/custom)"
                          value={newItemForm.href}
                          onChange={(e) => setNewItemForm({ ...newItemForm, href: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddCustomSidebarItem();
                          setShowAddSidebarForm(false);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
                        title="Add custom sidebar item"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  )}
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSidebarDragEnd}
                >
                  <SortableContext
                    items={sortedSidebarItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 h-[calc(100vh-280px)] overflow-y-auto">
                      {sortedSidebarItems.map((item, index) => (
                        <SortableSidebarItem
                          key={item.id}
                          item={item}
                          index={index}
                          onToggleVisibility={(id) => handleToggleVisibility(id, 'sidebar')}
                          onRename={(id, name) => handleRename(id, name, 'sidebar')}
                          onDelete={(id) => handleDelete(id, 'sidebar')}
                          onToggleSubmenu={handleToggleSubmenu}
                          onSubmenuUpdate={handleSubmenuUpdate}
                          editingItem={editingItem}
                          setEditingItem={setEditingItem}
                          editingValue={editingValue}
                          setEditingValue={setEditingValue}
                          expandedSubmenus={expandedSubmenus}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-900">Dashboard</h4>
                  <button
                    onClick={handleResetDashboard}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded transition-colors"
                    title="Reset to default dashboard"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>
                
                {/* Add Custom Block Section */}
                <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-900">Add Custom Block</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddDashboardBlockForm(!showAddDashboardBlockForm)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      <span>{showAddDashboardBlockForm ? 'Cancel' : 'Add New'}</span>
                    </button>
                  </div>
                  
                  {showAddDashboardBlockForm && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-300">
                      <input
                        type="text"
                        placeholder="Block Name"
                        value={newBlockForm.name}
                        onChange={(e) => setNewBlockForm({ ...newBlockForm, name: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      
                      <select
                        value={newBlockForm.width}
                        onChange={(e) => setNewBlockForm({ ...newBlockForm, width: e.target.value as DashboardElement['width'] })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="full">Full Width</option>
                        <option value="1/2">Half Width</option>
                        <option value="1/3">Third Width</option>
                        <option value="1/4">Quarter Width</option>
                        <option value="2/3">Two Thirds</option>
                        <option value="3/4">Three Quarters</option>
                      </select>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-gray-700">Buttons</label>
                          <button
                            type="button"
                            onClick={handleAddButtonToBlock}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            <PlusIcon className="h-3 w-3" />
                            <span>Add Button</span>
                          </button>
                        </div>
                        
                        {newBlockForm.buttons.map((button, index) => (
                          <div key={button.id} className="p-2 bg-white border border-gray-200 rounded space-y-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Button {index + 1}</span>
                              {newBlockForm.buttons.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveButtonFromBlock(button.id)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Button Label"
                              value={button.label}
                              onChange={(e) => handleUpdateButtonInBlock(button.id, 'label', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Icon (e.g., HomeIcon, UserIcon)"
                              value={button.icon}
                              onChange={(e) => handleUpdateButtonInBlock(button.id, 'icon', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Link (e.g., /admin/custom)"
                              value={button.link}
                              onChange={(e) => handleUpdateButtonInBlock(button.id, 'link', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAddCustomDashboardBlock}
                        className="w-full px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        <span>Add Block</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Default Time Period Setting */}
                <div className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200">
                  <h4 className="text-xs font-medium text-gray-900 mb-1.5">Default Time Period</h4>
                    <select
                      value={defaultTimePeriod}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setDefaultTimePeriod(newValue);
                        // Save immediately
                        localStorage.setItem('dashboard_default_time_period', newValue);
                        // Trigger event for dashboard page
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new Event('dashboardCustomizationUpdated'));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last 12 Months</option>
                    <option value="custom">Custom Period</option>
                  </select>
                </div>
                

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDashboardDragStart}
                  onDragEnd={handleDashboardDragEnd}
                >
                  <SortableContext
                    items={sortedDashboardElements.map(el => el.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 h-[calc(100vh-280px)] overflow-y-auto">
                      {sortedDashboardElements.map((element) => (
                        <SortableDashboardElement
                          key={element.id}
                          element={element}
                          onToggleVisibility={(id) => handleToggleVisibility(id, 'dashboard')}
                          onRename={(id, name) => handleRename(id, name, 'dashboard')}
                          onDelete={(id) => handleDelete(element.id, 'dashboard')}
                          onUpdateWidth={handleUpdateWidth}
                          onEdit={handleEditBlock}
                          editingItem={editingItem}
                          setEditingItem={setEditingItem}
                          editingValue={editingValue}
                          setEditingValue={setEditingValue}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

          </div>
        </div>

        {/* Block Edit Modal */}
        <DashboardBlockEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBlock(null);
          }}
          element={editingBlock}
          onUpdate={handleUpdateBlock}
        />
    </>
  );
}
