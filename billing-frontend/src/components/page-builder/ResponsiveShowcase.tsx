'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Component } from './types';

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

const SHOWCASE_BREAKPOINTS = [400, 600, 900];

interface ResponsiveShowcaseProps {
  component: Component;
  isEditor: boolean;
  isHovered: boolean;
}

export default function ResponsiveShowcase({
  component,
  isEditor,
  isHovered,
}: ResponsiveShowcaseProps) {
  const showcaseColumns = component.props?.columns || 3;
  const { containerRef, actualColumns } = useResponsiveColumns(showcaseColumns, SHOWCASE_BREAKPOINTS);
  
  return (
    <div
      ref={containerRef}
      style={{
        padding: '1rem',
        ...component.style
      }}
      className={`${component.className || ''} ${isEditor && isHovered ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
    >
      {component.props?.showTitle && (
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
          {component.props?.title || 'Showcase'}
        </h2>
      )}
      {component.props?.showSubtitle && (
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#6b7280' }}>
          {component.props?.subtitle || 'Showcase your best work'}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${actualColumns}, 1fr)`,
          gap: '1rem'
        }}
      >
      {Array.from({ length: 3 }).map((_, index) => {
        // Only render visible columns
        if (index >= actualColumns) return null;
        
        return (
          <div
            key={index}
            style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}
          >
            Showcase item {index + 1}
          </div>
        );
      })}
    </div>
  </div>
  );
}

