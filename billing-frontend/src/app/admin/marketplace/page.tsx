'use client';

import { useState, useEffect } from 'react';
import { marketplaceAPI } from '@/lib/api';
import {
  PuzzlePieceIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  StarIcon,
  TagIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Addon {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  version: string;
  author?: string;
  icon?: string;
  status: string;
  is_premium: boolean;
  price: number;
  features?: string[];
  install_count: number;
  rating_average: number;
  rating_count: number;
  is_installed: boolean;
}

const categoryConfig: Record<string, { color: string; label: string }> = {
  communication: { color: 'bg-blue-100 text-blue-800', label: 'Communication' },
  payment: { color: 'bg-green-100 text-green-800', label: 'Payment' },
  analytics: { color: 'bg-purple-100 text-purple-800', label: 'Analytics' },
  security: { color: 'bg-red-100 text-red-800', label: 'Security' },
  marketing: { color: 'bg-yellow-100 text-yellow-800', label: 'Marketing' },
  integration: { color: 'bg-indigo-100 text-indigo-800', label: 'Integration' },
  productivity: { color: 'bg-pink-100 text-pink-800', label: 'Productivity' },
  other: { color: 'bg-gray-100 text-gray-800', label: 'Other' },
};

export default function MarketplacePage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [filteredAddons, setFilteredAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, free, premium
  const [installedFilter, setInstalledFilter] = useState('all'); // all, installed, not_installed
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    loadAddons();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [addons, searchTerm, categoryFilter, typeFilter, installedFilter]);

  const loadAddons = async () => {
    try {
      setIsLoading(true);
      const response = await marketplaceAPI.listAddons();
      setAddons(response.data);
    } catch (error) {
      console.error('Failed to load addons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...addons];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(addon => 
        addon.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(addon => addon.category === categoryFilter);
    }
    
    // Type filter
    if (typeFilter === 'free') {
      filtered = filtered.filter(addon => !addon.is_premium);
    } else if (typeFilter === 'premium') {
      filtered = filtered.filter(addon => addon.is_premium);
    }
    
    // Installed filter
    if (installedFilter === 'installed') {
      filtered = filtered.filter(addon => addon.is_installed);
    } else if (installedFilter === 'not_installed') {
      filtered = filtered.filter(addon => !addon.is_installed);
    }
    
    setFilteredAddons(filtered);
  };

  const handleInstall = async (addonId: string, addonName: string) => {
    if (!confirm(`Install "${addonName}"?\n\nThis will:\n- Download and add plugin files\n- Create database tables\n- Add new routes\n\nYou'll need to restart Next.js dev server after installation.`)) return;
    
    try {
      setInstalling(addonId);
      await marketplaceAPI.install(addonId);
      await loadAddons();
      alert(`✅ "${addonName}" installed successfully!\n\n🔄 IMPORTANT: Restart Next.js dev server:\n\n1. Go to your terminal running "npm run dev"\n2. Press Ctrl+C to stop\n3. Run "npm run dev" again\n4. Wait 10 seconds for compilation\n5. Then refresh your browser\n\n📁 Files were added to /app/(dashboard)/ directory`);
    } catch (error: any) {
      console.error('Failed to install addon:', error);
      alert(error.response?.data?.detail || 'Failed to install addon');
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (addonId: string, addonName: string) => {
    if (!confirm(`Uninstall "${addonName}"?\n\nThis will:\n- Delete plugin files\n- Drop database tables\n- Remove routes\n\nYou'll need to restart Next.js dev server after uninstallation.`)) return;
    
    try {
      setInstalling(addonId);
      await marketplaceAPI.uninstall(addonId);
      await loadAddons();
      alert(`✅ "${addonName}" uninstalled successfully!\n\n🔄 IMPORTANT: Restart Next.js dev server:\n\n1. Go to your terminal running "npm run dev"\n2. Press Ctrl+C to stop\n3. Run "npm run dev" again\n4. Wait 5-10 seconds\n5. /support/chats will be 404 (truly gone!)\n\n📁 Files were removed from /app/(dashboard)/ directory`);
    } catch (error: any) {
      console.error('Failed to uninstall addon:', error);
      alert(error.response?.data?.detail || 'Failed to uninstall addon');
    } finally {
      setInstalling(null);
    }
  };

  const renderRating = (rating: number, count: number) => {
    return (
      <div className="flex items-center">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            i < Math.round(rating) ? (
              <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon key={i} className="h-4 w-4 text-gray-300" />
            )
          ))}
        </div>
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)} ({count})
        </span>
      </div>
    );
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
            <p className="mt-2 text-sm text-gray-600">
              Enhance your system with powerful addons and extensions
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search addons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={installedFilter}
                onChange={(e) => setInstalledFilter(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Addons</option>
                <option value="installed">Installed</option>
                <option value="not_installed">Not Installed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Addons Grid */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading marketplace...</p>
            </div>
          ) : filteredAddons.length === 0 ? (
            <div className="text-center py-12">
              <PuzzlePieceIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No addons found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAddons.map((addon) => (
                <div
                  key={addon.id}
                  className={`relative rounded-lg border-2 ${
                    addon.is_installed ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  } p-6 hover:shadow-lg transition-all`}
                >
                  {/* Addon Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-4xl mr-3">{addon.icon || '📦'}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{addon.display_name}</h3>
                        <p className="text-xs text-gray-500">v{addon.version}</p>
                      </div>
                    </div>
                    {addon.is_installed && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Installed
                      </span>
                    )}
                  </div>

                  {/* Category and Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryConfig[addon.category]?.color || categoryConfig.other.color}`}>
                      {categoryConfig[addon.category]?.label || 'Other'}
                    </span>
                    {addon.is_premium ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                        ${addon.price}/mo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {addon.description}
                  </p>

                  {/* Features */}
                  {addon.features && addon.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Features:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {addon.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircleIcon className="h-3 w-3 mr-1 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b">
                    {renderRating(addon.rating_average, addon.rating_count)}
                    <div className="text-xs text-gray-500">
                      {addon.install_count} installs
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {addon.is_installed ? (
                      <button
                        onClick={() => handleUninstall(addon.id, addon.display_name)}
                        disabled={installing === addon.id}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {installing === addon.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            Uninstalling...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Uninstall
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInstall(addon.id, addon.display_name)}
                        disabled={installing === addon.id}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {installing === addon.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Installing...
                          </>
                        ) : (
                          <>
                            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                            {addon.is_premium ? `Install for $${addon.price}/mo` : 'Install Free'}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Author */}
                  {addon.author && (
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      by {addon.author}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

