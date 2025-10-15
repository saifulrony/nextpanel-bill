'use client';

import { useDefaultPages } from '@/contexts/DefaultPageContext';

export default function DebugPage() {
  const { defaultPageConfig, isLoading, getCustomPageForType } = useDefaultPages();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Default Page Context</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Context State</h2>
          <div className="space-y-2">
            <p><strong>isLoading:</strong> {isLoading ? 'true' : 'false'}</p>
            <p><strong>defaultPageConfig:</strong></p>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(defaultPageConfig, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Page Type Tests</h2>
          <div className="space-y-2">
            <p><strong>Cart page:</strong> {getCustomPageForType('cart') || 'null'}</p>
            <p><strong>Shop page:</strong> {getCustomPageForType('shop') || 'null'}</p>
            <p><strong>Checkout page:</strong> {getCustomPageForType('checkout') || 'null'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">localStorage Raw Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {typeof window !== 'undefined' ? localStorage.getItem('default_page_config') || 'null' : 'Server side'}
          </pre>
        </div>

        <div className="mt-6">
          <a 
            href="/cart" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Test Cart Page
          </a>
        </div>
      </div>
    </div>
  );
}
