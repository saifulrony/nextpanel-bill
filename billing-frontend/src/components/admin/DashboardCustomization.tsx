'use client';

import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-between p-3 border rounded-lg bg-white mb-2">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <Bars3Icon className="h-5 w-5" />
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
              className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
          ) : (
            <span className="font-medium text-gray-900">{item.name}</span>
          )}
          
          <span className="text-sm text-gray-500">{item.href}</span>
          {item.isCustom && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Custom</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingItem(item.id);
              setEditingValue(item.name);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Rename"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onToggleVisibility(item.id)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={item.visible ? 'Hide' : 'Show'}
          >
            {item.visible ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </button>
          {item.isCustom && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
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
      <div className="flex items-center justify-between p-2 border rounded bg-gray-50">
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
    <div ref={setNodeRef} style={style} className={`${!element.visible ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between p-3 border rounded-lg bg-white mb-2">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <Bars3Icon className="h-5 w-5" />
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
              className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              autoFocus
            />
          ) : (
            <span className="font-medium text-gray-900">{element.name}</span>
          )}
          
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">{element.type}</span>
          <select
            value={element.width || 'full'}
            onChange={(e) => onUpdateWidth(element.id, e.target.value as DashboardElement['width'])}
            className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="full">Full Width</option>
            <option value="1/2">Half Width</option>
            <option value="1/3">Third Width</option>
            <option value="1/4">Quarter Width</option>
            <option value="2/3">Two Thirds</option>
            <option value="3/4">Three Quarters</option>
          </select>
          {element.description && (
            <span className="text-xs text-gray-500 italic" title={element.description}>
              {element.description.length > 30 ? element.description.substring(0, 30) + '...' : element.description}
            </span>
          )}
          {element.isCustom && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Custom</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingItem(element.id);
              setEditingValue(element.name);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Rename"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onToggleVisibility(element.id)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={element.visible ? 'Hide' : 'Show'}
          >
            {element.visible ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </button>
          {element.isCustom && (
            <button
              onClick={() => onDelete(element.id)}
              className="p-1 text-red-400 hover:text-red-600"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
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
  const [newItemForm, setNewItemForm] = useState<{ name: string; href: string; visible: boolean; isSubmenu: boolean; parentId?: string }>({
    name: '',
    href: '',
    visible: true,
    isSubmenu: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const handleDashboardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setLocalDashboardElements((elements) => {
        const oldIndex = elements.findIndex((el) => el.id === active.id);
        const newIndex = elements.findIndex((el) => el.id === over.id);
        const newElements = arrayMove(elements, oldIndex, newIndex);
        // Update order
        return newElements.map((el, index) => ({ ...el, order: index }));
      });
    }
  };

  const handleToggleVisibility = (id: string, type: 'sidebar' | 'dashboard') => {
    if (type === 'sidebar') {
      setLocalSidebarItems(items =>
        items.map(item => {
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
        })
      );
    } else {
      setLocalDashboardElements(elements =>
        elements.map(el => el.id === id ? { ...el, visible: !el.visible } : el)
      );
    }
  };

  const handleRename = (id: string, newName: string, type: 'sidebar' | 'dashboard') => {
    if (type === 'sidebar') {
      setLocalSidebarItems(items =>
        items.map(item => {
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
        })
      );
    } else {
      setLocalDashboardElements(elements =>
        elements.map(el => el.id === id ? { ...el, name: newName } : el)
      );
    }
  };

  const handleUpdateWidth = (id: string, width: DashboardElement['width']) => {
    setLocalDashboardElements(elements =>
      elements.map(el => el.id === id ? { ...el, width } : el)
    );
  };

  const handleAddCustomSidebarItem = () => {
    if (!newItemForm.name || !newItemForm.href) return;

    if (newItemForm.isSubmenu && newItemForm.parentId) {
      // Add as submenu
      setLocalSidebarItems(items =>
        items.map(item => {
          if (item.id === newItemForm.parentId) {
            const newSubmenu: SidebarSubmenuItem = {
              id: `custom-submenu-${Date.now()}`,
              name: newItemForm.name,
              href: newItemForm.href,
              visible: newItemForm.visible,
              order: (item.children?.length || 0),
              isCustom: true,
            };
            return {
              ...item,
              children: [...(item.children || []), newSubmenu],
            };
          }
          return item;
        })
      );
    } else {
      // Add as main item
      const newItem: SidebarItem = {
        id: `custom-${Date.now()}`,
        name: newItemForm.name,
        href: newItemForm.href,
        visible: newItemForm.visible,
        order: localSidebarItems.length,
        isCustom: true,
      };
      setLocalSidebarItems([...localSidebarItems, newItem]);
    }
    
    setNewItemForm({ name: '', href: '', visible: true, isSubmenu: false });
  };

  const handleAddCustomDashboardElement = () => {
    if (!newItemForm.name) return;

    const newElement: DashboardElement = {
      id: `custom-${Date.now()}`,
      name: newItemForm.name,
      type: 'custom',
      visible: newItemForm.visible,
      order: localDashboardElements.length,
      isCustom: true,
      link: newItemForm.href || undefined,
    };

    setLocalDashboardElements([...localDashboardElements, newElement]);
    setNewItemForm({ name: '', href: '', visible: true, isSubmenu: false });
  };

  const handleDelete = (id: string, type: 'sidebar' | 'dashboard') => {
    if (type === 'sidebar') {
      // Check if it's a submenu
      let found = false;
      setLocalSidebarItems(items =>
        items.map(item => {
          if (item.children) {
            const filtered = item.children.filter(child => child.id !== id);
            if (filtered.length !== item.children.length) {
              found = true;
              return { ...item, children: filtered };
            }
          }
          return item;
        }).filter(item => item.id !== id || !found)
      );
    } else {
      setLocalDashboardElements(elements => elements.filter(el => el.id !== id));
    }
  };

  const handleSubmenuUpdate = (parentId: string, submenus: SidebarSubmenuItem[]) => {
    setLocalSidebarItems(items =>
      items.map(item =>
        item.id === parentId ? { ...item, children: submenus } : item
      )
    );
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
    onSidebarUpdate(localSidebarItems);
    onDashboardUpdate(localDashboardElements);
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Customize Dashboard</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('sidebar')}
                  className={`${
                    activeTab === 'sidebar'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Sidebar Elements
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${
                    activeTab === 'dashboard'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Dashboard Elements
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
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Add Custom Sidebar Item</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newItemForm.isSubmenu}
                        onChange={(e) => setNewItemForm({ ...newItemForm, isSubmenu: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm text-gray-700">Add as submenu</label>
                    </div>
                    {newItemForm.isSubmenu && (
                      <select
                        value={newItemForm.parentId || ''}
                        onChange={(e) => setNewItemForm({ ...newItemForm, parentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select parent menu</option>
                        {sortedSidebarItems.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    )}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={newItemForm.name}
                        onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Link (e.g., /admin/custom)"
                        value={newItemForm.href}
                        onChange={(e) => setNewItemForm({ ...newItemForm, href: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={handleAddCustomSidebarItem}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
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
                    <div className="space-y-2 max-h-96 overflow-y-auto">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Dashboard Customization</h4>
                  <button
                    onClick={handleResetDashboard}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 rounded-md transition-colors"
                    title="Reset to default dashboard"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Reset to Default</span>
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Add Custom Dashboard Element</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Element Name"
                      value={newItemForm.name}
                      onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Link (optional)"
                      value={newItemForm.href}
                      onChange={(e) => setNewItemForm({ ...newItemForm, href: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={handleAddCustomDashboardElement}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDashboardDragEnd}
                >
                  <SortableContext
                    items={sortedDashboardElements.map(el => el.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {sortedDashboardElements.map((element) => (
                        <SortableDashboardElement
                          key={element.id}
                          element={element}
                          onToggleVisibility={(id) => handleToggleVisibility(id, 'dashboard')}
                          onRename={(id, name) => handleRename(id, name, 'dashboard')}
                          onDelete={(id) => handleDelete(element.id, 'dashboard')}
                          onUpdateWidth={handleUpdateWidth}
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

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
