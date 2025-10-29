"use client";

import { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, plansAPI } from '@/lib/api';
import { EditLicenseModal, EditSubscriptionModal } from '@/components/customers/EditModals';

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your customers, their subscriptions, and products
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">With Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.customers_with_subscriptions}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.customers_with_licenses} with licenses
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
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Licenses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subscriptions
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
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.full_name}
                        </div>
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
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.active_licenses}/{customer.total_licenses}
                      </div>
                      <div className="text-xs text-gray-500">active/total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.active_subscriptions}/{customer.total_subscriptions}
                      </div>
                      <div className="text-xs text-gray-500">active/total</div>
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
  const [activeTab, setActiveTab] = useState<'details' | 'licenses' | 'subscriptions' | 'payments'>(
    'details'
  );
  const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
  const [showEditLicenseModal, setShowEditLicenseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
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
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('licenses')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'licenses'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Licenses ({customer.total_licenses})
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Subscriptions ({customer.total_subscriptions})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'payments'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Payments
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

          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Payment History
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-900 dark:text-white text-2xl font-bold">
                  {formatCurrency(customer.total_payments)}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Total Paid</p>
              </div>
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

