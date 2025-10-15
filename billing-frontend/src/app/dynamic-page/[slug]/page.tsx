'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ComponentRenderer from '@/components/page-builder/ComponentRenderer';
import { Component } from '@/components/page-builder/types';

export default function DynamicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const response = await fetch(`${apiUrl}/api/v1/pages/${slug}`);
      
      if (!response.ok) {
        throw new Error('Page not found');
      }
      
      const pageData = await response.json();
      setComponents(pageData.components || []);
    } catch (err) {
      console.error('Error loading page:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {components.map((component) => (
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

