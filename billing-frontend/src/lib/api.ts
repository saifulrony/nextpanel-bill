import axios from 'axios';

// Dynamically determine API URL based on how the frontend is accessed
const getApiUrl = () => {
  // For client-side code, always detect from window location (ignore env if set incorrectly)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = 8001; // Backend port
    
    // Use the same hostname as the frontend
    // This will work for both localhost and network IPs
    const apiUrl = `http://${hostname}:${port}`;
    console.log('API URL (detected from hostname):', apiUrl);
    return apiUrl;
  }
  
  // For server-side rendering, check env first, then fallback to localhost
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('192.168.10.203')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback for server-side rendering - use localhost
  return 'http://localhost:8001';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout - increased for slower connections
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Both customers and admins use JWT tokens stored in 'access_token'
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request to ${config.url}: Using JWT token`);
    }
  }
  return config;
});

// Add response interceptor to handle auth errors and blob errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log network errors with more details
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('=== NETWORK ERROR DETAILS ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Request URL:', error.config?.url);
      console.error('Request baseURL:', error.config?.baseURL);
      console.error('Full request URL:', error.config?.baseURL + error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request headers:', error.config?.headers);
      
      // Provide a more helpful error message
      const apiUrl = error.config?.baseURL || 'unknown';
      error.networkErrorDetails = {
        message: `Cannot connect to backend API at ${apiUrl}. Please check if the backend server is running.`,
        url: apiUrl,
        suggestion: 'Make sure the backend server is running on port 8001'
      };
    }
    
    // If error response is a blob (from PDF endpoints), try to parse it as JSON
    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const jsonError = JSON.parse(text);
        // Replace the blob with the parsed JSON for easier error handling
        error.response.data = jsonError;
      } catch {
        // If parsing fails, keep the blob but add a helpful message
        error.response.data = { detail: 'PDF generation failed. Please check backend logs.' };
      }
    }
    
    // Handle 401 (unauthorized) and 403 (forbidden) errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Check if it's an authentication error
      const errorDetail = error.response?.data?.detail || '';
      if (errorDetail.includes('Could not validate') || 
          errorDetail.includes('credentials') ||
          errorDetail.includes('Not authenticated')) {
        // Token is invalid or expired
        if (typeof window !== 'undefined') {
          // Add a small delay to allow error messages to be displayed first
          // This gives modals/forms a chance to show the error before redirecting
          setTimeout(() => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Redirect to appropriate login based on current path
            if (!window.location.pathname.includes('/login')) {
              if (window.location.pathname.startsWith('/customer')) {
                window.location.href = '/customer/login';
              } else {
                window.location.href = '/login';
              }
            }
          }, 2000); // 2 second delay to show error
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string; company_name?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  getMe: () =>
    api.get('/auth/me'),
  
  updateProfile: (data: { full_name?: string; company_name?: string; current_password?: string; new_password?: string }) =>
    api.put('/auth/me', data),
};

// Plans/Products API
export const plansAPI = {
  list: (params?: { category?: string; is_active?: boolean; is_featured?: boolean }) =>
    api.get('/plans', { params }),
  
  get: (id: string) =>
    api.get(`/plans/${id}`),
  
  create: (data: any) =>
    api.post('/plans', data),
  
  update: (id: string, data: any) =>
    api.put(`/plans/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/plans/${id}`),
  
  categories: () =>
    api.get('/plans/categories'),
  
  stats: () =>
    api.get('/plans/stats/summary'),
};

// Licenses API
export const licensesAPI = {
  list: () =>
    api.get('/licenses'),
  
  get: (id: string) =>
    api.get(`/licenses/${id}`),
  
  validate: (license_key: string, feature: string) =>
    api.post('/licenses/validate', { license_key, feature }),
};

// Payments API
export const paymentsAPI = {
  createIntent: (data: any) =>
    api.post('/payments/intent', data),
  
  manualCharge: (data: any) =>
    api.post('/payments/manual-charge', data),
  
  configureAutoCharge: (orderId: string, config: any) =>
    api.post(`/payments/auto-charge/${orderId}`, config),
  
  getPaymentHistory: (orderId: string) =>
    api.get(`/payments/history/${orderId}`),
  
  retryPayment: (paymentId: string) =>
    api.post(`/payments/retry/${paymentId}`),
  
  getAutoChargeQueue: () =>
    api.get('/payments/auto-charge/queue'),
  
  processAutoChargeQueue: () =>
    api.post('/payments/auto-charge/process'),
  
  list: (params?: any) =>
    api.get('/payments', { params }),
  
  get: (id: string) =>
    api.get(`/payments/${id}`),
  
  stats: () =>
    api.get('/payments/stats/summary'),
};

// Payment Gateways API
export const paymentGatewaysAPI = {
  list: (params?: { status?: string; type?: string; limit?: number; offset?: number }) =>
    api.get('/payment-gateways', { params }),
  
  listActive: () =>
    api.get('/payment-gateways/active'),
  
  get: (id: string) =>
    api.get(`/payment-gateways/${id}`),
  
  create: (data: {
    name: string;
    type: string;
    display_name: string;
    description?: string;
    config?: any;
    supports_recurring?: boolean;
    supports_refunds?: boolean;
    supports_partial_refunds?: boolean;
    supports_webhooks?: boolean;
    fixed_fee?: number;
    percentage_fee?: number;
    api_key?: string;
    secret_key?: string;
    webhook_secret?: string;
    is_sandbox?: boolean;
    sandbox_api_key?: string;
    sandbox_secret_key?: string;
  }) =>
    api.post('/payment-gateways', data),
  
  update: (id: string, data: any) =>
    api.put(`/payment-gateways/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/payment-gateways/${id}`),
  
  test: (id: string, data?: { test_amount?: number; test_currency?: string }) =>
    api.post(`/payment-gateways/${id}/test`, data || {}),
  
  activate: (id: string) =>
    api.post(`/payment-gateways/${id}/activate`),
  
  deactivate: (id: string) =>
    api.post(`/payment-gateways/${id}/deactivate`),
  
  stats: (id: string) =>
    api.get(`/payment-gateways/${id}/stats`),
  
  getStripeConfig: () =>
    api.get('/payment-gateways/stripe/config'),
};

// Subscriptions API
export const subscriptionsAPI = {
  create: (data: any) =>
    api.post('/subscriptions', data),
  
  list: () =>
    api.get('/subscriptions'),
  
  get: (id: string) =>
    api.get(`/subscriptions/${id}`),
  
  update: (id: string, data: any) =>
    api.put(`/subscriptions/${id}`, data),
  
  cancel: (id: string, data: any) =>
    api.post(`/subscriptions/${id}/cancel`, data),
  
  reactivate: (id: string) =>
    api.post(`/subscriptions/${id}/reactivate`),
};

// Orders API
export const ordersAPI = {
  create: (data: any) =>
    api.post('/orders', data),
  
  list: (params?: any) =>
    api.get('/orders', { params }),
  
  get: (id: string) =>
    api.get(`/orders/${id}`),
  
  update: (id: string, data: any) =>
    api.put(`/orders/${id}`, data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}?status=${encodeURIComponent(status)}`),
  
  delete: (id: string) =>
    api.delete(`/orders/${id}`),
  
  stats: () =>
    api.get('/orders/stats'),
  
  downloadPDF: (id: string) =>
    api.get(`/orders/${id}/pdf`, { responseType: 'blob' }),
  
  send: (id: string) =>
    api.post(`/orders/${id}/send`),
  
  pay: (id: string) =>
    api.post(`/orders/${id}/pay`),
  
  void: (id: string) =>
    api.post(`/orders/${id}/void`),
  refund: (id: string, data: { amount?: number; reason?: string }) =>
    api.post(`/orders/${id}/refund`, data),
};

