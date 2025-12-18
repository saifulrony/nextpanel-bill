'use client';

import { useState, useEffect, useMemo } from 'react';
import { plansAPI } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditProductModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
}

export default function EditProductModal({ product, onClose, onSuccess, categories }: EditProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentProduct, setCurrentProduct] = useState(product);
  const [attachedFile, setAttachedFile] = useState<{ filename: string; file_path: string; file_size: number } | null>(
    product.features?.download_file || null
  );

  // Refresh product data when modal opens to ensure we have the latest file info
  useEffect(() => {
    const loadProductData = async () => {
      try {
        const productResponse = await plansAPI.get(product.id);
        const updatedProduct = productResponse.data;
        setCurrentProduct(updatedProduct);
        
        // Debug: Log product data
        console.log('EditProductModal - Product loaded:', {
          id: updatedProduct.id,
          name: updatedProduct.name,
          category: updatedProduct.features?.category,
          features: updatedProduct.features,
          hasDownloadFile: !!updatedProduct.features?.download_file
        });
        
        // Update attached file info from refreshed product data
        if (updatedProduct.features?.download_file) {
          setAttachedFile(updatedProduct.features.download_file);
        } else {
          setAttachedFile(null);
        }
      } catch (err) {
        console.error('Failed to refresh product data:', err);
        // Keep using the original product data if refresh fails
      }
    };
    
    loadProductData();
  }, [product.id]);
  
  // Debug: Log when formData.category changes
  useEffect(() => {
    console.log('EditProductModal - formData.category changed:', {
      category: formData.category,
      productId: product.id,
      productName: product.name,
      originalCategory: product.features?.category
    });
  }, [formData.category, product.id, product.name, product.features?.category]);
  
  const [formData, setFormData] = useState({
    name: product.name || '',
    description: product.description || '',
    price_monthly: product.price_monthly?.toString() || '',
    price_yearly: product.price_yearly?.toString() || '',
    max_accounts: product.max_accounts?.toString() || '0',
    max_domains: product.max_domains?.toString() || '0',
    max_databases: product.max_databases?.toString() || '0',
    max_emails: product.max_emails?.toString() || '0',
    category: product.features?.category || 'hosting',
    subcategory: product.features?.subcategory || product.features?.user_type || '',
    // Advanced features
    storage: product.features?.storage || '',
    bandwidth: product.features?.bandwidth || '',
    cpu: product.features?.cpu || '',
    ram: product.features?.ram || '',
    ssl: product.features?.ssl || false,
    backups: product.features?.backups || 'weekly',
    support: product.features?.support || '24/7 Email',
    uptime: product.features?.uptime || '99.9%',
    is_active: product.is_active || true,
    // Discount fields
    discount_first_day: product.discount_first_day?.toString() || '0',
    discount_first_month: product.discount_first_month?.toString() || '0',
    discount_first_year: product.discount_first_year?.toString() || '0',
    discount_lifetime: product.discount_lifetime?.toString() || '0',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name || !formData.price_monthly || !formData.price_yearly) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.price_monthly) < 0 || parseFloat(formData.price_yearly) < 0) {
      setError('Prices must be positive numbers');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build features object based on category
      // Start with existing features to preserve any existing data (like download_file)
      const existingFeatures = currentProduct.features || product.features || {};
      const features: any = {
        ...existingFeatures, // Preserve existing features (including download_file)
        category: formData.category,
      };

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
      
      // Preserve download_file if it exists (for software/license products)
      if (existingFeatures.download_file) {
        features.download_file = existingFeatures.download_file;
      }
      
      // Ensure category is preserved for software/license products
      const categoryLower = formData.category?.toLowerCase() || '';
      if (categoryLower === 'software' || categoryLower === 'licenses' || categoryLower === 'license' ||
          categoryLower.includes('software') || categoryLower.includes('license')) {
        features.category = formData.category;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
        max_accounts: parseInt(formData.max_accounts) || 0,
        max_domains: parseInt(formData.max_domains) || 0,
        max_databases: parseInt(formData.max_databases) || 0,
        max_emails: parseInt(formData.max_emails) || 0,
        is_active: formData.is_active,
        features,
        // Discount fields
        discount_first_day: parseFloat(formData.discount_first_day) || 0.0,
        discount_first_month: parseFloat(formData.discount_first_month) || 0.0,
        discount_first_year: parseFloat(formData.discount_first_year) || 0.0,
        discount_lifetime: parseFloat(formData.discount_lifetime) || 0.0,
      };

      await plansAPI.update(product.id, payload);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update product:', err);
      setError(err.response?.data?.detail || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Edit Product
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* User Type Subcategory - Only show for hosting category */}
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Pricing</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Monthly Price ($) *
                      </label>
                      <input
                        type="number"
                        name="price_monthly"
                        value={formData.price_monthly}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Yearly Price ($) *
                      </label>
                      <input
                        type="number"
                        name="price_yearly"
                        value={formData.price_yearly}
                        onChange={handleChange}
                        required
                        step="0.01"
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount Settings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Time-Based Discounts</h4>
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

                {/* File Upload for Software/License Products */}
                {useMemo(() => {
                  // Check category - be flexible with different category names
                  const category = (formData.category || '').toLowerCase().trim();
                  const isSoftwareOrLicense = category === 'software' || 
                                             category === 'licenses' || 
                                             category === 'license' ||
                                             category.includes('software') ||
                                             category.includes('license');
                  
                  // Debug logging (only once per category change)
                  console.log('EditProductModal - File upload section check:', {
                    category: formData.category,
                    lowercase: category,
                    isSoftwareOrLicense,
                    productId: product.id,
                    productName: product.name,
                    productFeatures: product.features
                  });
                  
                  return isSoftwareOrLicense;
                }, [formData.category, product.id, product.name, product.features]) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">File Attachment</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Attach a downloadable file for this software/license product. Customers who purchase this product will be able to download this file.
                    </p>
                    
                    {attachedFile ? (
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
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('access_token');
                            if (!token) {
                              alert('Authentication token not found. Please login again.');
                              return;
                            }
                            
                            // Use the same API URL construction as the rest of the app
                                  const apiUrl = typeof window !== 'undefined' 
                                    ? `http://${window.location.hostname}:8001`
                                    : 'http://localhost:8001';
                                  
                            const response = await fetch(`${apiUrl}/api/v1/products/${product.id}/file`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                    },
                                  });
                                  
                                  if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete file' }));
                                    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
                                  }
                                  
                                  setAttachedFile(null);
                                  
                                  // Refresh product data after file deletion
                                  try {
                                    const productResponse = await plansAPI.get(product.id);
                                    setCurrentProduct(productResponse.data);
                                  } catch (err) {
                                    console.error('Failed to refresh product after file deletion:', err);
                                  }
                                } catch (err: any) {
                                  console.error('Failed to delete file:', err);
                                  alert(err.message || 'Failed to delete file');
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : uploadingFile ? (
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
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <input
                          type="file"
                          id="product-file-upload-edit"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            setSelectedFile(file);
                            setUploadingFile(true);
                            setUploadProgress(0);
                            setError('');
                            
                            const uploadFormData = new FormData();
                            uploadFormData.append('file', file);
                            
                            const token = localStorage.getItem('access_token');
                            if (!token) {
                              setError('Authentication token not found. Please login again.');
                              setUploadingFile(false);
                              setUploadProgress(0);
                              return;
                            }
                            
                            // Use the same API URL construction as the rest of the app
                            const apiUrl = typeof window !== 'undefined' 
                              ? `http://${window.location.hostname}:8001`
                              : 'http://localhost:8001';
                            
                            console.log('File upload - API URL:', apiUrl);
                            console.log('File upload - Product ID:', product.id);
                            console.log('File upload - File:', file.name, file.size, 'bytes');
                            
                            // Use XMLHttpRequest for progress tracking
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
                                const fileSize = file.size || 1;
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
                                  const result = JSON.parse(xhr.responseText);
                                  setAttachedFile(result.file_info);
                                  setError('');
                                  
                                  // Refresh product data to get updated features
                                  plansAPI.get(product.id).then((productResponse) => {
                                    setCurrentProduct(productResponse.data);
                                  }).catch((err) => {
                                    console.error('Failed to refresh product after file upload:', err);
                                  });
                                } catch (e) {
                                  setError('Failed to parse response');
                                }
                              } else {
                                try {
                                  const errorData = JSON.parse(xhr.responseText);
                                  setError(errorData.detail || `HTTP ${xhr.status}: ${xhr.statusText}`);
                                } catch (e) {
                                  setError(`HTTP ${xhr.status}: ${xhr.statusText}`);
                                }
                                setUploadProgress(0);
                              }
                              setUploadingFile(false);
                            });
                            
                            // Handle errors
                            xhr.addEventListener('error', (e) => {
                              stopSimulatedProgress();
                              console.error('Upload error:', e);
                              setError('Network error during upload');
                              setUploadProgress(0);
                              setUploadingFile(false);
                            });
                            
                            xhr.addEventListener('abort', () => {
                              stopSimulatedProgress();
                              console.log('Upload aborted');
                              setError('Upload aborted');
                              setUploadProgress(0);
                              setUploadingFile(false);
                            });
                            
                            // Open and send - MUST be after event listeners
                            const uploadUrl = `${apiUrl}/api/v1/products/${product.id}/upload-file`;
                            xhr.open('POST', uploadUrl);
                            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                            
                            console.log('Starting upload...', {
                              url: uploadUrl,
                              apiUrl: apiUrl,
                              productId: product.id,
                              fileSize: file.size,
                              fileName: file.name,
                              hasToken: !!token
                            });
                            
                            xhr.send(uploadFormData);
                          }}
                          disabled={uploadingFile}
                        />
                        <label
                          htmlFor="product-file-upload-edit"
                          className={`cursor-pointer flex flex-col items-center justify-center ${
                            uploadingFile ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <svg className="h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h4m-4-4v4m0 4v-4m0 0l-3.172-3.172" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="mt-2 text-sm text-gray-600">
                            Click to select a file
                          </span>
                          <span className="mt-1 text-xs text-gray-500">
                            Max file size: 500MB
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Resource Limits */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Resource Limits</h4>
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
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Category-specific features */}
                {formData.category === 'hosting' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Hosting Features</h4>
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

