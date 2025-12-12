'use client';

import { useState, useEffect } from 'react';
import { plansAPI } from '@/lib/api';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

interface CreateProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
}

export default function CreateProductModal({ onClose, onSuccess, categories }: CreateProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  
  // Clear error when modal opens
  useEffect(() => {
    setError('');
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'hosting',
    subcategory: '', // User type: regular-user, reseller-user, master-reseller-user
    domain: '', // Optional domain field
    // Billing cycles with prices
    billing_cycles: {
      one_time: { enabled: false, price: '' },
      quarterly: { enabled: false, price: '' },
      semi_annually: { enabled: false, price: '' },
      yearly: { enabled: false, price: '' },
      biennially: { enabled: false, price: '' },
      triennially: { enabled: false, price: '' },
    },
    // Resource limits (for regular products)
    max_accounts: '1',
    max_domains: '1',
    max_databases: '5',
    max_emails: '10',
    // Server product fields (for dedicated/VPS)
    server_type: 'vps', // 'vps' or 'dedicated'
    cpu_cores: '2',
    ram_gb: '4',
    storage_gb: '80',
    storage_type: 'SSD',
    bandwidth_tb: '2',
    provisioning_type: 'manual', // 'manual', 'automated', 'api'
    // Advanced features (stored in features JSON)
    storage: '',
    bandwidth: '',
    cpu: '',
    ram: '',
    ssl: false,
    backups: 'weekly',
    support: '24/7 Email',
    uptime: '99.9%',
    // Stock system
    stock_enabled: false,
    stock_quantity: '',
    stock_low_threshold: '',
    allow_backorder: false,
  });

  const billingCycleOptions = [
    { key: 'one_time', label: 'One Time', description: 'Single payment' },
    { key: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
    { key: 'semi_annually', label: 'Semi-annually', description: 'Every 6 months' },
    { key: 'yearly', label: 'Yearly', description: 'Every 12 months' },
    { key: 'biennially', label: 'Biennially', description: 'Every 24 months' },
    { key: 'triennially', label: 'Triennially', description: 'Every 36 months' },
  ];

  const steps = [
    { id: 1, name: 'Basic Info', description: 'Product name and category' },
    { id: 2, name: 'Pricing', description: 'Billing cycles and pricing' },
    { id: 3, name: 'Resources', description: 'Limits and features' },
    { id: 4, name: 'Stock', description: 'Inventory management' },
    { id: 5, name: 'Review', description: 'Review and create' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBillingCycleChange = (cycleKey: string, field: 'enabled' | 'price', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      billing_cycles: {
        ...prev.billing_cycles,
        [cycleKey]: {
          ...prev.billing_cycles[cycleKey as keyof typeof prev.billing_cycles],
          [field]: value
        }
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.category;
      case 2:
        return Object.values(formData.billing_cycles).some(cycle => cycle.enabled && cycle.price);
      case 3:
        return true; // Resources step is optional
      case 4:
        return true; // Stock step is optional
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    const enabledCycles = Object.entries(formData.billing_cycles).filter(([_, cycle]) => cycle.enabled);
    if (enabledCycles.length === 0) {
      setError('Please enable at least one billing cycle');
      return;
    }

    // Validate prices
    for (const [_, cycle] of enabledCycles) {
      if (!cycle.price || parseFloat(cycle.price) < 0) {
        setError('All enabled billing cycles must have valid prices');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build features object based on category
      const features: any = {
        category: formData.category,
      };

      // Add domain if provided
      if (formData.domain) {
        features.domain = formData.domain;
      }

      // Add subcategory for hosting products
      if (formData.category === 'hosting' && formData.subcategory) {
        features.subcategory = formData.subcategory;
        features.user_type = formData.subcategory; // Also store as user_type for easier access
      }

      // Add category-specific features
      if (formData.category === 'hosting') {
        if (formData.storage) features.storage = formData.storage;
        if (formData.bandwidth) features.bandwidth = formData.bandwidth;
        if (formData.cpu) features.cpu = formData.cpu;
        if (formData.ram) features.ram = formData.ram;
        features.ssl = formData.ssl;
        if (formData.backups) features.backups = formData.backups;
        if (formData.support) features.support = formData.support;
        if (formData.uptime) features.uptime = formData.uptime;
      }

      // Map billing cycles to backend expected fields
      let priceMonthly = 0;
      let priceYearly = 0;
      
      // Find monthly and yearly prices from enabled cycles
      for (const [cycleKey, cycle] of enabledCycles) {
        if (cycleKey === 'quarterly') {
          // Quarterly is 3 months, so monthly = quarterly / 3
          priceMonthly = parseFloat(cycle.price) / 3;
        } else if (cycleKey === 'semi_annually') {
          // Semi-annually is 6 months, so monthly = semi_annually / 6
          priceMonthly = parseFloat(cycle.price) / 6;
        } else if (cycleKey === 'yearly') {
          priceYearly = parseFloat(cycle.price);
        } else if (cycleKey === 'biennially') {
          // Biennially is 24 months, so yearly = biennially / 2
          priceYearly = parseFloat(cycle.price) / 2;
        } else if (cycleKey === 'triennially') {
          // Triennially is 36 months, so yearly = triennially / 3
          priceYearly = parseFloat(cycle.price) / 3;
        } else if (cycleKey === 'one_time') {
          // One-time payment - set as monthly price for now
          priceMonthly = parseFloat(cycle.price);
        }
      }
      
      // If no yearly price found, calculate from monthly (yearly = monthly * 12)
      if (priceYearly === 0 && priceMonthly > 0) {
        priceYearly = priceMonthly * 12;
      }
      
      // If no monthly price found, calculate from yearly (monthly = yearly / 12)
      if (priceMonthly === 0 && priceYearly > 0) {
        priceMonthly = priceYearly / 12;
      }
      
      // Round to 2 decimal places to avoid floating point precision issues
      priceMonthly = Math.round(priceMonthly * 100) / 100;
      priceYearly = Math.round(priceYearly * 100) / 100;

      // Check if this is a server product (dedicated/VPS)
      if (formData.category === 'server') {
        // Use dedicated servers API
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Authentication token not found. Please login again.');
        }

        const serverPayload = {
          name: formData.name,
          description: formData.description || '',
          server_type: formData.server_type,
          cpu_cores: parseInt(formData.cpu_cores) || 2,
          ram_gb: parseInt(formData.ram_gb) || 4,
          storage_gb: parseInt(formData.storage_gb) || 80,
          storage_type: formData.storage_type || 'SSD',
          bandwidth_tb: parseInt(formData.bandwidth_tb) || 2,
          price_monthly: priceMonthly,
          price_quarterly: formData.billing_cycles.quarterly.enabled ? parseFloat(formData.billing_cycles.quarterly.price) : null,
          price_yearly: priceYearly,
          setup_fee: 0,
          provisioning_type: formData.provisioning_type || 'manual',
          provisioning_module: formData.provisioning_type === 'manual' ? 'manual' : null,
          is_active: true,
          stock_count: formData.stock_enabled ? (parseInt(formData.stock_quantity) || null) : null,
        };

        console.log('Creating server product with payload:', JSON.stringify(serverPayload, null, 2));

        const response = await fetch('http://192.168.177.129:8001/api/v1/dedicated-servers/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(serverPayload),
        });

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error('Server product creation failed:', errorData);
          } catch (e) {
            const text = await response.text();
            console.error('Failed to parse error response:', text);
            errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
          }
          throw new Error(errorData.detail || errorData.message || `Failed to create server product: ${response.status}`);
        }

        const result = await response.json();
        console.log('Server product created successfully:', result);
        alert('Server product created successfully!');
        onSuccess();
        return;
      }

      // Regular product - use existing API
      const payload = {
        name: formData.name,
        description: formData.description,
        price_monthly: priceMonthly,
        price_yearly: priceYearly,
        max_accounts: parseInt(formData.max_accounts) || 0,
        max_domains: parseInt(formData.max_domains) || 0,
        max_databases: parseInt(formData.max_databases) || 0,
        max_emails: parseInt(formData.max_emails) || 0,
        features,
        // Stock system fields
        stock_enabled: formData.stock_enabled,
        stock_quantity: formData.stock_enabled ? parseInt(formData.stock_quantity) || 0 : null,
        stock_low_threshold: formData.stock_enabled ? parseInt(formData.stock_low_threshold) || 0 : null,
        allow_backorder: formData.stock_enabled ? formData.allow_backorder : false,
      };

      console.log('Creating product with payload:', JSON.stringify(payload, null, 2));
      const result = await plansAPI.create(payload);
      console.log('Product created successfully:', result);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create product:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error type:', typeof err.response?.data);
      
      // Handle different error response formats
      let errorMessage = 'Failed to create product';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        console.log('Processing error data:', errorData);
        
        // Handle validation errors (array of error objects)
        if (Array.isArray(errorData)) {
          errorMessage = errorData.map((error: any) => 
            error.msg || error.message || 'Validation error'
          ).join(', ');
        }
        // Handle single error object
        else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        // Handle error with message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Handle error with msg
        else if (errorData.msg) {
          errorMessage = errorData.msg;
        }
        // Handle other error formats
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
        // If it's still an object, stringify it safely
        else if (typeof errorData === 'object') {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('Final error message:', errorMessage);
      console.log('Error message type:', typeof errorMessage);
      
      // Ensure error is always a string
      const safeErrorMessage = typeof errorMessage === 'string' 
        ? errorMessage 
        : JSON.stringify(errorMessage);
      
      setError(safeErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Shared Hosting - Business"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Describe your product..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="server">Server (Dedicated/VPS)</option>
                  </select>
                </div>

                {formData.category === 'server' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Server Type *
                    </label>
                    <select
                      name="server_type"
                      value={formData.server_type}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="vps">VPS</option>
                      <option value="dedicated">Dedicated Server</option>
                    </select>
                  </div>
                )}

                {formData.category === 'hosting' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      User Type *
                    </label>
                    <select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Select User Type...</option>
                      <option value="regular-user">🌐 Regular User (Panel Account)</option>
                      <option value="reseller-user">💼 Reseller User (Can create sub-accounts)</option>
                      <option value="master-reseller-user">👑 Master Reseller User (Full admin access)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      This determines the type of NextPanel account created for customers
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Domain (Optional)
                  </label>
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional domain associated with this product
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Cycles & Pricing</h4>
              <p className="text-sm text-gray-600 mb-6">Select which billing cycles to offer and set their prices.</p>
              
              <div className="space-y-4">
                {billingCycleOptions.map((option) => (
                  <div key={option.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.billing_cycles[option.key as keyof typeof formData.billing_cycles].enabled}
                          onChange={(e) => handleBillingCycleChange(option.key, 'enabled', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <label className="text-sm font-medium text-gray-900">
                            {option.label}
                          </label>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </div>
                      {formData.billing_cycles[option.key as keyof typeof formData.billing_cycles].enabled && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            value={formData.billing_cycles[option.key as keyof typeof formData.billing_cycles].price}
                            onChange={(e) => handleBillingCycleChange(option.key, 'price', e.target.value)}
                            step="0.01"
                            min="0"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        // Show server-specific fields if category is server
        if (formData.category === 'server') {
          return (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Server Specifications</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CPU Cores *
                    </label>
                    <input
                      type="number"
                      name="cpu_cores"
                      value={formData.cpu_cores}
                      onChange={handleChange}
                      min="1"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      RAM (GB) *
                    </label>
                    <input
                      type="number"
                      name="ram_gb"
                      value={formData.ram_gb}
                      onChange={handleChange}
                      min="1"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Storage (GB) *
                    </label>
                    <input
                      type="number"
                      name="storage_gb"
                      value={formData.storage_gb}
                      onChange={handleChange}
                      min="1"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Storage Type
                    </label>
                    <select
                      name="storage_type"
                      value={formData.storage_type}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="SSD">SSD</option>
                      <option value="HDD">HDD</option>
                      <option value="NVMe">NVMe</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bandwidth (TB) *
                    </label>
                    <input
                      type="number"
                      name="bandwidth_tb"
                      value={formData.bandwidth_tb}
                      onChange={handleChange}
                      min="1"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Provisioning Type *
                    </label>
                    <select
                      name="provisioning_type"
                      value={formData.provisioning_type}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="manual">Manual (Admin provisions)</option>
                      <option value="automated">Automated (API)</option>
                      <option value="api">API Integration</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      How the server will be provisioned when ordered
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Regular product - show resource limits
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Resource Limits</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Accounts
                  </label>
                  <input
                    type="number"
                    name="max_accounts"
                    value={formData.max_accounts}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Domains
                  </label>
                  <input
                    type="number"
                    name="max_domains"
                    value={formData.max_domains}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Databases
                  </label>
                  <input
                    type="number"
                    name="max_databases"
                    value={formData.max_databases}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Emails
                  </label>
                  <input
                    type="number"
                    name="max_emails"
                    value={formData.max_emails}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {formData.category === 'hosting' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Hosting Features</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Storage
                    </label>
                    <input
                      type="text"
                      name="storage"
                      value={formData.storage}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., 50 GB SSD"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bandwidth
                    </label>
                    <input
                      type="text"
                      name="bandwidth"
                      value={formData.bandwidth}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., Unlimited"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CPU
                    </label>
                    <input
                      type="text"
                      name="cpu"
                      value={formData.cpu}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., 2 vCPU"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      RAM
                    </label>
                    <input
                      type="text"
                      name="ram"
                      value={formData.ram}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., 4 GB"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Backups
                    </label>
                    <select
                      name="backups"
                      value={formData.backups}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="none">None</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Support Level
                    </label>
                    <input
                      type="text"
                      name="support"
                      value={formData.support}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., 24/7 Email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Uptime Guarantee
                    </label>
                    <input
                      type="text"
                      name="uptime"
                      value={formData.uptime}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="e.g., 99.9%"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="ssl"
                      checked={formData.ssl}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Free SSL Certificate
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Stock Management</h4>
              <p className="text-sm text-gray-600 mb-6">
                Configure inventory tracking for this product. This is optional - you can disable stock tracking for unlimited products.
              </p>
              
              <div className="space-y-6">
                {/* Enable Stock Tracking */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="stock_enabled"
                    checked={formData.stock_enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable stock tracking for this product
                  </label>
                </div>

                {formData.stock_enabled && (
                  <div className="space-y-4 pl-6 border-l-2 border-indigo-200">
                    {/* Stock Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Initial Stock Quantity
                      </label>
                      <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleChange}
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter initial stock quantity"
                      />
                    </div>

                    {/* Low Stock Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        name="stock_low_threshold"
                        value={formData.stock_low_threshold}
                        onChange={handleChange}
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Alert when stock falls below this number"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        You'll be notified when stock falls below this level
                      </p>
                    </div>

                    {/* Allow Backorder */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="allow_backorder"
                        checked={formData.allow_backorder}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Allow backorders when out of stock
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 pl-6">
                      Customers can still purchase when stock is 0
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        const enabledCycles = Object.entries(formData.billing_cycles).filter(([_, cycle]) => cycle.enabled);
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Review Product</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900">{formData.name}</h5>
                  <p className="text-sm text-gray-600">{formData.description || 'No description'}</p>
                </div>
                
                <div>
                  <h6 className="font-medium text-gray-700">Category</h6>
                  <p className="text-sm text-gray-600">{formData.category}</p>
                </div>

                {formData.domain && (
                  <div>
                    <h6 className="font-medium text-gray-700">Domain</h6>
                    <p className="text-sm text-gray-600">{formData.domain}</p>
                  </div>
                )}

                <div>
                  <h6 className="font-medium text-gray-700">Pricing</h6>
                  <div className="space-y-1">
                    {enabledCycles.map(([key, cycle]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600">{billingCycleOptions.find(opt => opt.key === key)?.label}</span>
                        <span className="font-medium">${parseFloat(cycle.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h6 className="font-medium text-gray-700">Resource Limits</h6>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Accounts: {formData.max_accounts}</div>
                    <div>Domains: {formData.max_domains}</div>
                    <div>Databases: {formData.max_databases}</div>
                    <div>Emails: {formData.max_emails}</div>
                  </div>
                </div>

                {formData.stock_enabled && (
                  <div>
                    <h6 className="font-medium text-gray-700">Stock Management</h6>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock Tracking</span>
                        <span className="font-medium text-green-600">Enabled</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Initial Stock</span>
                        <span className="font-medium">{formData.stock_quantity || 0} units</span>
                      </div>
                      {formData.stock_low_threshold && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Low Stock Alert</span>
                          <span className="font-medium">{formData.stock_low_threshold} units</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Allow Backorders</span>
                        <span className="font-medium">{formData.allow_backorder ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Product
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Step {currentStep} of {steps.length}: {steps[currentStep - 1].description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="mt-6">
              <nav aria-label="Progress">
                <ol className="flex items-center">
                  {steps.map((step, stepIdx) => (
                    <li key={step.name} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                      {step.id < currentStep ? (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-indigo-600" />
                        </div>
                      ) : step.id === currentStep ? (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-gray-200" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="h-0.5 w-full bg-gray-200" />
                        </div>
                      )}
                      <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                        step.id < currentStep 
                          ? 'bg-indigo-600' 
                          : step.id === currentStep 
                          ? 'bg-indigo-600' 
                          : 'bg-gray-200'
                      }`}>
                        {step.id < currentStep ? (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className={`text-sm font-medium ${
                            step.id === currentStep ? 'text-white' : 'text-gray-500'
                          }`}>
                            {step.id}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error creating product
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {(() => {
                          try {
                            if (typeof error === 'string') {
                              return error;
                            } else if (error && typeof error === 'object') {
                              return JSON.stringify(error, null, 2);
                            } else {
                              return String(error);
                            }
                          } catch (e) {
                            return 'An error occurred';
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>

                {currentStep === steps.length ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Product'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

