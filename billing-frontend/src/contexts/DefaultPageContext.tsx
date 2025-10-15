'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DefaultPageConfig {
  homepage: string | null;
  cart: string | null;
  shop: string | null;
  checkout: string | null;
  order_success: string | null;
  about: string | null;
  contact: string | null;
  privacy: string | null;
  terms: string | null;
}

interface DefaultPageContextType {
  defaultPageConfig: DefaultPageConfig;
  setDefaultPageConfig: (config: DefaultPageConfig) => void;
  getCustomPageForType: (pageType: keyof DefaultPageConfig) => string | null;
  isLoading: boolean;
}

const DefaultPageContext = createContext<DefaultPageContextType | undefined>(undefined);

export function DefaultPageProvider({ children }: { children: ReactNode }) {
  const [defaultPageConfig, setDefaultPageConfig] = useState<DefaultPageConfig>({
    homepage: null,
    cart: null,
    shop: null,
    checkout: null,
    order_success: null,
    about: null,
    contact: null,
    privacy: null,
    terms: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const getCustomPageForType = (pageType: keyof DefaultPageConfig): string | null => {
    return defaultPageConfig[pageType];
  };

  useEffect(() => {
    loadDefaultPageConfig();
  }, []);

  const loadDefaultPageConfig = async () => {
    try {
      console.log('DefaultPageContext: Starting to load config...');
      setIsLoading(true);
      
      // Only run on client side
      if (typeof window === 'undefined') {
        console.log('DefaultPageContext: Not client side, skipping localStorage');
        setIsLoading(false);
        return;
      }
      
      // Try to load from localStorage first
      const savedConfig = localStorage.getItem('default_page_config');
      console.log('DefaultPageContext: Raw localStorage data:', savedConfig);
      
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setDefaultPageConfig(config);
        console.log('DefaultPageContext: Loaded config from localStorage:', config);
      } else {
        console.log('DefaultPageContext: No saved config found, using defaults');
      }

      // In a real app, you would also load from the backend API
      // For now, we'll just use localStorage
      
    } catch (error) {
      console.error('DefaultPageContext: Failed to load default page config:', error);
    } finally {
      console.log('DefaultPageContext: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const updateConfig = (newConfig: DefaultPageConfig) => {
    setDefaultPageConfig(newConfig);
    localStorage.setItem('default_page_config', JSON.stringify(newConfig));
  };

  return (
    <DefaultPageContext.Provider 
      value={{ 
        defaultPageConfig, 
        setDefaultPageConfig: updateConfig, 
        getCustomPageForType,
        isLoading 
      }}
    >
      {children}
    </DefaultPageContext.Provider>
  );
}

export function useDefaultPages() {
  const context = useContext(DefaultPageContext);
  if (context === undefined) {
    throw new Error('useDefaultPages must be used within a DefaultPageProvider');
  }
  return context;
}
