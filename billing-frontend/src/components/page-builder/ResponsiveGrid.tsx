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

const GRID_BREAKPOINTS = [400, 600, 900];

interface ResponsiveGridProps {
  component: Component;
  onAddToContainer?: (type: ComponentType, containerId?: string, columnIndex?: number) => void;
  onColumnClick?: (containerId: string, columnIndex: number) => void;
  onAddColumn?: (containerId: string) => void;
  onRemoveColumn?: (containerId: string) => void;
}

export default function ResponsiveGrid({
  component,
  onAddToContainer,
  onColumnClick,
  onAddColumn,
  onRemoveColumn,
}: ResponsiveGridProps) {
  const { containerRef, actualColumns } = useResponsiveColumns(3, GRID_BREAKPOINTS);
  
  return (
    <div
      ref={containerRef}
      style={{ ...component.style, gridTemplateColumns: `repeat(${actualColumns}, 1fr)` }}
      className={`grid gap-4 ${component.className || ''}`}
    >
    {component.children?.map((child) => (
      <ComponentRenderer
        key={child.id}
        component={child}
        isSelected={false}
        isHovered={false}
        onClick={() => {}}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
        onAddToContainer={onAddToContainer}
        onColumnClick={onColumnClick}
        onAddColumn={onAddColumn}
        onRemoveColumn={onRemoveColumn}
      />
    ))}
  </div>
  );
}

