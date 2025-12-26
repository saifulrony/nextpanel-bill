'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { plansAPI, dedicatedServersAPI } from '@/lib/api';
import {
  ShoppingCartIcon,
  CheckIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CloudIcon,
  ServerIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly?: number;
  price_quarterly?: number;
  max_accounts?: number;
  max_domains?: number;
  max_databases?: number;
  max_emails?: number;
  features?: any;
  is_active: boolean;
  is_featured?: boolean;
  sort_order?: number;
  created_at: string;
  category?: string;
  subcategory?: string;
  // VPS/Dedicated Server specific fields
  server_type?: 'vps' | 'dedicated';
  cpu_cores?: number;
  ram_gb?: number;
  storage_gb?: number;
  storage_type?: string;
  bandwidth_tb?: number;
  is_vps_product?: boolean; // Flag to identify VPS products
  image?: string; // Product image URL
  file_path?: string; // Product file path (for uploaded images)
}

// Icon mapping for different product categories
const getProductIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'hosting':
      return ServerIcon;
    case 'domains':
      return GlobeAltIcon;
    case 'security':
      return ShieldCheckIcon;
    case 'email':
      return CloudIcon;
    default:
      return ServerIcon;
  }
};

export default function ServicesPage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load both regular products and VPS/dedicated server products
        const [productsRes, categoriesRes, vpsProductsRes] = await Promise.all([
          plansAPI.list({ is_active: true }),
          plansAPI.categories().catch(() => ({ data: [] })),
          dedicatedServersAPI.listProducts({ is_active: true }).catch(() => ({ data: [] }))
        ]);
        
        // Transform regular products
        const regularProducts: Product[] = (productsRes.data || []).map((p: any) => ({
          ...p,
          id: String(p.id),
          is_vps_product: false,
        }));
        
        // Transform VPS/dedicated server products to match Product interface
        const vpsProducts: Product[] = (vpsProductsRes.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price_monthly: p.price_monthly || 0,
          price_yearly: p.price_yearly || null,
          price_quarterly: p.price_quarterly || null,
          is_active: p.is_active,
          category: 'server',
          subcategory: p.server_type === 'vps' ? 'vps' : 'dedicated',
          server_type: p.server_type,
          cpu_cores: p.cpu_cores,
          ram_gb: p.ram_gb,
          storage_gb: p.storage_gb,
          storage_type: p.storage_type,
          bandwidth_tb: p.bandwidth_tb,
          is_vps_product: true,
          features: {
            category: 'server',
            type: p.server_type,
            cpu: `${p.cpu_cores} vCPU`,
            ram: `${p.ram_gb} GB`,
            storage: `${p.storage_gb} GB ${p.storage_type || 'SSD'}`,
            bandwidth: `${p.bandwidth_tb} TB`,
          },
        }));
        
        // Combine both product types
        const allProducts = [...regularProducts, ...vpsProducts];
        setProducts(allProducts);
        
        // Extract unique categories from products
        const productCategories = [...new Set(allProducts.map((p: Product) => p.category).filter(Boolean))] as string[];
        setCategories(['all', ...productCategories]);
        
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again later.');
        // Fallback to empty array
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  );

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    
    // Calculate price based on billing cycle
    let price = product.price_monthly;
    if (billingCycle === 'yearly' && product.price_yearly) {
      price = product.price_yearly;
    } else if (billingCycle === 'monthly') {
      price = product.price_monthly;
    }
    
    // Get image URL - prioritize file_path, then image, then use placeholder
    let imageUrl = '';
    if (product.file_path) {
      // If file_path is a full URL, use it; otherwise construct the URL
      imageUrl = product.file_path.startsWith('http') 
        ? product.file_path 
        : `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001')}${product.file_path}`;
    } else if (product.image) {
      imageUrl = product.image;
    }

    const cartItem = {
      id: String(product.id),
      name: product.name,
      description: product.description,
      price: price,
      billing_cycle: billingCycle,
      category: product.category || 'general',
      type: product.is_vps_product ? 'vps_product' as const : 'product' as const,
      quantity: 1,
      image: imageUrl,
      // Include VPS-specific data if it's a VPS product
      ...(product.is_vps_product && {
        server_type: product.server_type,
        cpu_cores: product.cpu_cores,
        ram_gb: product.ram_gb,
        storage_gb: product.storage_gb,
        storage_type: product.storage_type,
        bandwidth_tb: product.bandwidth_tb,
      })
    };

    addItem(cartItem);
    
    // Simulate loading
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  const getPrice = (product: Product) => {
    if (billingCycle === 'yearly' && product.price_yearly) {
      return product.price_yearly;
    }
    return product.price_monthly;
  };

  const getBillingText = () => {
    return billingCycle === 'monthly' ? '/month' : '/year';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="mt-1 text-sm text-gray-500">Loading products...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="mt-1 text-sm text-red-500">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and purchase services for your business needs.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Category Filter */}
            <div className="flex space-x-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Billing:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const IconComponent = getProductIcon(product.category || '');
          return (
            <div
              key={product.id}
              className={`bg-white overflow-hidden shadow rounded-lg relative ${
                product.is_featured ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              {product.is_featured && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Featured
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.category || 'General'}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-600">{product.description}</p>

                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      ${getPrice(product).toFixed(2)}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      {getBillingText()}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Specifications:</h4>
                  <ul className="space-y-2">
                    {product.is_vps_product ? (
                      <>
                        <li className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          CPU: {product.cpu_cores} {product.cpu_cores === 1 ? 'Core' : 'Cores'}
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          RAM: {product.ram_gb} GB
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          Storage: {product.storage_gb} GB {product.storage_type || 'SSD'}
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          Bandwidth: {product.bandwidth_tb} TB/month
                        </li>
                        <li className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          Type: {product.server_type === 'vps' ? 'VPS' : 'Dedicated Server'}
                        </li>
                      </>
                    ) : (
                      <>
                        {product.max_accounts !== undefined && (
                          <li className="flex items-center text-sm text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            Max Accounts: {product.max_accounts}
                          </li>
                        )}
                        {product.max_domains !== undefined && (
                          <li className="flex items-center text-sm text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            Max Domains: {product.max_domains}
                          </li>
                        )}
                        {product.max_databases !== undefined && (
                          <li className="flex items-center text-sm text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            Max Databases: {product.max_databases}
                          </li>
                        )}
                        {product.max_emails !== undefined && (
                          <li className="flex items-center text-sm text-gray-600">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            Max Emails: {product.max_emails}
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product.id}
                    className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      addingToCart === product.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {addingToCart === product.id ? (
                      <>
                        <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="h-4 w-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}
    </div>
  );
}
