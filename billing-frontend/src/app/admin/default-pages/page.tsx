'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CogIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Page {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface DefaultPageConfig {
  homepage: string;
  cart: string;
  shop: string;
  checkout: string;
  order_success: string;
  about: string;
  contact: string;
  privacy: string;
  terms: string;
}

const pageTypes = [
  {
    key: 'homepage',
    label: 'Homepage',
    description: 'Main landing page of your website',
    icon: HomeIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    key: 'cart',
    label: 'Shopping Cart',
    description: 'Cart page where customers review their items',
    icon: ShoppingCartIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    key: 'shop',
    label: 'Shop',
    description: 'Product catalog and shopping page',
    icon: ShoppingBagIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    key: 'checkout',
    label: 'Checkout',
    description: 'Payment and order completion page',
    icon: CreditCardIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    key: 'order_success',
    label: 'Order Success',
    description: 'Order confirmation and thank you page',
    icon: CheckCircleIcon,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    key: 'about',
    label: 'About Us',
    description: 'Company information and story',
    icon: InformationCircleIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    key: 'contact',
    label: 'Contact',
    description: 'Contact information and form',
    icon: CogIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  {
    key: 'privacy',
    label: 'Privacy Policy',
    description: 'Privacy policy and data protection',
    icon: CogIcon,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
  {
    key: 'terms',
    label: 'Terms of Service',
    description: 'Terms and conditions',
    icon: CogIcon,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
];

export default function DefaultPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<DefaultPageConfig>({
    homepage: '',
    cart: '',
    shop: '',
    checkout: '',
    order_success: '',
    about: '',
    contact: '',
    privacy: '',
    terms: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load pages and default configuration
      // For now, we'll use demo data
      const demoPages: Page[] = [
        {
          id: 'page-1',
          name: 'Homepage',
          slug: 'homepage',
          type: 'homepage',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-2',
          name: 'Shopping Cart',
          slug: 'cart',
          type: 'cart',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-3',
          name: 'Shop',
          slug: 'shop',
          type: 'shop',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-4',
          name: 'Checkout',
          slug: 'checkout',
          type: 'checkout',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-5',
          name: 'Order Success',
          slug: 'order-success',
          type: 'order_success',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-6',
          name: 'About Us',
          slug: 'about',
          type: 'about',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-7',
          name: 'Contact',
          slug: 'contact',
          type: 'contact',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-8',
          name: 'Privacy Policy',
          slug: 'privacy',
          type: 'privacy',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-9',
          name: 'Terms of Service',
          slug: 'terms',
          type: 'terms',
          is_default: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      setPages(demoPages);
      
      // Set default configuration
      const config: DefaultPageConfig = {
        homepage: 'page-1',
        cart: 'page-2',
        shop: 'page-3',
        checkout: 'page-4',
        order_success: 'page-5',
        about: 'page-6',
        contact: 'page-7',
        privacy: 'page-8',
        terms: 'page-9',
      };
      setDefaultConfig(config);
      
    } catch (error) {
      console.error('Failed to load default pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (pageType: keyof DefaultPageConfig, pageId: string) => {
    setDefaultConfig(prev => ({
      ...prev,
      [pageType]: pageId,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save default page configuration
      console.log('Saving default page configuration:', defaultConfig);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Default pages configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save default pages:', error);
      alert('Failed to save default pages configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const openPageEditor = (pageId: string) => {
    router.push(`/admin/customization?page=${pageId}`);
  };

  const createNewPage = (pageType: string) => {
    router.push(`/admin/customization?type=${pageType}&action=create`);
  };

  const getAvailablePages = (pageType: string) => {
    return pages.filter(page => page.type === pageType);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading default pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Default Pages</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure which pages are used for different sections of your website
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>

      {/* Homepage Management Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <HomeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-medium text-gray-900">Homepage Management</h2>
                <p className="text-sm text-gray-500">Manage your website's main landing page</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                Current: <span className="font-medium text-gray-900">Homepage</span>
              </span>
              <button
                onClick={() => openPageEditor('page-1')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Homepage
              </button>
              <button
                onClick={() => window.open('/', '_blank')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </button>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Homepage Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Homepage Status</h3>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                </div>
                <span className="ml-2 text-sm text-gray-600">Active</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Homepage Components */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Components</h3>
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Header with navigation
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Hero section with domain search
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Featured products grid
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Footer with links
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => createNewPage('home')}
                  className="w-full text-left text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  + Create new homepage variant
                </button>
                <button
                  onClick={() => router.push('/admin/customization?tab=homepage')}
                  className="w-full text-left text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  → Go to homepage settings
                </button>
                <button
                  onClick={() => window.open('/', '_blank')}
                  className="w-full text-left text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  → View live homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Default Pages Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Other Default Pages</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure pages for cart, shop, checkout, and other sections
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {pageTypes.map((pageType) => {
          const Icon = pageType.icon;
          const availablePages = getAvailablePages(pageType.key);
          const selectedPageId = defaultConfig[pageType.key as keyof DefaultPageConfig];
          const selectedPage = pages.find(p => p.id === selectedPageId);

          return (
            <div
              key={pageType.key}
              className={`bg-white border-2 rounded-lg p-6 ${pageType.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${pageType.bgColor}`}>
                    <Icon className={`h-6 w-6 ${pageType.color}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {pageType.label}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {pageType.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {/* Page Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Page
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedPageId}
                      onChange={(e) => handlePageChange(pageType.key as keyof DefaultPageConfig, e.target.value)}
                      className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select a page...</option>
                      {availablePages.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => createNewPage(pageType.key)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      title="Create new page"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Page Info */}
                {selectedPage && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPage.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Slug: /{selectedPage.slug}
                        </p>
                        <p className="text-xs text-gray-500">
                          Last updated: {new Date(selectedPage.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openPageEditor(selectedPage.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          title="Edit page"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => window.open(`/${selectedPage.slug}`, '_blank')}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          title="Preview page"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Page Selected */}
                {!selectedPage && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          No page selected for {pageType.label.toLowerCase()}. 
                          <button
                            onClick={() => createNewPage(pageType.key)}
                            className="ml-1 font-medium text-yellow-900 underline hover:text-yellow-700"
                          >
                            Create one now
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How Default Pages Work
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Each page type has a default page that will be displayed when users visit that section</li>
                <li>You can create multiple pages for each type and choose which one to use as default</li>
                <li>Use the page editor to customize the content, layout, and design of each page</li>
                <li>Changes to default pages will be reflected immediately on your website</li>
                <li>You can preview pages before making them live</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
