'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageBuilderWithISR } from '@/components/page-builder/PageBuilderWithISR';
import { Component } from '@/components/page-builder/types';

function AdminPageBuilderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pageBuilderComponents, setPageBuilderComponents] = useState<Component[]>([]);
  const [pageId, setPageId] = useState('');
  const [pageTitle, setPageTitle] = useState('Untitled Page');
  const [pageDescription, setPageDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPageData = async () => {
      // Get page ID from URL params if editing existing page
      const id = searchParams.get('id');
      const page = searchParams.get('page'); // Changed from 'type' to 'page'
      const slug = searchParams.get('slug'); // Get slug from URL
      
      if (id) {
        setPageId(id);
        await loadPage(id);
        setIsLoading(false);
      } else if (page || slug) {
        // Determine the slug to use
        let pageSlug = slug;
        if (!pageSlug && page) {
          // Map page type to slug if slug not provided
          const pageTypeToSlug: Record<string, string> = {
            homepage: 'home',
            cart: 'cart',
            shop: 'shop',
            checkout: 'checkout',
            order_success: 'order-success',
            contact: 'contact',
            about: 'about',
            privacy: 'privacy',
            terms: 'terms',
          };
          pageSlug = pageTypeToSlug[page] || page;
        }
        
        if (pageSlug) {
          setPageId(pageSlug);
          // Try to load existing page from backend first
          await loadPageBySlug(pageSlug, page);
        } else {
          // Fallback: load default template
          if (page) {
            loadDefaultTemplate(page);
          }
          setIsLoading(false);
        }
      } else {
        // Load saved page builder components if no specific page/type
        const savedComponents = localStorage.getItem('page_builder_components');
        if (savedComponents) {
          setPageBuilderComponents(JSON.parse(savedComponents));
        }
        setIsLoading(false);
      }
    };
    
    loadPageData();
  }, [searchParams]);

  const loadPage = async (id: string) => {
    try {
      const response = await fetch(`/api/pages?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setPageTitle(data.title || 'Untitled Page');
        setPageDescription(data.description || '');
        setPageBuilderComponents(data.components || []);
      }
    } catch (error) {
      console.error('Error loading page:', error);
    }
  };

  const loadPageBySlug = async (slug: string, pageType?: string) => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Try to load existing page from backend
      const response = await fetch(`${apiUrl}/api/v1/pages/${slug}`, {
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded existing page from backend:', data);
        setPageTitle(data.title || 'Untitled Page');
        setPageDescription(data.description || '');
        setPageBuilderComponents(data.components || []);
        setIsLoading(false);
        return;
      } else if (response.status === 404) {
        // Page doesn't exist, load default template
        console.log('Page not found, loading default template');
        if (pageType) {
          loadDefaultTemplate(pageType);
        } else {
          // Try to infer page type from slug
          const slugToPageType: Record<string, string> = {
            'home': 'homepage',
            'homepage': 'homepage',
            'cart': 'cart',
            'shop': 'shop',
            'checkout': 'checkout',
            'order-success': 'order_success',
            'order_success': 'order_success',
            'contact': 'contact',
            'about': 'about',
            'privacy': 'privacy',
            'terms': 'terms',
          };
          const inferredPageType = slugToPageType[slug];
          if (inferredPageType) {
            loadDefaultTemplate(inferredPageType);
          }
        }
      } else {
        console.error('Error loading page:', response.status, response.statusText);
        // Fallback to default template
        if (pageType) {
          loadDefaultTemplate(pageType);
        }
      }
    } catch (error) {
      console.error('Error loading page by slug:', error);
      // Fallback to default template
      if (pageType) {
        loadDefaultTemplate(pageType);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultTemplate = (pageType: string) => {
    // Set page title based on type
    const typeTitles: Record<string, string> = {
      homepage: 'Homepage',
      cart: 'Cart Page',
      shop: 'Shop Page',
      checkout: 'Checkout Page',
      order_success: 'Order Success Page',
      about: 'About Page',
      contact: 'Contact Page',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service'
    };
    
    setPageTitle(typeTitles[pageType] || 'Untitled Page');
    setPageDescription(`Default ${typeTitles[pageType] || pageType} template`);
    
    // Load default components based on page type
    const defaultComponents = getDefaultPageTemplate(pageType);
    setPageBuilderComponents(defaultComponents);
  };

  const getDefaultPageTemplate = (pageType: string): Component[] => {
    const templates: Record<string, Component[]> = {
      homepage: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'hero-1',
          type: 'heading',
          content: 'Welcome to NextPanel Billing',
          props: { level: 'h1' },
          style: { fontSize: '48px', textAlign: 'center', marginBottom: '24px' }
        },
        {
          id: 'hero-text-1',
          type: 'text',
          content: 'Professional billing and hosting management made simple.',
          props: {},
          style: { fontSize: '20px', textAlign: 'center', color: '#666', marginBottom: '48px' }
        },
        {
          id: 'products-grid-1',
          type: 'products-grid',
          props: {},
          style: { marginBottom: '48px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      cart: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'Shopping Cart',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'cart-1',
          type: 'cart',
          props: {
            showHeader: true,
            showCheckoutButton: true,
            showEmptyState: true,
            showItemCount: true,
            showTotal: true,
            headerText: 'Shopping Cart',
            emptyStateText: 'Your cart is empty',
            checkoutButtonText: 'Proceed to Checkout',
            buttonColor: '#4f46e5'
          },
          style: { marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      shop: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'Our Products',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'products-grid-1',
          type: 'products-grid',
          props: {},
          style: { marginBottom: '48px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      checkout: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'Checkout',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: 'Complete your purchase securely.',
          props: {},
          style: { color: '#666', marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      order_success: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'Order Successful!',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px', color: '#10b981' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: 'Thank you for your purchase. Your order has been confirmed and you will receive an email shortly.',
          props: {},
          style: { color: '#666', marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      about: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'About Us',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: 'We are a leading provider of hosting and billing solutions, helping businesses grow online.',
          props: {},
          style: { color: '#666', marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      contact: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'Contact Us',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: 'Get in touch with our team for support or inquiries.',
          props: {},
          style: { color: '#666', marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      privacy: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'Privacy Policy',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: 'This privacy policy explains how we collect, use, and protect your information.',
          props: {},
          style: { color: '#666', marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ],
      terms: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            logoText: 'NextPanel',
            showNavigation: true,
            showCart: true,
            showUserMenu: true,
            backgroundColor: '#ffffff',
            textColor: '#374151',
            logoColor: '#4f46e5'
          },
          style: { marginBottom: '0px' }
        },
        {
          id: 'heading-1',
          type: 'heading',
          content: 'Terms of Service',
          props: { level: 'h1' },
          style: { fontSize: '32px', marginBottom: '24px' }
        },
        {
          id: 'text-1',
          type: 'text',
          content: 'These terms and conditions govern your use of our services.',
          props: {},
          style: { color: '#666', marginBottom: '32px' }
        },
        {
          id: 'footer-1',
          type: 'footer',
          props: {
            companyName: 'NextPanel Billing',
            copyrightText: 'All rights reserved.',
            showLinks: true,
            showSocial: false,
            backgroundColor: '#111827',
            textColor: '#ffffff',
            linkColor: '#9ca3af'
          },
          style: { marginTop: '48px' }
        }
      ]
    };
    
    return templates[pageType] || templates.homepage;
  };

  const handleClose = () => {
    // Go back to previous page or customization page
    router.push('/admin/customization');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page builder...</p>
        </div>
      </div>
    );
  }

  return (
    <PageBuilderWithISR
      initialComponents={pageBuilderComponents}
      pageId={pageId}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
      onSave={(components) => {
        setPageBuilderComponents(components);
        localStorage.setItem('page_builder_components', JSON.stringify(components));
      }}
      onClose={handleClose}
    />
  );
}

export default function AdminPageBuilderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AdminPageBuilderPageContent />
    </Suspense>
  );
}
