'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { domainPricingAPI } from '@/lib/api';
import { 
  Cog6ToothIcon as CogIcon, 
  PlusIcon, 
  TrashIcon,
  BanknotesIcon as CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface Config {
  id: string;
  name: string;
  description?: string;
  default_markup_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function DomainPricingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [tldPricing, setTldPricing] = useState<any[]>([]);
  const [editingTld, setEditingTld] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  
  // New markup options
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage');
  const [markupValue, setMarkupValue] = useState<number>(10);
  const [sellingPrices, setSellingPricesState] = useState<{[tld: string]: number}>({});
  
  // Table functionality
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'tld' | 'wholesale' | 'selling' | 'markup'>('tld');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'calculated' | 'popular'>('all');

  // Popular TLDs list (most common domain extensions)
  const popularTlds = [
    'com', 'net', 'org', 'info', 'biz', 'co', 'io', 'dev', 'app', 'tech',
    'online', 'site', 'store', 'blog', 'news', 'tv', 'me', 'us', 'uk',
    'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se',
    'no', 'dk', 'fi', 'pl', 'cz', 'hu', 'ro', 'bg', 'hr', 'sk', 'si',
    'lt', 'lv', 'ee', 'lu', 'mt', 'cy', 'ie', 'pt', 'gr', 'jp', 'kr',
    'cn', 'in', 'sg', 'hk', 'tw', 'th', 'my', 'ph', 'id', 'vn', 'br',
    'mx', 'ar', 'cl', 'co', 'pe', 've', 'uy', 'py', 'bo', 'ec', 'cr',
    'pa', 'gt', 'hn', 'sv', 'ni', 'cu', 'do', 'ht', 'jm', 'tt', 'bb',
    'ag', 'lc', 'vc', 'gd', 'kn', 'dm', 'bs', 'bz', 'sr', 'gy', 'fk',
    'za', 'ng', 'ke', 'eg', 'ma', 'tn', 'dz', 'ly', 'sd', 'et', 'gh',
    'ci', 'sn', 'ml', 'bf', 'ne', 'td', 'cm', 'cf', 'gq', 'ga', 'cg',
    'cd', 'ao', 'zm', 'zw', 'bw', 'na', 'sz', 'ls', 'mg', 'mu', 'sc',
    'km', 'dj', 'so', 'er', 'ss', 'rw', 'bi', 'ug', 'tz', 'mw', 'mz',
    're', 'yt'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configResponse, tldResponse] = await Promise.all([
        domainPricingAPI.getConfig(),
        domainPricingAPI.getTLDPricing()
      ]);

      if (configResponse.data) {
        setConfig(configResponse.data);
        // Set the markup value from the config
        setMarkupValue(configResponse.data.default_markup_percentage || 20);
      }

      if (tldResponse.data && Array.isArray(tldResponse.data)) {
        setTldPricing(tldResponse.data);
      }
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };



  const autoFetchPrices = async () => {
    if (!config || !config.id) {
      toast.error('No configuration found');
      return;
    }

    setIsFetchingPrices(true);
    try {
      const response = await domainPricingAPI.autoFetchPrices();
      
      if (response.data && response.data.success) {
        toast.success(`Successfully fetched prices for ${response.data.data.total_tlds} TLDs`);
        // Reload data to show updated prices
        await loadData();
      } else {
        throw new Error('Failed to fetch prices');
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Failed to auto-fetch prices from API');
    } finally {
      setIsFetchingPrices(false);
    }
  };

  const startEditing = (tld: string, currentPrice: number) => {
    setEditingTld(tld);
    setEditingPrice(currentPrice.toString());
  };

  const cancelEditing = () => {
    setEditingTld(null);
    setEditingPrice('');
  };

  const saveInlinePrice = async (tld: string) => {
    if (!config || !config.id) {
      toast.error('No configuration found');
      return;
    }

    const price = parseFloat(editingPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      // Find the TLD pricing record
      const tldRecord = tldPricing.find(t => t.tld === tld);
      if (!tldRecord) {
        toast.error('TLD not found');
        return;
      }

      // Update the custom price
      const response = await domainPricingAPI.updateTLDPricing(tldRecord.id, {
        custom_price: price
      });

      if (response.data) {
        toast.success(`Updated .${tld} price to $${price.toFixed(2)}`);
        await loadData(); // Reload data to show updated prices
        cancelEditing();
      }
    } catch (error) {
      console.error('Error updating TLD price:', error);
      toast.error('Failed to update TLD price');
    }
  };


  const setSellingPrices = async () => {
    if (!config || !config.id) {
      toast.error('No configuration found');
      return;
    }

    if (markupValue < 0) {
      toast.error('Markup value must be positive');
      return;
    }

    try {
      // Update the configuration with new markup percentage
      if (markupType === 'percentage') {
        await domainPricingAPI.updateConfig({
          default_markup_percentage: markupValue
        });
      }

      const newSellingPrices: {[tld: string]: number} = {};
      const bulkUpdateData: any[] = [];
      
      tldPricing.forEach(tld => {
        let sellingPrice: number;
        
        if (markupType === 'percentage') {
          sellingPrice = tld.wholesale_price * (1 + markupValue / 100);
        } else {
          sellingPrice = tld.wholesale_price + markupValue;
        }
        
        newSellingPrices[tld.tld] = sellingPrice;
        
        // Prepare data for bulk update
        bulkUpdateData.push({
          tld: tld.tld,
          custom_price: sellingPrice,
          wholesale_price: tld.wholesale_price,
          markup_percentage: markupType === 'percentage' ? markupValue : null
        });
      });
      
      // Save the calculated selling prices as custom prices for each TLD
      await domainPricingAPI.bulkUpdatePricing({
        tld_prices: bulkUpdateData
      });
      
      setSellingPricesState(newSellingPrices);
      
      // Reload the data to get updated prices from backend
      await loadData();
      
      toast.success(`Selling prices calculated and saved for ${tldPricing.length} TLDs using ${markupType === 'percentage' ? `${markupValue}%` : `$${markupValue}`} markup`);
    } catch (error) {
      console.error('Error setting selling prices:', error);
      toast.error('Failed to set selling prices');
    }
  };

  const getFilteredAndSortedTlds = () => {
    let filtered = tldPricing;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tld => 
        tld.tld.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tld => {
        if (filterType === 'custom') {
          return tld.custom_price !== null;
        } else if (filterType === 'calculated') {
          return tld.custom_price === null;
        } else if (filterType === 'popular') {
          return popularTlds.includes(tld.tld);
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      // If popular filter is selected, rank by popularity first
      if (filterType === 'popular') {
        const aPopularity = popularTlds.indexOf(a.tld);
        const bPopularity = popularTlds.indexOf(b.tld);
        
        // If both are in popular list, sort by popularity rank
        if (aPopularity !== -1 && bPopularity !== -1) {
          comparison = aPopularity - bPopularity;
        } else if (aPopularity !== -1) {
          comparison = -1; // a comes first
        } else if (bPopularity !== -1) {
          comparison = 1; // b comes first
        } else {
          // Neither is popular, use regular sorting
          comparison = a.tld.localeCompare(b.tld);
        }
      } else {
        // Regular sorting when not using popular filter
        switch (sortBy) {
          case 'tld':
            comparison = a.tld.localeCompare(b.tld);
            break;
          case 'wholesale':
            comparison = a.wholesale_price - b.wholesale_price;
            break;
          case 'selling':
            const aSelling = sellingPrices[a.tld] || (a.custom_price ? a.custom_price : (a.wholesale_price * (1 + (a.markup_percentage || 20) / 100)));
            const bSelling = sellingPrices[b.tld] || (b.custom_price ? b.custom_price : (b.wholesale_price * (1 + (b.markup_percentage || 20) / 100)));
            comparison = aSelling - bSelling;
            break;
          case 'markup':
            const aSellingPrice = sellingPrices[a.tld] || (a.custom_price ? a.custom_price : (a.wholesale_price * (1 + (a.markup_percentage || 20) / 100)));
            const bSellingPrice = sellingPrices[b.tld] || (b.custom_price ? b.custom_price : (b.wholesale_price * (1 + (b.markup_percentage || 20) / 100)));
            const aMarkup = ((aSellingPrice - a.wholesale_price) / a.wholesale_price) * 100;
            const bMarkup = ((bSellingPrice - b.wholesale_price) / b.wholesale_price) * 100;
            comparison = aMarkup - bMarkup;
            break;
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const handleSort = (column: 'tld' | 'wholesale' | 'selling' | 'markup') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Domain Pricing Management</h1>
          <p className="mt-2 text-gray-600">Set profit percentage and custom prices for domain TLDs</p>
        </div>



        {/* Markup Options */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CogIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Markup Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markup Type
              </label>
              <select
                value={markupType}
                onChange={(e) => setMarkupType(e.target.value as 'percentage' | 'fixed')}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markup Value
              </label>
              <input
                type="number"
                value={markupValue}
                onChange={(e) => setMarkupValue(Number(e.target.value))}
                min="0"
                step={markupType === 'percentage' ? '0.1' : '0.01'}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={markupType === 'percentage' ? '10' : '5.00'}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={setSellingPrices}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center"
              >
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                Set Selling Price
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={autoFetchPrices}
                disabled={isFetchingPrices}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isFetchingPrices ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Fetching...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Auto-Fetch Prices
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <p><strong>Example:</strong> Wholesale $10 + {markupType === 'percentage' ? `${markupValue}%` : `$${markupValue}`} = ${markupType === 'percentage' ? (10 * (1 + markupValue / 100)).toFixed(2) : (10 + markupValue).toFixed(2)}</p>
          </div>
        </div>

        {/* TLD Pricing Table */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              TLD Pricing ({tldPricing.length} TLDs)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Auto-fetched wholesale prices with your profit percentage applied
            </p>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search TLDs
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search extensions..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'custom' | 'calculated' | 'popular')}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All TLDs</option>
                  <option value="popular">Popular TLDs</option>
                  <option value="custom">Custom Prices</option>
                  <option value="calculated">Calculated Prices</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'tld' | 'wholesale' | 'selling' | 'markup')}
                  className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="tld">TLD Name</option>
                  <option value="wholesale">Wholesale Price</option>
                  <option value="selling">Selling Price</option>
                  <option value="markup">Markup %</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full flex items-center justify-center pl-3 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('tld')}
                  >
                    <div className="flex items-center">
                      TLD
                      {sortBy === 'tld' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('wholesale')}
                  >
                    <div className="flex items-center">
                      Wholesale Price
                      {sortBy === 'wholesale' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('selling')}
                  >
                    <div className="flex items-center">
                      Selling Price
                      {sortBy === 'selling' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('markup')}
                  >
                    <div className="flex items-center">
                      Markup %
                      {sortBy === 'markup' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="h-4 w-4 ml-1" /> : <ArrowDownIcon className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedTlds().map((tld) => {
                  const sellingPrice = sellingPrices[tld.tld] || (tld.custom_price ? tld.custom_price : (tld.wholesale_price * (1 + (tld.markup_percentage || profitPercentage) / 100)));
                  // Calculate actual markup percentage based on selling price vs wholesale price
                  const markupPercent = ((sellingPrice - tld.wholesale_price) / tld.wholesale_price) * 100;
                  
                  return (
                    <tr key={tld.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        .{tld.tld}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${tld.wholesale_price?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingTld === tld.tld ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-24 text-sm border-gray-300 rounded px-2 py-1"
                              step="0.01"
                              min="0"
                              autoFocus
                            />
                            <button
                              onClick={() => saveInlinePrice(tld.tld)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="text-sm font-semibold text-green-600 cursor-pointer hover:text-green-700"
                            onClick={() => startEditing(tld.tld, sellingPrice)}
                            title="Click to edit price"
                          >
                            ${sellingPrice.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {markupPercent.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tld.custom_price ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Custom
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Calculated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => startEditing(tld.tld, sellingPrice)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {getFilteredAndSortedTlds().length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No TLDs found matching your criteria</div>
              {tldPricing.length === 0 && (
                <button
                  onClick={autoFetchPrices}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  Fetch Prices
                </button>
              )}
            </div>
          )}
        </div>


        {/* Summary */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Auto-Fetch:</strong> Click "Auto-Fetch Prices" to get wholesale prices from Namecheap API</li>
            <li>• <strong>Markup Options:</strong> Set percentage or fixed amount markup for all TLDs</li>
            <li>• <strong>Set Selling Price:</strong> Apply markup to calculate selling prices for all TLDs</li>
            <li>• <strong>Inline Editing:</strong> Click on any selling price in the table to edit it directly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}