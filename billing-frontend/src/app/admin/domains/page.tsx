'use client';

import { useState, useEffect } from 'react';
import { domainsAPI } from '@/lib/api';

export default function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [searchDomain, setSearchDomain] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const response = await domainsAPI.list();
      setDomains(response.data);
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDomain = async () => {
    if (!searchDomain) return;
    
    setIsChecking(true);
    setSearchResult(null);
    
    try {
      const response = await domainsAPI.check(searchDomain);
      setSearchResult(response.data);
    } catch (error) {
      console.error('Failed to check domain:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const registerDomain = async () => {
    if (!searchResult?.domain_name) return;
    
    try {
      await domainsAPI.register({
        domain_name: searchResult.domain_name,
        years: 1,
        auto_renew: true,
      });
      
      alert('Domain registered successfully!');
      setSearchResult(null);
      setSearchDomain('');
      loadDomains();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to register domain');
    }
  };

  return (
    <div className="px-4 py-8 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Domain Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Register and manage your domain names
        </p>
      </div>

      {/* Domain Search */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Register New Domain
          </h3>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={searchDomain}
              onChange={(e) => setSearchDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              onKeyPress={(e) => e.key === 'Enter' && checkDomain()}
            />
            <button
              onClick={checkDomain}
              disabled={isChecking}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isChecking ? 'Checking...' : 'Check Availability'}
            </button>
          </div>

          {searchResult && (
            <div className={`mt-4 p-4 rounded-md ${searchResult.available ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-medium ${searchResult.available ? 'text-green-800' : 'text-red-800'}`}>
                {searchResult.available ? '✓ Domain is available!' : '✗ Domain is not available'}
              </p>
              {searchResult.available && searchResult.price && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Price: ${searchResult.price}/year</p>
                  <button
                    onClick={registerDomain}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Register Domain
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Domains List */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Your Domains
          </h3>

          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : domains.length === 0 ? (
            <p className="text-gray-500">No domains yet. Register one above!</p>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">{domain.domain_name}</h4>
                      <p className="text-sm text-gray-500">
                        Status: <span className={`font-medium ${
                          domain.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        }`}>{domain.status}</span>
                      </p>
                      {domain.expiry_date && (
                        <p className="text-sm text-gray-500">
                          Expires: {new Date(domain.expiry_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        Manage
                      </button>
                      <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                        Renew
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

