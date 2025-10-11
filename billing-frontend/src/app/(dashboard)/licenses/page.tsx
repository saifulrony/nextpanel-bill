'use client';

import { useState, useEffect } from 'react';
import { licensesAPI } from '@/lib/api';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const response = await licensesAPI.list();
      setLicenses(response.data);
    } catch (error) {
      console.error('Failed to load licenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Licenses</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your NextPanel hosting licenses
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Licenses</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{licenses.length}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              {licenses.filter(l => l.status === 'active').length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Expired</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">
              {licenses.filter(l => l.status === 'expired').length}
            </dd>
          </div>
        </div>
      </div>

      {/* Licenses List */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Licenses
            </h3>
            <a
              href="/pricing"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Purchase New License
            </a>
          </div>

          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : licenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No licenses yet. Purchase your first license!</p>
              <a
                href="/pricing"
                className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                View Pricing Plans
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {licenses.map((license) => (
                <div key={license.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-lg">License Key</h4>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{license.license_key}</code>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      license.status === 'active' ? 'bg-green-100 text-green-800' :
                      license.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {license.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Accounts</p>
                      <p className="font-medium">{license.current_accounts} / {license.max_accounts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Domains</p>
                      <p className="font-medium">{license.current_domains} / {license.max_domains}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Databases</p>
                      <p className="font-medium">{license.current_databases} / {license.max_databases}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Emails</p>
                      <p className="font-medium">{license.current_emails} / {license.max_emails}</p>
                    </div>
                  </div>

                  {license.expiry_date && (
                    <p className="mt-4 text-sm text-gray-600">
                      Expires: {new Date(license.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