// Order Automation API
export const orderAutomationAPI = {
  list: (orderId: string) =>
    api.get(`/orders/${orderId}/automation`),
  
  get: (orderId: string, ruleId: string) =>
    api.get(`/orders/${orderId}/automation/${ruleId}`),
  
  create: (orderId: string, data: any) =>
    api.post(`/orders/${orderId}/automation`, data),
  
  update: (orderId: string, ruleId: string, data: any) =>
    api.patch(`/orders/${orderId}/automation/${ruleId}`, data),
  
  delete: (orderId: string, ruleId: string) =>
    api.delete(`/orders/${orderId}/automation/${ruleId}`),
  
  execute: (orderId: string, ruleId: string) =>
    api.post(`/orders/${orderId}/automation/${ruleId}/execute`),
  
  getPaymentMethods: (orderId: string) =>
    api.get(`/orders/${orderId}/automation/payment-methods`),
};

// Orders Partial Payment API
export const ordersPartialPaymentAPI = {
  partialPayment: (id: string, data: any) =>
    api.post(`/orders/${id}/partial-payment`, data),
  
  getPartialPayments: (id: string) =>
    api.get(`/orders/${id}/partial-payments`),
};

// Invoices API
export const invoicesAPI = {
  create: (data: any) =>
    api.post('/invoices', data),
  
  list: (params?: any) =>
    api.get('/invoices', { params }),
  
  get: (id: string) =>
    api.get(`/invoices/${id}`),
  
  update: (id: string, data: any) =>
    api.put(`/invoices/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/invoices/${id}`),
  
  pay: (id: string) =>
    api.post(`/invoices/${id}/pay`),
  
  partialPayment: (id: string, data: any) =>
    api.post(`/invoices/${id}/partial-payment`, data),
  
  getPartialPayments: (id: string) =>
    api.get(`/invoices/${id}/partial-payments`),
  
  void: (id: string) =>
    api.post(`/invoices/${id}/void`),
  
  downloadPDF: (id: string) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  
  send: (id: string) =>
    api.post(`/invoices/${id}/send`),
  
  sendReminder: (id: string) =>
    api.post(`/invoices/${id}/send-reminder`),
  
  stats: () =>
    api.get('/invoices/stats/summary'),
  
  agingReport: () =>
    api.get('/invoices/stats/aging-report'),
  
  overdue: () =>
    api.get('/invoices/overdue'),
  
  // Templates
  templates: {
    create: (data: any) =>
      api.post('/invoices/templates', data),
    
    list: () =>
      api.get('/invoices/templates'),
    
    generate: (id: string, sendEmail: boolean = false) =>
      api.post(`/invoices/templates/${id}/generate`, null, { params: { send_email: sendEmail } }),
  },
  
  // Bulk operations
  bulk: {
    sendReminders: (daysBefore: number = 3) =>
      api.post('/invoices/bulk/send-reminders', null, { params: { days_before_due: daysBefore } }),
    
    markOverdue: () =>
      api.post('/invoices/bulk/mark-overdue'),
  },
};

