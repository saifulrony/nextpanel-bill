"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart,
  FileText,
  CreditCard,
  MessageSquare,
  Ticket,
  Globe,
  Star,
  Settings,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Mail
} from 'lucide-react';
import { api, ordersAPI, invoicesAPI, supportAPI, chatAPI, emailTemplatesAPI } from '@/lib/api';
import { EditLicenseModal, EditSubscriptionModal } from '@/components/customers/EditModals';

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

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'orders' | 'licenses' | 'subscriptions' | 'invoices' | 'transactions' | 'payment-settings' | 'domains' | 'tickets' | 'chats' | 'reviews' | 'coupons'>(
    'details'
  );
  const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
  const [showEditLicenseModal, setShowEditLicenseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  
  // State for additional tabs
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
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  
  // Payment settings
  const [paymentCycle, setPaymentCycle] = useState('monthly');
  const [invoiceCycle, setInvoiceCycle] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Create invoice modal
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

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
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [activeTab, customer]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/customers/${customerId}`);
      setCustomer(response.data);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      alert('Failed to load customer. Redirecting...');
      router.push('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    if (!customer) return;
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
    if (!customer) return;
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
    if (!customer) return;
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
    if (!customer) return;
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
    if (!customer) return;
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
    if (!customer) return;
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
    if (!customer) return;
    setLoadingChats(true);
    try {
      const response = await chatAPI.listSessions({ limit: 1000 });
      const allSessions = response.data || [];
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
    if (!customer) return;
    setLoadingReviews(true);
    try {
      const response = await api.get(`/customers/${customer.id}/reviews`);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchCoupons = async () => {
    if (!customer) return;
    setLoadingCoupons(true);
    try {
      // Fetch orders with coupon codes
      const response = await ordersAPI.list({ customer_id: customer.id });
      const orders = response.data || [];
      
      // Extract unique coupons used by this customer
      const couponMap = new Map<string, any>();
      
      orders.forEach((order: any) => {
        if (order.coupon_code) {
          const couponCode = order.coupon_code;
          if (!couponMap.has(couponCode)) {
            couponMap.set(couponCode, {
              code: couponCode,
              discount_amount: 0,
              discount_percent: order.discount_percent || 0,
              usage_count: 0,
              total_savings: 0,
              orders: []
            });
          }
          
          const couponData = couponMap.get(couponCode)!;
          couponData.usage_count += 1;
          couponData.discount_amount = order.discount_amount || 0;
          couponData.total_savings += (order.discount_amount || 0);
          couponData.orders.push({
            order_id: order.id,
            order_number: order.order_number || order.id,
            date: order.created_at,
            amount: order.total,
            discount: order.discount_amount || 0
          });
        }
      });
      
      setCoupons(Array.from(couponMap.values()));
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    if (!customer) return;
    setSavingSettings(true);
    try {
      await api.put(`/customers/${customer.id}/settings`, {
        payment_cycle: paymentCycle,
        invoice_cycle: invoiceCycle,
        payment_method: paymentMethod,
      });
      alert('Payment settings saved successfully!');
      fetchCustomer();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg">
          Customer not found
        </div>
        <button
          onClick={() => router.push('/admin/customers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" style={{ background: 'white' }}>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/customers')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {customer.full_name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{customer.email}</p>
                {customer.company_name && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{customer.company_name}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    router.push(`/admin/customers?action=send-email&id=${customer.id}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-6 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700 flex-wrap">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'details'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <ShoppingCart className="w-4 h-4 inline mr-1" />
                Orders
              </button>
              <button
                onClick={() => setActiveTab('licenses')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'licenses'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Licenses ({customer.total_licenses})
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'subscriptions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Subs ({customer.total_subscriptions})
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'invoices'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Invoices
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'transactions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-1" />
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('payment-settings')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'payment-settings'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Payment
              </button>
              <button
                onClick={() => setActiveTab('domains')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'domains'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Globe className="w-4 h-4 inline mr-1" />
                Domains ({customer.total_domains || 0})
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'tickets'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Ticket className="w-4 h-4 inline mr-1" />
                Tickets
              </button>
              <button
                onClick={() => setActiveTab('chats')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'chats'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Chats
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'reviews'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Star className="w-4 h-4 inline mr-1" />
                Reviews
              </button>
              <button
                onClick={() => setActiveTab('coupons')}
                className={`px-3 py-2 rounded-t transition-colors whitespace-nowrap text-sm font-medium ${
                  activeTab === 'coupons'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Coupons ({coupons.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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
                                  fetchCustomer();
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

          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Coupons Used by Customer
              </h3>
              
              {loadingCoupons ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : coupons.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No coupons used
                </p>
              ) : (
                <div className="space-y-4">
                  {coupons.map((coupon: any, index: number) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {coupon.code}
                          </h4>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Used: <span className="font-semibold">{coupon.usage_count} time{coupon.usage_count !== 1 ? 's' : ''}</span></span>
                            {coupon.discount_percent > 0 && (
                              <span>Discount: <span className="font-semibold">{coupon.discount_percent}%</span></span>
                            )}
                            <span>Total Savings: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(coupon.total_savings)}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Orders using this coupon:</p>
                        <div className="space-y-2">
                          {coupon.orders.map((order: any) => (
                            <div key={order.order_id} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">Order #{order.order_number}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">{formatDate(order.date)}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-900 dark:text-white">Order Total: {formatCurrency(order.amount)}</div>
                                <div className="text-green-600 dark:text-green-400">Saved: {formatCurrency(order.discount)}</div>
                              </div>
                            </div>
                          ))}
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

      {/* Modals */}
      {showAddLicenseModal && customer && (
        <AddLicenseModal
          customerId={customer.id}
          onClose={() => setShowAddLicenseModal(false)}
          onSuccess={() => {
            setShowAddLicenseModal(false);
            fetchCustomer();
          }}
        />
      )}

      {showEditLicenseModal && selectedLicense && customer && (
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
            fetchCustomer();
          }}
        />
      )}

      {showEditSubscriptionModal && selectedSubscription && customer && (
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
            fetchCustomer();
          }}
        />
      )}

      {showCreateInvoiceModal && customer && (
        <CreateInvoiceModal
          customerId={customer.id}
          customerName={customer.full_name}
          onClose={() => setShowCreateInvoiceModal(false)}
          onSuccess={() => {
            setShowCreateInvoiceModal(false);
            fetchInvoices();
            fetchCustomer();
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

