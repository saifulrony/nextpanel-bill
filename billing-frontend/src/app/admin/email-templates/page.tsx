'use client';

import { useState, useEffect } from 'react';
import { emailTemplatesAPI } from '@/lib/api';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'custom',
    subject: '',
    body_text: '',
    body_html: '',
  });
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await emailTemplatesAPI.list();
      setTemplates(response.data);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      alert(`Failed to load templates: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await emailTemplatesAPI.create(formData);
      alert('Template created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to create template:', error);
      alert(`Failed to create template: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleUpdate = async () => {
    try {
      await emailTemplatesAPI.update(editingTemplate.id, formData);
      alert('Template updated successfully!');
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to update template:', error);
      alert(`Failed to update template: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await emailTemplatesAPI.delete(id);
      alert('Template deleted successfully!');
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      alert(`Failed to delete template: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handlePreview = async (template: any) => {
    try {
      const response = await emailTemplatesAPI.render(template.id, previewVars);
      setPreviewTemplate({ ...template, rendered: response.data });
    } catch (error: any) {
      console.error('Failed to render template:', error);
      alert(`Failed to render template: ${error.response?.data?.detail || error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template_type: 'custom',
      subject: '',
      body_text: '',
      body_html: '',
    });
    setPreviewVars({});
  };

  const startEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      template_type: template.template_type,
      subject: template.subject,
      body_text: template.body_text || '',
      body_html: template.body_html || '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingTemplate(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5" />
          Create Template
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap">{template.name}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{template.template_type.replace('_', ' ')}</td>
                <td className="px-6 py-4">{template.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setPreviewTemplate(template);
                      setPreviewVars({ customer_name: 'John Doe', invoice_number: 'INV-001', amount: '100.00', currency: 'USD' });
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <EyeIcon className="h-5 w-5 inline" />
                  </button>
                  {!template.is_system && (
                    <>
                      <button
                        onClick={() => startEdit(template)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select
                    value={formData.template_type}
                    onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={!!editingTemplate}
                  >
                    <option value="welcome">Welcome</option>
                    <option value="payment_confirmation">Payment Confirmation</option>
                    <option value="invoice_generated">Invoice Generated</option>
                    <option value="payment_failed">Payment Failed</option>
                    <option value="renewal_reminder">Renewal Reminder</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Use {{variable_name}} for variables"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">HTML Body</label>
                <textarea
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={10}
                  placeholder="Use {{variable_name}} for variables"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Plain Text Body</label>
                <textarea
                  value={formData.body_text}
                  onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                  rows={5}
                  placeholder="Use {{variable_name}} for variables"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingTemplate ? handleUpdate : handleCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Preview Template</h2>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {previewTemplate.rendered ? (
              <div>
                <div className="mb-4">
                  <strong>Subject:</strong> {previewTemplate.rendered.subject}
                </div>
                <div 
                  className="border border-gray-300 rounded p-4"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.rendered.body_html || previewTemplate.rendered.body_text }}
                />
                <button
                  onClick={() => handlePreview(previewTemplate)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Refresh Preview
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">Click "Refresh Preview" to render with variables</p>
                <button
                  onClick={() => handlePreview(previewTemplate)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Render Preview
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

