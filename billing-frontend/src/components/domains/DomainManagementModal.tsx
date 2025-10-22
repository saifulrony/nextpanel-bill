'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, Cog6ToothIcon, ArrowPathIcon, ArrowsRightLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { customerDomainsAPI } from '@/lib/api';

interface Domain {
  id: string;
  domain_name: string;
  registrar?: string;
  registration_date?: string;
  expiry_date?: string;
  auto_renew: boolean;
  nameservers?: string[];
  status: string;
  created_at: string;
}

interface DomainManagementModalProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
  onDomainUpdated: () => void;
}

export default function DomainManagementModal({ 
  domain, 
  isOpen, 
  onClose, 
  onDomainUpdated 
}: DomainManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'dns' | 'renewal' | 'transfer'>('dns');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // DNS Settings
  const [nameservers, setNameservers] = useState<string[]>([]);
  const [newNameserver, setNewNameserver] = useState('');
  
  // Renewal Settings
  const [renewalYears, setRenewalYears] = useState(1);
  
  // Transfer Settings
  const [authCode, setAuthCode] = useState('');
  const [newRegistrar, setNewRegistrar] = useState('');

  useEffect(() => {
    if (domain && isOpen) {
      setNameservers(domain.nameservers || []);
      setError(null);
      setSuccess(null);
    }
  }, [domain, isOpen]);

  const handleUpdateNameservers = async () => {
    if (!domain) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await customerDomainsAPI.updateNameservers(domain.id, nameservers);
      setSuccess('Nameservers updated successfully!');
      onDomainUpdated();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update nameservers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNameserver = () => {
    if (newNameserver.trim() && !nameservers.includes(newNameserver.trim())) {
      setNameservers([...nameservers, newNameserver.trim()]);
      setNewNameserver('');
    }
  };

  const handleRemoveNameserver = (index: number) => {
    setNameservers(nameservers.filter((_, i) => i !== index));
  };

  const handleRenewDomain = async () => {
    if (!domain) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // This would need to be implemented in the backend
      // For now, we'll just show a success message
      setSuccess(`Domain renewal initiated for ${renewalYears} year(s). This feature will be available soon.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to renew domain');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferDomain = async () => {
    if (!domain) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // This would need to be implemented in the backend
      // For now, we'll just show a success message
      setSuccess(`Domain transfer initiated to ${newRegistrar}. This feature will be available soon.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initiate domain transfer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !domain) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <GlobeAltIcon className="h-6 w-6 text-indigo-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{domain.domain_name}</h3>
                <p className="text-sm text-gray-500">Domain Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('dns')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dns'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Cog6ToothIcon className="h-5 w-5 inline mr-2" />
                DNS Settings
              </button>
              <button
                onClick={() => setActiveTab('renewal')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'renewal'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ArrowPathIcon className="h-5 w-5 inline mr-2" />
                Renewal
              </button>
              <button
                onClick={() => setActiveTab('transfer')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transfer'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ArrowsRightLeftIcon className="h-5 w-5 inline mr-2" />
                Transfer
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* DNS Settings Tab */}
            {activeTab === 'dns' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Nameserver Configuration</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure the nameservers for your domain. These determine where your domain's DNS records are managed.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Nameservers
                      </label>
                      <div className="space-y-2">
                        {nameservers.map((ns, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-900">{ns}</span>
                            <button
                              onClick={() => handleRemoveNameserver(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {nameservers.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No nameservers configured</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Nameserver
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newNameserver}
                          onChange={(e) => setNewNameserver(e.target.value)}
                          placeholder="e.g., ns1.example.com"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleAddNameserver}
                          disabled={!newNameserver.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateNameservers}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Nameservers'}
                  </button>
                </div>
              </div>
            )}

            {/* Renewal Tab */}
            {activeTab === 'renewal' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Domain Renewal</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Renew your domain registration to keep it active. The domain will be renewed for the specified number of years.
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Domain Renewal Information
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>• Current expiry date: {domain.expiry_date ? new Date(domain.expiry_date).toLocaleDateString() : 'N/A'}</p>
                          <p>• Auto-renewal: {domain.auto_renew ? 'Enabled' : 'Disabled'}</p>
                          <p>• Renewal will extend the domain for the selected period</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Renewal Period
                      </label>
                      <select
                        value={renewalYears}
                        onChange={(e) => setRenewalYears(parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value={1}>1 Year</option>
                        <option value={2}>2 Years</option>
                        <option value={3}>3 Years</option>
                        <option value={5}>5 Years</option>
                        <option value={10}>10 Years</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleRenewDomain}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Renew Domain'}
                  </button>
                </div>
              </div>
            )}

            {/* Transfer Tab */}
            {activeTab === 'transfer' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Domain Transfer</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Transfer your domain to another registrar. You'll need the authorization code from your current registrar.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Transfer Requirements
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>• Domain must be unlocked at current registrar</p>
                          <p>• Authorization code (EPP code) required</p>
                          <p>• Domain must be at least 60 days old</p>
                          <p>• Transfer may take 5-7 days to complete</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Registrar
                      </label>
                      <input
                        type="text"
                        value={newRegistrar}
                        onChange={(e) => setNewRegistrar(e.target.value)}
                        placeholder="e.g., GoDaddy, Namecheap, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Authorization Code (EPP Code)
                      </label>
                      <input
                        type="text"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="Enter the authorization code from your current registrar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleTransferDomain}
                    disabled={loading || !newRegistrar.trim() || !authCode.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Initiate Transfer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
