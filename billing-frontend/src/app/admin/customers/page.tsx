"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  UserPlus,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  Filter,
  Download,
  Upload,
  ShoppingCart,
  FileText,
  CreditCard,
  MessageSquare,
  Ticket,
  Globe,
  Star,
  Settings,
  Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, plansAPI, adminAPI, ordersAPI, invoicesAPI, supportAPI, chatAPI, emailTemplatesAPI } from '@/lib/api';
import { EditLicenseModal, EditSubscriptionModal } from '@/components/customers/EditModals';
import { exportToExcel, handleFileImport } from '@/lib/excel-utils';

interface CustomerStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  customers_with_licenses: number;
  customers_with_subscriptions: number;
  new_customers_this_month: number;
  new_customers_this_week: number;
  total_revenue: number;
  average_customer_value: number;
}

interface License {
  id: string;
  license_key: string;
  status: string;
  max_accounts: number;
  max_domains: number;
  current_accounts: number;
  current_domains: number;
  activation_date: string | null;
  expiry_date: string | null;
  created_at: string;
}

interface Customer {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  total_licenses: number;
  active_licenses: number;
  total_subscriptions: number;
  active_subscriptions: number;
  total_domains: number;
  total_payments: number;
  total_invoices: number;
  outstanding_invoices: number;
  last_payment_date: string | null;
  licenses: License[];
}

