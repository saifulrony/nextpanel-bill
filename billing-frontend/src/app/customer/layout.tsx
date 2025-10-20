'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  UserIcon,
  GlobeAltIcon,
  CubeIcon,
  KeyIcon,
  LifebuoyIcon,
  ServerIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const customerNavigation = [
  { name: 'Dashboard', href: '/customer', icon: HomeIcon },
  { name: 'Services', href: '/customer/services', icon: ShoppingCartIcon },
  { 
    name: 'My Services', 
    href: '/customer/my-services', 
    icon: CubeIcon,
    submenu: [
      { name: 'Domains', href: '/customer/my-services/domains', icon: GlobeAltIcon },
      { name: 'Hosting', href: '/customer/my-services/hosting', icon: ServerIcon },
      { name: 'Servers', href: '/customer/my-services/servers', icon: ServerIcon },
      { name: 'Licenses', href: '/customer/my-services/licenses', icon: KeyIcon },
      { name: 'Others', href: '/customer/my-services/others', icon: CubeIcon },
    ]
  },
  { name: 'Billing', href: '/customer/billing', icon: CreditCardIcon },
  { name: 'Invoices', href: '/customer/invoices', icon: DocumentTextIcon },
  { name: 'Support', href: '/customer/support', icon: LifebuoyIcon },
  { name: 'Settings', href: '/customer/settings', icon: Cog6ToothIcon },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [customerAuth, setCustomerAuth] = useState<{ isAuthenticated: boolean; user: any }>({ isAuthenticated: false, user: null });

  useEffect(() => {
    // Add a small delay to prevent hydration mismatch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Check customer authentication
  useEffect(() => {
    const checkCustomerAuth = () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('user_type');
      const userData = localStorage.getItem('user');
      
      if (token && userType === 'customer') {
        try {
          // Verify token is not expired
          const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
          if (decoded.exp && Date.now() / 1000 > decoded.exp) {
            // Token expired, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user_type');
            localStorage.removeItem('user');
            setCustomerAuth({ isAuthenticated: false, user: null });
          } else {
            // Token is valid
            const user = userData ? JSON.parse(userData) : null;
            setCustomerAuth({ isAuthenticated: true, user });
          }
        } catch (error) {
          // Invalid token, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user');
          setCustomerAuth({ isAuthenticated: false, user: null });
        }
      } else {
        setCustomerAuth({ isAuthenticated: false, user: null });
      }
    };

    checkCustomerAuth();
  }, [pathname]); // Re-run when pathname changes

  useEffect(() => {
    // Don't redirect if we're on login or register pages
    if (pathname === '/customer/login' || pathname === '/customer/register') {
      return;
    }
    
    // Add a small delay to allow authentication check to complete
    if (!isLoading && !customerAuth.isAuthenticated) {
      const timer = setTimeout(() => {
        router.push('/customer/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [customerAuth.isAuthenticated, router, isLoading, pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('[data-user-menu]')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const isSubmenuActive = (submenu: any[]) => {
    return submenu.some(item => pathname === item.href);
  };

  const handleCustomerLogout = () => {
    // Clear customer authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user');
    
    // Clear cookies
    document.cookie = 'auth_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Reset customer auth state
    setCustomerAuth({ isAuthenticated: false, user: null });
    
    // Redirect to customer login
    router.push('/customer/login');
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show login/register pages without sidebar
  if (pathname === '/customer/login' || pathname === '/customer/register') {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Show loading spinner for unauthenticated users on other pages
  if (!customerAuth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {customerNavigation.map((item) => {
                  const isActive = pathname === item.href || (item.submenu && isSubmenuActive(item.submenu));
                  const isExpanded = expandedMenus.has(item.name);
                  
                  if (item.submenu) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => toggleSubmenu(item.name)}
                          className={`${
                            isActive
                              ? 'bg-indigo-100 text-indigo-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } group flex items-center justify-between w-full px-2 py-2 text-base font-medium rounded-md`}
                        >
                          <div className="flex items-center">
                            <item.icon className="mr-4 h-6 w-6" />
                            {item.name}
                          </div>
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.submenu.map((subItem) => {
                              const isSubActive = pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  className={`${
                                    isSubActive
                                      ? 'bg-indigo-100 text-indigo-900'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                >
                                  <subItem.icon className="mr-3 h-5 w-5" />
                                  {subItem.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    >
                      <item.icon className="mr-4 h-6 w-6" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main layout container */}
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-screen border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                  <h1 className="text-xl font-bold text-gray-900">Customer Portal</h1>
                </div>
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {customerNavigation.map((item) => {
                    const isActive = pathname === item.href || (item.submenu && isSubmenuActive(item.submenu));
                    const isExpanded = expandedMenus.has(item.name);
                    
                    if (item.submenu) {
                      return (
                        <div key={item.name}>
                          <button
                            onClick={() => toggleSubmenu(item.name)}
                            className={`${
                              isActive
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            } group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md`}
                          >
                            <div className="flex items-center">
                              <item.icon className="mr-3 h-6 w-6" />
                              {item.name}
                            </div>
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="ml-6 mt-1 space-y-1">
                              {item.submenu.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className={`${
                                      isSubActive
                                        ? 'bg-indigo-100 text-indigo-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                  >
                                    <subItem.icon className="mr-3 h-5 w-5" />
                                    {subItem.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isActive
                            ? 'bg-indigo-100 text-indigo-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                      >
                        <item.icon className="mr-3 h-6 w-6" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with user dropdown */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page title - hidden on mobile */}
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-gray-900">
                  {customerNavigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                </h1>
              </div>

              {/* User dropdown menu */}
              <div className="relative" data-user-menu>
                <button
                  type="button"
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {customerAuth.user?.name?.charAt(0).toUpperCase() || customerAuth.user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700">{customerAuth.user?.name || customerAuth.user?.email}</p>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
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
                      href="/customer/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Settings
                    </a>
                    <a
                      href="/customer/billing"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Billing
                    </a>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => {
                        handleCustomerLogout();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
