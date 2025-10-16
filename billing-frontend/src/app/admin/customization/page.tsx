'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import HeaderCustomization from '@/components/HeaderCustomization';

interface CustomizationSettings {
  // Front Page Header
  logo: string | null;
  logoWidth: number;
  logoHeight: number;
  logoPosition: 'left' | 'center' | 'right';
  logoPadding: number;
  logoOpacity: number;
  logoMaxWidth: string;
  logoText: string;
  logoColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  headerPadding: number;
  headerBorderRadius: number;
  headerShadow: string;
  headerMargin: number;
  headerMarginTop: number;
  headerMarginBottom: number;
  headerMarginLeft: number;
  headerMarginRight: number;
  headerIsStatic: boolean;
  showNavigation: boolean;
  showCart: boolean;
  showUserMenu: boolean;
  
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

interface HeaderTemplate {
  id: string;
  name: string;
  description: string;
  device: 'desktop' | 'tablet' | 'mobile';
  backgroundColor: string;
  textColor: string;
  logoColor: string;
  logoText: string;
  showNavigation: boolean;
  showCart: boolean;
  showUserMenu: boolean;
  features: string[];
}

export default function CustomizationPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'header' | 'sidebar' | 'footer' | 'fonts' | 'colors' | 'layout' | 'theme' | 'custom' | 'default-pages'>('header');
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [settings, setSettings] = useState<CustomizationSettings>({
    // Front Page Header
    logo: null,
    logoWidth: 150,
    logoHeight: 50,
    logoPosition: 'left',
    logoPadding: 10,
    logoOpacity: 100,
    logoMaxWidth: '200px',
    logoText: 'NextPanel',
    logoColor: '#4f46e5',
    headerBackgroundColor: '#ffffff',
    headerTextColor: '#374151',
    headerPadding: 16,
    headerBorderRadius: 0,
    headerShadow: 'none',
    headerMargin: 0,
    headerMarginTop: 0,
    headerMarginBottom: 0,
    headerMarginLeft: 0,
    headerMarginRight: 0,
    headerIsStatic: false,
    showNavigation: true,
    showCart: true,
    showUserMenu: true,
    
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

  // Header Templates Data
  const headerTemplates: HeaderTemplate[] = [
    // Desktop Templates
    {
      id: 'desktop-classic',
      name: 'Classic Header',
      description: 'Traditional header with full navigation menu',
      device: 'desktop',
      backgroundColor: '#ffffff',
      textColor: '#374151',
      logoColor: '#4f46e5',
      logoText: 'NextPanel',
      showNavigation: true,
      showCart: true,
      showUserMenu: true,
      features: ['Full Menu', 'Cart Icon', 'User Menu', 'Clean Design']
    },
    {
      id: 'desktop-modern',
      name: 'Modern Header',
      description: 'Sleek header with gradient background',
      device: 'desktop',
      backgroundColor: '#1e293b',
      textColor: '#ffffff',
      logoColor: '#06b6d4',
      logoText: 'NextPanel',
      showNavigation: true,
      showCart: true,
      showUserMenu: true,
      features: ['Dark Theme', 'Gradient', 'Modern Look', 'Premium Feel']
    },
    {
      id: 'desktop-minimal',
      name: 'Minimal Header',
      description: 'Clean and simple header design',
      device: 'desktop',
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      logoColor: '#059669',
      logoText: 'NextPanel',
      showNavigation: false,
      showCart: true,
      showUserMenu: true,
      features: ['Minimal Design', 'Clean Layout', 'Focus on Content']
    },
    {
      id: 'desktop-corporate',
      name: 'Corporate Header',
      description: 'Professional header for business websites',
      device: 'desktop',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      logoColor: '#dc2626',
      logoText: 'NextPanel',
      showNavigation: true,
      showCart: false,
      showUserMenu: true,
      features: ['Professional', 'Business Focus', 'Trustworthy']
    },
    {
      id: 'desktop-creative',
      name: 'Creative Header',
      description: 'Bold header with vibrant colors',
      device: 'desktop',
      backgroundColor: '#fef3c7',
      textColor: '#92400e',
      logoColor: '#f59e0b',
      logoText: 'NextPanel',
      showNavigation: true,
      showCart: true,
      showUserMenu: false,
      features: ['Creative', 'Vibrant', 'Eye-catching', 'Unique']
    },
    
    // Tablet Templates
    {
      id: 'tablet-responsive',
      name: 'Responsive Tablet',
      description: 'Optimized header for tablet devices',
      device: 'tablet',
      backgroundColor: '#ffffff',
      textColor: '#374151',
      logoColor: '#4f46e5',
      logoText: 'NextPanel',
      showNavigation: true,
      showCart: true,
      showUserMenu: true,
      features: ['Tablet Optimized', 'Touch Friendly', 'Responsive']
    },
    {
      id: 'tablet-simple',
      name: 'Simple Tablet',
      description: 'Simplified header for tablet navigation',
      device: 'tablet',
      backgroundColor: '#f1f5f9',
      textColor: '#334155',
      logoColor: '#0ea5e9',
      logoText: 'NextPanel',
      showNavigation: false,
      showCart: true,
      showUserMenu: true,
      features: ['Simplified', 'Touch Focused', 'Clean']
    },
    
    // Mobile Templates
    {
      id: 'mobile-hamburger',
      name: 'Mobile Hamburger',
      description: 'Mobile header with hamburger menu',
      device: 'mobile',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      logoColor: '#4f46e5',
      logoText: 'NextPanel',
      showNavigation: false,
      showCart: true,
      showUserMenu: true,
      features: ['Hamburger Menu', 'Mobile First', 'Touch Optimized']
    },
    {
      id: 'mobile-minimal',
      name: 'Mobile Minimal',
      description: 'Minimal mobile header design',
      device: 'mobile',
      backgroundColor: '#f9fafb',
      textColor: '#374151',
      logoColor: '#059669',
      logoText: 'NextPanel',
      showNavigation: false,
      showCart: false,
      showUserMenu: true,
      features: ['Ultra Minimal', 'Fast Loading', 'Clean']
    },
    {
      id: 'mobile-app',
      name: 'App Style Mobile',
      description: 'App-like mobile header design',
      device: 'mobile',
      backgroundColor: '#1e293b',
      textColor: '#ffffff',
      logoColor: '#06b6d4',
      logoText: 'NextPanel',
      showNavigation: false,
      showCart: true,
      showUserMenu: true,
      features: ['App Style', 'Dark Theme', 'Modern Mobile']
    }
  ];

  // Helper functions
  const getTemplatesForDevice = (device: 'desktop' | 'tablet' | 'mobile') => {
    return headerTemplates.filter(template => template.device === device);
  };

  const getTemplateById = (id: string) => {
    return headerTemplates.find(template => template.id === id);
  };

  const applyTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      setSettings(prev => ({
        ...prev,
        headerBackgroundColor: template.backgroundColor,
        headerTextColor: template.textColor,
        logoColor: template.logoColor,
        logoText: template.logoText,
        showNavigation: template.showNavigation,
        showCart: template.showCart,
        showUserMenu: template.showUserMenu,
      }));
      alert(`Applied ${template.name} template successfully!`);
    }
  };
  
