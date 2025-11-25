'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Component, ComponentType } from './types';
import ComponentRenderer from './ComponentRenderer';

// Custom hook for responsive columns
function useResponsiveColumns(baseColumns: number, minWidths: number[] = [300, 500, 800]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [actualColumns, setActualColumns] = useState(baseColumns);
  const minWidthsRef = useRef(minWidths);
  
  // Update ref when minWidths changes
  useEffect(() => {
    minWidthsRef.current = minWidths;
  }, [minWidths]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateColumns = () => {
      const width = containerRef.current?.offsetWidth || 0;
      const widths = minWidthsRef.current;
      
      let responsiveCols = baseColumns;
      if (width < widths[0]) {
        responsiveCols = 1;
      } else if (width < widths[1]) {
        responsiveCols = Math.min(2, baseColumns);
      } else if (width < widths[2]) {
        responsiveCols = Math.min(3, baseColumns);
      } else {
        responsiveCols = baseColumns;
      }
      
      setActualColumns(responsiveCols);
    };
    
    updateColumns();
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [baseColumns]);
  
  return { containerRef, actualColumns };
}

interface ResponsiveContainerProps {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onAddColumn?: (containerId: string) => void;
  onRemoveColumn?: (containerId: string) => void;
  onColumnClick?: (containerId: string, columnIndex: number) => void;
  onColumnAddClick?: (containerId: string, columnIndex: number) => void;
  onAddToContainer?: (type: ComponentType, containerId?: string, columnIndex?: number) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddAfter?: (componentId: string, type: ComponentType) => void;
  isEditor: boolean;
  selectedComponent: string | null;
}

export default function ResponsiveContainer({
  component,
  isSelected,
  isHovered,
  onAddColumn,
  onRemoveColumn,
  onColumnClick,
  onColumnAddClick,
  onAddToContainer,
  onMouseEnter,
  onMouseLeave,
  onAddAfter,
  isEditor,
  selectedComponent,
}: ResponsiveContainerProps) {
  const containerColumns = component.props?.columns || 2;
  const { containerRef, actualColumns } = useResponsiveColumns(containerColumns);
  
  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        ...component.style,
      }}
      className={`${isEditor ? 'bg-white border border-gray-200 rounded-md shadow-sm' : ''} ${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
    >
      {isEditor && (
        <div className="mb-2 flex items-center justify-between p-2 bg-gray-50 border-b">
          <h3 className="text-xs font-medium text-gray-600">
            Container ({containerColumns} columns, showing {actualColumns})
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddColumn?.(component.id);
              }}
              className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
            >
              + Column
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveColumn?.(component.id);
              }}
              className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              - Column
            </button>
          </div>
        </div>
      )}
      
      <div 
        className="grid gap-0"
        style={{ gridTemplateColumns: `repeat(${actualColumns}, 1fr)` }}
      >
      {Array.from({ length: containerColumns }).map((_, index) => {
        const child = component.children?.[index];
        // Only render visible columns
        if (index >= actualColumns) return null;
        
        return (
          <div 
            key={index} 
            className={`${isEditor ? 'min-h-[80px] border border-dashed border-gray-300 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 transition-all' : ''} ${isEditor ? 'cursor-pointer' : ''}`}
            onClick={isEditor ? (e) => {
              e.stopPropagation();
              onColumnClick?.(component.id, index);
            } : undefined}
          >
            {child ? (
              <ComponentRenderer
                component={child}
                isSelected={isSelected && selectedComponent === child.id}
                isHovered={isHovered}
                onClick={() => {
                  onColumnClick?.(component.id, index);
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onAddToContainer={onAddToContainer}
                onColumnClick={onColumnClick}
                onColumnAddClick={onColumnAddClick}
                onAddColumn={onAddColumn}
                onRemoveColumn={onRemoveColumn}
                onAddAfter={onAddAfter}
                containerId={component.id}
                columnIndex={index}
                isEditor={isEditor}
                selectedComponent={selectedComponent}
              />
            ) : isEditor ? (
              // Show placeholder only for empty columns in editor mode
              <div 
                className="cursor-pointer transition-all flex items-center justify-center group h-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onColumnAddClick?.(component.id, index);
                }}
              >
                <div className="text-center text-gray-400 group-hover:text-indigo-600">
                  <svg className="h-6 w-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-xs font-medium">Click to Add</p>
                  <p className="text-xs mt-0.5 opacity-75">Col {index + 1}</p>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  </div>
  );
}

