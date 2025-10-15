'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDefaultPages } from '@/contexts/DefaultPageContext';
import { ArrowLeftIcon, ShoppingCartIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { DynamicPageRenderer } from '@/components/page-builder/DynamicPageRenderer';

export default function TermsPage() {
  const router = useRouter();
  const { getItemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { defaultPageConfig, isLoading: isLoadingConfig } = useDefaultPages();

  // Check if a custom terms page is configured
  const customTermsPage = defaultPageConfig?.terms;

  // Show loading while checking for custom page configuration
  if (isLoadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading terms of service...</p>
        </div>
      </div>
    );
  }

  // If custom terms page is configured, render it
  if (customTermsPage) {
    console.log('Rendering custom terms page:', customTermsPage);
    return <DynamicPageRenderer slug={customTermsPage} fallbackComponent={<DefaultTermsPage />} />;
  }

  // Default terms page component
  function DefaultTermsPage() {
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-6">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Terms Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using NextPanel Billing services, you accept and agree to be 
                  bound by the terms and provision of this agreement. If you do not agree to 
                  abide by the above, please do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-600 mb-4">
                  NextPanel Billing provides web hosting, domain registration, and related 
                  services. We reserve the right to modify, suspend, or discontinue any part 
                  of our services at any time without notice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <p className="text-gray-600 mb-4">
                  To access certain features of our service, you must register for an account. 
                  You are responsible for:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Updating your information as necessary</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment Terms</h2>
                <p className="text-gray-600 mb-4">
                  Payment for services is due in advance. We accept various payment methods 
                  including credit cards, PayPal, and bank transfers. By providing payment 
                  information, you authorize us to charge your account for services.
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                  <li>All fees are non-refundable unless otherwise stated</li>
                  <li>Late payments may result in service suspension</li>
                  <li>Prices are subject to change with 30 days notice</li>
                  <li>You are responsible for all applicable taxes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
                <p className="text-gray-600 mb-4">
                  You agree not to use our services for any unlawful purpose or any purpose 
                  prohibited under this clause. Prohibited uses include:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                  <li>Illegal activities or content</li>
                  <li>Spam, malware, or malicious software</li>
                  <li>Copyright infringement</li>
                  <li>Excessive resource usage</li>
                  <li>Activities that harm our infrastructure</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Level Agreement</h2>
                <p className="text-gray-600 mb-4">
                  We strive to maintain 99.9% uptime for our hosting services. However, we 
                  do not guarantee uninterrupted service and are not liable for downtime 
                  caused by:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                  <li>Scheduled maintenance</li>
                  <li>Force majeure events</li>
                  <li>Third-party service failures</li>
                  <li>User-caused issues</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data and Privacy</h2>
                <p className="text-gray-600 mb-4">
                  We respect your privacy and handle your data according to our Privacy Policy. 
                  You retain ownership of your content, but grant us necessary licenses to 
                  provide our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
                <p className="text-gray-600 mb-4">
                  All content, trademarks, and intellectual property on our website and 
                  services are owned by NextPanel Billing or our licensors. You may not 
                  reproduce, distribute, or create derivative works without permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-600 mb-4">
                  To the maximum extent permitted by law, NextPanel Billing shall not be 
                  liable for any indirect, incidental, special, consequential, or punitive 
                  damages, including but not limited to loss of profits, data, or business 
                  opportunities.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                <p className="text-gray-600 mb-4">
                  Either party may terminate this agreement at any time. We may suspend or 
                  terminate your account immediately if you violate these terms. Upon 
                  termination, your right to use our services ceases immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Dispute Resolution</h2>
                <p className="text-gray-600 mb-4">
                  Any disputes arising from these terms shall be resolved through binding 
                  arbitration in accordance with the rules of the American Arbitration 
                  Association. The arbitration shall take place in San Francisco, California.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
                <p className="text-gray-600 mb-4">
                  These terms shall be governed by and construed in accordance with the laws 
                  of the State of California, without regard to conflict of law principles.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
                <p className="text-gray-600 mb-4">
                  We reserve the right to modify these terms at any time. We will notify 
                  users of significant changes via email or website notice. Continued use 
                  of our services after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
                <p className="text-gray-600 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 mb-2">
                    <strong>Email:</strong> legal@nextpanel.com
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Phone:</strong> +1 (555) 123-4567
                  </p>
                  <p className="text-gray-600">
                    <strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <DefaultTermsPage />;
}
