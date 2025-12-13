'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { DashboardElement } from './DashboardCustomization';

interface DashboardBlockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: DashboardElement | null;
  onUpdate: (updatedElement: DashboardElement) => void;
}

export default function DashboardBlockEditModal({
  isOpen,
  onClose,
  element,
  onUpdate,
}: DashboardBlockEditModalProps) {
  const [formData, setFormData] = useState<Partial<DashboardElement>>({
    name: '',
    visible: true,
    width: 'full',
    order: 0,
    config: {},
  });

  useEffect(() => {
    if (element) {
      setFormData({
        name: element.name || '',
        visible: element.visible !== false,
        width: element.width || 'full',
        order: element.order || 0,
        config: element.config || {},
        description: element.description || '',
        link: element.link || '',
      });
    }
  }, [element]);

  if (!isOpen || !element) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DashboardElement = {
      ...element,
      ...formData,
      config: formData.config || {},
    };
    onUpdate(updated);
    onClose();
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...(prev.config || {}),
        [key]: value,
      },
    }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              Customize Block: {element.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Settings</h3>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter block name"
                />
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visibility
                  </label>
                  <p className="text-xs text-gray-500">
                    Show or hide this block on the dashboard
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visible: !prev.visible }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                    formData.visible
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formData.visible ? (
                    <>
                      <EyeIcon className="h-5 w-5" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeSlashIcon className="h-5 w-5" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>

              {/* Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width
                </label>
                <select
                  value={formData.width || 'full'}
                  onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value as DashboardElement['width'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="full">Full Width</option>
                  <option value="1/2">Half Width (1/2)</option>
                  <option value="1/3">Third Width (1/3)</option>
                  <option value="1/4">Quarter Width (1/4)</option>
                  <option value="2/3">Two Thirds (2/3)</option>
                  <option value="3/4">Three Quarters (3/4)</option>
                </select>
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first. Use the customization panel to drag and drop for easier reordering.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="Optional description for this block"
                />
              </div>

              {/* Link */}
              {element.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.link || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="/admin/custom-page"
                  />
                </div>
              )}
            </div>

            {/* Type-Specific Settings */}
            {element.type === 'chart' && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Chart Settings</h3>

                {/* Chart Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.config?.primaryColor || '#6366f1'}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.config?.primaryColor || '#6366f1'}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                {/* Chart Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chart Height (px)
                  </label>
                  <input
                    type="number"
                    value={formData.config?.height || 256}
                    onChange={(e) => handleConfigChange('height', parseInt(e.target.value) || 256)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="100"
                    max="800"
                  />
                </div>
              </div>
            )}

            {element.type === 'gauge' && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Gauge Settings</h3>

                {/* Gauge Colors */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      High Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.config?.highColor || '#10b981'}
                        onChange={(e) => handleConfigChange('highColor', e.target.value)}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.config?.highColor || '#10b981'}
                        onChange={(e) => handleConfigChange('highColor', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medium Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.config?.mediumColor || '#f59e0b'}
                        onChange={(e) => handleConfigChange('mediumColor', e.target.value)}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.config?.mediumColor || '#f59e0b'}
                        onChange={(e) => handleConfigChange('mediumColor', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.config?.lowColor || '#ef4444'}
                        onChange={(e) => handleConfigChange('lowColor', e.target.value)}
                        className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.config?.lowColor || '#ef4444'}
                        onChange={(e) => handleConfigChange('lowColor', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom CSS */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">Advanced</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom CSS Classes
                </label>
                <input
                  type="text"
                  value={formData.config?.customClasses || ''}
                  onChange={(e) => handleConfigChange('customClasses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="custom-class another-class"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add custom CSS classes to style this block
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

