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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ filename: string; file_path: string; file_size: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
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
    // Discount fields for time-based pricing
    discount_first_day: '0',
    discount_first_month: '0',
    discount_first_year: '0',
    discount_lifetime: '0',
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
    // For software category, skip step 3 (Resources) and go directly to step 4 (Stock)
    if (formData.category === 'software') {
      if (currentStep === 2) {
        // Skip from Pricing (step 2) to Stock (step 4)
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // After Stock, go to Review step (step 5) for software too
        // This allows user to review before submitting
        setCurrentStep(5);
      } else if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    // For software category, handle step navigation correctly
    if (formData.category === 'software') {
      if (currentStep === 5) {
        // Go back from Review (step 5) to Stock (step 4)
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Go back from Stock (step 4) to Pricing (step 2), skipping Resources (step 3)
        setCurrentStep(2);
      } else if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    } else {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
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

        // Use the API client instead of hardcoded URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
          (typeof window !== 'undefined' ? `http://${window.location.hostname}:8001` : 'http://localhost:8001');
        
        const response = await fetch(`${apiUrl}/api/v1/dedicated-servers/products`, {
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
        // Discount fields
        discount_first_day: parseFloat(formData.discount_first_day) || 0.0,
        discount_first_month: parseFloat(formData.discount_first_month) || 0.0,
        discount_first_year: parseFloat(formData.discount_first_year) || 0.0,
        discount_lifetime: parseFloat(formData.discount_lifetime) || 0.0,
      };

      console.log('Creating product with payload:', JSON.stringify(payload, null, 2));
      const response = await plansAPI.create(payload);
      console.log('Product created successfully - full response:', JSON.stringify(response, null, 2));
      
      // Extract product ID from response (axios returns data in response.data)
      // Try multiple possible response structures
      const productId = response?.data?.id || response?.data?.data?.id || (response?.data && typeof response.data === 'object' && 'id' in response.data ? response.data.id : null);
      
      if (!productId) {
        console.error('Product creation response structure:', {
          response,
          'response.data': response?.data,
          'response.data?.id': response?.data?.id,
          // 'response.id': response?.id, // Removed: AxiosResponse doesn't have id property
          keys: response ? Object.keys(response) : 'response is null/undefined'
        });
        throw new Error('Product was created but ID was not returned. Response: ' + JSON.stringify(response));
      }
      
      console.log('Extracted Product ID:', productId);
      
      // Wait a moment to ensure product is fully committed to database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Upload file if attached (for software products) - MUST complete before calling onSuccess
      if (formData.category === 'software' && selectedFile) {
        try {
          setUploadingFile(true);
          setUploadProgress(0);
          
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedFile);
          
          const token = localStorage.getItem('access_token');
          if (!token) {
            throw new Error('Authentication token not found');
          }
          
          // Get API URL dynamically
          const apiUrl = typeof window !== 'undefined' 
            ? `http://${window.location.hostname}:8001`
            : 'http://localhost:8001';
          
          console.log(`Uploading file to: ${apiUrl}/api/v1/products/${productId}/upload-file`);
          
          // Use XMLHttpRequest for progress tracking
          const uploadResult = await new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            let lastProgress = 0;
            let progressInterval: NodeJS.Timeout | null = null;
            
            // Simulated progress fallback if real progress doesn't update
            const startSimulatedProgress = () => {
              if (progressInterval) return;
              
              progressInterval = setInterval(() => {
                if (lastProgress < 90) {
                  lastProgress = Math.min(90, lastProgress + 5);
                  setUploadProgress(lastProgress);
                }
              }, 200);
            };
            
            const stopSimulatedProgress = () => {
              if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
              }
            };
            
            // Set initial progress
            setUploadProgress(5);
            lastProgress = 5;
            startSimulatedProgress();
            
            // Track upload progress - MUST be set before open()
            xhr.upload.addEventListener('progress', (e) => {
              stopSimulatedProgress(); // Stop simulated progress when real progress starts
              
              console.log('Progress event:', {
                loaded: e.loaded,
                total: e.total,
                lengthComputable: e.lengthComputable
              });
              
              if (e.lengthComputable && e.total > 0) {
                const percentComplete = (e.loaded / e.total) * 100;
                const rounded = Math.max(5, Math.min(99, Math.round(percentComplete)));
                lastProgress = rounded;
                setUploadProgress(rounded);
                console.log(`Upload progress: ${rounded}% (${e.loaded}/${e.total} bytes)`);
              } else if (e.loaded > 0) {
                // If total is unknown, show progress based on bytes loaded
                const fileSize = selectedFile?.size || 1;
                const estimated = Math.max(5, Math.min(95, Math.round((e.loaded / fileSize) * 100)));
                lastProgress = estimated;
                setUploadProgress(estimated);
                console.log(`Upload progress (estimated): ${estimated}% (${e.loaded}/${fileSize} bytes)`);
              }
            });
            
            // Track loadstart
            xhr.upload.addEventListener('loadstart', () => {
              console.log('Upload started');
              setUploadProgress(5);
              lastProgress = 5;
            });
            
            // Handle completion
            xhr.addEventListener('load', () => {
              stopSimulatedProgress();
              console.log('Upload completed, status:', xhr.status);
              setUploadProgress(100);
              
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  resolve(response);
                } catch (e) {
                  reject(new Error('Failed to parse response'));
                }
              } else {
                try {
                  const errorData = JSON.parse(xhr.responseText);
                  reject(new Error(errorData.detail || `HTTP ${xhr.status}: ${xhr.statusText}`));
                } catch (e) {
                  reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
              }
            });
            
            // Handle errors
            xhr.addEventListener('error', (e) => {
              stopSimulatedProgress();
              console.error('Upload error:', e);
              setUploadProgress(0);
              reject(new Error('Network error during upload'));
            });
            
            xhr.addEventListener('abort', () => {
              stopSimulatedProgress();
              console.log('Upload aborted');
              setUploadProgress(0);
              reject(new Error('Upload aborted'));
            });
            
            // Open and send - MUST be after event listeners
            xhr.open('POST', `${apiUrl}/api/v1/products/${productId}/upload-file`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            
            console.log('Starting upload...', {
              url: `${apiUrl}/api/v1/products/${productId}/upload-file`,
              fileSize: selectedFile.size,
              fileName: selectedFile.name,
              productId: productId
            });
            
            xhr.send(uploadFormData);
          });
          
          console.log('File uploaded successfully:', uploadResult);
          setUploadProgress(100);
          
          // Update attached file info with the actual file path
          if (uploadResult.file_info) {
            setAttachedFile(uploadResult.file_info);
          }
        } catch (err: any) {
          console.error('Failed to upload file:', err);
          setUploadProgress(0);
          setUploadingFile(false);
          
          // Show error but allow user to proceed - product is already created
          const errorMsg = err.message || 'Unknown error';
          setError(`Product created successfully, but file upload failed: ${errorMsg}. You can upload the file later by editing the product.`);
          
          // Don't throw - allow the modal to close and product to be saved
          // User can edit the product later to upload the file
          console.warn('File upload failed, but product was created:', productId);
        } finally {
          setUploadingFile(false);
        }
      }
      
      // Call onSuccess AFTER file upload completes (or fails)
      // This ensures the product list is refreshed with the product data
      onSuccess();
      onClose(); // Close modal only on success
    } catch (err: any) {
      console.error('Failed to create product:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error type:', typeof err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Handle different error response formats
      let errorMessage = 'Failed to create product';
      
      // Check if it's an authentication error
      if (err.response?.status === 401 || err.response?.status === 403) {
        const errorData = err.response?.data;
        const errorDetail = errorData?.detail || errorData?.message || '';
        
        if (errorDetail.includes('Could not validate') || 
            errorDetail.includes('credentials') ||
            errorDetail.includes('Not authenticated') ||
            errorDetail.includes('Not enough permissions')) {
          errorMessage = 'Authentication failed. Please login again.';
          // Don't close modal immediately - show error first
          // The axios interceptor will handle the logout/redirect
          setError(errorMessage);
          setIsSubmitting(false);
          return; // Exit early to prevent modal from closing
        }
      }
      
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
      // DO NOT close modal on error - let user see the error and fix it
      // DO NOT call onSuccess() on error
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

                {formData.category !== 'software' && (
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
                )}
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

              {/* Discount Settings */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Time-Based Discounts</h4>
                <p className="text-sm text-gray-600 mb-4">Set discount percentages for different time periods. Discounts apply to the base price.</p>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Day Discount (%)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="discount_first_day"
                        value={formData.discount_first_day}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.1"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.0"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Discount for first day purchases</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Month Discount (%)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="discount_first_month"
                        value={formData.discount_first_month}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.1"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.0"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Discount for first month subscriptions</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Year Discount (%)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="discount_first_year"
                        value={formData.discount_first_year}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.1"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.0"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Discount for first year subscriptions</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lifetime Discount (%)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="discount_lifetime"
                        value={formData.discount_lifetime}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.1"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.0"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Discount for lifetime purchases</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        // Skip Resources step for software category
        if (formData.category === 'software') {
          // This step should not be shown for software, but if we're here, go to next step
          return (
            <div className="space-y-6">
              <div className="text-center py-8">
                <p className="text-gray-500">This step is not applicable for software products.</p>
              </div>
            </div>
          );
        }
        
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
            {/* File Upload for Software Products */}
            {formData.category === 'software' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">File Attachment</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Attach a downloadable file for this software product. Customers who purchase this product will be able to download this file.
                </p>
                
                {uploadingFile ? (
                  <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Uploading file...</p>
                            <p className="text-xs text-gray-500">
                              {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0')} MB)
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : attachedFile ? (
                  <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachedFile.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(attachedFile.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFile(null);
                          setSelectedFile(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      id="product-file-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Store the actual file object for later upload
                        setSelectedFile(file);
                        setAttachedFile({
                          filename: file.name,
                          file_path: '', // Will be set after upload
                          file_size: file.size
                        });
                      }}
                      disabled={uploadingFile}
                    />
                    <label
                      htmlFor="product-file-upload"
                      className={`cursor-pointer flex flex-col items-center justify-center ${
                        uploadingFile ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h4m-4-4v4m0 4v-4m0 0l-3.172-3.172" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="mt-2 text-sm text-gray-600">
                        {uploadingFile ? 'Preparing...' : 'Click to select a file'}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        Max file size: 500MB
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
            
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

                {formData.category !== 'software' && (
                  <div>
                    <h6 className="font-medium text-gray-700">Resource Limits</h6>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Accounts: {formData.max_accounts}</div>
                      <div>Domains: {formData.max_domains}</div>
                      <div>Databases: {formData.max_databases}</div>
                      <div>Emails: {formData.max_emails}</div>
                    </div>
                  </div>
                )}

                {formData.category === 'software' && attachedFile && (
                  <div>
                    <h6 className="font-medium text-gray-700">Attached File</h6>
                    <div className="text-sm text-gray-600">
                      <p>{attachedFile.filename}</p>
                      <p className="text-xs text-gray-500">{(attachedFile.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}

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
                  {(() => {
                    const totalSteps = formData.category === 'software' ? 4 : steps.length; // Software: Basic Info, Pricing, Stock, Review
                    let stepDescription = steps[currentStep - 1]?.description || 'Review';
                    // For software, map step numbers correctly
                    let displayStep = currentStep;
                    if (formData.category === 'software') {
                      if (currentStep === 4) {
                        displayStep = 3; // Stock is step 3 for software
                        stepDescription = steps[3]?.description || 'Stock';
                      } else if (currentStep === 5) {
                        displayStep = 4; // Review is step 4 for software
                        stepDescription = steps[4]?.description || 'Review';
                      }
                    }
                    return `Step ${displayStep} of ${totalSteps}: ${stepDescription}`;
                  })()}
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
                  {(() => {
                    // For software, show steps 1, 2, 4, and 5 (displayed as 1, 2, 3, 4)
                    // For others, show all steps
                    const visibleSteps = formData.category === 'software' 
                      ? steps.filter(step => step.id !== 3) // Remove Resources (3), keep Review (5)
                      : steps;
                    
                    return visibleSteps.map((step, stepIdx) => {
                      // For software, map step numbers: 4->3, 5->4
                      let displayStepNumber = step.id;
                      if (formData.category === 'software') {
                        if (step.id === 4) displayStepNumber = 3; // Stock
                        else if (step.id === 5) displayStepNumber = 4; // Review
                      }
                      
                      // Determine if this step is current or completed
                      const isCurrentStep = step.id === currentStep;
                      const isCompletedStep = step.id < currentStep;
                      
                      return (
                        <li key={step.name} className={`${stepIdx !== visibleSteps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                          {isCompletedStep ? (
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="h-0.5 w-full bg-indigo-600" />
                            </div>
                          ) : isCurrentStep ? (
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="h-0.5 w-full bg-gray-200" />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="h-0.5 w-full bg-gray-200" />
                            </div>
                          )}
                          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                            isCompletedStep 
                              ? 'bg-indigo-600' 
                              : isCurrentStep 
                              ? 'bg-indigo-600' 
                              : 'bg-gray-200'
                          }`}>
                            {isCompletedStep ? (
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className={`text-sm font-medium ${
                                isCurrentStep ? 'text-white' : 'text-gray-500'
                              }`}>
                                {displayStepNumber}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    });
                  })()}
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

