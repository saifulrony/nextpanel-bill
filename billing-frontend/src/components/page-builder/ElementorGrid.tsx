'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Component, ComponentType } from './types';
import ComponentRenderer from './ComponentRenderer';
import { useDroppable } from '@dnd-kit/core';

// Grid layout presets with different column widths and patterns
const GRID_LAYOUTS = [
  {
    id: 'layout-1',
    name: 'Layout 1',
    rows: 2,
    columns: 3,
    gridTemplate: [
      ['1', '1', '2'],  // Row 1: first cell spans 2 columns, second cell spans 1
      ['3', '4', '5'],  // Row 2: three equal cells
    ],
    columnWidths: [33.33, 33.33, 33.34],
    cellSpans: {
      '0-0': { colSpan: 2 }, // First cell spans 2 columns
    }
  },
  {
    id: 'layout-2',
    name: 'Layout 2',
    rows: 2,
    columns: 4,
    gridTemplate: [
      ['1', '2', '3', '4'],
      ['5', '5', '6', '6'],  // Row 2: first two cells span 1 col each, last two span 1 col each
    ],
    columnWidths: [25, 25, 25, 25],
    cellSpans: {}
  },
  {
    id: 'layout-3',
    name: 'Layout 3',
    rows: 3,
    columns: 3,
    gridTemplate: [
      ['1', '1', '1'],  // Full width
      ['2', '3', '4'],  // Three columns
      ['5', '5', '6'],  // Two columns + one
    ],
    columnWidths: [33.33, 33.33, 33.34],
    cellSpans: {
      '0-0': { colSpan: 3 }, // First row spans all 3 columns
      '2-0': { colSpan: 2 }, // Third row first cell spans 2 columns
    }
  },
  {
    id: 'layout-4',
    name: 'Layout 4',
    rows: 2,
    columns: 5,
    gridTemplate: [
      ['1', '2', '3', '4', '5'],
      ['6', '6', '7', '8', '9'],  // First cell spans 2 columns
    ],
    columnWidths: [20, 20, 20, 20, 20],
    cellSpans: {
      '1-0': { colSpan: 2 }, // Second row first cell spans 2 columns
    }
  },
  {
    id: 'layout-5',
    name: 'Layout 5',
    rows: 3,
    columns: 4,
    gridTemplate: [
      ['1', '2', '3', '4'],
      ['5', '5', '6', '6'],  // Two cells each spanning 2 columns
      ['7', '8', '9', '10'],
    ],
    columnWidths: [25, 25, 25, 25],
    cellSpans: {
      '1-0': { colSpan: 2 }, // Second row first cell spans 2 columns
      '1-2': { colSpan: 2 }, // Second row third cell spans 2 columns
    }
  },
  {
    id: 'layout-6',
    name: 'Layout 6',
    rows: 2,
    columns: 6,
    gridTemplate: [
      ['1', '2', '3', '4', '5', '6'],
      ['7', '7', '7', '8', '9', '10'],  // First cell spans 3 columns
    ],
    columnWidths: [16.67, 16.67, 16.67, 16.67, 16.67, 16.65],
    cellSpans: {
      '1-0': { colSpan: 3 }, // Second row first cell spans 3 columns
    }
  },
];