  // Page editor states
  const [selectedPage, setSelectedPage] = useState<PageFile | null>(null);
  const [pageCode, setPageCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [isCodeModified, setIsCodeModified] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Homepage management states
  const [homepagePages, setHomepagePages] = useState<any[]>([]);
  const [currentHomepage, setCurrentHomepage] = useState<any>(null);
  const [loadingHomepage, setLoadingHomepage] = useState(false);

  // Default pages management states
  const [defaultPageConfig, setDefaultPageConfig] = useState<Record<string, any>>({
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
  const [loadingDefaultPages, setLoadingDefaultPages] = useState(false);

  // Handle URL parameters for page editing
  useEffect(() => {
    const pageId = searchParams.get('page');
    const pageType = searchParams.get('type');
    const action = searchParams.get('action');
    
  }, [searchParams]);





  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('User not logged in, homepage management will be limited');
    }
    
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

    
    // Load homepage data
    loadHomepageData();
    loadDefaultPageConfig();
    loadAvailablePages();
  }, []);

  const loadHomepageData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No auth token found, skipping homepage data load');
        return;
      }
      
      console.log('Loading homepage data...');
      
      // Load all pages
      const pagesResponse = await fetch(`${apiUrl}/api/v1/pages/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (pagesResponse.ok) {
        const pages = await pagesResponse.json();
        setHomepagePages(pages);
        console.log('Loaded pages:', pages.length);
      } else {
        console.error('Failed to load pages:', pagesResponse.status);
      }
      
      // Load current homepage (no auth required)
      const homepageResponse = await fetch(`${apiUrl}/api/v1/pages/homepage`);
      if (homepageResponse.ok) {
        const homepage = await homepageResponse.json();
        setCurrentHomepage(homepage);
        console.log('Loaded homepage:', homepage?.title);
      } else {
        console.log('No custom homepage set');
      }
    } catch (error) {
      console.error('Error loading homepage data:', error);
    }
  };

  const handleSetHomepage = async (pageSlug: string) => {
    try {
      setLoadingHomepage(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in first. You can log in from the admin panel.');
        return;
      }
      
      console.log('Setting homepage for slug:', pageSlug);
      console.log('Using API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/v1/pages/homepage/${pageSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Homepage set response status:', response.status);
      
      if (response.ok) {
        const homepage = await response.json();
        setCurrentHomepage(homepage);
        alert(`Homepage set to "${homepage.title}" successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Homepage set error:', errorData);
        alert(`Failed to set homepage: ${errorData.detail || 'Please check your permissions.'}`);
      }
    } catch (error) {
      console.error('Error setting homepage:', error);
      alert(`Error setting homepage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingHomepage(false);
    }
  };

  const handleUnsetHomepage = async () => {
    if (!confirm('Are you sure you want to remove the custom homepage and revert to the default?')) {
      return;
    }
    
    try {
      setLoadingHomepage(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in first. You can log in from the admin panel.');
        return;
      }
      
      console.log('Unsetting homepage');
      console.log('Using API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/v1/pages/homepage`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Homepage unset response status:', response.status);
      
      if (response.ok) {
        setCurrentHomepage(null);
        alert('Homepage unset successfully! Reverted to default homepage.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Homepage unset error:', errorData);
        alert(`Failed to unset homepage: ${errorData.detail || 'Please check your permissions.'}`);
      }
    } catch (error) {
      console.error('Error unsetting homepage:', error);
      alert(`Error unsetting homepage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingHomepage(false);
    }
  };

  const loadDefaultPageConfig = async () => {
    try {
      // Load from localStorage
      const savedConfig = localStorage.getItem('default_page_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setDefaultPageConfig(config);
        console.log('Loaded default page config from localStorage:', config);
      } else {
        // Default empty config
        const defaultConfig = {
          homepage: null,
          cart: null,
          shop: null,
          checkout: null,
          order_success: null,
          about: null,
          contact: null,
          privacy: null,
          terms: null,
        };
        setDefaultPageConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to load default page config:', error);
    }
  };

  const loadAvailablePages = async () => {
    try {
      setLoadingHomepage(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No token found, skipping page loading');
        return;
      }

      const response = await fetch(`${apiUrl}/api/v1/pages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const pages = await response.json();
        console.log('Loaded pages from API:', pages);
        setHomepagePages(pages);
      } else {
        console.error('Failed to load pages:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoadingHomepage(false);
    }
  };

  const handleSetDefaultPage = async (pageType: string, pageSlug: string) => {
    try {
      setLoadingDefaultPages(true);
      console.log(`Setting ${pageType} page to: ${pageSlug}`);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in first. You can log in from the admin panel.');
        return;
      }
      
      // Update local state
      const newConfig = {
        ...defaultPageConfig,
        [pageType]: pageSlug
      };
      console.log('New config:', newConfig);
      setDefaultPageConfig(newConfig);
      
      // Save to localStorage so the pages can use it
      localStorage.setItem('default_page_config', JSON.stringify(newConfig));
      
      // In a real app, you would save this to the backend
      console.log(`Set ${pageType} page to: ${pageSlug}`);
      alert(`${pageType.charAt(0).toUpperCase() + pageType.slice(1)} page set successfully! You can now visit /${pageType} to see your custom page.`);
    } catch (error) {
      console.error('Failed to set default page:', error);
      alert('Failed to set default page');
    } finally {
      setLoadingDefaultPages(false);
    }
  };

  const handleUnsetDefaultPage = async (pageType: string) => {
    try {
      setLoadingDefaultPages(true);
      
      // Update local state
      const newConfig = {
        ...defaultPageConfig,
        [pageType]: null
      };
      setDefaultPageConfig(newConfig);
      
      // Save to localStorage
      localStorage.setItem('default_page_config', JSON.stringify(newConfig));
      
      console.log(`Unset ${pageType} page`);
      alert(`${pageType.charAt(0).toUpperCase() + pageType.slice(1)} page unset successfully! Now using default ${pageType} page.`);
    } catch (error) {
      console.error('Failed to unset default page:', error);
      alert('Failed to unset default page');
    } finally {
      setLoadingDefaultPages(false);
    }
  };

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
        logoText: 'NextPanel',
        logoColor: '#4f46e5',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#374151',
        headerPadding: 16,
        headerBorderRadius: 0,
        headerShadow: 'none',
        headerMargin: 0,
        headerMarginTop: 0,
        headerMarginBottom: 0,
        headerMarginLeft: 0,
        headerMarginRight: 0,
        headerIsStatic: false,
        showNavigation: true,
        showCart: true,
        showUserMenu: true,
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
                        { id: 'default-pages', name: 'Default Pages', icon: DocumentTextIcon },
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
                      setActiveTab(tab.id as any);
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
        <div className="w-full">
            {/* Main Content */}
            <div className="w-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

                {/* Default Pages Tab */}
                {activeTab === 'default-pages' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Default Pages Management</h2>
                      <button
                        onClick={() => window.open('/admin/page-builder', '_blank')}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create New Page</span>
                      </button>
                    </div>
                    
                    {/* Login Status Indicator */}
                    {!localStorage.getItem('access_token') && (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Authentication Required
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>You need to be logged in to manage default pages. Please log in from the admin panel first.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Page Type Selection */}
                      {[
                        { key: 'homepage', name: 'Homepage', icon: '🏠' },
                        { key: 'cart', name: 'Cart Page', icon: '🛒' },
                        { key: 'shop', name: 'Shop Page', icon: '🛍️' },
                        { key: 'checkout', name: 'Checkout Page', icon: '💳' },
                        { key: 'order_success', name: 'Order Success Page', icon: '✅' },
                        { key: 'about', name: 'About Page', icon: 'ℹ️' },
                        { key: 'contact', name: 'Contact Page', icon: '📞' },
                        { key: 'privacy', name: 'Privacy Policy', icon: '🔒' },
                        { key: 'terms', name: 'Terms of Service', icon: '📋' },
                      ].map((pageType) => (
                        <div key={pageType.key} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{pageType.icon}</span>
                              <div>
                                <h3 className="text-md font-semibold text-gray-900">{pageType.name}</h3>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  // Open page builder with the specific page type
                                  const pageTypeKey = pageType.key;
                                  window.open(`/admin/page-builder?page=${pageTypeKey}`, '_blank');
                                }}
                                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                              >
                                Edit
                              </button>
                              {defaultPageConfig[pageType.key] && (
                                <>
                                  <a
                                    href={`/dynamic-page/${defaultPageConfig[pageType.key]}`}
                                    target="_blank"
                                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                  >
                                    Preview
                                  </a>
                                  <button
                                    onClick={() => handleUnsetDefaultPage(pageType.key)}
                                    disabled={loadingDefaultPages}
                                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Page Selection */}
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Select Custom Page</h4>
                            <div className="text-xs text-gray-500 mb-2">
                              Available pages: {homepagePages.length} | Loading: {loadingHomepage ? 'Yes' : 'No'}
                            </div>
                            {homepagePages.length > 0 ? (
                              <div className="relative">
                                <select
                                  value={defaultPageConfig[pageType.key] || ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleSetDefaultPage(pageType.key, e.target.value);
                                    } else {
                                      handleUnsetDefaultPage(pageType.key);
                                    }
                                  }}
                                  disabled={loadingDefaultPages}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="">Use Default {pageType.name}</option>
                                  {homepagePages.map((page) => (
                                    <option key={page.id} value={page.slug}>
                                      {page.title} (/{page.slug})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <Squares2X2Icon className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-600 mt-2">No pages found</p>
                                <p className="text-xs text-gray-500">Create pages using the Page Builder first</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>
                )}

                {/* Header Tab */}
                {activeTab === 'header' && (
                <div>
                  {/* Header Preview Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Header Preview</h2>
                      <button
                        onClick={() => window.open('/admin/header-editor', '_blank')}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                      >
                        <PaintBrushIcon className="h-4 w-4" />
                        <span>Edit in Header Editor</span>
                      </button>
                    </div>

                    {/* Live Header Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="text-center mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Header Preview</h3>
                        <div className="text-xs text-gray-500">Live preview of your current header settings</div>
                      </div>
                      
                      {/* Header Preview Container */}
                      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between px-6 py-4"
                          style={{
                            backgroundColor: settings.headerBackgroundColor || '#ffffff',
                            color: settings.headerTextColor || '#374151'
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            {settings.logo ? (
                              <img 
                                src={settings.logo} 
                                alt="Logo" 
                                style={{
                                  width: settings.logoWidth || 150,
                                  height: settings.logoHeight || 50,
                                  opacity: (settings.logoOpacity || 100) / 100
                                }}
                              />
                            ) : (
                              <div 
                                className="font-bold text-xl"
                                style={{ color: settings.logoColor || '#4f46e5' }}
                              >
                                {settings.logoText || 'NextPanel'}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            {settings.showNavigation && (
                              <nav className="flex space-x-6">
                                <span className="text-sm">Home</span>
                                <span className="text-sm">About</span>
                                <span className="text-sm">Services</span>
                                <span className="text-sm">Contact</span>
                              </nav>
                            )}
                            {settings.showCart && (
                              <div className="w-6 h-6 bg-gray-400 rounded"></div>
                            )}
                            {settings.showUserMenu && (
                              <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Customization */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Advanced Customization</h3>
                    <HeaderCustomization 
                      settings={settings}
                      onSettingsChange={setSettings}
                    />
                  </div>

                  {/* Header Templates Section */}
                  <div className="border-t border-gray-200 pt-6 mt-8">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Header Templates</h3>
                    <p className="text-sm text-gray-600 mb-6">Choose from pre-designed templates for different device sizes. Each device can have its own template.</p>
                    
                    {/* Desktop Templates */}
                    <div className="mb-8">
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                        <span className="mr-2">🖥️</span>
                        Desktop Templates
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getTemplatesForDevice('desktop').map((template, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                          >
                            {/* Template Preview */}
                            <div className="aspect-video bg-gray-50 relative">
                              <div className="absolute inset-0 p-2">
                                <div 
                                  className="w-full h-full bg-white rounded shadow-sm overflow-hidden"
                                  style={{ 
                                    backgroundColor: template.backgroundColor,
                                    color: template.textColor 
                                  }}
                                >
                                  {/* Header Content Preview */}
                                  <div className="flex items-center justify-between p-2 h-full">
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: template.logoColor }}
                                      />
                                      <span className="font-semibold text-xs">{template.logoText}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {template.showNavigation && (
                                        <div className="flex space-x-1">
                                          <div className="w-6 h-0.5 bg-gray-300 rounded"></div>
                                          <div className="w-4 h-0.5 bg-gray-300 rounded"></div>
                                        </div>
                                      )}
                                      {template.showCart && (
                                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                      )}
                                      {template.showUserMenu && (
                                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Template Info */}
                            <div className="p-3 bg-white border-t border-gray-100">
                              <h5 className="font-medium text-gray-900 text-sm">{template.name}</h5>
                              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                              
                              {/* Apply Button */}
                              <button
                                onClick={() => applyTemplate(template.id)}
                                className="w-full mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
                              >
                                Apply to Desktop
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tablet Templates */}
                    <div className="mb-8">
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                        <span className="mr-2">📱</span>
                        Tablet Templates
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getTemplatesForDevice('tablet').map((template, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                          >
                            {/* Template Preview */}
                            <div className="aspect-video bg-gray-50 relative">
                              <div className="absolute inset-0 p-2">
                                <div 
                                  className="w-full h-full bg-white rounded shadow-sm overflow-hidden"
                                  style={{ 
                                    backgroundColor: template.backgroundColor,
                                    color: template.textColor 
                                  }}
                                >
                                  {/* Header Content Preview */}
                                  <div className="flex items-center justify-between p-2 h-full">
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: template.logoColor }}
                                      />
                                      <span className="font-semibold text-xs">{template.logoText}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {template.showNavigation && (
                                        <div className="flex space-x-1">
                                          <div className="w-6 h-0.5 bg-gray-300 rounded"></div>
                                          <div className="w-4 h-0.5 bg-gray-300 rounded"></div>
                                        </div>
                                      )}
                                      {template.showCart && (
                                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                      )}
                                      {template.showUserMenu && (
                                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Template Info */}
                            <div className="p-3 bg-white border-t border-gray-100">
                              <h5 className="font-medium text-gray-900 text-sm">{template.name}</h5>
                              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                              
                              {/* Apply Button */}
                              <button
                                onClick={() => applyTemplate(template.id)}
                                className="w-full mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
                              >
                                Apply to Tablet
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Templates */}
                    <div className="mb-8">
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                        <span className="mr-2">📱</span>
                        Mobile Templates
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getTemplatesForDevice('mobile').map((template, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                          >
                            {/* Template Preview */}
                            <div className="aspect-video bg-gray-50 relative">
                              <div className="absolute inset-0 p-2">
                                <div 
                                  className="w-full h-full bg-white rounded shadow-sm overflow-hidden"
                                  style={{ 
                                    backgroundColor: template.backgroundColor,
                                    color: template.textColor 
                                  }}
                                >
                                  {/* Header Content Preview */}
                                  <div className="flex items-center justify-between p-2 h-full">
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: template.logoColor }}
                                      />
                                      <span className="font-semibold text-xs">{template.logoText}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {template.showNavigation && (
                                        <div className="flex space-x-1">
                                          <div className="w-6 h-0.5 bg-gray-300 rounded"></div>
                                          <div className="w-4 h-0.5 bg-gray-300 rounded"></div>
                                        </div>
                                      )}
                                      {template.showCart && (
                                        <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                      )}
                                      {template.showUserMenu && (
                                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Template Info */}
                            <div className="p-3 bg-white border-t border-gray-100">
                              <h5 className="font-medium text-gray-900 text-sm">{template.name}</h5>
                              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                              
                              {/* Apply Button */}
                              <button
                                onClick={() => applyTemplate(template.id)}
                                className="w-full mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors"
                              >
                                Apply to Mobile
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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

