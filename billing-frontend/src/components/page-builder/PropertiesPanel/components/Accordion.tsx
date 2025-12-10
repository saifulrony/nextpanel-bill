'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function Accordion({ 
  title, 
  children, 
  defaultOpen = false, 
  isOpen: controlledIsOpen, 
  onToggle,
  className = ''
}: AccordionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">{title}</span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

