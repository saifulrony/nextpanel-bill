'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersAPI, plansAPI } from '@/lib/api';
import {
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Software {
  id: string;
  name: string;
  description: string;
  version: string;
  file_size: string;
  download_url: string;
  category: string;
  release_date: string;
  last_updated: string;
  status: 'available' | 'downloading' | 'downloaded';
  license_key?: string;
  installation_guide?: string;
}

export default function MySoftwaresPage() {
  const { user } = useAuth();
  const [softwares, setSoftwares] = useState<Software[]>([]);
  const [filteredSoftwares, setFilteredSoftwares] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const loadSoftwares = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch completed orders
        const ordersResponse = await ordersAPI.list({ status: 'completed' });
        const orders = ordersResponse.data || [];
        
        // Extract software products from order items
        const softwareItems: Software[] = [];
        const processedProductIds = new Set<string>();
        
        for (const order of orders) {
          if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
              // Check if item is a software product
              const isSoftware = item.type === 'software' || 
                                item.category === 'software' ||
                                (item.product_id && !processedProductIds.has(item.product_id));
              
              if (isSoftware && item.product_id) {
                processedProductIds.add(item.product_id);
                
                try {
                  // Fetch product details to get file attachment
                  const productResponse = await plansAPI.get(item.product_id);
                  const product = productResponse.data;
                  
                  if (product && product.features?.category === 'software') {
                    const fileInfo = product.features?.download_file;
                    const apiUrl = typeof window !== 'undefined' 
                      ? `http://${window.location.hostname}:8001`
                      : 'http://localhost:8001';
                    
                    softwareItems.push({
                      id: product.id,
                      name: product.name || item.description || 'Software Product',
                      description: product.description || item.description || '',
                      version: product.features?.version || '1.0.0',
                      file_size: fileInfo ? `${(fileInfo.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
                      download_url: fileInfo ? `${apiUrl}${fileInfo.file_path}` : '',
                      category: product.features?.subcategory || 'Software',
                      release_date: product.created_at || new Date().toISOString(),
                      last_updated: product.updated_at || product.created_at || new Date().toISOString(),
                      status: fileInfo ? 'available' : 'unavailable',
                      license_key: item.license_key || undefined,
                      installation_guide: product.features?.installation_guide || undefined,
                    });
                  }
                } catch (err) {
                  console.error(`Failed to load product ${item.product_id}:`, err);
                }
              }
            }
          }
        }
        
        setSoftwares(softwareItems);
        setFilteredSoftwares(softwareItems);
        
      } catch (err) {
        console.error('Failed to load softwares:', err);
        setError('Failed to load your software downloads. Please try again later.');
        setSoftwares([]);
        setFilteredSoftwares([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSoftwares();
    }
  }, [user]);

  useEffect(() => {
    let filtered = softwares;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(software =>
        software.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        software.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        software.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(software => software.category === selectedCategory);
    }

    setFilteredSoftwares(filtered);
  }, [searchQuery, selectedCategory, softwares]);

  const handleDownload = async (software: Software) => {
    try {
      if (!software.download_url) {
        alert('Download file is not available for this software.');
        return;
      }
      
      setDownloadingId(software.id);
      
      // Get auth token for authenticated download
      const token = localStorage.getItem('access_token');
      
      // Fetch the file with authentication
      const response = await fetch(software.download_url, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = software.name.replace(/\s+/g, '-').toLowerCase() + '-' + software.version;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      // Update status
      setSoftwares(prev => prev.map(s => 
        s.id === software.id ? { ...s, status: 'downloaded' as const } : s
      ));
      
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download software. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(softwares.map(s => s.category)))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'downloading':
        return 'bg-blue-100 text-blue-800';
      case 'downloaded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">My Software Downloads</h1>
            <p className="mt-1 text-sm text-gray-500">Loading your software downloads...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Software Downloads</h1>
                <p className="mt-1 text-sm text-red-500">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ComputerDesktopIcon className="h-8 w-8 mr-3 text-indigo-600" />
                My Software Downloads
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Download and manage your purchased software
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search software..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Software List */}
      {filteredSoftwares.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-12 text-center">
            <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No software found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'You don\'t have any software downloads available yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSoftwares.map((software) => (
            <div key={software.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <ComputerDesktopIcon className="h-6 w-6 text-indigo-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">{software.name}</h3>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(software.status)}`}>
                        {software.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{software.description}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="font-medium">Version:</span>
                        <span className="ml-2">{software.version}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Size:</span>
                        <span className="ml-2">{software.file_size}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Category:</span>
                        <span className="ml-2">{software.category}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Updated:</span>
                        <span className="ml-2">{new Date(software.last_updated).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {software.license_key && (
                      <div className="mt-4 p-3 bg-indigo-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-indigo-900">License Key:</span>
                            <code className="ml-2 text-sm text-indigo-700 font-mono">{software.license_key}</code>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  await navigator.clipboard.writeText(software.license_key || '');
                                  alert('License key copied to clipboard!');
                                } else {
                                  // Fallback for browsers that don't support clipboard API
                                  const textArea = document.createElement('textarea');
                                  textArea.value = software.license_key || '';
                                  textArea.style.position = 'fixed';
                                  textArea.style.left = '-999999px';
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textArea);
                                  alert('License key copied to clipboard!');
                                }
                              } catch (err) {
                                console.error('Failed to copy license key:', err);
                                alert('Failed to copy license key. Please copy it manually.');
                              }
                            }}
                            className="ml-4 text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    {software.installation_guide && (
                      <div className="mt-3">
                        <a
                          href={software.installation_guide}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          View Installation Guide →
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col items-end">
                    <button
                      onClick={() => handleDownload(software)}
                      disabled={downloadingId === software.id}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        downloadingId === software.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      }`}
                    >
                      {downloadingId === software.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Download Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Total Software</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{softwares.length}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Available</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {softwares.filter(s => s.status === 'available').length}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Downloaded</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">
                {softwares.filter(s => s.status === 'downloaded').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

