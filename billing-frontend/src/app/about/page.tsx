'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultPages } from '@/contexts/DefaultPageContext';
import { ArrowLeftIcon, ShoppingCartIcon, UserGroupIcon, ShieldCheckIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { DynamicPageRenderer } from '@/components/page-builder/DynamicPageRenderer';

export default function AboutPage() {
  const router = useRouter();
  const { getItemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { defaultPageConfig, isLoading: isLoadingConfig } = useDefaultPages();

  // Check if a custom about page is configured
  const customAboutPage = defaultPageConfig?.about;

  // Show loading while checking for custom page configuration
  if (isLoadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading about page...</p>
        </div>
      </div>
    );
  }

  // If custom about page is configured, render it
  if (customAboutPage) {
    console.log('Rendering custom about page:', customAboutPage);
    return <DynamicPageRenderer slug={customAboutPage} fallbackComponent={<DefaultAboutPage />} />;
  }

  // Default about page component
  function DefaultAboutPage() {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Home
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Cart Button */}
                <button
                  onClick={() => router.push('/cart')}
                  className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getItemCount()}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-medium">{user?.email || 'User'}</p>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">About NextPanel Billing</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We are passionate about providing reliable hosting solutions and domain services 
              to help businesses and individuals establish their online presence.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
            <div className="text-center">
              <LightBulbIcon className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                To empower businesses and individuals with cutting-edge hosting technology, 
                exceptional customer support, and innovative solutions that drive online success.
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <UserGroupIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer First</h3>
              <p className="text-gray-600">
                We prioritize our customers' needs and provide personalized support 
                to ensure their success.
              </p>
            </div>
            <div className="text-center">
              <ShieldCheckIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reliability</h3>
              <p className="text-gray-600">
                Our infrastructure is built for maximum uptime and performance, 
                ensuring your websites stay online.
              </p>
            </div>
            <div className="text-center">
              <LightBulbIcon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                We continuously evolve our technology to provide the latest 
                and most efficient hosting solutions.
              </p>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="mb-4">
                Founded with a vision to democratize web hosting, NextPanel Billing has grown 
                from a small startup to a trusted provider serving thousands of customers worldwide. 
                Our journey began when we recognized the need for affordable, reliable hosting 
                solutions that don't compromise on quality.
              </p>
              <p className="mb-4">
                Over the years, we've invested heavily in infrastructure, technology, and most 
                importantly, our team. Today, we're proud to offer a comprehensive suite of 
                hosting services, from shared hosting to dedicated servers, all backed by 
                our commitment to excellence.
              </p>
              <p>
                Our success is measured not just by our growth, but by the success of our 
                customers. Every website we host, every domain we register, and every 
                support ticket we resolve is a step toward our goal of making the web 
                more accessible to everyone.
              </p>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Team</h2>
            <p className="text-lg text-gray-600 mb-8">
              We're a diverse group of professionals united by our passion for technology 
              and commitment to customer success.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-32 w-32 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">JS</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">John Smith</h3>
                <p className="text-indigo-600 mb-2">CEO & Founder</p>
                <p className="text-sm text-gray-600">
                  Visionary leader with 15+ years in web hosting industry.
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-32 w-32 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">MJ</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Maria Johnson</h3>
                <p className="text-indigo-600 mb-2">CTO</p>
                <p className="text-sm text-gray-600">
                  Technology expert focused on infrastructure and security.
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-32 w-32 bg-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">DW</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">David Wilson</h3>
                <p className="text-indigo-600 mb-2">Head of Support</p>
                <p className="text-sm text-gray-600">
                  Customer advocate ensuring exceptional service experience.
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="bg-indigo-600 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of satisfied customers who trust us with their online presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/shop')}
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                View Our Services
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-indigo-600 transition-colors font-medium"
              >
                Contact Us
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <DefaultAboutPage />;
}
