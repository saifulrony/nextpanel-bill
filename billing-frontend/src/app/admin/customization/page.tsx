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
} from '@heroicons/react/24/outline';

interface CustomizationSettings {
  logo: string | null;
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
  const [activeTab, setActiveTab] = useState<'logo' | 'fonts' | 'colors' | 'layout' | 'theme' | 'custom'>('logo');
  const [previewMode, setPreviewMode] = useState(false);
  const [settings, setSettings] = useState<CustomizationSettings>({
    logo: null,
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
      setSettings(JSON.parse(saved));
    }
    
    // Load saved themes
    const themes = localStorage.getItem('customization_themes');
    if (themes) {
      setSavedThemes(JSON.parse(themes));
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('customization_settings', JSON.stringify(settings));
    
    // Apply settings to the page
    applySettings();
  }, [settings]);

  const applySettings = () => {
    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--bg-color', settings.backgroundColor);
    root.style.setProperty('--text-color', settings.textColor);
    root.style.setProperty('--font-family', settings.fontFamily);
    
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
                { id: 'logo', name: 'Logo', icon: PhotoIcon },
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
                    onClick={() => setActiveTab(tab.id as any)}
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
              {/* Logo Tab */}
              {activeTab === 'logo' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">System Logo</h2>
                  <div className="space-y-6">
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
                    {settings.logo && (
                      <button
                        onClick={() => setSettings({ ...settings, logo: null })}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove Logo
                      </button>
                    )}
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Layout Options</h2>
                  <div className="space-y-4">
                    {layouts.map((layout) => (
                      <div
                        key={layout.id}
                        onClick={() => setSettings({ ...settings, layout: layout.id as any })}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          settings.layout === layout.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{layout.name}</h3>
                            <p className="text-sm text-gray-500">{layout.description}</p>
                          </div>
                          {settings.layout === layout.id && (
                            <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                          )}
                        </div>
                      </div>
                    ))}
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

