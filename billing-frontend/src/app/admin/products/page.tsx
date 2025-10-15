'use client';

import { useState, useEffect } from 'react';
import { plansAPI } from '@/lib/api';
import { getDemoData } from '@/lib/demoData';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ServerIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CircleStackIcon,
  BoltIcon,
  StarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import CreateProductModal from '@/components/products/CreateProductModal';
import EditProductModal from '@/components/products/EditProductModal';
import ProductDetailsModal from '@/components/products/ProductDetailsModal';

interface Product {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_accounts: number;
  max_domains: number;
  max_databases: number;
  max_emails: number;
  features: any;
  is_active: boolean;
  is_featured?: boolean;
  sort_order?: number;
  created_at: string;
}

interface Stats {
  total_active_plans: number;
  plans_by_category: Record<string, number>;
  average_price: number;
  min_price: number;
  max_price: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active'); // Default: show only active products

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      try {
        const [productsRes, categoriesRes, statsRes] = await Promise.all([
          plansAPI.list(),
          plansAPI.categories(),
          plansAPI.stats().catch(() => ({ data: null })),
        ]);
        
        // Check if API returned empty data (no products in database)
        if (productsRes.data && productsRes.data.length === 0) {
          console.log('📦 API returned empty data, using demo products...');
          throw new Error('No products in database');
        }
        
        setProducts(productsRes.data);
        setCategories(categoriesRes.data.categories || []);
        setStats(statsRes.data);
        setIsUsingDemoData(false);
        console.log('✅ Products loaded from API');
      } catch (apiError) {
        console.log('📦 API not available, using demo data...');
        
        // Use demo data when API is not available
        const demoProducts = getDemoData('products');
        const demoCategories = [
          { id: 'hosting', name: 'Hosting' },
          { id: 'domain', name: 'Domain' },
          { id: 'ssl', name: 'SSL' },
          { id: 'email', name: 'Email' }
        ];
        const demoStats = {
          total_active_plans: demoProducts.length,
          plans_by_category: {
            hosting: 3,
            domain: 1,
            ssl: 1,
            email: 1
          },
          average_price: 29.99,
          min_price: 4.99,
          max_price: 99.99
        };
        
        setProducts(demoProducts);
        setCategories(demoCategories);
        setStats(demoStats);
        setIsUsingDemoData(true);
        console.log('✅ Demo products loaded');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.features?.category === categoryFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => 
        statusFilter === 'active' ? p.is_active : !p.is_active
      );
    }
    
    setFilteredProducts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? It will be marked as inactive.')) {
      return;
    }
    
    try {
      await plansAPI.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await plansAPI.update(product.id, {
        is_featured: !product.is_featured,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to update featured status:', error);
      alert('Failed to update featured status');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const newStatus = !product.is_active;
      
      // Update the product status
      await plansAPI.update(product.id, {
        is_active: newStatus,
      });
      
      // Reload all data to get fresh counts and products
      await loadData();
      
      // Show feedback
      const message = newStatus 
        ? `✅ "${product.name}" is now ACTIVE and visible to customers`
        : `⚠️ "${product.name}" is now INACTIVE and hidden from customers`;
      
      // Show toast notification (brief)
      alert(message);
      
    } catch (error) {
      console.error('Failed to update active status:', error);
      alert('Failed to update active status');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      hosting: ServerIcon,
      domain: GlobeAltIcon,
      software: CodeBracketIcon,
      email: EnvelopeIcon,
      ssl: LockClosedIcon,
      backup: CircleStackIcon,
      cdn: BoltIcon,
    };
    return icons[category] || ServerIcon;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      hosting: 'bg-blue-100 text-blue-800 border-blue-200',
      domain: 'bg-green-100 text-green-800 border-green-200',
      software: 'bg-purple-100 text-purple-800 border-purple-200',
      email: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ssl: 'bg-red-100 text-red-800 border-red-200',
      backup: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      cdn: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div>
      {/* Demo Data Banner */}
      {isUsingDemoData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Demo Data Mode
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  Showing demo products including hosting plans, domain registration, SSL certificates, and email hosting.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Products Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create and manage hosting, domains, licenses, and other products
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ServerIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stats.total_active_plans}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BoltIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {Object.keys(stats.plans_by_category || {}).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CircleStackIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Average Price</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${stats.average_price?.toFixed(2) || '0.00'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <GlobeAltIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Price Range</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      ${stats.min_price?.toFixed(2)} - ${stats.max_price?.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter - Professional Toggle with Counts */}
            <div className="flex items-center">
              <div className="inline-flex rounded-md shadow-sm border border-gray-300 bg-white" role="group">
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  Active ({products.filter(p => p.is_active).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('inactive')}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border-l border-r border-gray-300 focus:z-10 focus:outline-none transition-colors ${
                    statusFilter === 'inactive'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <EyeIcon className="h-4 w-4 mr-1.5" />
                  Inactive ({products.filter(p => !p.is_active).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All ({products.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating a new product'}
          </p>
          {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Product
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const category = product.features?.category || 'other';
            const CategoryIcon = getCategoryIcon(category);
            
            return (
              <div
                key={product.id}
                className={`bg-white overflow-hidden shadow-sm rounded-lg border-2 transition-all ${
                  product.is_active 
                    ? 'border-gray-200 hover:shadow-md hover:border-indigo-200' 
                    : 'border-gray-300 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="p-5 relative">
                  {/* Inactive Overlay */}
                  {!product.is_active && (
                    <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      INACTIVE
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${getCategoryColor(category)} ${!product.is_active ? 'opacity-50' : ''}`}>
                        <CategoryIcon className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-lg font-medium ${product.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            product.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active ? '✓ Active' : '✕ Inactive'}
                          </span>
                          {product.is_featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFeatured(product)}
                      className={`p-2 rounded-lg hover:bg-gray-100 transition ${
                        product.is_featured ? 'text-yellow-500' : 'text-gray-400'
                      }`}
                      title={product.is_featured ? 'Remove from homepage' : 'Feature on homepage'}
                    >
                      {product.is_featured ? (
                        <StarIconSolid className="h-6 w-6" />
                      ) : (
                        <StarIcon className="h-6 w-6" />
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Pricing */}
                  <div className="mt-4 flex items-baseline space-x-4">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.price_monthly}
                      </span>
                      <span className="text-sm text-gray-500">/mo</span>
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-gray-700">
                        ${product.price_yearly}
                      </span>
                      <span className="text-sm text-gray-500">/yr</span>
                    </div>
                  </div>

                  {/* Features Summary */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {product.max_accounts > 0 && (
                      <div>Accounts: {product.max_accounts}</div>
                    )}
                    {product.max_domains > 0 && (
                      <div>Domains: {product.max_domains}</div>
                    )}
                    {product.max_databases > 0 && (
                      <div>Databases: {product.max_databases}</div>
                    )}
                    {product.max_emails > 0 && (
                      <div>Emails: {product.max_emails}</div>
                    )}
                  </div>

                  {/* Actions - Compact Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(product)}
                        className="flex-1 inline-flex items-center justify-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        title="View full details"
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 inline-flex items-center justify-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        title="Edit product details"
                      >
                        <PencilIcon className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 border text-xs font-medium rounded transition-colors ${
                          product.is_active
                            ? 'border-orange-300 text-orange-700 bg-white hover:bg-orange-50'
                            : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                        }`}
                        title={product.is_active ? 'Deactivate (hide from customers)' : 'Activate (show to customers)'}
                      >
                        {product.is_active ? (
                          <>
                            <EyeIcon className="h-3.5 w-3.5 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-3.5 w-3.5 mr-1" />
                            Show
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 border border-red-300 text-red-700 bg-white hover:bg-red-50 rounded transition-colors"
                        title="Delete product"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
          categories={categories}
        />
      )}

      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
            loadData();
          }}
          categories={categories}
        />
      )}

      {showDetailsModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />
      )}
    </div>
  );
}

