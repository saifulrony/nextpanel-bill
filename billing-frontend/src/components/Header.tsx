'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import {
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  BellIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';

interface HeaderElement {
  id: string;
  type: 'logo' | 'navigation' | 'search' | 'cart' | 'user-menu' | 'wishlist' | 'notifications' | 'mobile-menu';
  label: string;
  visible: boolean;
  position: number;
  settings: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontWeight?: string;
    padding?: number;
    borderRadius?: number;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

interface HeaderProps {
  headerDesign?: {
    selectedDesign: string;
    elements: HeaderElement[];
    deviceType: string;
    timestamp: string;
  } | null;
  settings?: {
    logo?: string | null;
    logoWidth?: number;
    logoHeight?: number;
    logoPosition?: 'left' | 'center' | 'right';
    logoPadding?: number;
    logoOpacity?: number;
    logoMaxWidth?: string;
    logoText?: string;
    logoColor?: string;
    headerBackgroundColor?: string;
    headerTextColor?: string;
    headerPadding?: number;
    headerBorderRadius?: number;
    headerShadow?: string;
    headerMarginTop?: number;
    headerMarginBottom?: number;
    headerMarginLeft?: number;
    headerMarginRight?: number;
    headerIsStatic?: boolean;
  };
}

const iconMap = {
  'shopping-cart': ShoppingCartIcon,
  'user': UserIcon,
  'search': MagnifyingGlassIcon,
  'heart': HeartIcon,
  'bell': BellIcon,
  'menu': Bars3BottomLeftIcon,
};

const renderElement = (element: HeaderElement, showUserMenu: boolean, setShowUserMenu: (show: boolean) => void, settings?: any, router?: any, user?: any, isAuthenticated?: boolean, logout?: () => void, getItemCount?: () => number, searchQuery?: string, setSearchQuery?: (query: string) => void) => {
  
  // Try to get icon from element, or fallback to iconMap
  let IconComponent = element.icon;
  
  // If element.icon is not a valid component, try to get it from iconMap
  if (!IconComponent || typeof IconComponent !== 'function') {
    const iconKey = element.type === 'cart' ? 'shopping-cart' : 
                   element.type === 'user-menu' ? 'user' :
                   element.type === 'mobile-menu' ? 'menu' :
                   element.type;
    IconComponent = iconMap[iconKey as keyof typeof iconMap];
  }
  
  // Safety check for valid icon component
  const isValidIcon = IconComponent && typeof IconComponent === 'function';
  
  switch (element.type) {
        case 'logo':
          return (
            <div className="flex items-center">
              {settings?.logo ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  className="cursor-pointer"
                  style={{
                    width: `${settings.logoWidth || 200}px`,
                    height: `${settings.logoHeight || 60}px`,
                    maxWidth: settings.logoMaxWidth || '200px',
                    opacity: (settings.logoOpacity || 100) / 100,
                    padding: `${settings.logoPadding || 16}px`,
                  }}
                  onClick={() => router.push('/')}
                />
              ) : (
                <h1 
                  className="text-2xl font-bold text-gray-900 cursor-pointer"
                  style={{ 
                    color: settings?.logoColor || element.settings.color || '#111827',
                    fontSize: `${element.settings.fontSize || 24}px`,
                    fontWeight: element.settings.fontWeight || 'bold',
                    fontFamily: settings?.logoFontFamily || 'Inter, sans-serif'
                  }}
                  onClick={() => router.push('/')}
                >
                  {settings?.logoText || 'NextPanel'}
                </h1>
              )}
            </div>
          );
    
    case 'navigation':
      return (
        <nav className="hidden md:flex space-x-6">
          <a 
            href="/" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            style={{ color: element.settings.color || '#4b5563' }}
          >
            Home
          </a>
          <a 
            href="/shop" 
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            style={{ color: element.settings.color || '#4f46e5' }}
          >
            Shop
          </a>
          <a 
            href="/#pricing" 
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            style={{ color: element.settings.color || '#4b5563' }}
          >
            Pricing
          </a>
        </nav>
      );
    
    case 'search':
      return (
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery || ''}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery?.trim()) {
                      router?.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
            className="px-3 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-64"
            style={{
              backgroundColor: element.settings.backgroundColor || '#ffffff',
              color: element.settings.color || '#374151',
              fontSize: `${element.settings.fontSize || 14}px`
            }}
          />
          {isValidIcon && (
            <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
        </div>
      );
    
    case 'cart':
      return (
        <button
          onClick={() => router?.push('/cart')}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
          style={{ color: element.settings.color || '#6b7280' }}
        >
          <ShoppingCartIcon className="h-6 w-6" />
          {getItemCount && getItemCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {getItemCount()}
            </span>
          )}
        </button>
      );
    
    case 'user-menu':
      return (
        <div className="relative">
          {isAuthenticated && user ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                style={{ color: element.settings.color || '#374151' }}
              >
                <div 
                  className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: element.settings.backgroundColor || '#4f46e5' }}
                >
                  {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium hidden sm:block">{user.full_name || user.email}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                        <a
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Admin Dashboard
                        </a>
                        <a
                          href="/customer"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Customer Portal
                        </a>
                        <a
                          href="/shop"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Shop
                        </a>
                        <button
                          onClick={() => {
                            logout?.();
                            setShowUserMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <a 
                href="/login" 
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                style={{ color: element.settings.color || '#6b7280' }}
              >
                Login
              </a>
              <a 
                href="/auth/register" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                style={{ backgroundColor: element.settings.backgroundColor || '#4f46e5' }}
              >
                Get Started
              </a>
            </div>
          )}
        </div>
      );
    
    case 'wishlist':
      return (
        <div
          className="flex items-center space-x-1 p-1 rounded hover:bg-gray-100 transition-colors"
          style={{ color: element.settings.color }}
        >
          {isValidIcon && <IconComponent className="h-4 w-4" />}
          <span className="text-sm">Wishlist</span>
        </div>
      );
    
    case 'notifications':
      return (
        <button
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded hover:bg-gray-100"
          style={{ color: element.settings.color || '#6b7280' }}
        >
          <BellIcon className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">3</span>
        </button>
      );
    
    case 'mobile-menu':
      return (
        <div
          className="flex items-center space-x-1 p-1 rounded hover:bg-gray-100 transition-colors"
          style={{ color: element.settings.color }}
        >
          {isValidIcon && <IconComponent className="h-4 w-4" />}
        </div>
      );
    
    default:
      return <div className="text-sm">{element.label}</div>;
  }
};

