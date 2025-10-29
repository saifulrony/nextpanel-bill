'use client';

import { useInstalledModules } from '@/hooks/useInstalledModules';

export default function TestModulesPage() {
  const { installedModules, isLoading, error, hasModule } = useInstalledModules();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Module Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Status:</h2>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Has ai_chatbot module: {hasModule('ai_chatbot') ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Installed Modules:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(installedModules, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Test Links:</h2>
        <ul className="list-disc list-inside">
          <li><a href="/admin/support/chats" className="text-blue-600 hover:underline">Admin Support Chats</a></li>
          <li><a href="/customer/support/chats/new" className="text-blue-600 hover:underline">Customer New Chat</a></li>
          <li><a href="/customer/support/chats/123" className="text-blue-600 hover:underline">Customer Chat ID</a></li>
        </ul>
      </div>
    </div>
  );
}
