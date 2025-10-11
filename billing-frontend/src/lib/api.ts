import axios from 'axios';

// Dynamically determine API URL based on how the frontend is accessed
const getApiUrl = () => {
  // If explicitly set in env, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Otherwise, detect from window location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = 8001; // Backend port
    
    // Use the same hostname as the frontend
    return `http://${hostname}:${port}`;
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:8001';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 (unauthorized), not 403 (forbidden/no permission)
    if (error.response?.status === 401) {
      // Token is invalid or expired
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
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
};

// Plans/Products API
export const plansAPI = {
  list: (params?: { category?: string; is_active?: boolean }) =>
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

// Domains API
export const domainsAPI = {
  check: (domain_name: string) =>
    api.post('/domains/check', { domain_name }),
  
  register: (data: any) =>
    api.post('/domains/register', data),
  
  list: () =>
    api.get('/domains'),
  
  get: (id: string) =>
    api.get(`/domains/${id}`),
  
  renew: (id: string, years: number) =>
    api.post(`/domains/${id}/renew`, { years }),
  
  updateNameservers: (id: string, nameservers: string[]) =>
    api.put(`/domains/${id}/nameservers`, { nameservers }),
};

// Payments API
export const paymentsAPI = {
  createIntent: (data: any) =>
    api.post('/payments/intent', data),
  
  list: () =>
    api.get('/payments'),
  
  get: (id: string) =>
    api.get(`/payments/${id}`),
  
  stats: () =>
    api.get('/payments/stats/summary'),
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

// Admin API
export const adminAPI = {
  users: {
    list: () =>
      api.get('/admin/users'),
    
    get: (id: string) =>
      api.get(`/admin/users/${id}`),
    
    update: (id: string, data: any) =>
      api.put(`/admin/users/${id}`, data),
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

export default api;
