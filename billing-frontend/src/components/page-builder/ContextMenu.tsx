'use client';

import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ClipboardIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onCopy,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: ContextMenuProps) {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Menu */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        {onEdit && (
          <button
            onClick={() => handleAction(onEdit)}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <PencilIcon className="h-4 w-4 mr-3 text-indigo-600 dark:text-indigo-400" />
            Edit
          </button>
        )}
        
        {onDuplicate && (
          <button
            onClick={() => handleAction(onDuplicate)}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-400" />
            Duplicate
          </button>
        )}
        
        {onCopy && (
          <button
            onClick={() => handleAction(onCopy)}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ClipboardIcon className="h-4 w-4 mr-3 text-gray-600 dark:text-gray-400" />
            Copy
          </button>
        )}
        
        {(onMoveUp || onMoveDown) && (
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        )}
        
        {onMoveUp && (
          <button
            onClick={() => handleAction(onMoveUp)}
            disabled={!canMoveUp}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpIcon className="h-4 w-4 mr-3 text-green-600 dark:text-green-400" />
            Move Up
          </button>
        )}
        
        {onMoveDown && (
          <button
            onClick={() => handleAction(onMoveDown)}
            disabled={!canMoveDown}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownIcon className="h-4 w-4 mr-3 text-green-600 dark:text-green-400" />
            Move Down
          </button>
        )}
        
        {onDelete && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-3" />
              Delete
            </button>
          </>
        )}
      </div>
    </>
  );
}

