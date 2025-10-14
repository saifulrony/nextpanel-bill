'use client';

import { useState, useEffect } from 'react';
import { PageBuilderWithISR } from '@/components/page-builder/PageBuilderWithISR';
import { Component } from '@/components/page-builder/types';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PageBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pageBuilderComponents, setPageBuilderComponents] = useState<Component[]>([]);
  const [pageId, setPageId] = useState('');
  const [pageTitle, setPageTitle] = useState('Untitled Page');
  const [pageDescription, setPageDescription] = useState('');

  useEffect(() => {
    // Load saved page builder components
    const savedComponents = localStorage.getItem('page_builder_components');
    if (savedComponents) {
      setPageBuilderComponents(JSON.parse(savedComponents));
    }

    // Get page ID from URL params if editing existing page
    const id = searchParams.get('id');
    if (id) {
      setPageId(id);
      loadPage(id);
    }
  }, [searchParams]);

  const loadPage = async (id: string) => {
    try {
      const response = await fetch(`/api/pages?id=${id}`);
      if (response.ok) {
        const pageData = await response.json();
        setPageTitle(pageData.title);
        setPageDescription(pageData.description || '');
        setPageBuilderComponents(pageData.components || []);
      }
    } catch (error) {
      console.error('Error loading page:', error);
    }
  };

  const handleClose = () => {
    // Go back to previous page or customization page
    router.push('/admin/customization');
  };

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

