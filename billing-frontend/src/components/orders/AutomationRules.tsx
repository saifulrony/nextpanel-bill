'use client';

import { useState, useEffect } from 'react';
import { orderAutomationAPI } from '@/lib/api';
import {
  CogIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  EnvelopeIcon,
  CreditCardIcon,
  BellIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface AutomationRule {
  id: string;
  order_id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_value?: number;
  trigger_unit?: string;
  action_type: string;
  action_config: any;
  is_recurring: boolean;
  recurring_interval?: number;
  recurring_unit?: string;
  max_executions?: number;
  execution_count: number;
  next_execution?: string;
  last_execution?: string;
  status: string;
  is_enabled: boolean;
  last_result?: any;
  error_count: number;
  last_error?: string;
  created_at: string;
  updated_at?: string;
}

interface AutomationRulesProps {
  orderId: string;
  actionTypeFilter?: string[]; // Filter rules by action type (e.g., ['send_email', 'send_reminder'])
  defaultActionType?: string; // Default action type for new rules
}

interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  display_name?: string;
}

export default function AutomationRules({ orderId, actionTypeFilter, defaultActionType = 'send_email' }: AutomationRulesProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [useCustomPaymentMethod, setUseCustomPaymentMethod] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'on_due_date',
    trigger_value: 0,
    trigger_unit: 'days',
    action_type: defaultActionType,
    action_config: {} as any,
    is_recurring: false,
    recurring_interval: 1,
    recurring_unit: 'days',
    max_executions: null as number | null,
    is_enabled: true,
  });

  useEffect(() => {
    loadRules();
  }, [orderId]);

  useEffect(() => {
    // Load payment methods when action type is charge_payment
    if (formData.action_type === 'charge_payment' && !useCustomPaymentMethod) {
      loadPaymentMethods();
    }
  }, [formData.action_type, orderId, useCustomPaymentMethod]);

  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true);
      const response = await orderAutomationAPI.getPaymentMethods(orderId);
      setPaymentMethods(response.data || []);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const response = await orderAutomationAPI.list(orderId);
      let loadedRules = response.data;
      
      // Filter rules by action type if filter is provided
      if (actionTypeFilter && actionTypeFilter.length > 0) {
        loadedRules = loadedRules.filter((rule: AutomationRule) => 
          actionTypeFilter.includes(rule.action_type)
        );
      }
      
      setRules(loadedRules);
    } catch (error: any) {
      console.error('Failed to load automation rules:', error);
      alert(error.response?.data?.detail || 'Failed to load automation rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await orderAutomationAPI.create(orderId, formData);
      alert('Automation rule created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadRules();
    } catch (error: any) {
      console.error('Failed to create rule:', error);
      alert(error.response?.data?.detail || 'Failed to create automation rule');
    }
  };

  const handleUpdate = async () => {
    if (!editingRule) return;
    
    try {
      await orderAutomationAPI.update(orderId, editingRule.id, formData);
      alert('Automation rule updated successfully!');
      setEditingRule(null);
      resetForm();
      loadRules();
    } catch (error: any) {
      console.error('Failed to update rule:', error);
      alert(error.response?.data?.detail || 'Failed to update automation rule');
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }
    
    try {
      await orderAutomationAPI.delete(orderId, ruleId);
      alert('Automation rule deleted successfully!');
      loadRules();
    } catch (error: any) {
      console.error('Failed to delete rule:', error);
      alert(error.response?.data?.detail || 'Failed to delete automation rule');
    }
  };

  const handleExecute = async (ruleId: string) => {
    try {
      const response = await orderAutomationAPI.execute(orderId, ruleId);
      if (response.data.success) {
        alert(`Rule executed successfully: ${response.data.message}`);
      } else {
        alert(`Rule execution failed: ${response.data.message}`);
      }
      loadRules();
    } catch (error: any) {
      console.error('Failed to execute rule:', error);
      alert(error.response?.data?.detail || 'Failed to execute automation rule');
    }
  };

  const handleToggle = async (rule: AutomationRule) => {
    try {
      await orderAutomationAPI.update(orderId, rule.id, {
        is_enabled: !rule.is_enabled,
        status: !rule.is_enabled ? 'active' : 'paused'
      });
      loadRules();
    } catch (error: any) {
      console.error('Failed to toggle rule:', error);
      alert(error.response?.data?.detail || 'Failed to toggle automation rule');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: 'on_due_date',
      trigger_value: 0,
      trigger_unit: 'days',
      action_type: defaultActionType,
      action_config: {},
      is_recurring: false,
      recurring_interval: 1,
      recurring_unit: 'days',
      max_executions: null,
      is_enabled: true,
    });
    setEditingRule(null);
    setUseCustomPaymentMethod(false);
  };

  const openEditModal = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger_type: rule.trigger_type,
      trigger_value: rule.trigger_value || 0,
      trigger_unit: rule.trigger_unit || 'days',
      action_type: rule.action_type,
      action_config: rule.action_config || {},
      is_recurring: rule.is_recurring,
      recurring_interval: rule.recurring_interval || 1,
      recurring_unit: rule.recurring_unit || 'days',
      max_executions: rule.max_executions || null,
      is_enabled: rule.is_enabled,
    });
    setShowCreateModal(true);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email':
        return <EnvelopeIcon className="h-5 w-5" />;
      case 'charge_payment':
        return <CreditCardIcon className="h-5 w-5" />;
      case 'send_reminder':
        return <BellIcon className="h-5 w-5" />;
      case 'update_status':
        return <ArrowPathIcon className="h-5 w-5" />;
      default:
        return <CogIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string, isEnabled: boolean) => {
    if (!isEnabled) return 'bg-gray-100 text-gray-600';
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Automation Rules</h3>
          <p className="text-sm text-gray-500">Configure automated actions for this order</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingRule(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading automation rules...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No automation rules</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new automation rule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${rule.is_enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                      {getActionIcon(rule.action_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">{rule.name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rule.status, rule.is_enabled)}`}>
                          {rule.status}
                        </span>
                        {!rule.is_enabled && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                            Disabled
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="mt-1 text-sm text-gray-500">{rule.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Trigger: {rule.trigger_type.replace('_', ' ')}</span>
                        {rule.trigger_value && (
                          <span>{rule.trigger_value} {rule.trigger_unit} {rule.trigger_type.includes('before') ? 'before' : rule.trigger_type.includes('after') ? 'after' : ''}</span>
                        )}
                        <span>Action: {rule.action_type.replace('_', ' ')}</span>
                        {rule.is_recurring && (
                          <span>Recurring: Every {rule.recurring_interval} {rule.recurring_unit}</span>
                        )}
                        <span>Executed: {rule.execution_count} times</span>
                        {rule.max_executions && (
                          <span>Max: {rule.max_executions}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                        {rule.next_execution && (
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Next: {formatDate(rule.next_execution)}
                          </span>
                        )}
                        {rule.last_execution && (
                          <span>Last: {formatDate(rule.last_execution)}</span>
                        )}
                        {rule.error_count > 0 && (
                          <span className="text-red-600">Errors: {rule.error_count}</span>
                        )}
                      </div>
                      {rule.last_result && (
                        <div className="mt-2 flex items-center space-x-2">
                          {rule.last_result.success ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-xs ${rule.last_result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {rule.last_result.message || (rule.last_result.success ? 'Success' : 'Failed')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggle(rule)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title={rule.is_enabled ? 'Disable' : 'Enable'}
                  >
                    {rule.is_enabled ? (
                      <PauseIcon className="h-5 w-5" />
                    ) : (
                      <PlayIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleExecute(rule.id)}
                    className="p-2 text-indigo-600 hover:text-indigo-800"
                    title="Execute Now"
                  >
                    <PlayIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Edit"
                  >
                    <CogIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </h3>
              
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rule Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Send Payment Reminder"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows={2}
                    placeholder="Optional description"
                  />
                </div>

                {/* Trigger Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trigger Type *</label>
                  <select
                    value={formData.trigger_type}
                    onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="on_due_date">On Due Date</option>
                    <option value="before_due_date">Before Due Date</option>
                    <option value="after_due_date">After Due Date</option>
                    <option value="on_create">On Order Create</option>
                    <option value="custom_interval">Custom Interval</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>

                {/* Trigger Value */}
                {(formData.trigger_type === 'before_due_date' || 
                  formData.trigger_type === 'after_due_date' || 
                  formData.trigger_type === 'custom_interval') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Value</label>
                      <input
                        type="number"
                        value={formData.trigger_value}
                        onChange={(e) => setFormData({ ...formData, trigger_value: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <select
                        value={formData.trigger_unit}
                        onChange={(e) => setFormData({ ...formData, trigger_unit: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="days">Days</option>
                        <option value="hours">Hours</option>
                        <option value="minutes">Minutes</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Action Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action Type *</label>
                  <select
                    value={formData.action_type}
                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value, action_config: {} })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={!!actionTypeFilter && actionTypeFilter.length === 1}
                  >
                    {(!actionTypeFilter || actionTypeFilter.includes('send_email')) && (
                      <option value="send_email">Send Email</option>
                    )}
                    {(!actionTypeFilter || actionTypeFilter.includes('charge_payment')) && (
                      <option value="charge_payment">Charge Payment</option>
                    )}
                    {(!actionTypeFilter || actionTypeFilter.includes('send_reminder')) && (
                      <option value="send_reminder">Send Reminder</option>
                    )}
                    {(!actionTypeFilter || actionTypeFilter.includes('update_status')) && (
                      <option value="update_status">Update Status</option>
                    )}
                  </select>
                </div>

                {/* Action Config - Send Email */}
                {formData.action_type === 'send_email' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">Email Configuration</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <input
                        type="text"
                        value={formData.action_config.subject || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, subject: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Body</label>
                      <textarea
                        value={formData.action_config.body || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, body: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        rows={4}
                        placeholder="Email body (supports {{customer_name}}, {{order_number}}, {{order_total}}, {{due_date}})"
                      />
                    </div>
                  </div>
                )}

                {/* Action Config - Charge Payment */}
                {formData.action_type === 'charge_payment' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">Payment Configuration</h4>
                    
                    {/* Payment Method Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomPaymentMethod(!useCustomPaymentMethod);
                            if (!useCustomPaymentMethod) {
                              setFormData({
                                ...formData,
                                action_config: { ...formData.action_config, payment_method_id: '' }
                              });
                            }
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          {useCustomPaymentMethod ? 'Select from saved' : 'Enter manually'}
                        </button>
                      </div>
                      
                      {useCustomPaymentMethod ? (
                        <input
                          type="text"
                          value={formData.action_config.payment_method_id || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            action_config: { ...formData.action_config, payment_method_id: e.target.value }
                          })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="pm_1234567890abcdef"
                        />
                      ) : (
                        <>
                          {loadingPaymentMethods ? (
                            <div className="mt-1 text-sm text-gray-500">Loading payment methods...</div>
                          ) : paymentMethods.length > 0 ? (
                            <select
                              value={formData.action_config.payment_method_id || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                action_config: { ...formData.action_config, payment_method_id: e.target.value }
                              })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="">Select a payment method...</option>
                              {paymentMethods.map((pm) => (
                                <option key={pm.id} value={pm.id}>
                                  {pm.display_name || `${pm.brand || 'Card'} •••• ${pm.last4 || 'xxxx'}${pm.exp_month && pm.exp_year ? ` (Exp: ${pm.exp_month}/${pm.exp_year})` : ''}`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="mt-1 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
                              No saved payment methods found for this customer. Please enter a payment method ID manually or click "Enter manually" above.
                            </div>
                          )}
                        </>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Select a saved payment method or enter a payment method ID manually
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (leave empty to use order total)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.action_config.amount || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, amount: e.target.value ? parseFloat(e.target.value) : null }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Retry Attempts</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.action_config.retry_attempts || 3}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, retry_attempts: parseInt(e.target.value) || 3 }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Number of times to retry if payment fails
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Config - Send Reminder */}
                {formData.action_type === 'send_reminder' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">Reminder Configuration</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <input
                        type="text"
                        value={formData.action_config.subject || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, subject: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Payment Reminder"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Body</label>
                      <textarea
                        value={formData.action_config.body || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, body: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        rows={4}
                        placeholder="Reminder message"
                      />
                    </div>
                  </div>
                )}

                {/* Action Config - Update Status */}
                {formData.action_type === 'update_status' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">Status Configuration</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Status</label>
                      <select
                        value={formData.action_config.new_status || 'pending'}
                        onChange={(e) => setFormData({
                          ...formData,
                          action_config: { ...formData.action_config, new_status: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Recurring */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
                    Recurring Rule
                  </label>
                </div>

                {formData.is_recurring && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interval</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurring_interval}
                        onChange={(e) => setFormData({ ...formData, recurring_interval: parseInt(e.target.value) || 1 })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <select
                        value={formData.recurring_unit}
                        onChange={(e) => setFormData({ ...formData, recurring_unit: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="days">Days</option>
                        <option value="hours">Hours</option>
                        <option value="minutes">Minutes</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Max Executions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Executions (leave empty for unlimited)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_executions || ''}
                    onChange={(e) => setFormData({ ...formData, max_executions: e.target.value ? parseInt(e.target.value) : null })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Unlimited"
                  />
                </div>

                {/* Enabled */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_enabled"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_enabled" className="ml-2 block text-sm text-gray-900">
                    Enable Rule
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRule ? handleUpdate : handleCreate}
                  disabled={!formData.name}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