// Usage API
export const usageAPI = {
  getQuota: () =>
    api.get('/usage/quota'),
  
  getReport: () =>
    api.get('/usage/report'),
  
  getAlerts: () =>
    api.get('/usage/alerts'),
};

// Analytics API
export const analyticsAPI = {
  revenue: () =>
    api.get('/analytics/revenue/summary'),
  
  licenses: () =>
    api.get('/analytics/licenses/stats'),
  
  domains: () =>
    api.get('/analytics/domains/stats'),
  
  invoices: () =>
    api.get('/analytics/invoices/stats'),
  
  dashboard: () =>
    api.get('/analytics/dashboard'),
};

// Support API
export const supportAPI = {
  createTicket: (data: any) =>
    api.post('/support/tickets', data),
  
  listTickets: () =>
    api.get('/support/tickets'),
  
  list: (params?: any) =>
    api.get('/support/tickets', { params }),
  
  getTicket: (id: string) =>
    api.get(`/support/tickets/${id}`),
  
  addReply: (id: string, message: string) =>
    api.post(`/support/tickets/${id}/replies`, { message }),
  
  getReplies: (id: string) =>
    api.get(`/support/tickets/${id}/replies`),
  
  closeTicket: (id: string) =>
    api.post(`/support/tickets/${id}/close`),
  
  stats: () =>
    api.get('/support/stats'),
};

