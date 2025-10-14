'use client';

import { useEffect, useState, use } from 'react';
import { ComponentRenderer } from '@/components/page-builder';
import { Component } from '@/components/page-builder/types';

// Fetch page data
async function fetchPageData(pageId: string) {
  try {
    // Use relative URL for client-side fetching
    const response = await fetch(`/api/pages?id=${pageId}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      console.error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching page data:', error);
    return null;
  }
}

export default function DynamicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        const data = await fetchPageData(id);
        if (data && data.components) {
          setPageData(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading page:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData || !pageData.components) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
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

