'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { plansAPI } from '@/lib/api';
import { ArrowLeftIcon, ShoppingCartIcon, CheckIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';

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
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      const productId = params.id as string;
      
      // Check if it's a server product
      if (productId.startsWith('server-')) {
        const serverId = productId.replace('server-', '');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
          (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
        
        const response = await fetch(`${apiUrl}/api/v1/dedicated-servers/products/${serverId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Server product not found');
          }
          throw new Error('Failed to load server product');
        }
        
        const serverProduct = await response.json();
        
        // Transform server product to match Product interface
        setProduct({
          id: `server-${serverProduct.id}`,
          name: serverProduct.name,
          description: serverProduct.description || '',
          price_monthly: serverProduct.price_monthly,
          price_yearly: serverProduct.price_yearly || serverProduct.price_monthly * 12,
          max_accounts: 0,
          max_domains: 0,
          max_databases: 0,
          max_emails: 0,
          features: {
            category: 'server',
            server_type: serverProduct.server_type,
            cpu_cores: serverProduct.cpu_cores,
            ram_gb: serverProduct.ram_gb,
            storage_gb: serverProduct.storage_gb,
            storage_type: serverProduct.storage_type,
            bandwidth_tb: serverProduct.bandwidth_tb,
            provisioning_type: serverProduct.provisioning_type,
          },
          is_active: serverProduct.is_active,
          is_featured: false,
        });
      } else {
        // Regular product
        const response = await plansAPI.get(productId);
        setProduct(response.data);
      }
    } catch (err: any) {
      console.error('Error loading product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price_monthly,
      billing_cycle: 'monthly',
      category: product.features?.category || 'product',
      type: 'product' as const,
    };

    addItem(cartItem);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/shop')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const category = product.features?.category || 'other';
  const isServerProduct = product.id.startsWith('server-');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image/Icon Section */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-12">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {isServerProduct ? '🖥️' : category === 'hosting' ? '☁️' : category === 'domain' ? '🌐' : '📦'}
                </div>
                <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-lg text-gray-600 mb-6">{product.description}</p>

              {/* Pricing */}
              <div className="mb-6 p-6 bg-indigo-50 rounded-lg">
                <div className="flex items-baseline space-x-4 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ${product.price_monthly?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-xl text-gray-500">/month</span>
                </div>
                <div className="text-sm text-gray-600">
                  or ${product.price_yearly?.toFixed(2) || '0.00'}/year
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                <div className="space-y-2">
                  {!isServerProduct && (
                    <>
                      {product.max_accounts > 0 && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.max_accounts === 999999 ? 'Unlimited' : product.max_accounts} Hosting Account{product.max_accounts !== 1 ? 's' : ''}
                        </div>
                      )}
                      {product.max_domains > 0 && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.max_domains === 999999 ? 'Unlimited' : product.max_domains} Domain{product.max_domains !== 1 ? 's' : ''}
                        </div>
                      )}
                      {product.max_databases > 0 && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.max_databases === 999999 ? 'Unlimited' : product.max_databases} Database{product.max_databases !== 1 ? 's' : ''}
                        </div>
                      )}
                      {product.max_emails > 0 && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.max_emails === 999999 ? 'Unlimited' : product.max_emails} Email Account{product.max_emails !== 1 ? 's' : ''}
                        </div>
                      )}
                    </>
                  )}
                  
                  {isServerProduct && product.features && (
                    <>
                      {product.features.cpu_cores && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.features.cpu_cores} CPU Core{product.features.cpu_cores !== 1 ? 's' : ''}
                        </div>
                      )}
                      {product.features.ram_gb && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.features.ram_gb} GB RAM
                        </div>
                      )}
                      {product.features.storage_gb && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.features.storage_gb} GB {product.features.storage_type || 'Storage'}
                        </div>
                      )}
                      {product.features.bandwidth_tb && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {product.features.bandwidth_tb} TB Bandwidth
                        </div>
                      )}
                      {product.features.server_type && (
                        <div className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          Type: {product.features.server_type}
                        </div>
                      )}
                    </>
                  )}

                  {/* Additional features from JSON */}
                  {product.features && Object.entries(product.features).map(([key, value]) => {
                    if (key === 'category' || key === 'server_type' || key === 'cpu_cores' || 
                        key === 'ram_gb' || key === 'storage_gb' || key === 'bandwidth_tb' || 
                        key === 'storage_type' || key === 'provisioning_type' || 
                        typeof value === 'object') {
                      return null;
                    }
                    if (value && String(value) !== 'false' && String(value) !== '0') {
                      return (
                        <div key={key} className="flex items-center text-gray-700">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {String(value)}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.is_active}
                className={`w-full px-6 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : product.is_active
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckIcon className="h-6 w-6 mr-2" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="h-6 w-6 mr-2" />
                    Add to Cart
                  </>
                )}
              </button>

              {!product.is_active && (
                <p className="mt-2 text-sm text-red-600 text-center">
                  This product is currently unavailable
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

