'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  CreditCardIcon,
  KeyIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon,
  LifebuoyIcon,
  CubeIcon,
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ServerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BanknotesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Customers', href: '/customers', icon: UserGroupIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Licenses', href: '/licenses', icon: KeyIcon },
  { name: 'Domains', href: '/domains', icon: GlobeAltIcon },
  { name: 'Subscriptions', href: '/subscriptions', icon: CubeIcon },
  { 
    name: 'Payments', 
    href: '/payments', 
    icon: CreditCardIcon,
    children: [
      { name: 'Transactions', href: '/payments', icon: DocumentTextIcon },
      { name: 'Payment Gateways', href: '/payments/gateways', icon: Cog6ToothIcon },
    ]
  },
  { name: 'Server', href: '/server', icon: ServerIcon },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: ChartBarIcon,
    children: [
      { name: 'Overview', href: '/analytics', icon: ChartBarIcon },
      { name: 'Sales Report', href: '/analytics/sales', icon: BanknotesIcon },
      { name: 'Client Numbers', href: '/analytics/clients', icon: UsersIcon },
      { name: 'Order Numbers', href: '/analytics/orders', icon: ClipboardDocumentListIcon },
      { name: 'Support Tickets', href: '/analytics/tickets', icon: ChatBubbleLeftRightIcon },
    ]
  },
  { name: 'Support', href: '/support', icon: LifebuoyIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Analytics', 'Payments']); // Default expand analytics and payments
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderNavigationItem = (item: any, isCollapsed = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = pathname === item.href || (hasChildren && item.children.some((child: any) => pathname === child.href));
    const isExpanded = hasChildren && isMenuExpanded(item.name);

    return (
      <div key={item.name}>
        {hasChildren ? (
          <button
            onClick={() => toggleMenu(item.name)}
            className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.name : ''}
          >
            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'} ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.name : ''}
          >
            <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'} ${!isCollapsed && 'mr-3'}`} />
            {!isCollapsed && item.name}
          </Link>
        )}
        
        {/* Submenu items */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child: any) => {
              const isChildActive = pathname === child.href;
              return (
                <Link
                  key={child.name}
                  href={child.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isChildActive
                      ? 'bg-indigo-100 text-indigo-700 border-l-2 border-indigo-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <child.icon className={`h-4 w-4 flex-shrink-0 mr-3 ${isChildActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {child.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between h-16 px-4 bg-indigo-600">
            <span className="text-xl font-bold text-white">NextPanel</span>
            <button onClick={() => setSidebarOpen(false)} className="text-white">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => renderNavigationItem(item, false))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 h-16 bg-indigo-600 justify-between">
            {!sidebarCollapsed && <span className="text-xl font-bold text-white">NextPanel Billing</span>}
            {sidebarCollapsed && <span className="text-xl font-bold text-white">NP</span>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:bg-indigo-700 p-1 rounded transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => renderNavigationItem(item, sidebarCollapsed))}
          </nav>
          
          {/* User info at bottom */}
          {!sidebarCollapsed && (
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex-shrink-0 border-t border-gray-200 p-4 flex justify-center">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search licenses, domains..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <BellIcon className="h-6 w-6" />
              </button>
              
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-white border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{user?.full_name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                        Signed in as
                      </div>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="font-medium text-gray-900">{user?.full_name}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {user?.is_admin ? 'Administrator' : 'User'}
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400" />
                          Your Profile
                        </div>
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400" />
                          Settings
                        </div>
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400" />
                          Sign Out
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