export default function Header({ headerDesign, settings }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount } = useCart();
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // If no header design is provided, show a default header
  if (!headerDesign || !headerDesign.elements) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">NextPanel</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="/" className="text-gray-600 hover:text-gray-900 font-medium">Home</a>
                <a href="/domains" className="text-gray-600 hover:text-gray-900 font-medium">Domains</a>
                <a href="/shop" className="text-indigo-600 hover:text-indigo-700 font-medium">Shop</a>
                <a href="/#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-indigo-600">Cart</button>
              <button className="text-gray-700 hover:text-indigo-600">Account</button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const visibleElements = headerDesign.elements.filter(el => el.visible);
  const leftElements = visibleElements.filter(el => el.position < 2).sort((a, b) => a.position - b.position);
  const centerElements = visibleElements.filter(el => el.position === 2);
  const rightElements = visibleElements.filter(el => el.position > 2).sort((a, b) => a.position - b.position);

  return (
    <header 
      className={`bg-white shadow-sm z-50 ${settings?.headerIsStatic ? '' : 'sticky top-0'}`}
      style={{
        backgroundColor: settings?.headerBackgroundColor || '#ffffff',
        color: settings?.headerTextColor || '#374151',
        padding: `${Math.max((settings?.headerPadding || 16) * 0.6, 8)}px 0`,
        borderRadius: `${settings?.headerBorderRadius || 0}px`,
        boxShadow: settings?.headerShadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 
                   settings?.headerShadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                   settings?.headerShadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
        marginTop: `${settings?.headerMarginTop || 0}px`,
        marginBottom: `${settings?.headerMarginBottom || 0}px`,
        marginLeft: `${settings?.headerMarginLeft || 0}px`,
        marginRight: `${settings?.headerMarginRight || 0}px`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Left Elements */}
          <div className="flex items-center space-x-8">
            {leftElements.map(el => (
              <div key={el.id}>
                {renderElement(el, showUserMenu, setShowUserMenu, settings, router, user, isAuthenticated, logout, getItemCount, searchQuery, setSearchQuery)}
              </div>
            ))}
          </div>

          {/* Center Elements */}
          <div className="flex items-center">
            {centerElements.map(el => (
              <div key={el.id}>
                {renderElement(el, showUserMenu, setShowUserMenu, settings, router, user, isAuthenticated, logout, getItemCount, searchQuery, setSearchQuery)}
              </div>
            ))}
          </div>

          {/* Right Elements */}
          <div className="flex items-center space-x-4">
            {rightElements.map(el => (
              <div key={el.id} className={el.type === 'user-menu' ? 'user-menu-container' : ''}>
                {renderElement(el, showUserMenu, setShowUserMenu, settings, router, user, isAuthenticated, logout, getItemCount, searchQuery, setSearchQuery)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
