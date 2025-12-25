'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PencilIcon } from '@heroicons/react/24/outline';

/**
 * Maps frontend routes to page builder page types/slugs
 * Based on the page builder's loadDefaultTemplate function
 */
const routeToPageMap: Record<string, { type?: string; slug?: string }> = {
  '/': { type: 'homepage', slug: 'home' },
  '/shop': { type: 'shop', slug: 'shop' },
  '/cart': { type: 'cart', slug: 'cart' },
  '/checkout': { type: 'checkout', slug: 'checkout' },
  '/order-success': { type: 'order_success', slug: 'order-success' },
  '/contact': { type: 'contact', slug: 'contact' },
  '/about': { type: 'about', slug: 'about' },
  '/privacy': { type: 'privacy', slug: 'privacy' },
  '/terms': { type: 'terms', slug: 'terms' },
  '/pricing': { slug: 'pricing' },
};

/**
 * Floating Edit Page button that appears for admins on frontend pages
 */
export default function EditPageButton() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const admin = (user as any)?.is_admin === true;
    setIsAdmin(admin);

    // Only show on frontend pages (not admin or customer dashboard pages)
    const isFrontendPage = 
      !pathname.startsWith('/admin') && 
      !pathname.startsWith('/customer') &&
      !pathname.startsWith('/login') &&
      !pathname.startsWith('/register') &&
      pathname !== '/page-builder' &&
      pathname !== '/api';

    setIsVisible(admin && isAuthenticated && isFrontendPage);
  }, [user, isAuthenticated, pathname]);

  const handleEditClick = () => {
    // Get page mapping for current route
    const pageInfo = routeToPageMap[pathname] || { slug: pathname.slice(1) || 'home' };
    
    // Build URL for page builder
    const params = new URLSearchParams();
    if (pageInfo.type) {
      params.set('page', pageInfo.type);
    }
    if (pageInfo.slug) {
      params.set('slug', pageInfo.slug);
    }
    
    // Open page builder in new tab with current page
    const builderUrl = `/admin/page-builder?${params.toString()}`;
    window.open(builderUrl, '_blank');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleEditClick}
        className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm"
        title="Edit this page with Page Builder"
      >
        <PencilIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Edit Page</span>
      </button>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          Edit this page with Page Builder
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}

