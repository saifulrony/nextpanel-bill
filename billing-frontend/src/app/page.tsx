'use client';

import { useState } from 'react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);

  const popularTlds = [
    { extension: '.com', price: '$8.99/yr' },
    { extension: '.net', price: '$10.99/yr' },
    { extension: '.org', price: '$11.99/yr' },
    { extension: '.io', price: '$34.99/yr' },
    { extension: '.dev', price: '$14.99/yr' },
    { extension: '.app', price: '$17.99/yr' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const fullDomain = searchQuery.includes('.') ? searchQuery : `${searchQuery}${selectedTld}`;
    // Redirect to domain registration page (we'll create this later)
    window.location.href = `/dashboard/domains?search=${encodeURIComponent(fullDomain)}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">NextPanel Billing</h1>
            <nav className="space-x-4">
              <a href="/login" className="text-gray-600 hover:text-gray-900">Login</a>
              <a href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Domain Search */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Find Your Perfect Domain
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Search and register domains at wholesale prices. Get started with NextPanel hosting and manage your entire web presence in one place.
          </p>

          {/* Domain Search Box */}
          <div className="mt-12 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for your domain name..."
                    className="block w-full pl-11 pr-3 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
                  />
                </div>
                <select
                  value={selectedTld}
                  onChange={(e) => setSelectedTld(e.target.value)}
                  className="px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {popularTlds.map((tld) => (
                    <option key={tld.extension} value={tld.extension}>
                      {tld.extension}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Popular TLDs */}
              <div className="mt-6">
                <p className="text-sm text-gray-600 mb-3 font-medium text-left">
                  Popular Extensions:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {popularTlds.map((tld) => (
                    <button
                      key={tld.extension}
                      type="button"
                      onClick={() => setSelectedTld(tld.extension)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedTld === tld.extension
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">
                        {tld.extension}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {tld.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="mt-10">
            <a
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              View Pricing Plans
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-3">
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

        {/* Pricing Preview */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple, Transparent Pricing
          </h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <h4 className="text-2xl font-bold text-gray-900">Starter</h4>
              <p className="mt-2 text-gray-600">Perfect for individuals</p>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> 1 Hosting Account
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> 3 Domains
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> 5 Databases
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> 10 Email Accounts
                </li>
              </ul>
              <a
                href="/register"
                className="mt-8 block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg text-center font-semibold hover:bg-gray-200 transition"
              >
                Get Started
              </a>
            </div>

            {/* Professional Plan */}
            <div className="bg-blue-600 p-8 rounded-xl shadow-xl border-2 border-blue-700 transform scale-105">
              <div className="flex justify-between items-center">
                <h4 className="text-2xl font-bold text-white">Professional</h4>
                <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">POPULAR</span>
              </div>
              <p className="mt-2 text-blue-100">Best for businesses</p>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-white">$99</span>
                <span className="text-blue-100">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center text-white">
                  <span className="text-yellow-400 mr-2">✓</span> 5 Hosting Accounts
                </li>
                <li className="flex items-center text-white">
                  <span className="text-yellow-400 mr-2">✓</span> 25 Domains
                </li>
                <li className="flex items-center text-white">
                  <span className="text-yellow-400 mr-2">✓</span> 50 Databases
                </li>
                <li className="flex items-center text-white">
                  <span className="text-yellow-400 mr-2">✓</span> 100 Email Accounts
                </li>
              </ul>
              <a
                href="/auth/register"
                className="mt-8 block w-full bg-white text-blue-600 px-6 py-3 rounded-lg text-center font-semibold hover:bg-gray-100 transition"
              >
                Get Started
              </a>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
              <h4 className="text-2xl font-bold text-gray-900">Enterprise</h4>
              <p className="mt-2 text-gray-600">For large organizations</p>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">$299</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> Unlimited Accounts
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> Unlimited Domains
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> Unlimited Databases
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span> 24/7 Phone Support
                </li>
              </ul>
              <a
                href="/register"
                className="mt-8 block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg text-center font-semibold hover:bg-gray-200 transition"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              &copy; 2025 NextPanel Billing. All rights reserved.
            </p>
            <div className="mt-4 space-x-6">
              <a href="/terms" className="text-gray-400 hover:text-white">Terms</a>
              <a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="/support" className="text-gray-400 hover:text-white">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

