'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import HeaderCustomization from '@/components/HeaderCustomization';

interface CustomizationSettings {
  // Logo settings
  logo: string | null;
  logoWidth: number;
  logoHeight: number;
  logoPosition: 'left' | 'center' | 'right';
  logoPadding: number;
  logoOpacity: number;
  logoMaxWidth: string;
  logoText: string;
  logoColor: string;
  logoFontFamily: string;
  
  // Header settings
  headerBackgroundColor: string;
  headerTextColor: string;
  headerPadding: number;
  headerBorderRadius: number;
  headerShadow: string;
  headerMarginTop: number;
  headerMarginBottom: number;
  headerMarginLeft: number;
  headerMarginRight: number;
  headerIsStatic: boolean;
  
  // Navigation settings
  showNavigation: boolean;
  showCart: boolean;
  showUserMenu: boolean;
  
  // Header design
  headerDesign?: {
    selectedDesign: string;
    elements: any[];
    deviceType: string;
    timestamp: string;
  } | null;
}

export default function HeaderEditor() {
  const router = useRouter();
  const [settings, setSettings] = useState<CustomizationSettings>({
    logo: null,
    logoWidth: 200,
    logoHeight: 60,
    logoPosition: 'left',
    logoPadding: 16,
    logoOpacity: 100,
    logoMaxWidth: '200px',
    logoText: 'NextPanel',
    logoColor: '#4f46e5',
    logoFontFamily: 'Inter',
    headerBackgroundColor: '#ffffff',
    headerTextColor: '#374151',
    headerPadding: 16,
    headerBorderRadius: 0,
    headerShadow: 'none',
    headerMarginTop: 0,
    headerMarginBottom: 0,
    headerMarginLeft: 0,
    headerMarginRight: 0,
    headerIsStatic: false,
    showNavigation: true,
    showCart: true,
    showUserMenu: true,
    headerDesign: null,
  });

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('customization_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Advanced Header Editor</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Header Customization */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeaderCustomization 
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>
    </div>
  );
}