// Grid cell component that uses useDroppable hook
function GridCell({
  component,
  cellData,
  rowIndex,
  colIndex,
  colSpan,
  isSelected,
  isHovered,
  selectedComponent,
  isEditor,
  onAddToContainer,
  onCellClick,
  onCellAddClick,
  onMouseEnter,
  onMouseLeave,
  onAddAfter,
  gridId,
}: {
  component: Component;
  cellData: Component | null;
  rowIndex: number;
  colIndex: number;
  colSpan: number;
  isSelected: boolean;
  isHovered: boolean;
  selectedComponent: string | null;
  isEditor: boolean;
  onAddToContainer?: (type: ComponentType, containerId?: string, columnIndex?: number) => void;
  onCellClick?: (gridId: string, rowIndex: number, colIndex: number) => void;
  onCellAddClick?: (gridId: string, rowIndex: number, colIndex: number) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddAfter?: (componentId: string, type: ComponentType) => void;
  gridId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `grid-${gridId}-cell-${rowIndex}-${colIndex}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[100px] ${
        isEditor ? 'border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 transition-all' : ''
      } ${isOver ? 'border-indigo-500 bg-indigo-100 ring-2 ring-indigo-300' : ''}`}
      style={{
        gridColumn: colSpan > 1 ? `span ${colSpan}` : 'auto',
      }}
      onClick={(e) => {
        // Only handle cell click if clicking on empty cell area, not on the widget itself
        // Widget clicks are handled by ComponentRenderer's onClick
        if (!cellData && onCellClick) {
          e.stopPropagation();
          onCellClick(gridId, rowIndex, colIndex);
        }
      }}
    >
      {/* Cell Header in Editor */}
      {isEditor && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-1 bg-indigo-100 border-b border-indigo-200 z-10">
          <div className="text-xs font-medium text-indigo-700 px-2">
            R{rowIndex + 1}C{colIndex + 1}
            {colSpan > 1 && ` (span ${colSpan})`}
          </div>
        </div>
      )}

      {/* Cell Content */}
      <div className={isEditor ? 'pt-8' : ''}>
        {cellData ? (
          <ComponentRenderer
            component={cellData}
            isSelected={isSelected && selectedComponent === cellData.id}
            isHovered={isHovered}
            onClick={() => {
              // Directly select the widget if selection handler is available
              if (onSelectComponent) {
                onSelectComponent(cellData.id);
              } else if (onCellClick) {
                onCellClick(gridId, rowIndex, colIndex);
              }
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onAddToContainer={onAddToContainer}
            onColumnClick={onCellClick ? (containerId: string, columnIndex: number) => {
              const rowIndex = Math.floor(columnIndex / 1000);
              const colIndex = columnIndex % 1000;
              onCellClick(containerId, rowIndex, colIndex);
            } : undefined}
            onColumnAddClick={onCellAddClick ? (containerId: string, columnIndex: number) => {
              const rowIndex = Math.floor(columnIndex / 1000);
              const colIndex = columnIndex % 1000;
              onCellAddClick(containerId, rowIndex, colIndex);
            } : undefined}
            onAddColumn={() => {}}
            onRemoveColumn={() => {}}
            onAddAfter={onAddAfter}
            containerId={gridId}
            columnIndex={rowIndex * 1000 + colIndex}
            isEditor={isEditor}
            selectedComponent={selectedComponent}
            onSelectComponent={onSelectComponent}
          />
        ) : isEditor ? (
          // Empty Cell Placeholder
          <div
            className="cursor-pointer transition-all flex flex-col items-center justify-center h-full min-h-[100px] group"
            onClick={(e) => {
              e.stopPropagation();
              if (onCellAddClick) {
                onCellAddClick(gridId, rowIndex, colIndex);
              }
            }}
          >
            <div className="text-center text-gray-400 group-hover:text-indigo-600">
              <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-sm font-medium">Click to Add Element</p>
              <p className="text-xs mt-1 opacity-75">or drag component here</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface ElementorGridProps {
  component: Component;
  isSelected: boolean;
  isHovered: boolean;
  onAddToContainer?: (type: ComponentType, containerId?: string, columnIndex?: number) => void;
  onColumnClick?: (containerId: string, columnIndex: number) => void;
  onColumnAddClick?: (containerId: string, columnIndex: number) => void;
  onAddColumn?: (containerId: string) => void;
  onRemoveColumn?: (containerId: string) => void;
  onUpdate?: (component: Component) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddAfter?: (componentId: string, type: ComponentType) => void;
  isEditor: boolean;
  selectedComponent: string | null;
  onSelectComponent?: (componentId: string) => void;
}

export default function ElementorGrid({
  component,
  isSelected,
  isHovered,
  onAddToContainer,
  onColumnClick,
  onColumnAddClick,
  onAddColumn,
  onRemoveColumn,
  onUpdate,
  onMouseEnter,
  onMouseLeave,
  onAddAfter,
  isEditor,
  selectedComponent,
  onSelectComponent,
}: ElementorGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  
  // Get current layout from component props or default to layout-1
  const currentLayout = component.props?.layout || 'layout-1';
  const layoutConfig = GRID_LAYOUTS.find(l => l.id === currentLayout) || GRID_LAYOUTS[0];
  const rows = layoutConfig.rows;
  const columns = layoutConfig.columns;
  const columnWidths = layoutConfig.columnWidths;
  const gridTemplate = layoutConfig.gridTemplate;
  const cellSpans = layoutConfig.cellSpans;
  
  // Grid data structure: component.props.gridData is a flat object with keys like "0-0", "0-1", etc.
  const gridData = component.props?.gridData || {};
  
  // Helper to get cell data
  const getCellData = (rowIndex: number, colIndex: number): Component | null => {
    const key = `${rowIndex}-${colIndex}`;
    return gridData[key] || null;
  };

  // Helper to get cell span
  const getCellSpan = (rowIndex: number, colIndex: number): number => {
    const key = `${rowIndex}-${colIndex}`;
    return (cellSpans as any)[key]?.colSpan || 1;
  };

  // Build cells array from grid template - only render cells that start at their position
  const cells: Array<{ rowIndex: number; colIndex: number; colSpan: number }> = [];
  gridTemplate.forEach((row, rowIndex) => {
    const processedCells = new Set<string>();
    let currentCol = 0;
    
    row.forEach((cellId, idx) => {
      // Only process the first occurrence of each cell ID (the start of a span)
      if (!processedCells.has(cellId)) {
        processedCells.add(cellId);
        const colSpan = getCellSpan(rowIndex, currentCol);
        cells.push({
          rowIndex,
          colIndex: currentCol,
          colSpan,
        });
        // Skip the columns that are part of this span
        currentCol += colSpan;
      }
    });
  });

  const handleLayoutChange = (layoutId: string) => {
    if (onUpdate) {
      const newLayout = GRID_LAYOUTS.find(l => l.id === layoutId);
      if (newLayout) {
        // Keep existing grid data, but remove cells outside new dimensions
        const newGridData: Record<string, Component> = {};
        Object.keys(gridData).forEach(key => {
          const [row, col] = key.split('-').map(Number);
          if (row < newLayout.rows && col < newLayout.columns) {
            newGridData[key] = gridData[key];
          }
        });
        
        onUpdate({
          ...component,
          props: {
            ...component.props,
            layout: layoutId,
            gridData: newGridData,
          },
        });
      }
    }
    setShowLayoutSelector(false);
  };

  const handleCellClick = (gridId: string, rowIndex: number, colIndex: number) => {
    // Check if there's a widget in this cell first
    const cellKey = `${rowIndex}-${colIndex}`;
    const gridData = component.props?.gridData || {};
    const cellWidget = gridData[cellKey];
    
    // If there's a widget, select it directly
    if (cellWidget && onSelectComponent) {
      onSelectComponent(cellWidget.id);
      return;
    }
    
    // Otherwise, handle as column click (for empty cells)
    if (onColumnClick) {
      onColumnClick(gridId, rowIndex * 1000 + colIndex);
    }
  };

  const handleCellAddClick = (gridId: string, rowIndex: number, colIndex: number) => {
    if (onColumnAddClick) {
      onColumnAddClick(gridId, rowIndex * 1000 + colIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative ${isEditor && isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${isEditor && isHovered && !isSelected ? 'ring-2 ring-indigo-300 ring-offset-2' : ''}`}
      style={{
        ...component.style,
        display: 'grid',
        gridTemplateColumns: columnWidths.map(w => `${w}%`).join(' '),
        gridTemplateRows: `repeat(${rows}, minmax(100px, auto))`,
        gap: component.props?.gap || '10px',
        width: '100%',
      }}
    >
      {/* Editor Controls */}
      {isEditor && (
        <>
          {/* Layout Selector Button */}
          <div className="absolute -top-8 left-0 z-10 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLayoutSelector(!showLayoutSelector);
              }}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 shadow-lg flex items-center gap-2"
              title="Change Layout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
              {layoutConfig.name}
            </button>
            
            {/* Layout Selector Dropdown */}
            {showLayoutSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-3 min-w-[300px]">
                <div className="text-xs font-semibold text-gray-700 mb-3 px-2">Choose Grid Layout</div>
                <div className="grid grid-cols-2 gap-3">
                  {GRID_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLayoutChange(layout.id);
                      }}
                      className={`p-3 border-2 rounded-lg text-xs font-medium transition-all ${
                        currentLayout === layout.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                      }`}
                      title={layout.name}
                    >
                      {/* Visual Grid Preview */}
                      <div 
                        className="grid gap-1 mb-2"
                        style={{ 
                          gridTemplateColumns: layout.columnWidths.map(w => `${w}%`).join(' '),
                          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                          width: '100%',
                          height: '60px'
                        }}
                      >
                        {layout.gridTemplate.flatMap((row, rowIdx) => 
                          row.map((cellId, colIdx) => {
                            const cellSpan = (layout.cellSpans as any)[`${rowIdx}-${colIdx}`]?.colSpan || 1;
                            // Only render the first cell of a span
                            const isFirstInSpan = !row.slice(0, colIdx).includes(cellId);
                            if (!isFirstInSpan) return null;
                            
                            return (
                              <div
                                key={`${rowIdx}-${colIdx}`}
                                className="bg-indigo-500 rounded"
                                style={{ 
                                  gridColumn: cellSpan > 1 ? `span ${cellSpan}` : 'auto',
                                  minHeight: '12px'
                                }}
                              />
                            );
                          })
                        )}
                      </div>
                      <div className="text-[10px] font-semibold">{layout.name}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        {layout.rows}×{layout.columns} Grid
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grid Info Badge */}
          <div className="absolute -top-8 right-0 z-10">
            <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
              {rows}×{columns} Grid
            </div>
          </div>
        </>
      )}

      {/* Grid Cells */}
      {cells.map(({ rowIndex, colIndex, colSpan }) => (
        <GridCell
          key={`${rowIndex}-${colIndex}`}
          component={component}
          cellData={getCellData(rowIndex, colIndex)}
          rowIndex={rowIndex}
          colIndex={colIndex}
          colSpan={colSpan}
          isSelected={isSelected}
          isHovered={isHovered}
          selectedComponent={selectedComponent}
          isEditor={isEditor}
          onAddToContainer={onAddToContainer}
          onCellClick={handleCellClick}
          onCellAddClick={handleCellAddClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onAddAfter={onAddAfter}
          gridId={component.id}
        />
      ))}
    </div>
  );
}
