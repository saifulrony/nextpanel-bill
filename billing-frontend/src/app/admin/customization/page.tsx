'use client';

import { useState, useEffect } from 'react';
import {
  PhotoIcon,
  SwatchIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  DocumentIcon,
  PlayIcon,
  ArrowPathIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { PageBuilderWithISR } from '@/components/page-builder/PageBuilderWithISR';
import { Component } from '@/components/page-builder/types';

interface CustomizationSettings {
  // Front Page Header
  logo: string | null;
  logoWidth: number;
  logoHeight: number;
  logoPosition: 'left' | 'center' | 'right';
  logoPadding: number;
  logoOpacity: number;
  logoMaxWidth: string;
  
  // Dashboard Sidebar
  sidebarLogo: string | null;
  sidebarBgColor: string;
  sidebarTextColor: string;
  sidebarHoverColor: string;
  sidebarActiveColor: string;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  
  // Front Page Footer
  footerBgColor: string;
  footerTextColor: string;
  footerHeadingColor: string;
  footerLogo: string | null;
  footerCopyright: string;
  footerLinks: Array<{ title: string; url: string }>;
  
  // Layout Settings
  headerHeight: number;
  sidebarWidthLayout: number;
  contentPadding: number;
  cardPadding: number;
  cardBorderRadius: number;
  cardShadow: string;
  buttonBorderRadius: number;
  inputBorderRadius: number;
  spacingUnit: number;
  gridGap: number;
  sectionGap: number;
  containerMaxWidth: string;
  
  // Global Settings
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  layout: 'default' | 'compact' | 'spacious';
  customCSS: string;
  customJS: string;
  customHTML: string;
  themeName: string;
}

interface PageFile {
  path: string;
  name: string;
  type: 'page' | 'component' | 'layout';
  category: string;
}

export default function CustomizationPage() {
  const [activeTab, setActiveTab] = useState<'header' | 'sidebar' | 'footer' | 'fonts' | 'colors' | 'layout' | 'theme' | 'custom' | 'builder'>('header');
  const [showPageBuilder, setShowPageBuilder] = useState(false);
  const [pageBuilderComponents, setPageBuilderComponents] = useState<Component[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [settings, setSettings] = useState<CustomizationSettings>({
    // Front Page Header
    logo: null,
    logoWidth: 150,
    logoHeight: 50,
    logoPosition: 'left',
    logoPadding: 10,
    logoOpacity: 100,
    logoMaxWidth: '200px',
    
    // Dashboard Sidebar
    sidebarLogo: null,
    sidebarBgColor: '#FFFFFF',
    sidebarTextColor: '#1F2937',
    sidebarHoverColor: '#F3F4F6',
    sidebarActiveColor: '#EEF2FF',
    sidebarWidth: 256,
    sidebarCollapsed: false,
    
    // Front Page Footer
    footerBgColor: '#1F2937',
    footerTextColor: '#9CA3AF',
    footerHeadingColor: '#FFFFFF',
    footerLogo: null,
    footerCopyright: '© 2025 NextPanel. All rights reserved.',
    footerLinks: [
      { title: 'About', url: '/about' },
      { title: 'Contact', url: '/contact' },
      { title: 'Privacy', url: '/privacy' },
      { title: 'Terms', url: '/terms' },
    ],
    
    // Layout Settings
    headerHeight: 64,
    sidebarWidthLayout: 256,
    contentPadding: 24,
    cardPadding: 24,
    cardBorderRadius: 8,
    cardShadow: 'sm',
    buttonBorderRadius: 6,
    inputBorderRadius: 6,
    spacingUnit: 8,
    gridGap: 24,
    sectionGap: 48,
    containerMaxWidth: '1280px',
    
    // Global Settings
    fontFamily: 'Inter',
    primaryColor: '#4F46E5',
    secondaryColor: '#818CF8',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    layout: 'default',
    customCSS: '',
    customJS: '',
    customHTML: '',
    themeName: '',
  });

  const [savedThemes, setSavedThemes] = useState<Array<{ name: string; settings: CustomizationSettings }>>([]);
  
  // Page editor states
  const [selectedPage, setSelectedPage] = useState<PageFile | null>(null);
  const [pageCode, setPageCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [isCodeModified, setIsCodeModified] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('customization_settings');
    if (saved) {
      const parsedSettings = JSON.parse(saved);
      // Ensure all numeric values are properly set
      setSettings({
        ...parsedSettings,
        logoWidth: parsedSettings.logoWidth || 150,
        logoHeight: parsedSettings.logoHeight || 50,
        logoPadding: parsedSettings.logoPadding || 10,
        logoOpacity: parsedSettings.logoOpacity || 100,
        logoMaxWidth: parsedSettings.logoMaxWidth || '200px',
      });
    }
    
    // Load saved themes
    const themes = localStorage.getItem('customization_themes');
    if (themes) {
      setSavedThemes(JSON.parse(themes));
    }

    // Load saved page builder components
    const savedComponents = localStorage.getItem('page_builder_components');
    if (savedComponents) {
      setPageBuilderComponents(JSON.parse(savedComponents));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('customization_settings', JSON.stringify(settings));
    
    // Apply settings to the page
    applySettings();
  }, [settings]);

  // Apply logo styles on mount
  useEffect(() => {
    const logoSettings = localStorage.getItem('logo_settings');
    if (logoSettings) {
      try {
        const settings = JSON.parse(logoSettings);
        const logoStyle = `
          .logo-container {
            display: flex;
            justify-content: ${settings.logoPosition || 'left'};
            padding: ${settings.logoPadding || 10}px;
            opacity: ${(settings.logoOpacity || 100) / 100};
          }
          .logo-img {
            max-width: ${settings.logoMaxWidth || '200px'};
            width: ${settings.logoWidth || 150}px;
            height: ${settings.logoHeight || 50}px;
            object-fit: contain;
          }
        `;
        
        let styleElement = document.getElementById('custom-logo-styles');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'custom-logo-styles';
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = logoStyle;
        
        // Update logo images if they exist
        if (settings.logo) {
          const logoElements = document.querySelectorAll('.logo-img, .sidebar-logo, .header-logo');
          logoElements.forEach((el) => {
            (el as HTMLImageElement).src = settings.logo;
            (el as HTMLElement).style.display = 'block';
          });
        }
      } catch (error) {
        console.error('Failed to apply logo settings:', error);
      }
    }
  }, []);

  // Apply layout settings on mount
  useEffect(() => {
    const layoutSettings = localStorage.getItem('layout_settings');
    if (layoutSettings) {
      try {
        const settings = JSON.parse(layoutSettings);
        const root = document.documentElement;
        
        root.style.setProperty('--header-height', `${settings.headerHeight || 64}px`);
        root.style.setProperty('--sidebar-width', `${settings.sidebarWidthLayout || 256}px`);
        root.style.setProperty('--content-padding', `${settings.contentPadding || 24}px`);
        root.style.setProperty('--card-padding', `${settings.cardPadding || 24}px`);
        root.style.setProperty('--card-radius', `${settings.cardBorderRadius || 8}px`);
        root.style.setProperty('--button-radius', `${settings.buttonBorderRadius || 6}px`);
        root.style.setProperty('--input-radius', `${settings.inputBorderRadius || 6}px`);
        root.style.setProperty('--spacing-unit', `${settings.spacingUnit || 8}px`);
        root.style.setProperty('--grid-gap', `${settings.gridGap || 24}px`);
        root.style.setProperty('--section-gap', `${settings.sectionGap || 48}px`);
        root.style.setProperty('--container-max-width', settings.containerMaxWidth || '1280px');
      } catch (error) {
        console.error('Failed to apply layout settings:', error);
      }
    }
  }, []);

  const applySettings = () => {
    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--bg-color', settings.backgroundColor);
    root.style.setProperty('--text-color', settings.textColor);
    root.style.setProperty('--font-family', settings.fontFamily);
    
    // Apply layout variables
    root.style.setProperty('--header-height', `${settings.headerHeight}px`);
    root.style.setProperty('--sidebar-width', `${settings.sidebarWidthLayout}px`);
    root.style.setProperty('--content-padding', `${settings.contentPadding}px`);
    root.style.setProperty('--card-padding', `${settings.cardPadding}px`);
    root.style.setProperty('--card-radius', `${settings.cardBorderRadius}px`);
    root.style.setProperty('--button-radius', `${settings.buttonBorderRadius}px`);
    root.style.setProperty('--input-radius', `${settings.inputBorderRadius}px`);
    root.style.setProperty('--spacing-unit', `${settings.spacingUnit}px`);
    root.style.setProperty('--grid-gap', `${settings.gridGap}px`);
    root.style.setProperty('--section-gap', `${settings.sectionGap}px`);
    root.style.setProperty('--container-max-width', settings.containerMaxWidth);
    
    // Apply layout class
    document.body.className = document.body.className.replace(/layout-\w+/g, '');
    document.body.classList.add(`layout-${settings.layout}`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = () => {
    // Save logo settings to localStorage
    localStorage.setItem('logo_settings', JSON.stringify({
      logo: settings.logo,
      logoWidth: settings.logoWidth,
      logoHeight: settings.logoHeight,
      logoPosition: settings.logoPosition,
      logoPadding: settings.logoPadding,
      logoOpacity: settings.logoOpacity,
      logoMaxWidth: settings.logoMaxWidth,
    }));
    
    // Apply logo styles globally
    const logoStyle = `
      .logo-container {
        display: flex;
        justify-content: ${settings.logoPosition || 'left'};
        padding: ${settings.logoPadding || 10}px;
        opacity: ${(settings.logoOpacity || 100) / 100};
      }
      .logo-img {
        max-width: ${settings.logoMaxWidth || '200px'};
        width: ${settings.logoWidth || 150}px;
        height: ${settings.logoHeight || 50}px;
        object-fit: contain;
      }
    `;
    
    // Inject CSS
    let styleElement = document.getElementById('custom-logo-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-logo-styles';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = logoStyle;
    
    // Update logo in sidebar and header if they exist
    const logoElements = document.querySelectorAll('.logo-img, .sidebar-logo, .header-logo');
    logoElements.forEach((el) => {
      if (settings.logo) {
        (el as HTMLImageElement).src = settings.logo;
        (el as HTMLElement).style.display = 'block';
      }
    });
    
    alert('Logo settings saved successfully!');
  };

  const handleSaveTheme = () => {
    if (!settings.themeName) {
      alert('Please enter a theme name');
      return;
    }
    
    const newTheme = {
      name: settings.themeName,
      settings: { ...settings },
    };
    
    const updatedThemes = [...savedThemes, newTheme];
    setSavedThemes(updatedThemes);
    localStorage.setItem('customization_themes', JSON.stringify(updatedThemes));
    alert('Theme saved successfully!');
  };

  const handleLoadTheme = (theme: { name: string; settings: CustomizationSettings }) => {
    setSettings(theme.settings);
    alert(`Theme "${theme.name}" loaded successfully!`);
  };

  const handleDeleteTheme = (themeName: string) => {
    const updatedThemes = savedThemes.filter(t => t.name !== themeName);
    setSavedThemes(updatedThemes);
    localStorage.setItem('customization_themes', JSON.stringify(updatedThemes));
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all customizations?')) {
      const defaultSettings: CustomizationSettings = {
        logo: null,
        logoWidth: 150,
        logoHeight: 50,
        logoPosition: 'left',
        logoPadding: 10,
        logoOpacity: 100,
        logoMaxWidth: '200px',
        sidebarLogo: null,
        sidebarBgColor: '#FFFFFF',
        sidebarTextColor: '#1F2937',
        sidebarHoverColor: '#F3F4F6',
        sidebarActiveColor: '#EEF2FF',
        sidebarWidth: 256,
        sidebarCollapsed: false,
        footerBgColor: '#1F2937',
        footerTextColor: '#9CA3AF',
        footerHeadingColor: '#FFFFFF',
        footerLogo: null,
        footerCopyright: '© 2025 NextPanel. All rights reserved.',
        footerLinks: [
          { title: 'About', url: '/about' },
          { title: 'Contact', url: '/contact' },
          { title: 'Privacy', url: '/privacy' },
          { title: 'Terms', url: '/terms' },
        ],
        headerHeight: 64,
        sidebarWidthLayout: 256,
        contentPadding: 24,
        cardPadding: 24,
        cardBorderRadius: 8,
        cardShadow: 'sm',
        buttonBorderRadius: 6,
        inputBorderRadius: 6,
        spacingUnit: 8,
        gridGap: 24,
        sectionGap: 48,
        containerMaxWidth: '1280px',
        fontFamily: 'Inter',
        primaryColor: '#4F46E5',
        secondaryColor: '#818CF8',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        layout: 'default',
        customCSS: '',
        customJS: '',
        customHTML: '',
        themeName: '',
      };
      setSettings(defaultSettings);
      localStorage.removeItem('customization_settings');
      localStorage.removeItem('customization_themes');
      setSavedThemes([]);
      alert('All customizations have been reset!');
    }
  };

  const fonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
    'Poppins', 'Nunito', 'Raleway', 'Ubuntu', 'Playfair Display'
  ];

  const layouts = [
    { id: 'default', name: 'Default', description: 'Standard spacing and layout' },
    { id: 'compact', name: 'Compact', description: 'Reduced spacing for more content' },
    { id: 'spacious', name: 'Spacious', description: 'Extra spacing for breathing room' },
  ];

  // Available pages for editing
  const availablePages: PageFile[] = [
    // Admin pages
    { path: '/admin/dashboard', name: 'Dashboard', type: 'page', category: 'Admin' },
    { path: '/admin/customers', name: 'Customers', type: 'page', category: 'Admin' },
    { path: '/admin/products', name: 'Products', type: 'page', category: 'Admin' },
    { path: '/admin/orders', name: 'Orders', type: 'page', category: 'Admin' },
    { path: '/admin/licenses', name: 'Licenses', type: 'page', category: 'Admin' },
    { path: '/admin/domains', name: 'Domains', type: 'page', category: 'Admin' },
    { path: '/admin/subscriptions', name: 'Subscriptions', type: 'page', category: 'Admin' },
    { path: '/admin/payments', name: 'Payments', type: 'page', category: 'Admin' },
    { path: '/admin/server', name: 'Server', type: 'page', category: 'Admin' },
    { path: '/admin/analytics', name: 'Analytics', type: 'page', category: 'Admin' },
    { path: '/admin/support', name: 'Support', type: 'page', category: 'Admin' },
    { path: '/admin/marketplace', name: 'Marketplace', type: 'page', category: 'Admin' },
    { path: '/admin/settings', name: 'Settings', type: 'page', category: 'Admin' },
    { path: '/admin/customization', name: 'Customization', type: 'page', category: 'Admin' },
    
    // Layouts
    { path: '/admin/layout', name: 'Admin Layout', type: 'layout', category: 'Layouts' },
    
    // Components
    { path: '/components/header', name: 'Header Component', type: 'component', category: 'Components' },
    { path: '/components/footer', name: 'Footer Component', type: 'component', category: 'Components' },
    { path: '/components/sidebar', name: 'Sidebar Component', type: 'component', category: 'Components' },
  ];

  const handleSelectPage = (page: PageFile) => {
    setSelectedPage(page);
    // In a real implementation, you would fetch the actual page code from the API
    // For now, we'll use mock data
    const mockCode = `'use client';

import { useState } from 'react';

export default function ${page.name}Page() {
  const [data, setData] = useState([]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">${page.name}</h1>
      <p className="text-gray-600">This is the ${page.name} page.</p>
      
      {/* Add your custom code here */}
    </div>
  );
}`;
    setPageCode(mockCode);
    setOriginalCode(mockCode);
    setIsCodeModified(false);
    setShowPreview(false);
  };

  const handleCodeChange = (newCode: string) => {
    setPageCode(newCode);
    setIsCodeModified(newCode !== originalCode);
  };

  const handleSaveCode = () => {
    if (selectedPage) {
      // In a real implementation, save to API
      setOriginalCode(pageCode);
      setIsCodeModified(false);
      alert(`Code saved for ${selectedPage.name}!`);
    }
  };

  const handleResetCode = () => {
    if (confirm('Are you sure you want to reset to original code?')) {
      setPageCode(originalCode);
      setIsCodeModified(false);
    }
  };

  // Open Page Builder in new tab
  const handleOpenPageBuilder = () => {
    window.open('/page-builder', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customization</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Customize the look and feel of your billing system
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    previewMode
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {previewMode ? (
                    <>
                      <EyeSlashIcon className="h-5 w-5 mr-2" />
                      Exit Preview
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-5 w-5 mr-2" />
                      Preview
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <nav className="flex space-x-8 -mb-px">
              {[
                { id: 'builder', name: 'Page Builder', icon: Squares2X2Icon, action: 'newTab' },
                { id: 'header', name: 'Header', icon: PhotoIcon },
                { id: 'sidebar', name: 'Sidebar', icon: FolderIcon },
                { id: 'footer', name: 'Footer', icon: DocumentIcon },
                { id: 'fonts', name: 'Fonts', icon: DocumentTextIcon },
                { id: 'colors', name: 'Colors', icon: SwatchIcon },
                { id: 'layout', name: 'Layout', icon: ArrowsRightLeftIcon },
                { id: 'theme', name: 'Themes', icon: PaintBrushIcon },
                { id: 'custom', name: 'Custom Code', icon: CodeBracketIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.action === 'newTab') {
                        handleOpenPageBuilder();
                      } else {
                        setActiveTab(tab.id as any);
                      }
                    }}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Header Tab */}
                {activeTab === 'header' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Front Page Header</h2>
                  <div className="space-y-6">
                    {/* Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Logo
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          {settings.logo ? (
                            <div>
                              <img
                                src={settings.logo}
                                alt="Logo preview"
                                className="mx-auto h-32 w-auto object-contain"
                              />
                              <p className="text-xs text-gray-500 mt-2">Current Logo</p>
                            </div>
                          ) : (
                            <>
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="logo-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="logo-upload"
                                    name="logo-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Logo Settings */}
                    {settings.logo && (
                      <>
                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-md font-semibold text-gray-900 mb-4">Logo Settings</h3>
                          
                          {/* Size Controls */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Width (px)
                              </label>
                              <input
                                type="number"
                                value={settings.logoWidth}
                                onChange={(e) => setSettings({ ...settings, logoWidth: parseInt(e.target.value) || 150 })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                min="50"
                                max="500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Height (px)
                              </label>
                              <input
                                type="number"
                                value={settings.logoHeight}
                                onChange={(e) => setSettings({ ...settings, logoHeight: parseInt(e.target.value) || 50 })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                min="20"
                                max="300"
                              />
                            </div>
                          </div>

                          {/* Max Width */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Width
                            </label>
                            <input
                              type="text"
                              value={settings.logoMaxWidth}
                              onChange={(e) => setSettings({ ...settings, logoMaxWidth: e.target.value })}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="200px"
                            />
                            <p className="text-xs text-gray-500 mt-1">Use px, %, vw, etc.</p>
                          </div>

                          {/* Position */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Position
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {(['left', 'center', 'right'] as const).map((pos) => (
                                <button
                                  key={pos}
                                  onClick={() => setSettings({ ...settings, logoPosition: pos })}
                                  className={`px-4 py-2 rounded-md border-2 transition-colors ${
                                    settings.logoPosition === pos
                                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Padding */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Padding: {settings.logoPadding}px
                            </label>
                            <input
                              type="range"
                              value={settings.logoPadding}
                              onChange={(e) => setSettings({ ...settings, logoPadding: parseInt(e.target.value) })}
                              className="w-full"
                              min="0"
                              max="50"
                            />
                          </div>

                          {/* Opacity */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Opacity: {settings.logoOpacity}%
                            </label>
                            <input
                              type="range"
                              value={settings.logoOpacity}
                              onChange={(e) => setSettings({ ...settings, logoOpacity: parseInt(e.target.value) })}
                              className="w-full"
                              min="0"
                              max="100"
                            />
                          </div>

                          {/* Live Preview */}
                          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                            <div
                              className="border border-gray-200 rounded p-4 bg-white"
                              style={{
                                display: 'flex',
                                justifyContent: settings.logoPosition,
                                padding: `${settings.logoPadding || 10}px`,
                                opacity: (settings.logoOpacity || 100) / 100,
                              }}
                            >
                              <img
                                src={settings.logo}
                                alt="Logo preview"
                                style={{
                                  maxWidth: settings.logoMaxWidth || '200px',
                                  width: `${settings.logoWidth || 150}px`,
                                  height: `${settings.logoHeight || 50}px`,
                                  objectFit: 'contain',
                                }}
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <button
                              onClick={handleSaveLogo}
                              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              Save Logo Settings
                            </button>
                            <button
                              onClick={() => setSettings({ ...settings, logo: null })}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Remove Logo
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Sidebar Tab */}
              {activeTab === 'sidebar' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Sidebar</h2>
                  <div className="space-y-6">
                    {/* Sidebar Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sidebar Logo
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          {settings.sidebarLogo ? (
                            <div>
                              <img
                                src={settings.sidebarLogo}
                                alt="Sidebar logo preview"
                                className="mx-auto h-16 w-auto object-contain"
                              />
                              <p className="text-xs text-gray-500 mt-2">Current Sidebar Logo</p>
                            </div>
                          ) : (
                            <>
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="sidebar-logo-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="sidebar-logo-upload"
                                    name="sidebar-logo-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setSettings({ ...settings, sidebarLogo: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Colors */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Sidebar Colors</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={settings.sidebarBgColor}
                              onChange={(e) => setSettings({ ...settings, sidebarBgColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.sidebarBgColor}
                              onChange={(e) => setSettings({ ...settings, sidebarBgColor: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={settings.sidebarTextColor}
                              onChange={(e) => setSettings({ ...settings, sidebarTextColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.sidebarTextColor}
                              onChange={(e) => setSettings({ ...settings, sidebarTextColor: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hover Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={settings.sidebarHoverColor}
                              onChange={(e) => setSettings({ ...settings, sidebarHoverColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.sidebarHoverColor}
                              onChange={(e) => setSettings({ ...settings, sidebarHoverColor: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Active Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={settings.sidebarActiveColor}
                              onChange={(e) => setSettings({ ...settings, sidebarActiveColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.sidebarActiveColor}
                              onChange={(e) => setSettings({ ...settings, sidebarActiveColor: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sidebar Width: {settings.sidebarWidth}px
                      </label>
                      <input
                        type="range"
                        value={settings.sidebarWidth}
                        onChange={(e) => setSettings({ ...settings, sidebarWidth: parseInt(e.target.value) })}
                        className="w-full"
                        min="200"
                        max="400"
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={() => {
                        localStorage.setItem('sidebar_settings', JSON.stringify({
                          sidebarLogo: settings.sidebarLogo,
                          sidebarBgColor: settings.sidebarBgColor,
                          sidebarTextColor: settings.sidebarTextColor,
                          sidebarHoverColor: settings.sidebarHoverColor,
                          sidebarActiveColor: settings.sidebarActiveColor,
                          sidebarWidth: settings.sidebarWidth,
                        }));
                        alert('Sidebar settings saved!');
                      }}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save Sidebar Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Tab */}
              {activeTab === 'footer' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Front Page Footer</h2>
                  <div className="space-y-6">
                    {/* Footer Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Footer Logo
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          {settings.footerLogo ? (
                            <div>
                              <img
                                src={settings.footerLogo}
                                alt="Footer logo preview"
                                className="mx-auto h-16 w-auto object-contain"
                              />
                              <button
                                onClick={() => setSettings({ ...settings, footerLogo: null })}
                                className="mt-2 text-xs text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="footer-logo-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                                >
                                  <span>Upload a file</span>
                                  <input
                                    id="footer-logo-upload"
                                    name="footer-logo-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setSettings({ ...settings, footerLogo: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Colors */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Footer Colors</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={settings.footerBgColor}
                              onChange={(e) => setSettings({ ...settings, footerBgColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.footerBgColor}
                              onChange={(e) => setSettings({ ...settings, footerBgColor: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={settings.footerTextColor}
                              onChange={(e) => setSettings({ ...settings, footerTextColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.footerTextColor}
                              onChange={(e) => setSettings({ ...settings, footerTextColor: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Heading Color
                          </label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={settings.footerHeadingColor}
                              onChange={(e) => setSettings({ ...settings, footerHeadingColor: e.target.value })}
                              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.footerHeadingColor}
                              onChange={(e) => setSettings({ ...settings, footerHeadingColor: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Copyright */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Copyright Text
                      </label>
                      <input
                        type="text"
                        value={settings.footerCopyright}
                        onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="© 2025 NextPanel. All rights reserved."
                      />
                    </div>

                    {/* Footer Links */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Footer Links
                      </label>
                      <div className="space-y-2">
                        {settings.footerLinks.map((link, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={link.title}
                              onChange={(e) => {
                                const newLinks = [...settings.footerLinks];
                                newLinks[index].title = e.target.value;
                                setSettings({ ...settings, footerLinks: newLinks });
                              }}
                              placeholder="Link Title"
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...settings.footerLinks];
                                newLinks[index].url = e.target.value;
                                setSettings({ ...settings, footerLinks: newLinks });
                              }}
                              placeholder="/url"
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            <button
                              onClick={() => {
                                const newLinks = settings.footerLinks.filter((_, i) => i !== index);
                                setSettings({ ...settings, footerLinks: newLinks });
                              }}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setSettings({
                              ...settings,
                              footerLinks: [...settings.footerLinks, { title: 'New Link', url: '/' }]
                            });
                          }}
                          className="w-full px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={() => {
                        localStorage.setItem('footer_settings', JSON.stringify({
                          footerBgColor: settings.footerBgColor,
                          footerTextColor: settings.footerTextColor,
                          footerHeadingColor: settings.footerHeadingColor,
                          footerLogo: settings.footerLogo,
                          footerCopyright: settings.footerCopyright,
                          footerLinks: settings.footerLinks,
                        }));
                        alert('Footer settings saved!');
                      }}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save Footer Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Fonts Tab */}
              {activeTab === 'fonts' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Font Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Family
                      </label>
                      <select
                        value={settings.fontFamily}
                        onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        style={{ fontFamily: settings.fontFamily }}
                      >
                        {fonts.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
                      <div style={{ fontFamily: settings.fontFamily }}>
                        <p className="text-2xl font-bold">Heading 1</p>
                        <p className="text-xl font-semibold">Heading 2</p>
                        <p className="text-lg">Heading 3</p>
                        <p className="text-base">Body text - The quick brown fox jumps over the lazy dog</p>
                        <p className="text-sm">Small text - Lorem ipsum dolor sit amet</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Scheme</h2>
                  <div className="space-y-6">
                    {[
                      { label: 'Primary Color', key: 'primaryColor' as keyof CustomizationSettings },
                      { label: 'Secondary Color', key: 'secondaryColor' as keyof CustomizationSettings },
                      { label: 'Background Color', key: 'backgroundColor' as keyof CustomizationSettings },
                      { label: 'Text Color', key: 'textColor' as keyof CustomizationSettings },
                    ].map((color) => (
                      <div key={color.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {color.label}
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={settings[color.key] as string}
                            onChange={(e) => setSettings({ ...settings, [color.key]: e.target.value })}
                            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings[color.key] as string}
                            onChange={(e) => setSettings({ ...settings, [color.key]: e.target.value })}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Color Preview</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div
                          className="p-3 rounded text-white text-sm"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          Primary
                        </div>
                        <div
                          className="p-3 rounded text-white text-sm"
                          style={{ backgroundColor: settings.secondaryColor }}
                        >
                          Secondary
                        </div>
                        <div
                          className="p-3 rounded text-sm"
                          style={{
                            backgroundColor: settings.backgroundColor,
                            color: settings.textColor,
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          Background
                        </div>
                        <div
                          className="p-3 rounded text-sm"
                          style={{ color: settings.textColor, backgroundColor: settings.backgroundColor }}
                        >
                          Text
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">System Layout & Structure</h2>
                  
                  {/* Quick Presets */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Presets</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {layouts.map((layout) => (
                        <button
                          key={layout.id}
                          onClick={() => setSettings({ ...settings, layout: layout.id as any })}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            settings.layout === layout.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <h4 className="text-sm font-medium text-gray-900">{layout.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{layout.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Custom Layout Settings</h3>
                    
                    {/* Header & Sidebar */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Header & Sidebar</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Header Height: {settings.headerHeight}px
                          </label>
                          <input
                            type="range"
                            value={settings.headerHeight}
                            onChange={(e) => setSettings({ ...settings, headerHeight: parseInt(e.target.value) })}
                            className="w-full"
                            min="48"
                            max="120"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sidebar Width: {settings.sidebarWidthLayout}px
                          </label>
                          <input
                            type="range"
                            value={settings.sidebarWidthLayout}
                            onChange={(e) => setSettings({ ...settings, sidebarWidthLayout: parseInt(e.target.value) })}
                            className="w-full"
                            min="200"
                            max="400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Spacing */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Spacing</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content Padding: {settings.contentPadding}px
                          </label>
                          <input
                            type="range"
                            value={settings.contentPadding}
                            onChange={(e) => setSettings({ ...settings, contentPadding: parseInt(e.target.value) })}
                            className="w-full"
                            min="8"
                            max="64"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Padding: {settings.cardPadding}px
                          </label>
                          <input
                            type="range"
                            value={settings.cardPadding}
                            onChange={(e) => setSettings({ ...settings, cardPadding: parseInt(e.target.value) })}
                            className="w-full"
                            min="8"
                            max="48"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grid Gap: {settings.gridGap}px
                          </label>
                          <input
                            type="range"
                            value={settings.gridGap}
                            onChange={(e) => setSettings({ ...settings, gridGap: parseInt(e.target.value) })}
                            className="w-full"
                            min="8"
                            max="64"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Section Gap: {settings.sectionGap}px
                          </label>
                          <input
                            type="range"
                            value={settings.sectionGap}
                            onChange={(e) => setSettings({ ...settings, sectionGap: parseInt(e.target.value) })}
                            className="w-full"
                            min="24"
                            max="128"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Border Radius</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cards: {settings.cardBorderRadius}px
                          </label>
                          <input
                            type="range"
                            value={settings.cardBorderRadius}
                            onChange={(e) => setSettings({ ...settings, cardBorderRadius: parseInt(e.target.value) })}
                            className="w-full"
                            min="0"
                            max="24"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buttons: {settings.buttonBorderRadius}px
                          </label>
                          <input
                            type="range"
                            value={settings.buttonBorderRadius}
                            onChange={(e) => setSettings({ ...settings, buttonBorderRadius: parseInt(e.target.value) })}
                            className="w-full"
                            min="0"
                            max="24"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Inputs: {settings.inputBorderRadius}px
                          </label>
                          <input
                            type="range"
                            value={settings.inputBorderRadius}
                            onChange={(e) => setSettings({ ...settings, inputBorderRadius: parseInt(e.target.value) })}
                            className="w-full"
                            min="0"
                            max="24"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shadow & Container */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Shadow & Container</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Shadow
                          </label>
                          <select
                            value={settings.cardShadow}
                            onChange={(e) => setSettings({ ...settings, cardShadow: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="none">None</option>
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                            <option value="xl">Extra Large</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Container Width
                          </label>
                          <input
                            type="text"
                            value={settings.containerMaxWidth}
                            onChange={(e) => setSettings({ ...settings, containerMaxWidth: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="1280px"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                      <div className="space-y-3">
                        <div
                          className="bg-white p-4 rounded"
                          style={{
                            borderRadius: `${settings.cardBorderRadius}px`,
                            padding: `${settings.cardPadding}px`,
                            boxShadow: settings.cardShadow === 'none' ? 'none' : 
                                       settings.cardShadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                                       settings.cardShadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                                       settings.cardShadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' :
                                       '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <div className="text-sm font-medium text-gray-900">Card Example</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Border Radius: {settings.cardBorderRadius}px | Padding: {settings.cardPadding}px
                          </div>
                        </div>
                        <button
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                          style={{ borderRadius: `${settings.buttonBorderRadius}px` }}
                        >
                          Button Example (Border Radius: {settings.buttonBorderRadius}px)
                        </button>
                        <input
                          type="text"
                          placeholder="Input Example"
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          style={{ borderRadius: `${settings.inputBorderRadius}px` }}
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={() => {
                        localStorage.setItem('layout_settings', JSON.stringify({
                          headerHeight: settings.headerHeight,
                          sidebarWidthLayout: settings.sidebarWidthLayout,
                          contentPadding: settings.contentPadding,
                          cardPadding: settings.cardPadding,
                          cardBorderRadius: settings.cardBorderRadius,
                          cardShadow: settings.cardShadow,
                          buttonBorderRadius: settings.buttonBorderRadius,
                          inputBorderRadius: settings.inputBorderRadius,
                          spacingUnit: settings.spacingUnit,
                          gridGap: settings.gridGap,
                          sectionGap: settings.sectionGap,
                          containerMaxWidth: settings.containerMaxWidth,
                        }));
                        alert('Layout settings saved!');
                      }}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save Layout Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Theme Tab */}
              {activeTab === 'theme' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Theme Management</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Save Current Settings as Theme
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Enter theme name..."
                          value={settings.themeName}
                          onChange={(e) => setSettings({ ...settings, themeName: e.target.value })}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <button
                          onClick={handleSaveTheme}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Save Theme
                        </button>
                      </div>
                    </div>

                    {savedThemes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Themes</h3>
                        <div className="space-y-2">
                          {savedThemes.map((theme) => (
                            <div
                              key={theme.name}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-900">{theme.name}</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleLoadTheme(theme)}
                                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => handleDeleteTheme(theme.name)}
                                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Code Tab */}
              {activeTab === 'custom' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Page Editor & Custom Code</h2>
                  
                  {/* Page Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Page to Edit
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                      {availablePages.map((page) => (
                        <button
                          key={page.path}
                          onClick={() => handleSelectPage(page)}
                          className={`flex items-start p-3 rounded-lg border-2 text-left transition-all ${
                            selectedPage?.path === page.path
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3 mt-0.5">
                            {page.type === 'page' && <DocumentIcon className="h-5 w-5 text-gray-400" />}
                            {page.type === 'layout' && <FolderIcon className="h-5 w-5 text-gray-400" />}
                            {page.type === 'component' && <CodeBracketIcon className="h-5 w-5 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{page.name}</p>
                            <p className="text-xs text-gray-500">{page.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Page Editor */}
                  {selectedPage && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <DocumentIcon className="h-6 w-6 text-indigo-600" />
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{selectedPage.name}</h3>
                            <p className="text-xs text-gray-600">{selectedPage.path}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCodeModified && (
                            <span className="text-xs text-orange-600 font-medium">Modified</span>
                          )}
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center px-3 py-1.5 text-sm bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-1.5" />
                            {showPreview ? 'Hide' : 'Show'} Preview
                          </button>
                        </div>
                      </div>

                      {/* Code Editor */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Page Code
                          </label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={handleResetCode}
                              disabled={!isCodeModified}
                              className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                              Reset
                            </button>
                            <button
                              onClick={handleSaveCode}
                              disabled={!isCodeModified}
                              className="flex items-center px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              Save Code
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={pageCode}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          rows={20}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
                          placeholder="Select a page to edit its code..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Global Custom Code */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Global Custom Code</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom CSS
                        </label>
                        <textarea
                          value={settings.customCSS}
                          onChange={(e) => setSettings({ ...settings, customCSS: e.target.value })}
                          rows={8}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
                          placeholder="/* Add your custom CSS here */"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom JavaScript
                        </label>
                        <textarea
                          value={settings.customJS}
                          onChange={(e) => setSettings({ ...settings, customJS: e.target.value })}
                          rows={8}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
                          placeholder="// Add your custom JavaScript here"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom HTML
                        </label>
                        <textarea
                          value={settings.customHTML}
                          onChange={(e) => setSettings({ ...settings, customHTML: e.target.value })}
                          rows={8}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono text-xs"
                          placeholder="<!-- Add your custom HTML here -->"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview Panel */}
                  {showPreview && selectedPage && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Live Preview</h4>
                        <button
                          onClick={() => setShowPreview(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="bg-white rounded p-4 min-h-[200px]">
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <style>
                                  ${settings.customCSS}
                                  body { margin: 0; padding: 16px; font-family: ${settings.fontFamily}; }
                                </style>
                              </head>
                              <body>
                                ${settings.customHTML}
                                <script>
                                  ${settings.customJS}
                                </script>
                              </body>
                            </html>
                          `}
                          className="w-full h-96 border border-gray-200 rounded"
                          title="Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Live Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h2>
              <div className="space-y-4">
                {/* Logo Preview */}
                {settings.logo && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Logo</h3>
                    <img
                      src={settings.logo}
                      alt="Logo preview"
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                )}

                {/* Colors Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Colors</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="p-2 rounded text-white text-xs text-center"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Primary
                    </div>
                    <div
                      className="p-2 rounded text-white text-xs text-center"
                      style={{ backgroundColor: settings.secondaryColor }}
                    >
                      Secondary
                    </div>
                  </div>
                </div>

                {/* Typography Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Typography</h3>
                  <div style={{ fontFamily: settings.fontFamily }}>
                    <p className="text-lg font-bold">Heading</p>
                    <p className="text-sm">Body text</p>
                  </div>
                </div>

                {/* Layout Preview */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Layout</h3>
                  <p className="text-sm text-gray-600 capitalize">{settings.layout}</p>
                </div>

                {/* Custom Code Status */}
                {(settings.customCSS || settings.customJS || settings.customHTML) && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Custom Code Active</h3>
                    <div className="text-xs text-green-700 space-y-1">
                      {settings.customCSS && <p>✓ CSS</p>}
                      {settings.customJS && <p>✓ JavaScript</p>}
                      {settings.customHTML && <p>✓ HTML</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS/JS/HTML Injection */}
      {settings.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: settings.customCSS }} />
      )}
      {settings.customJS && (
        <script dangerouslySetInnerHTML={{ __html: settings.customJS }} />
      )}
      {settings.customHTML && (
        <div dangerouslySetInnerHTML={{ __html: settings.customHTML }} />
      )}
    </div>
  );
}

