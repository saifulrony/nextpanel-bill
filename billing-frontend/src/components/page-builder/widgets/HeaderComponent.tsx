'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';

interface HeaderComponentProps {
  style?: React.CSSProperties;
  className?: string;
  isEditor?: boolean;
  props?: {
    logoUrl?: string;
    logoText?: string;
    showNavigation?: boolean;
    showCart?: boolean;
    showUserMenu?: boolean;
    navigationItems?: Array<{
      label: string;
      href: string;
    }>;
    backgroundColor?: string;
    textColor?: string;
    logoColor?: string;
  };
}

export default function HeaderComponent({
  style = {},
  className = '',
  isEditor = false,
  props = {}
}: HeaderComponentProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { getItemCount } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [headerDesign, setHeaderDesign] = useState<any>(null);

  const {
    logoUrl: propLogoUrl,
    logoText = 'NextPanel',
    showNavigation = true,
    showCart = true,
    showUserMenu: propShowUserMenu = true,
    navigationItems = [
      { label: 'Home', href: '/' },
      { label: 'Shop', href: '/shop' },
      { label: 'Pricing', href: '/#pricing' },
    ],
    backgroundColor = '#ffffff',
    textColor = '#374151',
    logoColor = '#4f46e5',
  } = props;

  useEffect(() => {
    // Load logo from localStorage if not provided as prop
    if (!propLogoUrl) {
      const logoSettings = localStorage.getItem('logo_settings');
      if (logoSettings) {
        try {
          const settings = JSON.parse(logoSettings);
          if (settings.logo) {
            setLogoUrl(settings.logo);
          }
        } catch (error) {
          console.error('Failed to load logo settings:', error);
        }
      }
    }

    // Load saved header design
    const savedSettings = localStorage.getItem('customization_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.headerDesign) {
          setHeaderDesign(settings.headerDesign);
        }
      } catch (error) {
        console.error('Failed to load header design:', error);
      }
    }
  }, [propLogoUrl]);

  const currentLogoUrl = propLogoUrl || logoUrl;

  // Conditional rendering in JSX instead of early return
  return (
    <div className={className} style={style}>
      {headerDesign ? (
        <Header headerDesign={headerDesign} />
      ) : (
        <header
          className="shadow-sm sticky top-0 z-50"
          style={{ backgroundColor }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-8">
                {currentLogoUrl ? (
                  <img
                    src={currentLogoUrl}
                    alt="Logo"
                    className={`h-10 w-auto logo-img ${isEditor ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={isEditor ? undefined : () => router.push('/')}
                    style={{ filter: logoColor !== '#4f46e5' ? `hue-rotate(${logoColor})` : 'none' }}
                  />
                ) : (
                  <h1
                    className={`text-2xl font-bold ${isEditor ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={isEditor ? undefined : () => router.push('/')}
                    style={{ color: logoColor }}
                  >
                    {logoText}
                  </h1>
                )}
                {showNavigation && (
                  <nav className="hidden md:flex space-x-6">
                    {navigationItems.map((item) => (
                      isEditor ? (
                        <span
                          key={item.label}
                          className="font-medium cursor-default"
                          style={{ color: textColor }}
                        >
                          {item.label}
                        </span>
                      ) : (
                        <a
                          key={item.label}
                          href={item.href}
                          className="font-medium hover:opacity-80 transition"
                          style={{ color: textColor }}
                        >
                          {item.label}
                        </a>
                      )
                    ))}
                  </nav>
                )}
              </div>
              <nav className="flex items-center space-x-4">
                {showCart && (
                  <button
                    onClick={isEditor ? undefined : () => router.push('/cart')}
                    className={`relative p-2 transition ${isEditor ? 'cursor-default' : 'hover:opacity-80 cursor-pointer'}`}
                    style={{ color: textColor }}
                  >
                    <ShoppingCartIcon className="h-6 w-6" />
                    {getItemCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {getItemCount()}
                      </span>
                    )}
                  </button>
                )}
                {isAuthenticated && user && propShowUserMenu && (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 transition hover:opacity-80"
                      style={{ color: textColor }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: logoColor }}
                      >
                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.full_name || user.email}</span>
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                        {isEditor ? (
                          <>
                            <span className="block px-4 py-2 text-sm text-gray-700 cursor-default">
                              Dashboard
                            </span>
                            <span className="block px-4 py-2 text-sm text-gray-700 cursor-default">
                              Shop
                            </span>
                          </>
                        ) : (
                          <>
                            <a
                              href="/admin/dashboard"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setShowUserMenu(false)}
                            >
                              Dashboard
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
                                logout();
                                setShowUserMenu(false);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Logout
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {!isAuthenticated && (
                  <>
                    {isEditor ? (
                      <>
                        <span
                          className="font-medium cursor-default"
                          style={{ color: textColor }}
                        >
                          Login
                        </span>
                        <span
                          className="px-4 py-2 rounded-lg cursor-default font-medium text-white"
                          style={{ backgroundColor: logoColor }}
                        >
                          Get Started
                        </span>
                      </>
                    ) : (
                      <>
                        <a
                          href="/login"
                          className="font-medium hover:opacity-80 transition"
                          style={{ color: textColor }}
                        >
                          Login
                        </a>
                        <a
                          href="/auth/register"
                          className="px-4 py-2 rounded-lg hover:opacity-90 transition font-medium text-white"
                          style={{ backgroundColor: logoColor }}
                        >
                          Get Started
                        </a>
                      </>
                    )}
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
      )}
    </div>
  );
}
