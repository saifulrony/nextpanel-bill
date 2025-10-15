'use client';

import { useState, useEffect } from 'react';
import { ComponentRenderer } from '@/components/page-builder';
import { Component } from '@/components/page-builder/types';
import { useDefaultPages } from '@/contexts/DefaultPageContext';

interface HomepageData {
  id: string;
  slug: string;
  title: string;
  description: string;
  components: Component[];
  is_homepage: boolean;
}

export function DynamicHomepage() {
  const [homepageData, setHomepageData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { defaultPageConfig, isLoading: isLoadingConfig } = useDefaultPages();

  useEffect(() => {
    loadHomepage();
  }, [defaultPageConfig]);

  const loadHomepage = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // Check if there's a custom homepage configured in default pages
      const customHomepage = defaultPageConfig?.homepage;
      
      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      let response;
      
      if (customHomepage) {
        // Load the custom homepage page
        response = await fetch(`${apiUrl}/api/v1/pages/${customHomepage}`);
      } else {
        // Load the default homepage (marked as is_homepage)
        response = await fetch(`${apiUrl}/api/v1/pages/homepage`);
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setHomepageData(data);
        } else {
          // No custom homepage set, this component should not render
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading homepage:', err);
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
          <p className="text-gray-600">Loading homepage...</p>
        </div>
      </div>
    );
  }

  if (error || !homepageData) {
    // Return null so the default homepage can render
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {homepageData.components.map((component: Component) => (
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