// Chat API
export const chatAPI = {
  // Sessions
  createSession: (data?: { subject?: string; guest_email?: string; guest_name?: string }) =>
    api.post('/chat/sessions', data || {}),
  
  listSessions: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/chat/sessions', { params }),
  
  getSession: (id: string) =>
    api.get(`/chat/sessions/${id}`),
  
  closeSession: (id: string) =>
    api.post(`/chat/sessions/${id}/close`),
  
  rateSession: (id: string, rating: number, feedback?: string) =>
    api.post(`/chat/sessions/${id}/rate`, null, { params: { rating, feedback } }),
  
  assignSession: (id: string, admin_id: string) =>
    api.post(`/chat/sessions/${id}/assign`, null, { params: { admin_id } }),
  
  // Messages
  getMessages: (session_id: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/chat/sessions/${session_id}/messages`, { params }),
  
  sendMessage: (session_id: string, data: { message: string; metadata?: any }) =>
    api.post(`/chat/sessions/${session_id}/messages`, data),
  
  // AI Bot
  chatWithBot: (data: { message: string; session_id?: string; context?: any }) =>
    api.post('/chat/bot', data),
  
  // Stats
  stats: () =>
    api.get('/chat/stats'),
};

// Admin API
export const adminAPI = {
  users: {
    create: (data: { email: string; password: string; full_name: string; company_name?: string; is_active?: boolean; is_admin?: boolean }) =>
      api.post('/admin/users', data),
    
    list: () =>
      api.get('/admin/users'),
    
    get: (id: string) =>
      api.get(`/admin/users/${id}`),
    
    update: (id: string, data: any) =>
      api.put(`/admin/users/${id}`, data),
    
    delete: (id: string) =>
      api.delete(`/admin/users/${id}`),
  },
  
  plans: {
    create: (data: any) =>
      api.post('/admin/plans', data),
    
    update: (id: string, data: any) =>
      api.put(`/admin/plans/${id}`, data),
  },
  
  stats: () =>
    api.get('/admin/stats'),
};

// Marketplace API
export const marketplaceAPI = {
  listAddons: (params?: { category?: string; is_premium?: boolean }) =>
    api.get('/marketplace/addons', { params }),
  
  getAddon: (id: string) =>
    api.get(`/marketplace/addons/${id}`),
  
  listInstalled: () =>
    api.get('/marketplace/installed'),
  
  install: (addon_id: string, settings?: any) =>
    api.post('/marketplace/install', { addon_id, settings }),
  
  uninstall: (addon_id: string) =>
    api.delete(`/marketplace/uninstall/${addon_id}`),
  
  toggle: (addon_id: string, enable: boolean) =>
    api.post(`/marketplace/toggle/${addon_id}`, null, { params: { enable } }),
};

// Settings API
export const settingsAPI = {
  list: (params?: { category?: string; is_public?: boolean }) =>
    api.get('/settings', { params }),
  
  get: (key: string) =>
    api.get(`/settings/${key}`),
  
  update: (key: string, value: string) =>
    api.put(`/settings/${key}`, { value }),
  
  bulkUpdate: (settings: Record<string, string>) =>
    api.post('/settings/bulk', { settings }),
  
  getPublic: () =>
    api.get('/settings/public/all'),
  
  initialize: () =>
    api.post('/settings/initialize'),
};

// Domains API
export const domainsAPI = {
  search: (data: any) =>
    api.post('/domains/search', data),
  
  getPricing: (domainName: string) =>
    api.get(`/domains/pricing/${domainName}`),
  
  register: (data: any) =>
    api.post('/domains/register', data),
  
  list: () =>
    api.get('/domains/my-domains'),
  
  getMyDomains: () =>
    api.get('/domains/my-domains'),
  
  getDomainInfo: (domainName: string) =>
    api.get(`/domains/info/${domainName}`),
  
  updateNameservers: (domainName: string, nameservers: string[]) =>
    api.post(`/domains/nameservers/${domainName}`, nameservers),
  
  getSuggestions: (query: string, limit?: number) =>
    api.get('/domains/suggestions', { params: { query, limit } }),
};

// Domain Providers API
export const domainProvidersAPI = {
  list: () =>
    api.get('/domain-providers'),

  get: (id: string) =>
    api.get(`/domain-providers/${id}`),

  create: (data: any) =>
    api.post('/domain-providers', data),

  update: (id: string, data: any) =>
    api.put(`/domain-providers/${id}`, data),

  delete: (id: string) =>
    api.delete(`/domain-providers/${id}`),

  test: (id: string, data: any) =>
    api.post(`/domain-providers/${id}/test`, data),

  activate: (id: string) =>
    api.post(`/domain-providers/${id}/activate`),

  deactivate: (id: string) =>
    api.post(`/domain-providers/${id}/deactivate`),

  getTypes: () =>
    api.get('/domain-providers/types/available'),
};

// Domain Pricing API
export const domainPricingAPI = {
  getConfig: () =>
    api.get('/domain-pricing/pricing/config'),
  
  updateConfig: (data: any) =>
    api.put('/domain-pricing/pricing/config', data),
  
  getTLDPricing: () =>
    api.get('/domain-pricing/pricing/tld-pricing'),
  
  updateTLDPricing: (id: string, data: any) =>
    api.put(`/domain-pricing/pricing/tld-pricing/${id}`, data),
  
  autoFetchPrices: () =>
    api.post('/domain-pricing/pricing/auto-fetch-prices'),
  
  bulkUpdatePricing: (data: any) =>
    api.post('/domain-pricing/pricing/tld-pricing/bulk', data),
};

// Customer Domains API
export const customerDomainsAPI = {
  // Get all domains for the current customer
  list: async (params?: { status?: string; expiring_soon?: boolean }) => {
    const response = await api.get('/customer/domains/', { params });
    return response.data;
  },

  // Get domain details
  get: async (domainId: string) => {
    const response = await api.get(`/customer/domains/${domainId}`);
    return response.data;
  },

  // Register a new domain
  register: async (data: {
    domain_name: string;
    years?: number;
    registrar?: string;
    nameservers?: string[];
    auto_renew?: boolean;
  }) => {
    const response = await api.post('/customer/domains/', data);
    return response.data;
  },

  // Update auto-renewal setting
  updateAutoRenew: async (domainId: string, autoRenew: boolean) => {
    const response = await api.put(`/customer/domains/${domainId}/auto-renew`, null, {
      params: { auto_renew: autoRenew }
    });
    return response.data;
  },

  // Update nameservers
  updateNameservers: async (domainId: string, nameservers: string[]) => {
    const response = await api.put(`/customer/domains/${domainId}/nameservers`, nameservers);
    return response.data;
  },

  // Get domain statistics
  getStats: async () => {
    const response = await api.get('/customer/domains/stats/summary');
    return response.data;
  }
};

// Customer Subscriptions API
export const customerSubscriptionsAPI = {
  // Get hosting subscriptions
  getHosting: async (params?: { status?: string }) => {
    const response = await api.get('/customer/subscriptions/hosting', { params });
    return response.data;
  },

  // Get subscription statistics
  getStats: async () => {
    const response = await api.get('/customer/subscriptions/stats/summary');
    return response.data;
  },

  // Get license usage details
  getUsage: async (licenseId: string) => {
    const response = await api.get(`/customer/subscriptions/usage/${licenseId}`);
    return response.data;
  },

  // Cancel subscription
  cancel: async (subscriptionId: string, cancelAtPeriodEnd: boolean = true) => {
    const response = await api.post(`/subscriptions/${subscriptionId}/cancel`, {
      cancel_at_period_end: cancelAtPeriodEnd
    });
    return response.data;
  }
};

// Customer Billing API
export const customerBillingAPI = {
  // Get customer invoices
  getInvoices: async (params?: { status?: string; due_only?: boolean }) => {
    const response = await api.get('/customer/billing/invoices', { params });
    return response.data;
  },

  // Get invoice details
  getInvoice: async (invoiceId: string) => {
    const response = await api.get(`/customer/billing/invoices/${invoiceId}`);
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    const response = await api.get('/customer/billing/payment-methods');
    return response.data;
  },

  // Get account balance
  getAccountBalance: async () => {
    const response = await api.get('/customer/billing/balance');
    return response.data;
  },

  // Add funds to account
  addFunds: async (amount: number, paymentMethodId: string) => {
    const response = await api.post('/customer/billing/add-funds', {
      amount,
      payment_method_id: paymentMethodId
    });
    return response.data;
  },

  // Get billing summary
  getBillingSummary: async () => {
    const response = await api.get('/customer/billing/billing-summary');
    return response.data;
  },

  // Pay invoice
  payInvoice: async (invoiceId: string, paymentMethodId: string) => {
    const response = await api.post(`/customer/billing/invoices/${invoiceId}/pay`, {
      payment_method_id: paymentMethodId
    });
    return response.data;
  }
};

// VPS API Keys API
export const vpsAPIKeysAPI = {
  list: () => api.get('/customer/vps-api-keys'),
  get: (id: string) => api.get(`/customer/vps-api-keys/${id}`),
  create: (data: any) => api.post('/customer/vps-api-keys', data),
  update: (id: string, data: any) => api.put(`/customer/vps-api-keys/${id}`, data),
  delete: (id: string) => api.delete(`/customer/vps-api-keys/${id}`),
  regenerate: (id: string) => api.post(`/customer/vps-api-keys/${id}/regenerate`),
};

export const customerProfileAPI = {
  // Get customer profile
  getProfile: async () => {
    const response = await api.get('/customer/profile');
    return response.data;
  },

  // Update customer profile
  updateProfile: async (profileData: {
    full_name?: string;
    email?: string;
    phone?: string;
    company?: string;
  }) => {
    const response = await api.put('/customer/profile', profileData);
    return response.data;
  },

  // Get customer settings
  getSettings: async () => {
    const response = await api.get('/customer/settings');
    return response.data;
  },

  // Update customer settings
  updateSettings: async (settings: any) => {
    const response = await api.put('/customer/settings', settings);
    return response.data;
  },
};

export const staffAPI = {
  // Roles
  listRoles: () => api.get('/staff/roles'),
  getRole: (roleId: string) => api.get(`/staff/roles/${roleId}`),
  createRole: (data: { name: string; display_name: string; description?: string; is_active?: boolean }) =>
    api.post('/staff/roles', data),
  updateRole: (roleId: string, data: { display_name?: string; description?: string; is_active?: boolean }) =>
    api.patch(`/staff/roles/${roleId}`, data),
  deleteRole: (roleId: string) => api.delete(`/staff/roles/${roleId}`),
  
  // Permissions
  listPermissions: (category?: string) => {
    const params = category ? { category } : {};
    return api.get('/staff/permissions', { params });
  },
  createPermission: (data: { name: string; display_name: string; description?: string; category?: string }) =>
    api.post('/staff/permissions', data),
  
  // Role-Permission Assignment
  getRolePermissions: (roleId: string) => api.get(`/staff/roles/${roleId}/permissions`),
  assignPermissionsToRole: (roleId: string, permissionIds: string[]) =>
    api.post(`/staff/roles/${roleId}/permissions`, { permission_ids: permissionIds }),
  
  // User-Role Assignment
  assignRoleToUser: (userId: string, roleId: string) =>
    api.post('/staff/users/assign-role', { user_id: userId, role_id: roleId }),
  getMyRoles: () => api.get('/staff/users/me/roles'),
  getUserRoles: (userId: string) => api.get(`/staff/users/${userId}/roles`),
  removeRoleFromUser: (userId: string, roleId: string) =>
    api.delete(`/staff/users/${userId}/roles/${roleId}`),
  
  // Initialize defaults
  initializeDefaults: () => api.post('/staff/initialize-defaults'),
  
  // Staff Users
  listStaffUsers: () => api.get('/staff/users'),
  
  // Permissions
  getMyPermissions: () => api.get('/staff/permissions/me'),
  getUserPermissions: (userId: string) => api.get(`/staff/permissions/user/${userId}`),
  
  // Role Cloning
  cloneRole: (roleId: string, newName: string, newDisplayName: string) =>
    api.post(`/staff/roles/${roleId}/clone?new_name=${newName}&new_display_name=${newDisplayName}`),
  
  // Permission Groups
  listPermissionGroups: () => api.get('/staff/permission-groups'),
  createPermissionGroup: (data: { name: string; display_name: string; description?: string; permission_ids?: string[] }) =>
    api.post('/staff/permission-groups', data),
  assignPermissionsToGroup: (groupId: string, permissionIds: string[]) =>
    api.post(`/staff/permission-groups/${groupId}/permissions`, { permission_ids: permissionIds }),
  
  // Permission Overrides
  getUserPermissionOverrides: (userId: string) => api.get(`/staff/users/${userId}/permission-overrides`),
  createPermissionOverride: (userId: string, data: { permission_id: string; is_allowed: boolean; expires_at?: string }) =>
    api.post(`/staff/users/${userId}/permission-overrides`, data),
  deletePermissionOverride: (userId: string, overrideId: string) =>
    api.delete(`/staff/users/${userId}/permission-overrides/${overrideId}`),
  
  // Audit & Activity Logs
  getAuditLogs: (params?: { limit?: number; offset?: number; action_type?: string; user_id?: string }) =>
    api.get('/staff/audit-logs', { params }),
  getActivityLogs: (params?: { user_id?: string; action_type?: string; entity_type?: string; limit?: number; offset?: number }) =>
    api.get('/staff/activity-logs', { params }),
  
  // Bulk Operations
  bulkAssignRole: (userIds: string[], roleId: string, expiresAt?: string) =>
    api.post('/staff/users/bulk-assign-role', { user_ids: userIds, role_id: roleId, expires_at: expiresAt }),
  bulkUpdateUserStatus: (userIds: string[], isActive: boolean) =>
    api.post('/staff/users/bulk-update-status', { user_ids: userIds, is_active: isActive }),
  
  // Export/Import
  exportRole: (roleId: string) => api.get(`/staff/roles/${roleId}/export`),
  importRole: (roleData: any) => api.post('/staff/roles/import', roleData),
  
  // Analytics
  getStaffPerformanceAnalytics: () => api.get('/staff/analytics/staff-performance'),
};

// Coupons API
export const couponsAPI = {
  list: (params?: any) => api.get('/coupons', { params }),
  get: (id: string) => api.get(`/coupons/${id}`),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/coupons/${id}`),
  validate: (data: any) => api.post('/coupons/validate', data),
  getUsage: (id: string) => api.get(`/coupons/${id}/usage`),
};

