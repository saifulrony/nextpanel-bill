import { useState, useEffect } from 'react';
import { marketplaceAPI } from '@/lib/api';

export interface InstalledModule {
  id: string;
  addon_id: string;
  is_enabled: boolean;
  settings: any;
  installed_at: string;
  addon: {
    id: string;
    name: string;
    display_name: string;
    description: string;
    category: string;
    version: string;
    author: string;
    icon: string;
    status: string;
    is_premium: boolean;
    price: number;
    features: string[];
    install_count: number;
    rating_average: number;
    rating_count: number;
    homepage_url: string | null;
    documentation_url: string | null;
    is_installed: boolean;
  };
}

export function useInstalledModules() {
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInstalledModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await marketplaceAPI.listInstalled();
      setInstalledModules(response.data || []);
    } catch (err: any) {
      console.error('Failed to load installed modules:', err);
      setError(err.response?.data?.detail || 'Failed to load installed modules');
      setInstalledModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstalledModules();
  }, []);

  const hasModule = (moduleName: string): boolean => {
    return installedModules.some(module => module.addon.name === moduleName);
  };

  const getModuleRoutes = (moduleName: string): string[] => {
    const module = installedModules.find(m => m.addon.name === moduleName);
    if (!module) return [];
    
    // Extract routes from module metadata or settings
    // This would need to be stored in the module metadata
    const routes: string[] = [];
    
    if (moduleName === 'ai_chatbot') {
      routes.push('/admin/support/chats');
      routes.push('/customer/support/chats');
    }
    
    return routes;
  };

  return {
    installedModules,
    isLoading,
    error,
    hasModule,
    getModuleRoutes,
    refresh: loadInstalledModules
  };
}