export default function CustomersPage() {
  const { isAuthenticated, user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'activate' | 'deactivate' | 'delete'>('activate');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBodyText, setEmailBodyText] = useState('');
  const [emailBodyHtml, setEmailBodyHtml] = useState('');
  const [emailCss, setEmailCss] = useState('');
  const [emailJs, setEmailJs] = useState('');
  const [emailEditMode, setEmailEditMode] = useState<'rich' | 'html' | 'css' | 'js'>('rich');
  const [sendingEmail, setSendingEmail] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Predefined beautiful email templates
  const predefinedTemplates = [
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      category: 'Professional',
      color: '#4f46e5',
      subject: 'Important Update',
      preview: 'Modern professional design with blue accents',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">{{subject}}</h1>
          </div>
          <div style="padding: 40px 30px; background: #ffffff;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear {{customer_name}},</p>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">{{content}}</p>
            <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-left: 4px solid #4f46e5; border-radius: 4px;">
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">{{highlight}}</p>
            </div>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 20px 0 0 0;">Best regards,<br><strong style="color: #374151;">NextPanel Team</strong></p>
          </div>
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPanel. All rights reserved.</p>
          </div>
        </div>
      `
    },
    {
      id: 'elegant-minimal',
      name: 'Elegant Minimal',
      category: 'Minimal',
      color: '#111827',
      subject: 'Update from NextPanel',
      preview: 'Clean and elegant minimal design',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb;">
          <div style="padding: 50px 40px 30px; text-align: center; border-bottom: 2px solid #111827;">
            <h1 style="color: #111827; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">{{subject}}</h1>
          </div>
          <div style="padding: 50px 40px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0;">Dear {{customer_name}},</p>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 25px 0;">{{content}}</p>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 25px 0 0 0;">Sincerely,<br><span style="color: #111827; font-weight: 500;">NextPanel</span></p>
          </div>
          <div style="padding: 30px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} NextPanel</p>
          </div>
        </div>
      `
    },
    {
      id: 'vibrant-gradient',
      name: 'Vibrant Gradient',
      category: 'Modern',
      color: '#ec4899',
      subject: 'Exciting News!',
      preview: 'Vibrant gradient design with modern colors',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 50px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">{{subject}}</h1>
          </div>
          <div style="padding: 40px 30px; background: #ffffff;">
            <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Hi {{customer_name}},</p>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">{{content}}</p>
            <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 8px;">
              <p style="color: #374151; font-size: 15px; margin: 0; line-height: 1.7; font-weight: 500;">{{highlight}}</p>
            </div>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 20px 0 0 0;">Best regards,<br><strong style="color: #667eea;">NextPanel Team</strong></p>
          </div>
          <div style="background: #f9fafb; padding: 25px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPanel</p>
          </div>
        </div>
      `
    },
    {
      id: 'corporate-classic',
      name: 'Corporate Classic',
      category: 'Business',
      color: '#1e40af',
      subject: 'Business Update',
      preview: 'Professional corporate design',
      html: `
        <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 2px solid #1e40af;">
          <div style="background: #1e40af; padding: 35px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 1px;">{{subject}}</h1>
          </div>
          <div style="padding: 45px 35px; background: #ffffff;">
            <p style="color: #1f2937; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0;">Dear {{customer_name}},</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.8; margin: 0 0 25px 0;">{{content}}</p>
            <div style="margin: 30px 0; padding: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px;">
              <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.7; font-weight: 500;">{{highlight}}</p>
            </div>
            <p style="color: #374151; font-size: 15px; line-height: 1.8; margin: 25px 0 0 0;">Yours sincerely,<br><strong style="color: #1e40af;">NextPanel</strong></p>
          </div>
          <div style="background: #1e3a8a; padding: 20px; text-align: center;">
            <p style="color: #dbeafe; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPanel. All rights reserved.</p>
          </div>
        </div>
      `
    },
    {
      id: 'warm-friendly',
      name: 'Warm & Friendly',
      category: 'Casual',
      color: '#f59e0b',
      subject: 'Hello from NextPanel',
      preview: 'Warm and friendly design',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 45px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 600;">{{subject}}</h1>
          </div>
          <div style="padding: 40px 30px; background: #ffffff;">
            <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Hi {{customer_name}}! 👋</p>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">{{content}}</p>
            <div style="margin: 30px 0; padding: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
              <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.7;">{{highlight}}</p>
            </div>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 20px 0 0 0;">Warm regards,<br><strong style="color: #f59e0b;">The NextPanel Team</strong></p>
          </div>
          <div style="background: #fef3c7; padding: 25px; text-align: center; border-top: 1px solid #fde68a;">
            <p style="color: #92400e; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPanel</p>
          </div>
        </div>
      `
    },
    {
      id: 'tech-modern',
      name: 'Tech Modern',
      category: 'Modern',
      color: '#10b981',
      subject: 'Tech Update',
      preview: 'Modern tech-inspired design',
      html: `
        <div style="font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">{{subject}}</h1>
          </div>
          <div style="padding: 40px 30px; background: #0f172a;">
            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">Hello {{customer_name}},</p>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 0 0 20px 0;">{{content}}</p>
            <div style="margin: 30px 0; padding: 20px; background: #1e293b; border: 1px solid #10b981; border-radius: 6px; border-left-width: 4px;">
              <p style="color: #10b981; font-size: 14px; margin: 0; line-height: 1.7; font-family: monospace;">{{highlight}}</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.8; margin: 20px 0 0 0;">Best,<br><span style="color: #10b981; font-weight: 600;">NextPanel</span></p>
          </div>
          <div style="background: #1e293b; padding: 20px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; font-size: 11px; margin: 0; font-family: monospace;">© ${new Date().getFullYear()} NextPanel</p>
          </div>
        </div>
      `
    }
  ];
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [customerProducts, setCustomerProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchCustomers();
    }
  }, [isAuthenticated, searchTerm, filterActive]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/customers/stats');
      setStats(response.data);
      setAccessDenied(false);
    } catch (error: any) {
      console.error('Failed to fetch customer stats:', error);
      if (error.response?.status === 403) {
        setAccessDenied(true);
        setLoading(false);
      }
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterActive !== null) params.is_active = filterActive;

      console.log('Fetching customers...');
      console.log('API base URL:', api.defaults.baseURL);
      const response = await api.get('/customers', { params });
      console.log('Customers response:', response.data);
      setCustomers(response.data);
      setAccessDenied(false);
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      if (error.message === 'Network Error') {
        alert('Network Error: Cannot connect to backend server. Please ensure the backend is running on port 8000.');
      }
      
      if (error.response?.status === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/customers/${customerId}`);
      fetchCustomers();
      fetchStats();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete customer');
    }
  };

  // Bulk actions handlers
  const handleBulkActivate = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer');
      return;
    }

    if (!confirm(`Are you sure you want to activate ${selectedCustomers.length} customer(s)?`)) {
      return;
    }

    try {
      const promises = selectedCustomers.map(customerId => 
        adminAPI.users.update(customerId, { is_active: true })
      );
      await Promise.all(promises);
      alert(`${selectedCustomers.length} customer(s) activated successfully!`);
      setShowBulkActionsModal(false);
      setSelectedCustomers([]);
      fetchCustomers();
      fetchStats();
    } catch (error: any) {
      console.error('Failed to bulk activate:', error);
      alert('Failed to activate customers: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer');
      return;
    }

    if (!confirm(`Are you sure you want to deactivate ${selectedCustomers.length} customer(s)?`)) {
      return;
    }

    try {
      const promises = selectedCustomers.map(customerId => 
        adminAPI.users.update(customerId, { is_active: false })
      );
      await Promise.all(promises);
      alert(`${selectedCustomers.length} customer(s) deactivated successfully!`);
      setShowBulkActionsModal(false);
      setSelectedCustomers([]);
      fetchCustomers();
      fetchStats();
    } catch (error: any) {
      console.error('Failed to bulk deactivate:', error);
      alert('Failed to deactivate customers: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = selectedCustomers.map(customerId => api.delete(`/customers/${customerId}`));
      await Promise.all(promises);
      alert(`${selectedCustomers.length} customer(s) deleted successfully!`);
      setShowBulkActionsModal(false);
      setSelectedCustomers([]);
      fetchCustomers();
      fetchStats();
    } catch (error: any) {
      console.error('Failed to bulk delete:', error);
      alert('Failed to delete customers: ' + (error.response?.data?.detail || error.message));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCustomerProductsCount = (customer: Customer) => {
    // Count unique products from licenses and subscriptions
    // For now, we'll use a simple count based on licenses and subscriptions
    // In the modal, we'll show actual products from orders
    return (customer.total_licenses || 0) + (customer.total_subscriptions || 0);
  };

  const fetchCustomerProducts = async (customerId: string) => {
    setLoadingProducts(true);
    try {
      // Fetch all orders and products in parallel
      const [ordersResponse, productsResponse] = await Promise.all([
        ordersAPI.list({ customer_id: customerId }),
        plansAPI.list({ is_active: true }).catch(() => ({ data: [] })) // Fetch products, but don't fail if it errors
      ]);
      
      const orders = ordersResponse.data || [];
      const allProducts = productsResponse.data || [];
      
      // Create a map of product_id to product name for quick lookup
      const productNameMap = new Map<string, string>();
      allProducts.forEach((product: any) => {
        if (product.id) {
          productNameMap.set(product.id, product.name || product.title || '');
        }
      });
      
      // Extract all products from orders
      const productsMap = new Map<string, any>();
      
      orders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productKey = item.product_id || item.name || item.description;
            if (productKey) {
              // Try to get product name from the fetched products
              let productName = item.name || item.description;
              if (!productName && item.product_id && productNameMap.has(item.product_id)) {
                productName = productNameMap.get(item.product_id);
              }
              // Fallback to a more descriptive name if still empty
              if (!productName) {
                productName = item.product_id ? `Product ${item.product_id.substring(0, 8)}` : 'Custom Item';
              }
              
              if (!productsMap.has(productKey)) {
                productsMap.set(productKey, {
                  id: item.product_id || productKey,
                  name: productName,
                  description: item.description || '',
                  quantity: 0,
                  total_amount: 0,
                  orders: [],
                  category: item.category || 'other',
                  billing_cycle: item.billing_cycle || 'one-time',
                  price: item.price || 0,
                });
              }
              
              const product = productsMap.get(productKey)!;
              product.quantity += item.quantity || 1;
              product.total_amount += (item.price || 0) * (item.quantity || 1);
              product.orders.push({
                order_id: order.id,
                order_number: order.order_number || order.invoice_number || order.id,
                order_date: order.created_at || order.order_date,
                status: order.status,
                quantity: item.quantity || 1,
                price: item.price || 0,
                total: (item.price || 0) * (item.quantity || 1),
              });
            }
          });
        }
      });
      
      // Also fetch licenses and subscriptions as products
      try {
        const licensesResponse = await api.get(`/customers/${customerId}/licenses`);
        const licenses = licensesResponse.data || [];
        
        licenses.forEach((license: any) => {
          const productKey = `license-${license.id}`;
          if (!productsMap.has(productKey)) {
            productsMap.set(productKey, {
              id: license.id,
              name: license.plan_name || 'License',
              description: `License Key: ${license.license_key}`,
              quantity: 1,
              total_amount: 0,
              orders: [],
              category: 'license',
              billing_cycle: license.billing_cycle || 'monthly',
              price: 0,
              license_key: license.license_key,
              status: license.status,
              expiry_date: license.expiry_date,
            });
          }
        });
      } catch (error) {
        console.error('Failed to fetch licenses:', error);
      }
      
      try {
        const subscriptionsResponse = await api.get(`/customers/${customerId}/subscriptions`);
        const subscriptions = subscriptionsResponse.data || [];
        
        subscriptions.forEach((subscription: any) => {
          const productKey = `subscription-${subscription.id}`;
          if (!productsMap.has(productKey)) {
            productsMap.set(productKey, {
              id: subscription.id,
              name: subscription.plan_name || 'Subscription',
              description: `Subscription Service`,
              quantity: 1,
              total_amount: 0,
              orders: [],
              category: 'subscription',
              billing_cycle: subscription.billing_cycle || 'monthly',
              price: 0,
              status: subscription.status,
              current_period_end: subscription.current_period_end,
            });
          }
        });
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      }
      
      setCustomerProducts(Array.from(productsMap.values()));
    } catch (error) {
      console.error('Failed to fetch customer products:', error);
      setCustomerProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const response = await emailTemplatesAPI.list();
      setEmailTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    try {
      // Check predefined templates first
      const predefinedTemplate = predefinedTemplates.find(t => t.id === templateId);
      if (predefinedTemplate) {
        // Keep existing subject and content if user has already entered something
        const subject = emailSubject || predefinedTemplate.subject || 'Update from NextPanel';
        const customerName = selectedCustomer?.full_name || 'Customer';
        const content = emailBodyText || 'We wanted to reach out with an important update regarding your account.';
        const highlight = content.split('\n')[0] || 'This is an important message that requires your attention.';
        
        // Replace placeholders in HTML template
        let html = predefinedTemplate.html
          .replace(/\{\{subject\}\}/g, subject)
          .replace(/\{\{customer_name\}\}/g, customerName)
          .replace(/\{\{content\}\}/g, content.replace(/\n/g, '<br>'))
          .replace(/\{\{highlight\}\}/g, highlight);
        
        // Only update if fields are empty
        if (!emailSubject) setEmailSubject(subject);
        if (!emailBodyText) setEmailBodyText(content);
        setEmailBodyHtml(html);
        
        // Update editor content
        if (editorRef.current) {
          editorRef.current.innerHTML = content;
        }
        return;
      }
      
      // Fallback to API templates
      const template = emailTemplates.find(t => t.id === templateId);
      if (template) {
        const bodyText = template.body_text || emailBodyText || '';
        const bodyHtml = template.body_html || '';
        setEmailSubject(template.subject || emailSubject || '');
        setEmailBodyText(bodyText);
        setEmailBodyHtml(bodyHtml);
        
        // Update editor content
        if (editorRef.current) {
          editorRef.current.innerHTML = bodyHtml || bodyText;
        }
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };
  
  // Sync editor when emailBodyHtml changes externally
  useEffect(() => {
    if (editorRef.current && emailBodyHtml && !editorRef.current.textContent) {
      editorRef.current.innerHTML = emailBodyHtml;
    }
  }, [emailBodyHtml]);
  
  const getRenderedEmailHtml = () => {
    if (!emailBodyHtml) return emailBodyText || '';
    
    // Replace placeholders with actual values
    const customerName = selectedCustomer?.full_name || 'Customer';
    const subject = emailSubject || 'Update from NextPanel';
    // Use emailBodyText if available, otherwise use a default message
    const content = emailBodyText || 'We wanted to reach out with an important update regarding your account.';
    const highlight = emailBodyText ? emailBodyText.split('\n')[0] : 'This is an important message that requires your attention.';
    
    let html = emailBodyHtml
      .replace(/\{\{subject\}\}/g, subject)
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{content\}\}/g, content.replace(/\n/g, '<br>'))
      .replace(/\{\{highlight\}\}/g, highlight);
    
    // Wrap with CSS if provided
    if (emailCss && emailCss.trim().length > 0) {
      html = `<style>${emailCss}</style>${html}`;
    }
    
    // Add JS if provided (though most email clients won't execute it)
    if (emailJs && emailJs.trim().length > 0) {
      html = `${html}<script>${emailJs}</script>`;
    }
    
    return html;
  };

  const handleSendEmail = async () => {
    if (!selectedCustomer) return;
    if (!emailSubject.trim()) {
      alert('Please enter an email subject');
      return;
    }
    if (!emailBodyText.trim() && !emailBodyHtml.trim()) {
      alert('Please enter email content');
      return;
    }

    setSendingEmail(true);
    try {
      // Combine HTML with CSS and JS
      let finalHtml = emailBodyHtml;
      if (emailCss && emailCss.trim().length > 0) {
        finalHtml = `<style>${emailCss}</style>${finalHtml}`;
      }
      if (emailJs && emailJs.trim().length > 0) {
        finalHtml = `${finalHtml}<script>${emailJs}</script>`;
      }

      await api.post('/email-templates/send', {
        customer_id: selectedCustomer.id,
        template_id: selectedTemplate || null,
        subject: emailSubject,
        body_text: emailBodyText,
        body_html: finalHtml,
        variables: {
          customer_name: selectedCustomer.full_name,
          customer_email: selectedCustomer.email,
          company_name: selectedCustomer.company_name || '',
        }
      });
      alert(`Email sent successfully to ${selectedCustomer.email}`);
      setShowSendEmailModal(false);
      setSelectedTemplate('');
      setEmailSubject('');
      setEmailBodyText('');
      setEmailBodyHtml('');
    } catch (error: any) {
      console.error('Failed to send email:', error);
      alert(`Failed to send email: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Export/Import handlers
  const handleExport = () => {
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }
    
    const exportData = customers.map(customer => ({
      'Customer ID': customer.id,
      'Email': customer.email,
      'Full Name': customer.full_name || '',
      'Company Name': customer.company_name || '',
      'Is Active': customer.is_active ? 'Yes' : 'No',
      'Is Admin': customer.is_admin ? 'Yes' : 'No',
      'Total Products': (customer.total_licenses || 0) + (customer.total_subscriptions || 0),
      'Total Domains': customer.total_domains || 0,
      'Total Payments': customer.total_payments || 0,
      'Total Invoices': customer.total_invoices || 0,
      'Outstanding Invoices': customer.outstanding_invoices || 0,
      'Last Payment Date': customer.last_payment_date ? formatDate(customer.last_payment_date) : 'N/A',
      'Created At': formatDate(customer.created_at),
    }));
    
    exportToExcel(exportData, `customers_export_${new Date().toISOString().split('T')[0]}`, 'Customers');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleFileImport(
      file,
      async (data) => {
        try {
          // Process imported customer data
          // Note: This is a basic implementation - you may want to add validation and API calls
          console.log('Imported customer data:', data);
          alert(`Successfully imported ${data.length} customer(s). Import functionality will process the data.`);
          
          // TODO: Add API call to create/update customers from imported data
          // Example:
          // for (const row of data) {
          //   await api.post('/customers', {
          //     email: row['Email'],
          //     full_name: row['Full Name'],
          //     company_name: row['Company Name'],
          //     is_active: row['Is Active'] === 'Yes',
          //   });
          // }
          // fetchCustomers();
        } catch (error: any) {
          alert(`Failed to import customers: ${error.message}`);
        }
      },
      (error) => {
        alert(`Import error: ${error}`);
      }
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show access denied message if user is not an admin
  if (accessDenied) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6">
              You need administrator privileges to access the customer management section.
              Please contact your system administrator if you believe you should have access.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedCustomers.length > 0 && (
            <button
              onClick={() => setShowBulkActionsModal(true)}
              className="flex items-center gap-1 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Bulk Actions</span>
              <span className="sm:hidden">Bulk</span>
              <span className="px-1.5 py-0.5 bg-purple-500 rounded text-xs">({selectedCustomers.length})</span>
            </button>
          )}
          <div className="flex items-center gap-2 border-r-0 sm:border-r border-gray-300 dark:border-gray-600 pr-0 sm:pr-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1 sm:gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Export to Excel"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleImportClick}
              className="flex items-center gap-1 sm:gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Import from Excel/CSV"
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        <button
          onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
        >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
        </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total_customers}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  +{stats.new_customers_this_month} this month
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.active_customers}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {((stats.active_customers / stats.total_customers) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.total_revenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatCurrency(stats.average_customer_value)} avg/customer
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">With Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.customers_with_licenses + stats.customers_with_subscriptions}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Active customers with products
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === true
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterActive === false
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCustomers(customers.map(c => c.id));
                        } else {
                          setSelectedCustomers([]);
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomers([...selectedCustomers, customer.id]);
                          } else {
                            setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <a
                          href={`/admin/customers/${customer.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                        >
                          {customer.full_name}
                        </a>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.email}
                        </div>
                        {customer.company_name && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {customer.company_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          customer.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          setSelectedCustomer(customer);
                          setShowProductsModal(true);
                          await fetchCustomerProducts(customer.id);
                        }}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        {getCustomerProductsCount(customer)} product{getCustomerProductsCount(customer) !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(customer.total_payments)}
                      </div>
                      {customer.outstanding_invoices > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {customer.outstanding_invoices} unpaid
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowEditModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Edit Customer"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowSendEmailModal(true);
                            loadEmailTemplates();
                          }}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                          title="Send Email"
                        >
                          <Mail className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCustomers();
            fetchStats();
          }}
        />
      )}

      {/* Bulk Actions Modal */}
      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Bulk Actions ({selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''})
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Action
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bulkCustomerAction"
                      value="activate"
                      checked={bulkActionType === 'activate'}
                      onChange={(e) => setBulkActionType(e.target.value as 'activate')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">Activate Customers</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bulkCustomerAction"
                      value="deactivate"
                      checked={bulkActionType === 'deactivate'}
                      onChange={(e) => setBulkActionType(e.target.value as 'deactivate')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">Deactivate Customers</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bulkCustomerAction"
                      value="delete"
                      checked={bulkActionType === 'delete'}
                      onChange={(e) => setBulkActionType(e.target.value as 'delete')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">Delete Customers</span>
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This action will be applied to <strong>{selectedCustomers.length}</strong> selected customer{selectedCustomers.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowBulkActionsModal(false);
                  setBulkActionType('activate');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkActionType === 'activate') {
                    handleBulkActivate();
                  } else if (bulkActionType === 'deactivate') {
                    handleBulkDeactivate();
                  } else if (bulkActionType === 'delete') {
                    handleBulkDelete();
                  }
                }}
                className={`px-4 py-2 rounded-md text-white ${
                  bulkActionType === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {bulkActionType === 'activate' && 'Activate Customers'}
                {bulkActionType === 'deactivate' && 'Deactivate Customers'}
                {bulkActionType === 'delete' && 'Delete Customers'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedCustomer && (
        <EditCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
            fetchCustomers();
            fetchStats();
          }}
        />
      )}

      {showDetailsModal && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCustomer(null);
          }}
          onUpdate={() => {
            fetchCustomers();
            fetchStats();
          }}
        />
      )}

      {/* Send Email Modal */}
      {showSendEmailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Send Email to {selectedCustomer.full_name}
                </h2>
                <button
                  onClick={() => {
                    setShowSendEmailModal(false);
                    setSelectedTemplate('');
                    setEmailSubject('');
                    setEmailBodyText('');
                    setEmailBodyHtml('');
                    setEmailCss('');
                    setEmailJs('');
                    setEmailEditMode('rich');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedCustomer.email}
              </p>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Left Side - Form Fields */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-gray-200 dark:border-gray-700">
                {/* Template Selection - Visual Grid */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Choose Email Template
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {predefinedTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          selectedTemplate === template.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: template.color }}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {template.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {template.category}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                              {template.preview}
                            </div>
                          </div>
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {emailTemplates.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Custom Templates
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">-- Select Custom Template --</option>
                        {emailTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectedTemplate && (
                    <button
                      onClick={() => {
                        setSelectedTemplate('');
                        setEmailBodyHtml('');
                        setEmailBodyText('');
                        setEmailCss('');
                        setEmailJs('');
                        if (editorRef.current) {
                          editorRef.current.innerHTML = '';
                        }
                      }}
                      className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      Clear template
                    </button>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Email subject"
                  />
                </div>

                {/* Email Body Editors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Body *
                    </label>
                    {/* Edit Mode Tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEmailEditMode('rich')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          emailEditMode === 'rich'
                            ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        Rich
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailEditMode('html')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          emailEditMode === 'html'
                            ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailEditMode('css')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          emailEditMode === 'css'
                            ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        CSS
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailEditMode('js')}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          emailEditMode === 'js'
                            ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        JS
                      </button>
                    </div>
                  </div>
                  
                  {/* Rich Text Editor */}
                  {emailEditMode === 'rich' && (
                    <>
                  {/* Toolbar */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap items-center gap-2">
                    {/* Text Formatting */}
                    <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <button
                        type="button"
                        onClick={() => document.execCommand('bold', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Bold"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('italic', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Italic"
                      >
                        <em>I</em>
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('underline', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 underline"
                        title="Underline"
                      >
                        U
                      </button>
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <select
                        defaultValue="3"
                        onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        title="Font Size"
                      >
                        <option value="1">Small</option>
                        <option value="3">Normal</option>
                        <option value="4">Large</option>
                        <option value="5">X-Large</option>
                        <option value="6">XX-Large</option>
                      </select>
                    </div>

                    {/* Text Color */}
                    <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <input
                        type="color"
                        onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                        className="h-7 w-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        title="Text Color"
                        defaultValue="#000000"
                      />
                    </div>

                    {/* Alignment */}
                    <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <button
                        type="button"
                        onClick={() => document.execCommand('justifyLeft', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Align Left"
                      >
                        ⬅
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('justifyCenter', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Align Center"
                      >
                        ⬌
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('justifyRight', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Align Right"
                      >
                        ➡
                      </button>
                    </div>

                    {/* Lists */}
                    <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
                      <button
                        type="button"
                        onClick={() => document.execCommand('insertUnorderedList', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Bullet List"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('insertOrderedList', false)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Numbered List"
                      >
                        1.
                      </button>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Enter URL:');
                          if (url) document.execCommand('createLink', false, url);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                        title="Insert Link"
                      >
                        🔗
                      </button>
                    </div>
                  </div>

                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => {
                      const html = e.currentTarget.innerHTML;
                      const text = e.currentTarget.innerText;
                      setEmailBodyHtml(html);
                      setEmailBodyText(text);
                      // Update template if selected
                      if (selectedTemplate) {
                        const predefinedTemplate = predefinedTemplates.find(t => t.id === selectedTemplate);
                        if (predefinedTemplate) {
                          const customerName = selectedCustomer?.full_name || 'Customer';
                          const subject = emailSubject || predefinedTemplate.subject || 'Update from NextPanel';
                          const content = html || 'We wanted to reach out with an important update.';
                          const highlight = text.split('\n')[0] || 'Important information';
                          
                          let templateHtml = predefinedTemplate.html
                            .replace(/\{\{subject\}\}/g, subject)
                            .replace(/\{\{customer_name\}\}/g, customerName)
                            .replace(/\{\{content\}\}/g, content)
                            .replace(/\{\{highlight\}\}/g, highlight);
                          setEmailBodyHtml(templateHtml);
                        }
                      }
                    }}
                    className="w-full min-h-[200px] px-3 py-2 border-x border-b border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ 
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                    data-placeholder="Start typing your email content here..."
                  />
                  <style dangerouslySetInnerHTML={{ __html: `
                    [contenteditable][data-placeholder]:empty:before {
                      content: attr(data-placeholder);
                      color: #9ca3af;
                      pointer-events: none;
                    }
                  `}} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedTemplate ? 'Template selected. Format your text using the toolbar above.' : 'Format your email using the toolbar above. HTML will be generated automatically.'}
                  </p>
                    </>
                  )}

                  {/* HTML Editor */}
                  {emailEditMode === 'html' && (
                    <div>
                      <textarea
                        value={emailBodyHtml}
                        onChange={(e) => {
                          setEmailBodyHtml(e.target.value);
                          // Extract text from HTML
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = e.target.value;
                          setEmailBodyText(tempDiv.textContent || tempDiv.innerText || '');
                        }}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="<!-- Enter your HTML email content here -->"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Edit the raw HTML content of your email
                      </p>
                    </div>
                  )}

                  {/* CSS Editor */}
                  {emailEditMode === 'css' && (
                    <div>
                      <textarea
                        value={emailCss}
                        onChange={(e) => setEmailCss(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="/* Add your custom CSS styles here */&#10;.email-container {&#10;  font-family: Arial, sans-serif;&#10;  color: #333;&#10;}"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add custom CSS styles that will be applied to your email
                      </p>
                    </div>
                  )}

                  {/* JavaScript Editor */}
                  {emailEditMode === 'js' && (
                    <div>
                      <textarea
                        value={emailJs}
                        onChange={(e) => setEmailJs(e.target.value)}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="// Add your custom JavaScript here&#10;// Note: Email clients have limited JavaScript support"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add custom JavaScript (Note: Most email clients don't support JavaScript)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Email Preview */}
              <div className="w-1/2 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Preview
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {emailBodyHtml ? 'HTML' : 'Text'} version
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  {/* Email Client Header */}
                  <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {selectedCustomer?.full_name || 'Customer'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {selectedCustomer?.email || 'customer@example.com'}
                        </div>
                      </div>
                    </div>
                    {emailSubject && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject:</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {emailSubject}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Email Body Preview */}
                  <div className="bg-white dark:bg-gray-800 min-h-[400px] overflow-y-auto" style={{ backgroundColor: '#f3f4f6' }}>
                    {emailBodyHtml ? (
                      <div 
                        className="email-preview-html"
                        style={{
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          padding: '20px',
                          minHeight: '400px',
                        }}
                        dangerouslySetInnerHTML={{ __html: getRenderedEmailHtml() }}
                      />
                    ) : emailBodyText ? (
                      <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans p-6">
                        {emailBodyText}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-8">
                        <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Select a template or start typing to see preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSendEmailModal(false);
                  setSelectedTemplate('');
                  setEmailSubject('');
                  setEmailBodyText('');
                  setEmailBodyHtml('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || (!emailBodyText.trim() && !emailBodyHtml.trim())}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Products & Services - {selectedCustomer.full_name}
                </h2>
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setCustomerProducts([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : customerProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No products or services found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerProducts.map((product, index) => (
                    <div
                      key={product.id || index}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {product.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Category: <span className="font-medium">{product.category || 'other'}</span></span>
                            <span>Billing: <span className="font-medium">{product.billing_cycle || 'one-time'}</span></span>
                            {product.quantity > 0 && (
                              <span>Quantity: <span className="font-medium">{product.quantity}</span></span>
                            )}
                            {product.status && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                product.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                product.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                              }`}>
                                {product.status}
                              </span>
                            )}
                          </div>
                          {product.license_key && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">License Key:</p>
                              <p className="font-mono text-sm text-gray-900 dark:text-white">{product.license_key}</p>
                            </div>
                          )}
                          {product.expiry_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Expires: {formatDate(product.expiry_date)}
                            </p>
                          )}
                          {product.current_period_end && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Period End: {formatDate(product.current_period_end)}
                            </p>
                          )}
                        </div>
                        {product.total_amount > 0 && (
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(product.total_amount)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {product.orders && product.orders.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Orders ({product.orders.length}):
                          </p>
                          <div className="space-y-2">
                            {product.orders.map((order: any, orderIndex: number) => (
                              <div
                                key={orderIndex}
                                className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded"
                              >
                                <div>
                                  <a
                                    href={`/admin/orders/${order.order_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                  >
                                    Order #{order.order_number}
                                  </a>
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    {formatDate(order.order_date)}
                                  </span>
                                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-gray-900 dark:text-white">
                                    {formatCurrency(order.total)}
                                  </div>
                                  {order.quantity > 1 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Qty: {order.quantity}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setShowProductsModal(false);
                  setCustomerProducts([]);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Customer Modal Component
function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    company_name: '',
    password: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Account counts by role
  const [accountCounts, setAccountCounts] = useState<any>(null);
  const [loadingAccountCounts, setLoadingAccountCounts] = useState(false);

  // Product selection
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedProductObj, setSelectedProductObj] = useState<any>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Account Type and Provisioning
  const [accountType, setAccountType] = useState(''); // 'panel', 'reseller', 'master-reseller'
  const [productType, setProductType] = useState(''); // 'hosting', 'domain', 'ssl', etc.
  const [provisionAccount, setProvisionAccount] = useState(false);
  const [provisionData, setProvisionData] = useState({
    username: '',
    hosting_password: '',
    server_id: '',
    account_type: 'panel',
  });
  const [servers, setServers] = useState<any[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);

  // Password visibility
  const [showBillingPassword, setShowBillingPassword] = useState(false);
  const [showHostingPassword, setShowHostingPassword] = useState(false);
  const [passwordsSaved, setPasswordsSaved] = useState(false);

  // Fetch account counts and products when modal opens
  useEffect(() => {
    fetchAccountCounts();
    fetchProducts();
  }, []);

  const fetchAccountCounts = async () => {
    setLoadingAccountCounts(true);
    try {
      console.log('Fetching account counts from:', '/nextpanel/accounts/counts/by-role');
      const response = await api.get('/nextpanel/accounts/counts/by-role');
      console.log('Account counts response:', response.data);
      setAccountCounts(response.data);
    } catch (error: any) {
      console.error('Failed to fetch account counts:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty counts on error
      setAccountCounts({
        total_accounts: 0,
        by_role: {
          panel: 0,
          reseller: 0,
          'master-reseller': 0,
          unknown: 0
        },
        summary: {
          regular_users: 0,
          reseller_users: 0,
          master_reseller_users: 0,
          unknown_accounts: 0
        }
      });
    } finally {
      setLoadingAccountCounts(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await plansAPI.list({ is_active: true });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchServers = async () => {
    setLoadingServers(true);
    try {
      const response = await api.get('/nextpanel/servers');
      setServers(response.data);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoadingServers(false);
    }
  };

  const generateStrongPassword = (length: number = 16): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert(`${type} password copied to clipboard!`);
      } else {
        // Fallback method for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          alert(`${type} password copied to clipboard!`);
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
          // Show the password in a prompt as last resort
          prompt(`Copy this ${type.toLowerCase()} password:`, text);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Show the password in a prompt as last resort
      prompt(`Copy this ${type.toLowerCase()} password:`, text);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create customer
      const customerResponse = await api.post('/customers', formData);
      const newCustomer = customerResponse.data;
      
      // If provisioning is enabled and it's a hosting service, provision the account
      if (provisionAccount && accountType && productType === 'hosting' && provisionData.username && provisionData.hosting_password && provisionData.server_id) {
        try {
          // Determine is_admin flag based on account type
          let is_admin = false;
          if (accountType === 'reseller' || accountType === 'master-reseller') {
            is_admin = true;
          }
          
          const provisionResponse = await api.post('/nextpanel/provision', {
            customer_id: newCustomer.id,
            username: provisionData.username.trim(),
            password: provisionData.hosting_password,
            email: formData.email,
            full_name: formData.full_name,
            company: formData.company_name,
            server_id: parseInt(provisionData.server_id),
            is_admin: is_admin,
            account_type: accountType, // Pass the specific account type
          });

          if (provisionResponse.data.success) {
            const accountTypeName = accountType === 'panel' ? 'Regular Account' : accountType === 'reseller' ? 'Reseller Account' : 'Master Reseller Account';
            alert(`Customer created and ${accountTypeName} provisioned successfully! NextPanel User ID: ${provisionResponse.data.nextpanel_user_id}`);
            // Refresh account counts after successful provisioning
            fetchAccountCounts();
          } else {
            alert(`Customer created, but provisioning failed: ${provisionResponse.data.error}`);
          }
        } catch (provError: any) {
          console.error('Provisioning error:', provError);
          alert('Customer created successfully, but provisioning failed. You can provision later from customer details.');
        }
      }
      
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Create New Customer
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Two Column Layout */}
          <div className="grid gap-6 grid-cols-2">
            {/* Left Column: Customer Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                Customer Details
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password (Billing Login) *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showBillingPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowBillingPassword(!showBillingPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showBillingPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newPassword = generateStrongPassword();
                  setFormData({ ...formData, password: newPassword });
                  setShowBillingPassword(true);
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm whitespace-nowrap"
                title="Generate strong password"
              >
                🎲 Generate
              </button>
              {formData.password && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(formData.password, 'Billing')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  title="Copy password"
                >
                  📋 Copy
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              For logging into the billing system
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

        </div>

        {/* Right Column: Product Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
            Product Selection
          </h3>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Search & Select Product/Service (Optional)
            </label>
            
            {/* Searchable Product Input */}
            <div className="relative">
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => {
                  setProductSearchTerm(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                placeholder="Type to search for products... (or select 'No Product')"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              
              {/* Dropdown with filtered products */}
              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {loadingProducts ? (
                    <div className="px-3 py-2 text-gray-500">Loading products...</div>
                  ) : (
                    <>
                      {/* No Product Option */}
                      <div
                        onClick={() => {
                          setSelectedProduct('');
                          setSelectedProductObj(null);
                          setProductSearchTerm('');
                          setShowProductDropdown(false);
                          setAccountType('');
                          setProductType('');
                          setProvisionAccount(false);
                          setProvisionData({ ...provisionData, account_type: 'panel' });
                        }}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">No Product</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Just create customer without product</div>
                      </div>
                      
                          {/* Filtered Products - Organized by Category */}
                          {(() => {
                            // Filter products based on search term
                            const filteredProducts = products.filter(product => 
                              !productSearchTerm || 
                              product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                              product.description?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                              (product.features?.category || '').toLowerCase().includes(productSearchTerm.toLowerCase())
                            );

                            // Group products by category
                            const groupedProducts = filteredProducts.reduce((groups: any, product) => {
                              const category = product.features?.category || 'other';
                              if (!groups[category]) {
                                groups[category] = [];
                              }
                              groups[category].push(product);
                              return groups;
                            }, {});

                            // Define category order and display info
                            const categoryInfo: any = {
                              hosting: { name: '🌐 Hosting Services', icon: '🌐' },
                              domain: { name: '🌍 Domain Services', icon: '🌍' },
                              ssl: { name: '🔒 SSL Certificates', icon: '🔒' },
                              vps: { name: '🖥️ VPS Services', icon: '🖥️' },
                              email: { name: '📧 Email Services', icon: '📧' },
                              backup: { name: '💾 Backup Services', icon: '💾' },
                              software: { name: '💻 Software Licenses', icon: '💻' },
                              cdn: { name: '⚡ CDN Services', icon: '⚡' },
                              other: { name: '📦 Other Services', icon: '📦' }
                            };

                            const categoryOrder = ['hosting', 'domain', 'ssl', 'vps', 'email', 'backup', 'software', 'cdn', 'other'];

                            return categoryOrder.map(categoryKey => {
                              const categoryProducts = groupedProducts[categoryKey];
                              if (!categoryProducts || categoryProducts.length === 0) return null;

                              return (
                                <div key={categoryKey}>
                                  {/* Category Header */}
                                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border-b border-gray-200 dark:border-gray-500">
                                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                      {categoryInfo[categoryKey]?.name || `${categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)} Services`}
                                    </div>
                                  </div>
                                  
                                  {/* Products in this category */}
                                  {categoryProducts.map((product: any) => {
                                    const category = product.features?.category || 'other';
                                    const subcategory = product.features?.subcategory || product.features?.user_type;
                                    
                                    let icon = categoryInfo[category]?.icon || '📦';
                                    if (category === 'hosting' && subcategory === 'regular-user') icon = '🌐';
                                    else if (category === 'hosting' && subcategory === 'reseller-user') icon = '💼';
                                    else if (category === 'hosting' && subcategory === 'master-reseller-user') icon = '👑';
                                    
                                    return (
                                      <div
                                        key={product.id}
                                        onClick={() => {
                                          setSelectedProduct(product.id);
                                          setSelectedProductObj(product);
                                          setProductSearchTerm('');
                                          setShowProductDropdown(false);
                                          
                                          // Set product type based on category
                                          setProductType(category);
                                          
                                          // Determine account type from subcategory for hosting products
                                          let newAccountType = '';
                                          if (category === 'hosting' && subcategory) {
                                            if (subcategory === 'regular-user') {
                                              newAccountType = 'panel';
                                            } else if (subcategory === 'reseller-user') {
                                              newAccountType = 'reseller';
                                            } else if (subcategory === 'master-reseller-user') {
                                              newAccountType = 'master-reseller';
                                            }
                                          }
                                          
                                          // Enable provisioning for hosting products
                                          if (category === 'hosting' && newAccountType) {
                                            setProvisionAccount(true);
                                            setAccountType(newAccountType);
                                            fetchServers(); // Load servers when hosting is selected
                                          } else {
                                            setProvisionAccount(false);
                                            setAccountType('');
                                          }
                                          
                                          // Update provision data account type
                                          setProvisionData({ ...provisionData, account_type: newAccountType });
                                        }}
                                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <span>{icon}</span>
                                            <div>
                                              <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {product.description || `${category} service`}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                              ${product.price_monthly}/mo
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              ${product.price_yearly}/yr
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }).filter(Boolean);
                          })()}
                      
                      {/* No results */}
                      {productSearchTerm && products.filter(product => 
                        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                        product.description?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                        (product.features?.category || '').toLowerCase().includes(productSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-center">
                          No products found matching "{productSearchTerm}"
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Click outside to close dropdown */}
            {showProductDropdown && (
              <div 
                className="fixed inset-0 z-0" 
                onClick={() => setShowProductDropdown(false)}
              />
            )}
            
            {selectedProduct && selectedProductObj ? (
              <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Selected: {selectedProductObj.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ${selectedProductObj.price_monthly}/month • ${selectedProductObj.price_yearly}/year
                </div>
              </div>
            ) : !selectedProduct && productSearchTerm === '' && !showProductDropdown ? (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-md border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No Product Selected
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Customer will be created without any product assignment
                </div>
              </div>
            ) : null}
          </div>



          {/* Hosting Provisioning Details - Shows when hosting product is selected */}
          {accountType && productType === 'hosting' && (
            <div className="mt-4 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {accountType === 'panel' ? 'Regular' : accountType === 'reseller' ? 'Reseller' : 'Master Reseller'} Account Details
                </h4>

                {loadingServers ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading servers...</div>
                ) : servers.length === 0 ? (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400">
                      ⚠️ No NextPanel servers available. Add a server first in the Server management page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hosting Username *
                      </label>
                      <input
                        type="text"
                        required={Boolean(accountType && productType === 'hosting')}
                        value={provisionData.username}
                        onChange={(e) => setProvisionData({ ...provisionData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., johndoe"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        For logging into NextPanel
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hosting Password *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showHostingPassword ? "text" : "password"}
                            required={provisionAccount}
                            minLength={8}
                            value={provisionData.hosting_password}
                            onChange={(e) => setProvisionData({ ...provisionData, hosting_password: e.target.value })}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Strong password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowHostingPassword(!showHostingPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showHostingPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newPassword = generateStrongPassword();
                            setProvisionData({ ...provisionData, hosting_password: newPassword });
                            setShowHostingPassword(true);
                          }}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm whitespace-nowrap"
                          title="Generate strong password"
                        >
                          🎲 Generate
                        </button>
                        {provisionData.hosting_password && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(provisionData.hosting_password, 'Hosting')}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            title="Copy password"
                          >
                            📋 Copy
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        For logging into NextPanel hosting account
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        NextPanel Server *
                      </label>
                      <select
                        required={provisionAccount}
                        value={provisionData.server_id}
                        onChange={(e) => setProvisionData({ ...provisionData, server_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select a server</option>
                        {servers.map(server => (
                          <option key={server.id} value={server.id}>
                            {server.name} ({server.current_accounts}/{server.capacity} accounts)
                          </option>
                        ))}
                      </select>
                      {provisionData.server_id && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            {(() => {
                              const selectedServer = servers.find(s => s.id.toString() === provisionData.server_id);
                              if (!selectedServer) return '';
                              
                              const accountTypeLabel = accountType === 'panel' ? 'Regular' : 
                                                     accountType === 'reseller' ? 'Reseller' : 
                                                     'Master Reseller';
                              
                              // For demo purposes, showing estimated count based on account type
                              // In a real implementation, you'd fetch actual counts by type per server
                              const estimatedCount = accountType === 'panel' ? Math.floor(selectedServer.current_accounts * 0.7) :
                                                    accountType === 'reseller' ? Math.floor(selectedServer.current_accounts * 0.25) :
                                                    Math.floor(selectedServer.current_accounts * 0.05);
                              
                              return `📊 ${selectedServer.name} currently has approximately ${estimatedCount} ${accountTypeLabel} accounts`;
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

          {/* Password Security Confirmation */}
          {(formData.password || (provisionAccount && provisionData.hosting_password)) && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <div className="flex items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <input
                  type="checkbox"
                  id="passwords_saved"
                  checked={passwordsSaved}
                  onChange={(e) => setPasswordsSaved(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded mt-0.5"
                  required
                />
                <label htmlFor="passwords_saved" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">✅ I have saved the passwords securely</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Please ensure you have safely stored both the billing login password
                    {provisionAccount && ' and hosting account password'} before proceeding.
                  </p>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || 
                (Boolean(formData.password || (provisionAccount && provisionData.hosting_password)) && !passwordsSaved) ||
                (productType === 'hosting' && provisionAccount && (!provisionData.username || !provisionData.hosting_password || !provisionData.server_id))
              }
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : (provisionAccount && accountType) ? 'Create & Provision' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Customer Modal Component
function EditCustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    email: customer.email,
    full_name: customer.full_name,
    company_name: customer.company_name || '',
    is_active: customer.is_active,
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData: any = {
        email: formData.email,
        full_name: formData.full_name,
        company_name: formData.company_name || null,
        is_active: formData.is_active,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.put(`/customers/${customer.id}`, updateData);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Customer</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="is_active_edit" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Customer Details Modal Component
function CustomerDetailsModal({
  customer,
  onClose,
  onUpdate,
}: {
  customer: Customer;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'orders' | 'licenses' | 'subscriptions' | 'invoices' | 'transactions' | 'payment-settings' | 'domains' | 'tickets' | 'chats' | 'reviews'>(
    'details'
  );
  const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
  const [showEditLicenseModal, setShowEditLicenseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  
  // New state for additional tabs
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Payment settings
  const [paymentCycle, setPaymentCycle] = useState('monthly');
  const [invoiceCycle, setInvoiceCycle] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Create invoice modal
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'domains') {
      fetchDomains();
    } else if (activeTab === 'tickets') {
      fetchTickets();
    } else if (activeTab === 'chats') {
      fetchChats();
    } else if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab]);

  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const response = await api.get(`/customers/${customer.id}/subscriptions`);
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await ordersAPI.list({ customer_id: customer.id });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await invoicesAPI.list({ customer_id: customer.id });
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await api.get('/payments', { params: { customer_id: customer.id } });
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchDomains = async () => {
    setLoadingDomains(true);
    try {
      const response = await api.get(`/customers/${customer.id}/domains`);
      setDomains(response.data || []);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      setDomains([]);
    } finally {
      setLoadingDomains(false);
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await supportAPI.list({ user_id: customer.id });
      setTickets(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchChats = async () => {
    setLoadingChats(true);
    try {
      // Fetch all sessions (admin can see all)
      // The backend automatically filters for non-admins, but admins see all
      const response = await chatAPI.listSessions({ limit: 1000 });
      const allSessions = response.data || [];
      // Filter sessions for this customer
      const customerChats = allSessions.filter((chat: any) => 
        chat.user_id === customer.id || chat.user?.id === customer.id
      );
      setChats(customerChats);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      // Reviews API - if it exists
      const response = await api.get(`/customers/${customer.id}/reviews`);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put(`/customers/${customer.id}/settings`, {
        payment_cycle: paymentCycle,
        invoice_cycle: invoiceCycle,
        payment_method: paymentMethod,
      });
      alert('Payment settings saved successfully!');
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {customer.full_name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{customer.email}</p>
              {customer.company_name && (
                <p className="text-sm text-gray-400 dark:text-gray-500">{customer.company_name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-1" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'licenses'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Licenses ({customer.total_licenses})
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Subscriptions ({customer.total_subscriptions})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-1" />
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('payment-settings')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'payment-settings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Payment Settings
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'domains'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-1" />
              Domains ({customer.total_domains || 0})
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'tickets'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Ticket className="w-4 h-4 inline mr-1" />
              Tickets
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'chats'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                activeTab === 'reviews'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Reviews
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(customer.created_at)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(customer.total_payments)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Payment</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(customer.last_payment_date)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Licenses</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {customer.active_licenses}/{customer.total_licenses}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Invoices</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {customer.outstanding_invoices}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Customer Licenses
                </h3>
                <button
                  onClick={() => setShowAddLicenseModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add License
                </button>
              </div>

              {customer.licenses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No licenses found
                </p>
              ) : (
                <div className="space-y-3">
                  {customer.licenses.map((license) => (
                    <div
                      key={license.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                            {license.license_key}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Status: <span className={`font-semibold ${license.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{license.status}</span></span>
                            <span>Accounts: {license.current_accounts}/{license.max_accounts}</span>
                            <span>Domains: {license.current_domains}/{license.max_domains}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Expires: {formatDate(license.expiry_date)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedLicense(license);
                              setShowEditLicenseModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit License"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this license?')) {
                                try {
                                  await api.delete(`/customers/${customer.id}/licenses/${license.id}`);
                                  onUpdate();
                                  onClose();
                                } catch (error) {
                                  alert('Failed to cancel license');
                                }
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Cancel License"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Customer Subscriptions
              </h3>
              
              {loadingSubscriptions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : subscriptions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No subscriptions found
                </p>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((subscription: any) => (
                    <div
                      key={subscription.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              subscription.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : subscription.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {subscription.status}
                            </span>
                            {subscription.cancel_at_period_end && (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Cancels at period end
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <div>Period: {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</div>
                            <div className="text-xs mt-1">License ID: {subscription.license_id}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowEditSubscriptionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit Subscription"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Customer Orders
                </h3>
              </div>
              
              {loadingOrders ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No orders found
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <div key={order.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              Order #{order.order_number || order.id}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Product: {order.product_name || 'N/A'}</div>
                            <div>Amount: {formatCurrency(order.total_amount || 0)}</div>
                            <div>Date: {formatDate(order.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Customer Invoices
                </h3>
                <button
                  onClick={() => setShowCreateInvoiceModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Invoice
                </button>
              </div>
              
              {loadingInvoices ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : invoices.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No invoices found
                </p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              Invoice #{invoice.invoice_number || invoice.id}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                            }`}>
                              {invoice.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Amount: {formatCurrency(invoice.total_amount || 0)}</div>
                            <div>Due Date: {formatDate(invoice.due_date)}</div>
                            <div>Created: {formatDate(invoice.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment Transactions
              </h3>
              
              {loadingTransactions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No transactions found
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {transaction.payment_method || 'Payment'}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Amount: {formatCurrency(transaction.amount || 0)}</div>
                            <div>Date: {formatDate(transaction.created_at)}</div>
                            {transaction.transaction_id && (
                              <div className="text-xs">Transaction ID: {transaction.transaction_id}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment-settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment & Invoice Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Cycle
                  </label>
                  <select
                    value={paymentCycle}
                    onChange={(e) => setPaymentCycle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Cycle
                  </label>
                  <select
                    value={invoiceCycle}
                    onChange={(e) => setInvoiceCycle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="on-demand">On Demand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select payment method</option>
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <button
                  onClick={handleSavePaymentSettings}
                  disabled={savingSettings}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'domains' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Customer Domains
              </h3>
              
              {loadingDomains ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : domains.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No domains found
                </p>
              ) : (
                <div className="space-y-3">
                  {domains.map((domain: any) => (
                    <div key={domain.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {domain.domain_name}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              domain.status === 'active' || domain.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              domain.status === 'expired' || domain.status === 'EXPIRED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {domain.status}
                            </span>
                            {domain.auto_renew && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                Auto-renew: ON
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {domain.registrar && (
                              <div>Registrar: {domain.registrar}</div>
                            )}
                            {domain.expiry_date && (
                              <div>Expires: {formatDate(domain.expiry_date)}</div>
                            )}
                            {domain.registration_date && (
                              <div>Registered: {formatDate(domain.registration_date)}</div>
                            )}
                            {domain.nameservers && domain.nameservers.length > 0 && (
                              <div className="text-xs mt-1">
                                Nameservers: {domain.nameservers.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Support Tickets
              </h3>
              
              {loadingTickets ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : tickets.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No support tickets found
                </p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket: any) => (
                    <div key={ticket.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              #{ticket.ticket_number || ticket.id} - {ticket.subject}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              ticket.status === 'open' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {ticket.status}
                            </span>
                            {ticket.priority && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Priority: {ticket.priority}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Created: {formatDate(ticket.created_at)}</div>
                            {ticket.updated_at && (
                              <div>Last Updated: {formatDate(ticket.updated_at)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Chat Sessions
              </h3>
              
              {loadingChats ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : chats.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No chat sessions found
                </p>
              ) : (
                <div className="space-y-3">
                  {chats.map((chat: any) => (
                    <div key={chat.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              Chat Session #{chat.id}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              chat.status === 'closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {chat.status}
                            </span>
                            {chat.rating && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                ⭐ {chat.rating}/5
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Started: {formatDate(chat.created_at)}</div>
                            {chat.assigned_admin && (
                              <div>Assigned to: {chat.assigned_admin}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Customer Reviews
              </h3>
              
              {loadingReviews ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No reviews found
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-600 dark:text-yellow-400">
                              {'⭐'.repeat(review.rating || 0)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddLicenseModal && (
        <AddLicenseModal
          customerId={customer.id}
          onClose={() => setShowAddLicenseModal(false)}
          onSuccess={() => {
            setShowAddLicenseModal(false);
            onUpdate();
          }}
        />
      )}

      {showEditLicenseModal && selectedLicense && (
        <EditLicenseModal
          customerId={customer.id}
          license={selectedLicense}
          onClose={() => {
            setShowEditLicenseModal(false);
            setSelectedLicense(null);
          }}
          onSuccess={() => {
            setShowEditLicenseModal(false);
            setSelectedLicense(null);
            onUpdate();
          }}
        />
      )}

      {showEditSubscriptionModal && selectedSubscription && (
        <EditSubscriptionModal
          customerId={customer.id}
          subscription={selectedSubscription}
          onClose={() => {
            setShowEditSubscriptionModal(false);
            setSelectedSubscription(null);
          }}
          onSuccess={() => {
            setShowEditSubscriptionModal(false);
            setSelectedSubscription(null);
            fetchSubscriptions();
            onUpdate();
          }}
        />
      )}

      {showCreateInvoiceModal && (
        <CreateInvoiceModal
          customerId={customer.id}
          customerName={customer.full_name}
          onClose={() => setShowCreateInvoiceModal(false)}
          onSuccess={() => {
            setShowCreateInvoiceModal(false);
            fetchInvoices();
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

// Create Invoice Modal Component
function CreateInvoiceModal({
  customerId,
  customerName,
  onClose,
  onSuccess,
}: {
  customerId: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  const [formData, setFormData] = useState({
    items: [{ description: '', quantity: 1, unit_price: 0 }],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    tax_rate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * (formData.tax_rate / 100);
    return subtotal + tax;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const invoiceData = {
        customer_id: customerId,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        due_date: formData.due_date,
        notes: formData.notes || undefined,
        tax_rate: formData.tax_rate || 0,
      };

      await invoicesAPI.create(invoiceData);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Create Invoice for {customerName}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invoice Items
            </label>
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Item
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add License Modal
function AddLicenseModal({
  customerId,
  onClose,
  onSuccess,
}: {
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [createSubscription, setCreateSubscription] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post(`/customers/${customerId}/licenses`, {
        plan_id: selectedPlan,
        billing_cycle: billingCycle,
        create_subscription: createSubscription,
      });
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to add license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add License</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan *
            </label>
            <select
              required
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price_monthly}/mo
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Billing Cycle *
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="create_subscription"
              checked={createSubscription}
              onChange={(e) => setCreateSubscription(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="create_subscription" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Create subscription
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

