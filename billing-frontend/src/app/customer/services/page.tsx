'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
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

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  category: string;
  features: string[];
  isPopular?: boolean;
  isNew?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const services: Service[] = [
  {
    id: '1',
    name: 'Basic Hosting',
    description: 'Perfect for small websites and personal projects',
    price: 9.99,
    billingCycle: 'monthly',
    category: 'hosting',
    features: ['10GB Storage', '100GB Bandwidth', '1 Domain', 'Email Support'],
    icon: ServerIcon,
  },
  {
    id: '2',
    name: 'Professional Hosting',
    description: 'Great for business websites and growing projects',
    price: 19.99,
    billingCycle: 'monthly',
    category: 'hosting',
    features: ['50GB Storage', '500GB Bandwidth', '5 Domains', 'Priority Support', 'SSL Certificate'],
    isPopular: true,
    icon: CloudIcon,
  },
  {
    id: '3',
    name: 'Premium Hosting',
    description: 'High-performance hosting for demanding applications',
    price: 39.99,
    billingCycle: 'monthly',
    category: 'hosting',
    features: ['100GB Storage', 'Unlimited Bandwidth', 'Unlimited Domains', '24/7 Support', 'Free SSL', 'CDN'],
    icon: ShieldCheckIcon,
  },
  {
    id: '4',
    name: 'Domain Registration',
    description: 'Register and manage your domain names',
    price: 12.99,
    billingCycle: 'yearly',
    category: 'domains',
    features: ['1 Year Registration', 'DNS Management', 'Domain Privacy', 'Auto-renewal'],
    icon: GlobeAltIcon,
  },
  {
    id: '5',
    name: 'SSL Certificate',
    description: 'Secure your website with SSL encryption',
    price: 29.99,
    billingCycle: 'yearly',
    category: 'security',
    features: ['256-bit Encryption', 'Trust Seal', 'Mobile Compatible', 'Auto-installation'],
    icon: ShieldCheckIcon,
  },
  {
    id: '6',
    name: 'Email Hosting',
    description: 'Professional email hosting for your business',
    price: 4.99,
    billingCycle: 'monthly',
    category: 'email',
    features: ['5GB Mailbox', 'Webmail Access', 'Mobile Sync', 'Spam Protection'],
    icon: ServerIcon,
  },
];

const categories = ['all', 'hosting', 'domains', 'security', 'email'];

export default function ServicesPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const filteredServices = services.filter(service => 
    selectedCategory === 'all' || service.category === selectedCategory
  );

  const handleAddToCart = async (service: Service) => {
    setAddingToCart(service.id);
    
    const cartItem = {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.price,
      billing_cycle: service.billingCycle,
      category: service.category,
      type: 'product' as const,
      quantity: 1
    };

    addItem(cartItem);
    
    // Simulate loading
    setTimeout(() => {
      setAddingToCart(null);
    }, 1000);
  };

  const getPrice = (service: Service) => {
    if (service.billingCycle === 'yearly' && billingCycle === 'monthly') {
      return (service.price / 12).toFixed(2);
    }
    if (service.billingCycle === 'monthly' && billingCycle === 'yearly') {
      return (service.price * 12).toFixed(2);
    }
    return service.price.toFixed(2);
  };

  const getBillingText = (service: Service) => {
    if (service.billingCycle === 'yearly' && billingCycle === 'monthly') {
      return '/month (billed yearly)';
    }
    if (service.billingCycle === 'monthly' && billingCycle === 'yearly') {
      return '/year (billed monthly)';
    }
    return service.billingCycle === 'monthly' ? '/month' : '/year';
  };

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

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => {
          const IconComponent = service.icon;
          return (
            <div
              key={service.id}
              className={`bg-white overflow-hidden shadow rounded-lg relative ${
                service.isPopular ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              {service.isPopular && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Most Popular
                </div>
              )}
              {service.isNew && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-br-lg">
                  New
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.category}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-600">{service.description}</p>

                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      ${getPrice(service)}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      {getBillingText(service)}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handleAddToCart(service)}
                    disabled={addingToCart === service.id}
                    className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      addingToCart === service.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {addingToCart === service.id ? (
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
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try selecting a different category or check back later.
          </p>
        </div>
      )}
    </div>
  );
}