// Credit Notes API
export const creditNotesAPI = {
  list: (params?: any) => api.get('/credit-notes', { params }),
  get: (id: string) => api.get(`/credit-notes/${id}`),
  create: (data: any) => api.post('/credit-notes', data),
  apply: (id: string, data: any) => api.post(`/credit-notes/${id}/apply`, data),
  getApplications: (id: string) => api.get(`/credit-notes/${id}/applications`),
};

// Email Templates API
export const emailTemplatesAPI = {
  list: (params?: any) => api.get('/email-templates', { params }),
  get: (id: string) => api.get(`/email-templates/${id}`),
  create: (data: any) => api.post('/email-templates', data),
  update: (id: string, data: any) => api.put(`/email-templates/${id}`, data),
  delete: (id: string) => api.delete(`/email-templates/${id}`),
  render: (id: string, data: any) => api.post(`/email-templates/${id}/render`, data),
};

// Currencies API
export const currenciesAPI = {
  list: (params?: any) => api.get('/currencies', { params }),
  get: (id: string) => api.get(`/currencies/${id}`),
  create: (data: any) => api.post('/currencies', data),
  update: (id: string, data: any) => api.put(`/currencies/${id}`, data),
  convert: (data: any) => api.post('/currencies/convert', data),
  createExchangeRate: (data: any) => api.post('/currencies/exchange-rates', data),
  getExchangeRateHistory: (params: any) => api.get('/currencies/exchange-rates/history', { params }),
};

