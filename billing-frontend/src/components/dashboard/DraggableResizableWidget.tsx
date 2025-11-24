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
  editMode?: boolean;
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
  editMode = true,
}: Omit<DraggableResizableWidgetProps, 'id'> & { id: string }) {
  // Always in edit mode - no need to check editMode prop
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
      const newPos = { x: config.x ?? 0, y: config.y ?? 0 };
      const newSize = { width: config.width ?? defaultWidth, height: config.height ?? defaultHeight };
      setPosition(newPos);
      setSize(newSize);
      currentPosRef.current = newPos;
      currentSizeRef.current = newSize;
    }
  }, [config, defaultWidth, defaultHeight]);
  const widgetRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0 });
  const currentSizeRef = useRef(size);
  const currentPosRef = useRef(position);
  
  // Detect which edge/corner the mouse is on
  const detectResizeEdge = (e: React.MouseEvent<HTMLDivElement> | MouseEvent, element?: HTMLElement): string | null => {
    const target = element || borderRef.current;
    if (!target) return null;
    
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    
    // Define resize zone thickness (12px from edges for easier grabbing)
    const resizeZone = 12;
    
    // Check corners first (priority) - smaller zone for corners
    const cornerZone = 16;
    const isNearTop = y < resizeZone;
    const isNearBottom = y > height - resizeZone;
    const isNearLeft = x < resizeZone;
    const isNearRight = x > width - resizeZone;
    const isInCornerTop = y < cornerZone;
    const isInCornerBottom = y > height - cornerZone;
    const isInCornerLeft = x < cornerZone;
    const isInCornerRight = x > width - cornerZone;
    
    // Corner detection (priority - check corners first)
    if (isInCornerTop && isInCornerLeft) return 'top-left';
    if (isInCornerTop && isInCornerRight) return 'top-right';
    if (isInCornerBottom && isInCornerLeft) return 'bottom-left';
    if (isInCornerBottom && isInCornerRight) return 'bottom-right';
    
    // Edge detection (only if not in corner)
    if (isNearTop && !isInCornerLeft && !isInCornerRight) return 'top';
    if (isNearBottom && !isInCornerLeft && !isInCornerRight) return 'bottom';
    if (isNearLeft && !isInCornerTop && !isInCornerBottom) return 'left';
    if (isNearRight && !isInCornerTop && !isInCornerBottom) return 'right';
    
    return null;
  };

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

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    // If handle is provided, use it; otherwise detect from mouse position
    const detectedHandle = handle || detectResizeEdge(e);
    
    if (!detectedHandle) return; // Not on a resize zone
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(detectedHandle);
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const startX = config?.x ?? 0;
      const startY = config?.y ?? 0;
      resizeStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
        startX: startX,
        startY: startY,
      };
    }
  };
  
  const handleBorderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || isResizing) return;
    
    // Check if mouse is over a handle (handles have their own cursor)
    const target = e.target as HTMLElement;
    if (target.closest('[class*="cursor-"]')) {
      return; // Let the handle's cursor show
    }
    
    const edge = detectResizeEdge(e);
    if (!edge) {
      document.body.style.cursor = '';
      return;
    }
    
    // Set appropriate cursor based on edge
    const cursorMap: Record<string, string> = {
      'top-left': 'nwse-resize',
      'top-right': 'nesw-resize',
      'bottom-left': 'nesw-resize',
      'bottom-right': 'nwse-resize',
      'top': 'ns-resize',
      'bottom': 'ns-resize',
      'left': 'ew-resize',
      'right': 'ew-resize',
    };
    
    document.body.style.cursor = cursorMap[edge] || '';
  };
  
  const handleBorderMouseLeave = () => {
    if (!isResizing) {
      document.body.style.cursor = '';
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeHandle) return;

      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;

      let newWidth = resizeStartPos.current.width;
      let newHeight = resizeStartPos.current.height;
      let newX = resizeStartPos.current.startX;
      let newY = resizeStartPos.current.startY;

      // Handle corner and edge resizing
      if (resizeHandle === 'top-left') {
        newWidth = Math.max(minWidth, resizeStartPos.current.width - deltaX);
        newHeight = Math.max(minHeight, resizeStartPos.current.height - deltaY);
        newX = resizeStartPos.current.startX + (resizeStartPos.current.width - newWidth);
        newY = resizeStartPos.current.startY + (resizeStartPos.current.height - newHeight);
      } else if (resizeHandle === 'top-right') {
        newWidth = Math.max(minWidth, resizeStartPos.current.width + deltaX);
        newHeight = Math.max(minHeight, resizeStartPos.current.height - deltaY);
        newY = resizeStartPos.current.startY + (resizeStartPos.current.height - newHeight);
      } else if (resizeHandle === 'bottom-left') {
        newWidth = Math.max(minWidth, resizeStartPos.current.width - deltaX);
        newHeight = Math.max(minHeight, resizeStartPos.current.height + deltaY);
        newX = resizeStartPos.current.startX + (resizeStartPos.current.width - newWidth);
      } else if (resizeHandle === 'bottom-right') {
        newWidth = Math.max(minWidth, resizeStartPos.current.width + deltaX);
        newHeight = Math.max(minHeight, resizeStartPos.current.height + deltaY);
      } else if (resizeHandle === 'top') {
        newHeight = Math.max(minHeight, resizeStartPos.current.height - deltaY);
        newY = resizeStartPos.current.startY + (resizeStartPos.current.height - newHeight);
      } else if (resizeHandle === 'bottom') {
        newHeight = Math.max(minHeight, resizeStartPos.current.height + deltaY);
      } else if (resizeHandle === 'left') {
        newWidth = Math.max(minWidth, resizeStartPos.current.width - deltaX);
        newX = resizeStartPos.current.startX + (resizeStartPos.current.width - newWidth);
      } else if (resizeHandle === 'right') {
        newWidth = Math.max(minWidth, resizeStartPos.current.width + deltaX);
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
      // Update refs for use in mouseup handler
      currentSizeRef.current = { width: newWidth, height: newHeight };
      currentPosRef.current = { x: newX, y: newY };
    };

    const handleMouseUp = () => {
      if (isResizing) {
        // Get final size and position from refs (always up-to-date)
        const finalSize = currentSizeRef.current;
        const finalPos = currentPosRef.current;
        
        setIsResizing(false);
        setResizeHandle(null);
        
        // Call callbacks with final values
        onResize?.(id, finalSize.width, finalSize.height);
        onPositionChange?.(id, finalPos.x, finalPos.y);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = resizeHandle?.includes('nwse') ? 'nwse-resize' : 
                                   resizeHandle?.includes('nesw') ? 'nesw-resize' :
                                   resizeHandle?.includes('ns') ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
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
        ref={borderRef}
        className={`relative w-full h-full bg-white dark:bg-gray-800 shadow-lg rounded-lg transition-all ${
          isResizing 
            ? 'border-4 border-indigo-600 border-dashed' 
            : editMode 
              ? 'border-4 border-indigo-400' 
              : 'border-2 border-transparent hover:border-indigo-500'
        }`}
        style={{ minWidth: `${minWidth}px`, minHeight: `${minHeight}px` }}
        onMouseDown={editMode ? handleMouseDown : undefined}
        onMouseMove={editMode ? handleBorderMouseMove : undefined}
        onMouseLeave={editMode ? handleBorderMouseLeave : undefined}
      >
        {/* Control Bar - Top Middle - Always Visible in Edit Mode */}
        {editMode && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-1 bg-indigo-600 dark:bg-indigo-700 rounded-lg px-2 py-1.5 opacity-100 shadow-lg">
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 text-white hover:bg-indigo-700 rounded cursor-grab active:cursor-grabbing transition-colors"
              title="Drag widget"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(id)}
                className="p-1.5 text-white hover:bg-indigo-700 rounded transition-colors"
                title="Edit widget"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="p-1.5 text-red-200 hover:bg-red-600 rounded transition-colors"
                title="Delete widget"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="w-full h-full overflow-auto p-4"
          onMouseDown={(e) => {
            // Prevent content clicks from triggering resize
            e.stopPropagation();
          }}
        >
          {children}
        </div>

        {/* Resize Handles on Border - Elementor Style - Always Visible */}
        {editMode && (
          <>
            {/* Corner Handles - Larger and more visible */}
            <div
              className={`absolute -top-3 -left-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'top-left' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'top-left');
              }}
              title="Resize from top-left"
              style={{ pointerEvents: 'auto' }}
            />
            <div
              className={`absolute -top-3 -right-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'top-right' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'top-right');
              }}
              title="Resize from top-right"
              style={{ pointerEvents: 'auto' }}
            />
            <div
              className={`absolute -bottom-3 -left-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'bottom-left' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'bottom-left');
              }}
              title="Resize from bottom-left"
              style={{ pointerEvents: 'auto' }}
            />
            <div
              className={`absolute -bottom-3 -right-3 w-6 h-6 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize transition-all z-50 hover:bg-indigo-600 hover:scale-150 shadow-xl ${
                isResizing && resizeHandle === 'bottom-right' ? 'bg-indigo-700 scale-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'bottom-right');
              }}
              title="Resize from bottom-right"
              style={{ pointerEvents: 'auto' }}
            />
            
            {/* Edge Handles - Top */}
            <div
              className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-indigo-500 border-2 border-white rounded-full cursor-ns-resize transition-all z-50 hover:bg-indigo-600 hover:scale-y-150 shadow-xl ${
                isResizing && resizeHandle === 'top' ? 'bg-indigo-700 scale-y-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'top');
              }}
              title="Resize height from top"
              style={{ pointerEvents: 'auto' }}
            />
            
            {/* Edge Handles - Bottom */}
            <div
              className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-indigo-500 border-2 border-white rounded-full cursor-ns-resize transition-all z-50 hover:bg-indigo-600 hover:scale-y-150 shadow-xl ${
                isResizing && resizeHandle === 'bottom' ? 'bg-indigo-700 scale-y-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'bottom');
              }}
              title="Resize height from bottom"
              style={{ pointerEvents: 'auto' }}
            />
            
            {/* Edge Handles - Left */}
            <div
              className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-5 h-16 bg-indigo-500 border-2 border-white rounded-full cursor-ew-resize transition-all z-50 hover:bg-indigo-600 hover:scale-x-150 shadow-xl ${
                isResizing && resizeHandle === 'left' ? 'bg-indigo-700 scale-x-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'left');
              }}
              title="Resize width from left"
              style={{ pointerEvents: 'auto' }}
            />
            
            {/* Edge Handles - Right */}
            <div
              className={`absolute -right-3 top-1/2 transform -translate-y-1/2 w-5 h-16 bg-indigo-500 border-2 border-white rounded-full cursor-ew-resize transition-all z-50 hover:bg-indigo-600 hover:scale-x-150 shadow-xl ${
                isResizing && resizeHandle === 'right' ? 'bg-indigo-700 scale-x-150 ring-2 ring-indigo-300' : 'opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, 'right');
              }}
              title="Resize width from right"
              style={{ pointerEvents: 'auto' }}
            />
          </>
        )}
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
  editMode = true,
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
        editMode={editMode}
      >
        {children}
      </DraggableWidget>
    </DndContext>
  );
}

