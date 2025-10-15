'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ComponentRenderer } from '@/components/page-builder';
import { Component } from '@/components/page-builder/types';

interface PageData {
  id: string;
  slug: string;
  title: string;
  description: string;
  components: Component[];
  is_homepage: boolean;
}

interface DynamicPageRendererProps {
  pageType?: 'cart' | 'shop' | 'checkout' | 'order_success' | 'about' | 'contact' | 'privacy' | 'terms';
  slug?: string;
  fallbackComponent?: React.ReactNode;
}

export function DynamicPageRenderer({ pageType, slug, fallbackComponent }: DynamicPageRendererProps) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCustomPage();
  }, [pageType, slug]);

  const loadCustomPage = async () => {
    try {
      setLoading(true);
      setError(false);
      
      let customPageSlug: string | null = null;
      
      if (slug) {
        // If slug is provided directly, use it
        customPageSlug = slug;
      } else if (pageType) {
        // If pageType is provided, get the slug from localStorage
        const savedConfig = localStorage.getItem('default_page_config');
        if (!savedConfig) {
          setError(true);
          return;
        }
        
        const config = JSON.parse(savedConfig);
        customPageSlug = config[pageType];
      }
      
      if (!customPageSlug) {
        setError(true);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/pages/${customPageSlug}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.components) {
          setPageData(data);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(`Error loading custom page:`, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading custom page...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    // Return fallback component or redirect to default page
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    
    // If no fallback, redirect to the default page
    if (pageType) {
      router.replace(`/${pageType}`);
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {pageData.components.map((component: Component) => (
        <ComponentRenderer
          key={component.id}
          component={component}
          isSelected={false}
          isHovered={false}
          onClick={() => {}}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        />
      ))}
    </div>
  );
}