// Tax Rules API
export const taxRulesAPI = {
  list: (params?: any) => api.get('/tax-rules', { params }),
  create: (data: any) => api.post('/tax-rules', data),
  calculate: (params: any) => api.get('/tax-rules/calculate', { params }),
  createExemption: (data: any) => api.post('/tax-rules/exemptions', data),
  listExemptions: (params?: any) => api.get('/tax-rules/exemptions', { params }),
};

// Affiliates API
export const affiliatesAPI = {
  register: (data: any) => api.post('/affiliates/register', data),
  getMyAffiliate: () => api.get('/affiliates/me'),
  trackReferral: (params: any) => api.post('/affiliates/track-referral', null, { params }),
  list: (params?: any) => api.get('/affiliates', { params }),
  approve: (id: string) => api.post(`/affiliates/${id}/approve`),
  getCommissions: (id: string, params?: any) => api.get(`/affiliates/${id}/commissions`, { params }),
  processCommission: (orderId: string) => api.post('/affiliates/process-commission', null, { params: { order_id: orderId } }),
};

// Recurring Billing API
export const recurringBillingAPI = {
  processRenewals: () => api.post('/recurring-billing/process-renewals'),
  processDunning: () => api.post('/recurring-billing/process-dunning'),
  processPaymentRetries: () => api.post('/recurring-billing/process-payment-retries'),
};

