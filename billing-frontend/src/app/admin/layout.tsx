'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import AdminProtectedRoute from '@/components/auth/AdminProtectedRoute';
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
  PuzzlePieceIcon,
  PaintBrushIcon,
  ArchiveBoxIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import { useInstalledModules } from '@/hooks/useInstalledModules';
import DashboardCustomization, { SidebarItem, SidebarSubmenuItem, DashboardElement } from '@/components/admin/DashboardCustomization';

// Base navigation items (always available)
const getBaseNavigation = () => [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Customers', href: '/admin/customers', icon: UserGroupIcon },
  { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCartIcon },
  { name: 'Licenses', href: '/admin/licenses', icon: KeyIcon },
  { 
    name: 'Domains', 
    href: '/admin/domains', 
    icon: GlobeAltIcon,
    children: [
      { name: 'Domain Search', href: '/admin/domains', icon: MagnifyingGlassIcon },
      { name: 'Domain Providers', href: '/admin/domain-providers', icon: Cog6ToothIcon },
      { name: 'Domain Pricing', href: '/admin/domain-pricing', icon: BanknotesIcon },
    ]
  },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CubeIcon },
  { 
    name: 'Payments', 
    href: '/admin/payments', 
    icon: CreditCardIcon,
    children: [
      { name: 'Transactions', href: '/admin/payments', icon: DocumentTextIcon },
      { name: 'Payment Gateways', href: '/admin/payments/gateways', icon: Cog6ToothIcon },
    ]
  },
  { 
    name: 'Billing Features', 
    href: '#', 
    icon: BanknotesIcon,
    children: [
      { name: 'Coupons', href: '/admin/coupons', icon: KeyIcon },
      { name: 'Credit Notes', href: '/admin/credit-notes', icon: DocumentTextIcon },
      { name: 'Email Templates', href: '/admin/email-templates', icon: EnvelopeIcon },
      { name: 'Currencies', href: '/admin/currencies', icon: CurrencyDollarIcon },
      { name: 'Tax Rules', href: '/admin/tax-rules', icon: CalculatorIcon },
      { name: 'Affiliates', href: '/admin/affiliates', icon: UserGroupIcon },
      { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
    ]
  },
  { name: 'Server', href: '/admin/server', icon: ServerIcon },
  { name: 'Backup', href: '/admin/backup', icon: ArchiveBoxIcon },
  { name: 'Security', href: '/admin/security', icon: ShieldCheckIcon },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: ChartBarIcon,
    children: [
      { name: 'Overview', href: '/admin/analytics', icon: ChartBarIcon },
      { name: 'Sales Report', href: '/admin/analytics/sales', icon: BanknotesIcon },
      { name: 'Client Numbers', href: '/admin/analytics/clients', icon: UsersIcon },
      { name: 'Order Numbers', href: '/admin/analytics/orders', icon: ClipboardDocumentListIcon },
      { name: 'Support Tickets', href: '/admin/analytics/tickets', icon: ChatBubbleLeftRightIcon },
    ]
  },
  { name: 'Marketplace', href: '/admin/marketplace', icon: PuzzlePieceIcon },
  { name: 'Customization', href: '/admin/customization', icon: PaintBrushIcon },
  { name: 'Stuffs', href: '/admin/stuffs', icon: UsersIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

// Function to build dynamic navigation based on installed modules
const buildNavigation = (hasModule: (moduleName: string) => boolean) => {
  const baseNavigation = getBaseNavigation();
  
  // Build support children based on installed modules
  const supportChildren = [
    { name: 'Tickets', href: '/admin/support', icon: ClipboardDocumentListIcon },
  ];
  
  // Add Live Chats only if ai_chatbot module is installed
  if (hasModule('ai_chatbot')) {
    supportChildren.push({ name: 'Live Chats', href: '/admin/support/chats', icon: ChatBubbleLeftRightIcon });
  }
  
  // Add Support section with dynamic children
  const supportSection = {
    name: 'Support',
    href: '/admin/support',
    icon: LifebuoyIcon,
    children: supportChildren
  };
  
  // Insert Support section before Marketplace
  const marketplaceIndex = baseNavigation.findIndex(item => item.name === 'Marketplace');
  baseNavigation.splice(marketplaceIndex, 0, supportSection);
  
  return baseNavigation;
};

// Permission mapping for navigation items
const navigationPermissions: Record<string, string> = {
  '/admin/dashboard': 'access_dashboard_page',
  '/admin/customers': 'access_customers_page',
  '/admin/products': 'access_products_page',
  '/admin/orders': 'access_orders_page',
  '/admin/licenses': 'access_licenses_page',
  '/admin/domains': 'access_domains_search_page',
  '/admin/domain-providers': 'access_domains_providers_page',
  '/admin/domain-pricing': 'access_domains_pricing_page',
  '/admin/subscriptions': 'access_subscriptions_page',
  '/admin/payments': 'access_payments_transactions_page',
  '/admin/payments/gateways': 'access_payments_gateways_page',
  '/admin/server': 'access_server_page',
  '/admin/backup': 'access_backup_page',
  '/admin/security': 'access_security_page',
  '/admin/analytics': 'access_analytics_overview_page',
  '/admin/analytics/sales': 'access_analytics_sales_page',
  '/admin/analytics/clients': 'access_analytics_clients_page',
  '/admin/analytics/orders': 'access_analytics_orders_page',
  '/admin/analytics/tickets': 'access_analytics_tickets_page',
  '/admin/support': 'access_support_tickets_page',
  '/admin/support/chats': 'access_support_chats_page',
  '/admin/marketplace': 'access_marketplace_page',
  '/admin/customization': 'access_customization_page',
  '/admin/stuffs': 'access_stuffs_page',
  '/admin/settings': 'access_settings_page',
  '/admin/coupons': 'access_coupons_page',
  '/admin/credit-notes': 'access_credit_notes_page',
  '/admin/email-templates': 'access_email_templates_page',
  '/admin/currencies': 'access_currencies_page',
  '/admin/tax-rules': 'access_tax_rules_page',
  '/admin/affiliates': 'access_affiliates_page',
  '/admin/reports': 'access_reports_page',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasModule } = useInstalledModules();
  const { user, logout, isLoading } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Build dynamic navigation based on installed modules
  const baseNavigation = buildNavigation(hasModule);
  
  // Filter navigation based on permissions
  const navigation = baseNavigation.filter(item => {
    // Super admins see everything
    if (user?.is_admin) {
      return true;
    }
    
    // Check main item permission
    const mainPermission = navigationPermissions[item.href];
    if (mainPermission && !hasPermission(mainPermission)) {
      return false;
    }
    
    // Filter children if they exist
    if (item.children) {
      item.children = item.children.filter(child => {
        const childPermission = navigationPermissions[child.href];
        if (childPermission && !hasPermission(childPermission)) {
          return false;
        }
        return true;
      });
      
      // If no children left, hide parent too
      if (item.children.length === 0) {
        return false;
      }
    }
    
    return true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]); // All menus closed by default
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [customizedSidebar, setCustomizedSidebar] = useState<SidebarItem[]>([]);
  const [customizedDashboard, setCustomizedDashboard] = useState<DashboardElement[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isMenuExpanded = (menuName: string) => expandedMenus.includes(menuName);

  // Note: Navigation is no longer filtered - pages handle addon checks themselves
  // This allows "install and use" without restart

  // Search function
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search through navigation items
    navigation.forEach((item) => {
      // Check main item
      if (item.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          name: item.name,
          href: item.href,
          icon: item.icon,
          type: 'page',
          category: 'Navigation'
        });
      }

      // Check children
      if (item.children) {
        item.children.forEach((child: any) => {
          if (child.name.toLowerCase().includes(lowerQuery)) {
            results.push({
              name: child.name,
              href: child.href,
              icon: child.icon,
              type: 'page',
              category: item.name
            });
          }
        });
      }
    });

    // Add predefined search suggestions
    const suggestions = [
      { name: 'Dashboard Overview', href: '/admin/dashboard', category: 'Quick Access' },
      { name: 'Customer Management', href: '/admin/customers', category: 'Quick Access' },
      { name: 'Product Catalog', href: '/admin/products', category: 'Quick Access' },
      { name: 'Order History', href: '/admin/orders', category: 'Quick Access' },
      { name: 'License Keys', href: '/admin/licenses', category: 'Quick Access' },
      { name: 'Domain Management', href: '/admin/domains', category: 'Quick Access' },
      { name: 'Domain Pricing', href: '/admin/domain-pricing', category: 'Quick Access' },
      { name: 'Payment Settings', href: '/admin/payments/gateways', category: 'Quick Access' },
      { name: 'Analytics & Reports', href: '/admin/analytics', category: 'Quick Access' },
      { name: 'Support Tickets', href: '/admin/support', category: 'Quick Access' },
      { name: 'System Settings', href: '/admin/settings', category: 'Quick Access' },
      { name: 'Security Settings', href: '/admin/security', category: 'Quick Access' },
      { name: 'Customization', href: '/admin/customization', category: 'Quick Access' },
      { name: 'Marketplace', href: '/admin/marketplace', category: 'Quick Access' },
    ];

    suggestions.forEach((suggestion) => {
      if (suggestion.name.toLowerCase().includes(lowerQuery) && 
          !results.find(r => r.href === suggestion.href)) {
        results.push({
          ...suggestion,
          type: 'suggestion'
        });
      }
    });

    setSearchResults(results);
    setSearchDropdownOpen(results.length > 0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Default dashboard elements
  const getDefaultDashboardElements = (): DashboardElement[] => [
    { id: 'key-metrics', name: 'Key Metrics (4 Cards)', type: 'stat', visible: true, order: 0, width: 'full', description: 'Total Customers, Orders, Revenue, Active Licenses' },
    { id: 'customer-distribution', name: 'Customer Distribution Chart', type: 'chart', visible: true, order: 1, width: '1/3', description: 'Pie chart showing active vs inactive customers' },
    { id: 'license-status', name: 'License Status Chart', type: 'chart', visible: true, order: 2, width: '1/3', description: 'Bar chart showing license status breakdown' },
    { id: 'invoice-status', name: 'Invoice Status Chart', type: 'chart', visible: true, order: 3, width: '1/3', description: 'Bar chart showing invoice status' },
    { id: 'revenue-trend', name: 'Revenue Trend Line Chart', type: 'chart', visible: true, order: 4, width: '1/2', description: 'Line chart showing revenue over time' },
    { id: 'order-status', name: 'Order Status Chart', type: 'chart', visible: true, order: 5, width: '1/2', description: 'Bar chart showing order status' },
    { id: 'customer-active-rate', name: 'Customer Active Rate Gauge', type: 'gauge', visible: true, order: 6, width: '1/3', description: 'Circular gauge showing customer active percentage' },
    { id: 'license-active-rate', name: 'License Active Rate Gauge', type: 'gauge', visible: true, order: 7, width: '1/3', description: 'Circular gauge showing license active percentage' },
    { id: 'domain-active-rate', name: 'Domain Active Rate Gauge', type: 'gauge', visible: true, order: 8, width: '1/3', description: 'Circular gauge showing domain active percentage' },
    { id: 'top-customers', name: 'Top Customers Table', type: 'table', visible: true, order: 9, width: 'full', description: 'Table showing top customers by orders' },
    { id: 'quick-stats', name: 'Quick Stats Grid', type: 'widget', visible: true, order: 10, width: 'full', description: 'Products, Subscriptions, Invoices, Domains' },
    { id: 'recent-activity', name: 'Recent Activity Summary', type: 'widget', visible: true, order: 11, width: 'full', description: 'New signups, payments, orders (last 24h)' },
    { id: 'realtime-status', name: 'Real-time Status Info', type: 'widget', visible: true, order: 12, width: 'full', description: 'Connection status and mode indicator' },
  ];

  // Load customization from localStorage on mount
  useEffect(() => {
    const savedSidebar = localStorage.getItem('dashboard_sidebar_customization');
    const savedDashboard = localStorage.getItem('dashboard_elements_customization');
    
    if (savedSidebar) {
      try {
        setCustomizedSidebar(JSON.parse(savedSidebar));
      } catch (e) {
        console.error('Failed to load sidebar customization:', e);
      }
    }
    
    if (savedDashboard) {
      try {
        const parsed = JSON.parse(savedDashboard);
        // Validate saved data - check if it has the new format (has width property) and has reasonable number of items
        const hasNewFormat = Array.isArray(parsed) && parsed.length > 0 && 
          parsed.some((item: any) => item.width !== undefined);
        const hasReasonableCount = parsed.length >= 10; // Should have at least 10 items (we have 13 defaults)
        
        if (hasNewFormat && hasReasonableCount) {
          setCustomizedDashboard(parsed);
        } else {
          // Old format or invalid data - use defaults
          console.log('Dashboard customization data is in old format or incomplete, using defaults');
          const defaults = getDefaultDashboardElements();
          setCustomizedDashboard(defaults);
          localStorage.setItem('dashboard_elements_customization', JSON.stringify(defaults));
        }
      } catch (e) {
        console.error('Failed to load dashboard customization:', e);
        // Initialize with defaults on error
        const defaults = getDefaultDashboardElements();
        setCustomizedDashboard(defaults);
        localStorage.setItem('dashboard_elements_customization', JSON.stringify(defaults));
      }
    } else {
      // No saved data, initialize with defaults
      const defaults = getDefaultDashboardElements();
      setCustomizedDashboard(defaults);
      localStorage.setItem('dashboard_elements_customization', JSON.stringify(defaults));
    }
  }, []);

  // Convert navigation to SidebarItem format
  const convertNavigationToSidebarItems = (nav: any[]): SidebarItem[] => {
    return nav.map((item, index) => {
      const sidebarItem: SidebarItem = {
        id: item.href || `nav-${index}`,
        name: item.name,
        href: item.href,
        icon: item.icon ? (typeof item.icon === 'function' ? item.icon.name : item.icon) : '',
        visible: true,
        order: index,
        isCustom: false,
      };
      
      // Add children if they exist
      if (item.children && item.children.length > 0) {
        sidebarItem.children = item.children.map((child: any, childIndex: number) => ({
          id: child.href || `nav-${index}-child-${childIndex}`,
          name: child.name,
          href: child.href,
          visible: true,
          order: childIndex,
          isCustom: false,
        }));
      }
      
      return sidebarItem;
    });
  };

  // Initialize sidebar items on mount if not already customized
  useEffect(() => {
    if (customizedSidebar.length === 0 && navigation.length > 0) {
      const initialItems = convertNavigationToSidebarItems(navigation);
      setCustomizedSidebar(initialItems);
    }
  }, [navigation.length]);

  // Get sidebar items (use customized if available, otherwise convert from navigation)
  const getSidebarItems = (): SidebarItem[] => {
    if (customizedSidebar.length > 0) {
      return customizedSidebar;
    }
    return convertNavigationToSidebarItems(navigation);
  };

  // Handle sidebar customization update
  const handleSidebarUpdate = (items: SidebarItem[]) => {
    setCustomizedSidebar(items);
    localStorage.setItem('dashboard_sidebar_customization', JSON.stringify(items));
  };

  // Handle dashboard customization update
  const handleDashboardUpdate = (elements: DashboardElement[]) => {
    setCustomizedDashboard(elements);
    localStorage.setItem('dashboard_elements_customization', JSON.stringify(elements));
  };

  // Get filtered navigation based on customization
  const getFilteredNavigation = () => {
    const sidebarItems = getSidebarItems();
    const visibleItems = sidebarItems.filter(item => item.visible);
    const sortedItems = visibleItems.sort((a, b) => a.order - b.order);
    
    // Map back to navigation format
    return sortedItems.map(item => {
      const originalItem = navigation.find(nav => nav.href === item.href);
      if (originalItem) {
        const result = { ...originalItem, name: item.name };
        
        // Handle submenus
        if (item.children && item.children.length > 0) {
          const visibleChildren = item.children
            .filter((child: SidebarSubmenuItem) => child.visible)
            .sort((a: SidebarSubmenuItem, b: SidebarSubmenuItem) => a.order - b.order);
          
          if (visibleChildren.length > 0) {
            result.children = visibleChildren.map((child: SidebarSubmenuItem) => {
              // Find original child or create custom one
              const originalChild = originalItem.children?.find((c: any) => c.href === child.href);
              if (originalChild) {
                return { ...originalChild, name: child.name };
              }
              return {
                name: child.name,
                href: child.href,
                icon: HomeIcon,
              };
            });
          }
        }
        
        return result;
      }
      
      // Custom item - find in all navigation including children
      let foundItem = null;
      navigation.forEach(nav => {
        if (nav.children) {
          const child = nav.children.find((c: any) => c.href === item.href);
          if (child) foundItem = child;
        }
      });
      if (foundItem) {
        return { ...foundItem, name: item.name };
      }
      
      // New custom item
      const customItem: any = {
        name: item.name,
        href: item.href,
        icon: HomeIcon, // Default icon for custom items
      };
      
      // Add submenus if they exist
      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children
          .filter((child: SidebarSubmenuItem) => child.visible)
          .sort((a: SidebarSubmenuItem, b: SidebarSubmenuItem) => a.order - b.order);
        
        if (visibleChildren.length > 0) {
          customItem.children = visibleChildren.map((child: SidebarSubmenuItem) => ({
            name: child.name,
            href: child.href,
            icon: HomeIcon,
          }));
        }
      }
      
      return customItem;
    });
  };

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

  // Check if current path should render without admin layout
  const isFullWidthPage = pathname === '/admin/page-builder' || pathname === '/admin/header-editor';

  // If it's a full width page, render children without admin layout
  if (isFullWidthPage) {
    return <AdminProtectedRoute>{children}</AdminProtectedRoute>;
  }

  // Admin protection is handled by AdminProtectedRoute component
  // No need for additional checks here

  return (
    <AdminProtectedRoute>
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
            {getFilteredNavigation().map((item) => renderNavigationItem(item, sidebarCollapsed))}
          </nav>
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
                <div className="relative w-full text-gray-400 focus-within:text-gray-600" ref={searchRef}>
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search pages, features..."
                    type="search"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setSearchDropdownOpen(true)}
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchDropdownOpen && searchResults.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                      <div className="py-2">
                        {searchResults.map((result, index) => {
                          const Icon = result.icon || HomeIcon;
                          return (
                            <Link
                              key={index}
                              href={result.href}
                              onClick={() => {
                                setSearchDropdownOpen(false);
                                setSearchQuery('');
                                setSearchResults([]);
                              }}
                              className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <Icon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{result.name}</p>
                                <p className="text-xs text-gray-500">{result.category}</p>
                              </div>
                              <div className="ml-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {result.type === 'suggestion' ? 'Quick Access' : 'Page'}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      
                      {/* Footer with search info */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* No results message */}
                  {searchDropdownOpen && searchResults.length === 0 && searchQuery.trim() && (
                    <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200">
                      <div className="px-4 py-8 text-center">
                        <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-900">No results found</p>
                        <p className="text-xs text-gray-500">Try searching for something else</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <button
                onClick={() => setCustomizeModalOpen(true)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Customize Dashboard"
              >
                <AdjustmentsHorizontalIcon className="h-6 w-6" />
              </button>
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
        <main className={`flex-1 transition-all duration-300 ${customizeModalOpen ? 'mr-96' : ''}`}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Customization Modal */}
      <DashboardCustomization
        isOpen={customizeModalOpen}
        onClose={() => setCustomizeModalOpen(false)}
        sidebarItems={getSidebarItems()}
        dashboardElements={customizedDashboard.length > 0 ? customizedDashboard : getDefaultDashboardElements()}
        defaultSidebarItems={convertNavigationToSidebarItems(navigation)}
        defaultDashboardElements={getDefaultDashboardElements()}
        onSidebarUpdate={handleSidebarUpdate}
        onDashboardUpdate={handleDashboardUpdate}
      />
    </div>
    </AdminProtectedRoute>
  );
}
