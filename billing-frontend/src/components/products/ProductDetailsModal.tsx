'use client';

import { XMarkIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ProductDetailsModalProps {
  product: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProductDetailsModal({ product, onClose, onEdit }: ProductDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value?.toString() || 'N/A';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Product Details
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  View complete product information
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b">
                  Basic Information
                </h4>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Product Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.name}</dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Category</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {product.features?.category || 'N/A'}
                      </span>
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.description || 'No description provided'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Created At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(product.created_at)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Product ID</dt>
                    <dd className="mt-1 text-xs text-gray-600 font-mono">{product.id}</dd>
                  </div>
                </dl>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b">
                  Pricing
                </h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-lg border border-indigo-200">
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Monthly Price
                    </dt>
                    <dd className="text-3xl font-bold text-indigo-600">
                      ${product.price_monthly?.toFixed(2) || '0.00'}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </dd>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-lg border border-green-200">
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Yearly Price
                    </dt>
                    <dd className="text-3xl font-bold text-green-600">
                      ${product.price_yearly?.toFixed(2) || '0.00'}
                      <span className="text-sm font-normal text-gray-500">/year</span>
                    </dd>
                    <dd className="mt-1 text-xs text-green-600">
                      Save ${((product.price_monthly || 0) * 12 - (product.price_yearly || 0)).toFixed(2)} per year
                    </dd>
                  </div>
                </div>
              </div>

              {/* Resource Limits */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b">
                  Resource Limits
                </h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Accounts</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {product.max_accounts || 0}
                    </dd>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Domains</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {product.max_domains || 0}
                    </dd>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Databases</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {product.max_databases || 0}
                    </dd>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="text-xs font-medium text-gray-500 uppercase">Emails</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                      {product.max_emails || 0}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Features */}
              {product.features && Object.keys(product.features).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b">
                    Features & Specifications
                  </h4>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(product.features)
                      .filter(([key]) => key !== 'category') // Skip category as it's shown above
                      .map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-3 rounded-lg">
                          <dt className="text-xs font-medium text-gray-500 uppercase">
                            {key.replace(/_/g, ' ')}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {renderFeatureValue(value)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              )}

              {/* Stripe Integration (if available) */}
              {(product.stripe_price_id_monthly || product.stripe_price_id_yearly) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4 pb-2 border-b">
                    Payment Integration
                  </h4>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {product.stripe_price_id_monthly && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">
                          Stripe Monthly Price ID
                        </dt>
                        <dd className="mt-1 text-xs text-gray-600 font-mono break-all">
                          {product.stripe_price_id_monthly}
                        </dd>
                      </div>
                    )}

                    {product.stripe_price_id_yearly && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">
                          Stripe Yearly Price ID
                        </dt>
                        <dd className="mt-1 text-xs text-gray-600 font-mono break-all">
                          {product.stripe_price_id_yearly}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onEdit}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Edit Product
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