// Dedicated Servers API
export const dedicatedServersAPI = {
  // Products
  listProducts: (params?: { server_type?: string; is_active?: boolean }) => 
    api.get('/dedicated-servers/products', { params }),
  getProduct: (id: number) => api.get(`/dedicated-servers/products/${id}`),
  createProduct: (data: any) => api.post('/dedicated-servers/products', data),
  updateProduct: (id: number, data: any) => api.put(`/dedicated-servers/products/${id}`, data),
  deleteProduct: (id: number) => api.delete(`/dedicated-servers/products/${id}`),
  
  // Instances (customer-facing)
  listInstances: () => api.get('/dedicated-servers/instances'),
  getInstance: (id: number) => api.get(`/dedicated-servers/instances/${id}`),
  rebootInstance: (id: number, bootType?: string) => {
    const params = bootType ? { boot_type: bootType } : {};
    return api.post(`/dedicated-servers/instances/${id}/reboot`, null, { params });
  },
  suspendInstance: (id: number, reason?: string) => 
    api.post(`/dedicated-servers/instances/${id}/suspend`, { reason }),
  unsuspendInstance: (id: number) => 
    api.post(`/dedicated-servers/instances/${id}/unsuspend`),
  terminateInstance: (id: number) => 
    api.post(`/dedicated-servers/instances/${id}/terminate`),
  getInstanceStatus: (id: number) => 
    api.get(`/dedicated-servers/instances/${id}/status`),
  // Power controls - Note: These endpoints need to be implemented in the backend
  startInstance: (id: number) => api.post(`/dedicated-servers/instances/${id}/start`),
  stopInstance: (id: number) => api.post(`/dedicated-servers/instances/${id}/stop`),
  restartInstance: (id: number) => api.post(`/dedicated-servers/instances/${id}/restart`),
};

// Reports API
export const reportsAPI = {
  exportOrders: (params: any) => api.get('/reports/orders/export', { params, responseType: 'blob' }),
  exportInvoices: (params: any) => api.get('/reports/invoices/export', { params, responseType: 'blob' }),
  getRevenueSummary: (params: any) => api.get('/reports/revenue-summary', { params }),
};

// Security API
export const securityAPI = {
  getIpLists: () => api.get('/security/ip-lists'),
  addToWhitelist: (ipAddress: string) => api.post('/security/ip-lists/whitelist', { ip_address: ipAddress }),
  addToBlacklist: (ipAddress: string) => api.post('/security/ip-lists/blacklist', { ip_address: ipAddress }),
  removeFromWhitelist: (ipAddress: string) => api.delete(`/security/ip-lists/whitelist/${ipAddress}`),
  removeFromBlacklist: (ipAddress: string) => api.delete(`/security/ip-lists/blacklist/${ipAddress}`),
};

export default api;
