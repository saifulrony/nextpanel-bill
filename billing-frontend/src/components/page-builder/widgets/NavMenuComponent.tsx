'use client';

import React, { useState } from 'react';

interface MenuItem {
  id: string;
  label: string;
  link: string;
  icon?: string;
  iconType?: 'heroicon' | 'emoji' | 'image';
  children?: MenuItem[];
  openInNewTab?: boolean;
}

interface NavMenuComponentProps {
  items?: MenuItem[];
  orientation?: 'horizontal' | 'vertical';
  alignment?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
  hoverColor?: string;
  activeColor?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  gap?: string;
  borderRadius?: string;
  showIcons?: boolean;
  mobileBreakpoint?: number;
  mobileMenuStyle?: 'dropdown' | 'sidebar';
  style?: React.CSSProperties;
  props?: Record<string, any>;
}

export default function NavMenuComponent({
  items = [],
  orientation = 'horizontal',
  alignment = 'left',
  backgroundColor = 'transparent',
  textColor = '#374151',
  hoverColor = '#4f46e5',
  activeColor = '#4f46e5',
  fontSize = '1rem',
  fontWeight = '500',
  padding = '0.75rem 1rem',
  gap = '0.5rem',
  borderRadius = '0.375rem',
  showIcons = true,
  mobileBreakpoint = 768,
  mobileMenuStyle = 'dropdown',
  style,
  props,
}: NavMenuComponentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  const toggleSubmenu = (itemId: string) => {
    const newOpenSubmenus = new Set(openSubmenus);
    if (newOpenSubmenus.has(itemId)) {
      newOpenSubmenus.delete(itemId);
    } else {
      newOpenSubmenus.add(itemId);
    }
    setOpenSubmenus(newOpenSubmenus);
  };

  const renderIcon = (item: MenuItem) => {
    if (!showIcons || !item.icon) return null;

    if (item.iconType === 'emoji') {
      return <span className="mr-2 text-lg">{item.icon}</span>;
    }

    if (item.iconType === 'image') {
      return (
        <img
          src={item.icon}
          alt=""
          className="w-5 h-5 mr-2"
          style={{ objectFit: 'contain' }}
        />
      );
    }

    // Heroicon (default)
    const iconMap: Record<string, React.ReactNode> = {
      home: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      about: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      contact: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      services: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      products: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      blog: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    };

    return iconMap[item.icon.toLowerCase()] || (
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    );
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenus.has(item.id);

    const menuItemClasses = `
      flex items-center justify-between
      ${orientation === 'horizontal' ? 'flex-row' : 'flex-col items-start'}
      transition-colors duration-200
      ${depth > 0 ? 'pl-4' : ''}
    `;

    const linkClasses = `
      flex items-center
      ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
      w-full
      transition-colors duration-200
      hover:opacity-80
    `;

    return (
      <li
        key={item.id}
        className="relative"
        style={{
          padding: depth === 0 ? padding : `0.5rem ${padding}`,
        }}
      >
        <div className={menuItemClasses}>
          <a
            href={item.link || '#'}
            target={item.openInNewTab ? '_blank' : undefined}
            rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
            className={linkClasses}
            style={{
              color: textColor,
              fontSize: fontSize,
              fontWeight: fontWeight,
              borderRadius: borderRadius,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = hoverColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = textColor;
            }}
          >
            {renderIcon(item)}
            <span>{item.label}</span>
          </a>
          {hasChildren && (
            <button
              onClick={() => toggleSubmenu(item.id)}
              className="ml-2 p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: textColor }}
              aria-label="Toggle submenu"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        {hasChildren && isSubmenuOpen && (
          <ul
            className="mt-2 space-y-1"
            style={{
              backgroundColor: props?.submenuBackgroundColor || 'rgba(0, 0, 0, 0.05)',
              borderRadius: borderRadius,
              padding: '0.5rem',
            }}
          >
            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const getAlignmentClass = () => {
    if (orientation === 'vertical') return 'items-start';
    switch (alignment) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-start';
    }
  };

  return (
    <>
      <style jsx>{`
        @media (max-width: ${mobileBreakpoint}px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
        }
        @media (min-width: ${mobileBreakpoint + 1}px) {
          .mobile-menu-button {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
      <nav
        className="relative"
        style={{
          backgroundColor: backgroundColor,
          borderRadius: borderRadius,
          padding: orientation === 'vertical' ? padding : '0',
          ...style,
        }}
      >
        {/* Desktop Menu */}
        <ul
          className={`desktop-menu flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} ${getAlignmentClass()} list-none m-0 p-0`}
          style={{
            gap: gap,
          }}
        >
          {items.map((item) => renderMenuItem(item))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button w-full flex items-center justify-between p-3 rounded"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            fontSize: fontSize,
            fontWeight: fontWeight,
            borderRadius: borderRadius,
          }}
          aria-label="Toggle menu"
        >
          <span>Menu</span>
          <svg
            className={`w-6 h-6 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className={`mobile-menu absolute ${mobileMenuStyle === 'sidebar' ? 'left-0 top-full' : 'left-0 top-full w-full'} z-50 mt-2 rounded shadow-lg`}
            style={{
              backgroundColor: props?.mobileMenuBackgroundColor || backgroundColor || '#ffffff',
              borderRadius: borderRadius,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              maxHeight: mobileMenuStyle === 'dropdown' ? '80vh' : '100vh',
              overflowY: 'auto',
              width: mobileMenuStyle === 'sidebar' ? '280px' : '100%',
            }}
          >
            <ul className="flex flex-col list-none m-0 p-0">
              {items.map((item) => (
                <li key={item.id} className="border-b border-gray-200 last:border-b-0">
                  <a
                    href={item.link || '#'}
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="flex items-center p-4 transition-colors hover:bg-gray-50"
                    style={{
                      color: textColor,
                      fontSize: fontSize,
                      fontWeight: fontWeight,
                    }}
                    onClick={() => {
                      if (!item.children || item.children.length === 0) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    {renderIcon(item)}
                    <span className="flex-1">{item.label}</span>
                    {item.children && item.children.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSubmenu(item.id);
                        }}
                        className="p-1"
                        style={{ color: textColor }}
                      >
                        <svg
                          className={`w-5 h-5 transition-transform ${openSubmenus.has(item.id) ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </a>
                  {item.children && item.children.length > 0 && openSubmenus.has(item.id) && (
                    <ul className="bg-gray-50">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <a
                            href={child.link || '#'}
                            target={child.openInNewTab ? '_blank' : undefined}
                            rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                            className="flex items-center pl-8 pr-4 py-3 transition-colors hover:bg-gray-100"
                            style={{
                              color: textColor,
                              fontSize: `calc(${fontSize} * 0.9)`,
                            }}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {renderIcon(child)}
                            <span>{child.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  );
}

