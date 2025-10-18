'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();
  const { getItemCount, addItem, updateQuantity, items } = useCart();
  const [headerDesign, setHeaderDesign] = useState<{
    selectedDesign: string;
    elements: any[];
    deviceType: string;
    timestamp: string;
  } | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [hasCustomHomepage, setHasCustomHomepage] = useState<boolean | null>(null);
  const [checkingHomepage, setCheckingHomepage] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCheckingHomepage(false);
    }, 1000);
  }, []);

  // Show loading state while checking for custom homepage
  if (checkingHomepage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If there's a custom homepage, render it
  if (hasCustomHomepage) {
    return (
      <div>
        <div>Custom Homepage</div>
      </div>
    );
  }

  // Otherwise, render the default homepage
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Custom Header */}
      <Header headerDesign={headerDesign} />

      {/* Enhanced Domain Search */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Find Your Perfect Domain
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Search and register domains at wholesale prices. Get started with NextPanel hosting and manage your entire web presence in one place.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-blue-600 text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Fast & Reliable</h3>
            <p className="text-gray-600">
              High-performance hosting infrastructure designed to handle 10,000+ concurrent users.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-blue-600 text-3xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Easy Payments</h3>
            <p className="text-gray-600">
              Secure payment processing with Stripe. Monthly or annual billing options available.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="text-blue-600 text-3xl mb-4">🌐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Domain Registration</h3>
            <p className="text-gray-600">
              Register domains at wholesale prices starting from $8.99/year with full management.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
