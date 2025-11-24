'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  useDraggable,
} from '@dnd-kit/core';
import {
  ArrowsPointingOutIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

interface WidgetConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DraggableResizableWidgetProps {
  id: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onPositionChange?: (id: string, x: number, y: number) => void;
  config?: WidgetConfig;
}

function DraggableWidget({
  id,
  children,
  onEdit,
  onDelete,
  onResize,
  onPositionChange,
  config,
  defaultWidth = 300,
  defaultHeight = 200,
  minWidth = 200,
  minHeight = 150,
}: Omit<DraggableResizableWidgetProps, 'id'> & { id: string }) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [position, setPosition] = useState({ 
    x: config?.x ?? 0, 
    y: config?.y ?? 0 
  });
  const [size, setSize] = useState({ 
    width: config?.width ?? defaultWidth, 
    height: config?.height ?? defaultHeight 
  });

  // Update position and size when config changes
  useEffect(() => {
    if (config) {
      setPosition({ x: config.x ?? 0, y: config.y ?? 0 });
      setSize({ width: config.width ?? defaultWidth, height: config.height ?? defaultHeight });
    }
  }, [config, defaultWidth, defaultHeight]);
  const widgetRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  useEffect(() => {
    if (transform) {
      const newX = (config?.x || 0) + transform.x;
      const newY = (config?.y || 0) + transform.y;
      setPosition({ x: newX, y: newY });
    }
  }, [transform, config]);

  useEffect(() => {
    if (!isDragging && transform) {
      const newX = (config?.x || 0) + transform.x;
      const newY = (config?.y || 0) + transform.y;
      onPositionChange?.(id, newX, newY);
    }
  }, [isDragging, transform, config, id, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      resizeStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeHandle) return;

      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;

      let newWidth = resizeStartPos.current.width;
      let newHeight = resizeStartPos.current.height;
      let newX = position.x;
      let newY = position.y;

      if (resizeHandle.includes('right')) {
        newWidth = Math.max(minWidth, resizeStartPos.current.width + deltaX);
      }
      if (resizeHandle.includes('left')) {
        const widthChange = Math.max(minWidth - resizeStartPos.current.width, -deltaX);
        newWidth = Math.max(minWidth, resizeStartPos.current.width - deltaX);
        if (newWidth > minWidth) {
          newX = position.x + deltaX;
        }
      }
      if (resizeHandle.includes('bottom')) {
        newHeight = Math.max(minHeight, resizeStartPos.current.height + deltaY);
      }
      if (resizeHandle.includes('top')) {
        newHeight = Math.max(minHeight, resizeStartPos.current.height - deltaY);
        if (newHeight > minHeight) {
          newY = position.y + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);
        // Get current size and position
        const currentSize = size;
        const currentPos = position;
        onResize?.(id, currentSize.width, currentSize.height);
        onPositionChange?.(id, currentPos.x, currentPos.y);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeHandle, minWidth, minHeight, id, onResize, onPositionChange]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (node) {
          (widgetRef as any).current = node;
        }
      }}
      style={{
        ...style,
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isDragging ? 1000 : 1,
        opacity: isDragging ? 0.8 : 1,
      }}
      className="group"
    >
      <div
        className="relative w-full h-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border-2 border-transparent hover:border-indigo-500 transition-all"
        style={{ minWidth: `${minWidth}px`, minHeight: `${minHeight}px` }}
      >
        {/* Control Bar - Top Middle */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-1 bg-gray-800 dark:bg-gray-700 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-white hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing"
            title="Drag"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="p-1 text-white hover:bg-gray-700 rounded"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="p-1 text-red-400 hover:bg-red-600 rounded"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="w-full h-full overflow-auto p-4">
          {children}
        </div>

        {/* Resize Handles */}
        <div
          className="absolute top-0 left-0 w-4 h-4 bg-indigo-500 border-2 border-white rounded-sm cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'top-left')}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 border-2 border-white rounded-sm cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'top-right')}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 bg-indigo-500 border-2 border-white rounded-sm cursor-nesw-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 border-2 border-white rounded-sm cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
        />
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-indigo-500 border-2 border-white rounded-sm cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'top')}
        />
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-indigo-500 border-2 border-white rounded-sm cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'bottom')}
        />
        <div
          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-indigo-500 border-2 border-white rounded-sm cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'left')}
        />
        <div
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-indigo-500 border-2 border-white rounded-sm cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => handleMouseDown(e, 'right')}
        />
      </div>
    </div>
  );
}

export default function DraggableResizableWidget({
  id,
  children,
  defaultWidth = 300,
  defaultHeight = 200,
  minWidth = 200,
  minHeight = 150,
  onEdit,
  onDelete,
  onResize,
  onPositionChange,
  config,
}: DraggableResizableWidgetProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    // Position update is handled in the DraggableWidget component
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <DraggableWidget
        id={id}
        defaultWidth={defaultWidth}
        defaultHeight={defaultHeight}
        minWidth={minWidth}
        minHeight={minHeight}
        onEdit={onEdit}
        onDelete={onDelete}
        onResize={onResize}
        onPositionChange={onPositionChange}
        config={config}
      >
        {children}
      </DraggableWidget>
    </DndContext>
  );
}

