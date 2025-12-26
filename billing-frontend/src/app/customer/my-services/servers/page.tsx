'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dedicatedServersAPI, ordersAPI, subscriptionsAPI } from '@/lib/api';
import {
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  EyeIcon,
  ShoppingCartIcon,
  CloudIcon,
  CpuChipIcon,
  CircleStackIcon,
  WifiIcon,
  PowerIcon,
  ArrowPathIcon,
  StopIcon,
  PlayIcon,
  CommandLineIcon,
  ClipboardDocumentIcon,
  KeyIcon,
  InformationCircleIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface ServerInstance {
  id: number;
  customer_id: string;
  order_id: number | null;
  product_id: number;
  hostname: string | null;
  ip_address: string | null;
  status: 'provisioning' | 'active' | 'suspended' | 'cancelled' | 'terminated' | 'pending_provisioning';
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  storage_type: string | null;
  bandwidth_tb: number;
  operating_system: string | null;
  datacenter_location: string | null;
  created_at: string;
  provisioned_at: string | null;
  root_password: string | null;
  ssh_port: number;
  control_panel_url: string | null;
  control_panel_type: string | null;
  provider: string | null;
  meta_data: any;
}

interface ServerProduct {
  id: number;
  name: string;
  description: string | null;
  server_type: 'vps' | 'dedicated';
}

export default function MyServersPage() {
  const { user } = useAuth();
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [products, setProducts] = useState<Record<number, ServerProduct>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<ServerInstance | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [serverToCancel, setServerToCancel] = useState<ServerInstance | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadServers();
    }
  }, [user?.id]);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please login to view your servers');
        setLoading(false);
        return;
      }

      // First, try to fetch from dedicated servers API (provisioned instances)
      try {
      const serverData = await dedicatedServersAPI.listInstances();
      const serversList = Array.isArray(serverData.data) ? serverData.data : [];
        
        if (serversList.length > 0) {
      setServers(serversList);

      // Load product details for each server
      const productIds = [...new Set(serversList.map((s: ServerInstance) => s.product_id))];
      const productPromises = productIds.map(async (productId: number) => {
        try {
          const productResponse = await dedicatedServersAPI.getProduct(productId);
          return { [productId]: productResponse.data };
        } catch (e) {
          console.error(`Failed to load product ${productId}:`, e);
          return {};
        }
      });

      const productResults = await Promise.all(productPromises);
      const productsMap = Object.assign({}, ...productResults);
      setProducts(productsMap);
          setLoading(false);
          return;
        }
      } catch (serverApiError) {
        console.warn('Dedicated servers API not available, trying orders API:', serverApiError);
      }

      // Fallback: Fetch from orders API to show purchased servers
      const { ordersAPI } = await import('@/lib/api');
      const ordersResponse = await ordersAPI.list({ status: 'completed' });
      const orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      
      // Filter orders for server products
      const serverOrders = orders.filter((order: any) => {
        const items = order.items || [];
        return items.some((item: any) => 
          item.type === 'server' || 
          item.category === 'server' ||
          item.product_id?.toString().startsWith('server-')
        );
      });

      if (serverOrders.length === 0) {
        setServers([]);
        setLoading(false);
        return;
      }

      // Transform orders into server instances format
      const serversFromOrders: ServerInstance[] = [];
      for (const order of serverOrders) {
        const items = order.items || [];
        for (const item of items) {
          if (item.type === 'server' || item.category === 'server' || item.product_id?.toString().startsWith('server-')) {
            const productId = item.product_id?.toString().replace('server-', '') || item.product_id;
            serversFromOrders.push({
              id: parseInt(productId) || Math.random(),
              customer_id: order.customer_id,
              order_id: parseInt(order.id) || null,
              product_id: parseInt(productId) || 0,
              hostname: null,
              ip_address: null,
              status: 'pending_provisioning' as const,
              cpu_cores: item.features?.cpu_cores || 0,
              ram_gb: item.features?.ram_gb || 0,
              storage_gb: item.features?.storage_gb || 0,
              storage_type: item.features?.storage_type || null,
              bandwidth_tb: item.features?.bandwidth_tb || 0,
              operating_system: null,
              datacenter_location: null,
              created_at: order.created_at || new Date().toISOString(),
              provisioned_at: null,
              root_password: null,
              ssh_port: 22,
              control_panel_url: null,
              control_panel_type: null,
              provider: null,
              meta_data: item.features || {},
            });
          }
        }
      }

      setServers(serversFromOrders);

      // Load product details if we have servers
      if (serversFromOrders.length > 0) {
        const productIds = [...new Set(serversFromOrders.map((s: ServerInstance) => s.product_id))];
        const productPromises = productIds.map(async (productId: number) => {
          try {
            const productResponse = await dedicatedServersAPI.getProduct(productId);
            return { [productId]: productResponse.data };
          } catch (e) {
            console.error(`Failed to load product ${productId}:`, e);
            return {};
          }
        });

        const productResults = await Promise.all(productPromises);
        const productsMap = Object.assign({}, ...productResults);
        setProducts(productsMap);
      }

    } catch (err: any) {
      console.error('Failed to load servers:', err);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to load your servers. Please try again later.';
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Cannot connect to the server. Please check if the backend is running.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServerAction = async (serverId: number, action: 'reboot' | 'suspend' | 'unsuspend' | 'start' | 'stop' | 'restart', bootType?: string) => {
    const actionLabels: Record<string, string> = {
      'reboot': 'reboot',
      'suspend': 'suspend',
      'unsuspend': 'unsuspend',
      'start': 'start',
      'stop': 'stop',
      'restart': 'restart',
    };
    
    if (!confirm(`Are you sure you want to ${actionLabels[action]} this server?`)) {
      return;
    }

    setActionLoading(serverId);
    
    // Wrap in additional error handler to prevent unhandled errors
    try {
      await executeServerAction(serverId, action, bootType, actionLabels);
    } catch (error: any) {
      // This is a safety net - should not reach here if executeServerAction handles errors properly
      console.error('Unhandled error in handleServerAction:', error);
      alert(`An unexpected error occurred: ${error?.message || 'Unknown error'}`);
      setActionLoading(null);
    }
  };

  const executeServerAction = async (
    serverId: number, 
    action: 'reboot' | 'suspend' | 'unsuspend' | 'start' | 'stop' | 'restart', 
    bootType: string | undefined,
    actionLabels: Record<string, string>
  ) => {
    
    try {
      let response;
      
      // Use centralized API client
      if (action === 'reboot') {
        response = await dedicatedServersAPI.rebootInstance(serverId, bootType);
      } else if (action === 'suspend') {
        response = await dedicatedServersAPI.suspendInstance(serverId, 'Customer requested');
      } else if (action === 'unsuspend') {
        response = await dedicatedServersAPI.unsuspendInstance(serverId);
      } else if (action === 'start') {
        try {
          response = await dedicatedServersAPI.startInstance(serverId);
        } catch (startErr: any) {
          // Re-throw with is404 flag for easier detection
          if (startErr?.response?.status === 404 || startErr?.is404) {
            const customErr: any = new Error('Start endpoint not found');
            customErr.response = startErr?.response;
            customErr.is404 = true;
            throw customErr;
          }
          throw startErr;
        }
      } else if (action === 'stop') {
        try {
          response = await dedicatedServersAPI.stopInstance(serverId);
        } catch (stopErr: any) {
          if (stopErr?.response?.status === 404 || stopErr?.is404) {
            const customErr: any = new Error('Stop endpoint not found');
            customErr.response = stopErr?.response;
            customErr.is404 = true;
            throw customErr;
          }
          throw stopErr;
        }
      } else if (action === 'restart') {
        try {
          response = await dedicatedServersAPI.restartInstance(serverId);
        } catch (restartErr: any) {
          if (restartErr?.response?.status === 404 || restartErr?.is404) {
            const customErr: any = new Error('Restart endpoint not found');
            customErr.response = restartErr?.response;
            customErr.is404 = true;
            throw customErr;
          }
          throw restartErr;
        }
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

      alert(`Server ${actionLabels[action]}ed successfully!`);
      await loadServers(); // Reload servers
      
      // Update selected server if it's the one we just modified
      if (selectedServer?.id === serverId) {
        const updatedServerResponse = await dedicatedServersAPI.getInstance(serverId);
        setSelectedServer(updatedServerResponse.data);
      }
    } catch (err: any) {
      console.error(`Failed to ${action} server:`, err);
      console.error('Error details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        code: err?.code,
        message: err?.message,
        response: err?.response?.data
      });
      
      // Handle 404 errors specifically - endpoints not implemented yet
      const is404 = err?.response?.status === 404 || 
                    err?.is404 === true ||
                    err?.code === 'ERR_BAD_REQUEST' || 
                    err?.message?.includes('404') ||
                    err?.message?.includes('not found') ||
                    err?.message?.includes('Request failed with status code 404');
      
      if (is404) {
        let errorMessage = '';
        if (['start', 'stop', 'restart'].includes(action)) {
          errorMessage = `The ${action} server feature is not yet available. The backend endpoint needs to be implemented. Please use Reboot or Suspend options for now, or contact support.`;
        } else {
          errorMessage = `The ${action} server endpoint was not found. Please contact support if this issue persists.`;
        }
        
        // Use setTimeout to ensure alert is shown and doesn't block
        setTimeout(() => {
          alert(errorMessage);
        }, 0);
        
        setActionLoading(null);
        return; // Exit early to prevent further execution
      }
      
      // Handle other errors
      const errorMessage = err?.response?.data?.detail || err?.message || `Failed to ${action} server`;
      setTimeout(() => {
        alert(errorMessage);
      }, 0);
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'suspended':
        return <StopIcon className="h-5 w-5 text-yellow-500" />;
      case 'provisioning':
      case 'pending_provisioning':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
      case 'terminated':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'provisioning':
      case 'pending_provisioning':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleCancelClick = (server: ServerInstance) => {
    setServerToCancel(server);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!serverToCancel) return;

    try {
      setCancellingId(serverToCancel.id);
      
      // For servers, we don't have a direct cancel API, so show support message
      alert('To cancel this server, please contact support. Your server will be terminated at the end of the current billing period.');
      
      setShowCancelModal(false);
      setServerToCancel(null);
    } catch (err: any) {
      console.error('Failed to cancel server:', err);
      alert('Failed to process cancellation. Please contact support.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">My Servers</h1>
            <p className="mt-1 text-sm text-gray-500">Loading your servers...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">My Servers</h1>
            <p className="mt-1 text-sm text-red-500">{error}</p>
            <button
              onClick={loadServers}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Servers</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your dedicated servers and VPS instances.
              </p>
            </div>
            <a
              href="/customer/services?category=server"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Buy More Servers
            </a>
          </div>
        </div>
      </div>

      {/* Server List */}
      <div className="space-y-4">
        {servers.map((server) => {
          const product = products[server.product_id];
          const isActionLoading = actionLoading === server.id;
          
          return (
            <div
              key={server.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <ServerIcon className="h-6 w-6 text-indigo-500 mr-3" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {product?.name || `Server #${server.id}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {product?.description || 'Server Instance'}
                        </p>
                      </div>
                      <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
                        {getStatusIcon(server.status)}
                        <span className="ml-1">{getStatusLabel(server.status)}</span>
                      </span>
                    </div>
                    
                    {/* Server Specifications */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Server Specifications</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CpuChipIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">CPU</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-lg font-semibold text-gray-900">
                              {server.cpu_cores} Cores
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CloudIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">RAM</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-lg font-semibold text-gray-900">
                              {server.ram_gb} GB
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CircleStackIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Storage</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-lg font-semibold text-gray-900">
                              {server.storage_gb} GB
                            </div>
                            <div className="text-xs text-gray-500">
                              {server.storage_type || 'SSD'}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <WifiIcon className="h-5 w-5 text-indigo-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">Bandwidth</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-lg font-semibold text-gray-900">
                              {server.bandwidth_tb} TB
                            </div>
                            <div className="text-xs text-gray-500">
                              Monthly Transfer
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Server Details */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {server.ip_address && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                          <dd className="mt-1 text-sm text-gray-900 font-mono flex items-center">
                            {server.ip_address}
                            <button
                              onClick={() => copyToClipboard(server.ip_address!, 'IP Address')}
                              className="ml-2 text-indigo-600 hover:text-indigo-500"
                              title="Copy IP Address"
                            >
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            </button>
                          </dd>
                        </div>
                      )}
                      {server.hostname && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Hostname</dt>
                          <dd className="mt-1 text-sm text-gray-900">{server.hostname}</dd>
                        </div>
                      )}
                      {server.datacenter_location && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Location</dt>
                          <dd className="mt-1 text-sm text-gray-900">{server.datacenter_location}</dd>
                        </div>
                      )}
                      {server.operating_system && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Operating System</dt>
                          <dd className="mt-1 text-sm text-gray-900">{server.operating_system}</dd>
                        </div>
                      )}
                      {server.control_panel_url && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Control Panel</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <a 
                              href={server.control_panel_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-500"
                            >
                              {server.control_panel_type || 'Control Panel'}
                            </a>
                          </dd>
                        </div>
                      )}
                      {server.provisioned_at && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Provisioned</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Date(server.provisioned_at).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-6 flex flex-col items-end space-y-3">
                    {/* Power Control Icon Buttons */}
                    {server.status === 'active' && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <button
                          onClick={async () => {
                            try {
                              await handleServerAction(server.id, 'start');
                            } catch (err: any) {
                              // Already handled in handleServerAction, but catch here to prevent unhandled error
                              console.log('Error caught in button handler:', err);
                            }
                          }}
                          disabled={actionLoading === server.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Start Server"
                        >
                          {actionLoading === server.id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <PlayIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await handleServerAction(server.id, 'stop');
                            } catch (err: any) {
                              console.log('Error caught in button handler:', err);
                            }
                          }}
                          disabled={actionLoading === server.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Stop Server"
                        >
                          {actionLoading === server.id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <StopIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await handleServerAction(server.id, 'restart');
                            } catch (err: any) {
                              console.log('Error caught in button handler:', err);
                            }
                          }}
                          disabled={actionLoading === server.id}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Restart Server"
                        >
                          {actionLoading === server.id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <ArrowPathIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {server.status !== 'active' && server.status !== 'provisioning' && server.status !== 'suspended' && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <button
                          onClick={async () => {
                            try {
                              await handleServerAction(server.id, 'start');
                            } catch (err: any) {
                              console.log('Error caught in button handler:', err);
                            }
                          }}
                          disabled={actionLoading === server.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Start Server"
                        >
                          {actionLoading === server.id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <PlayIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    )}

                    {server.status === 'suspended' && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <button
                          onClick={async () => {
                            try {
                              await handleServerAction(server.id, 'unsuspend');
                            } catch (err: any) {
                              console.log('Error caught in button handler:', err);
                            }
                          }}
                          disabled={actionLoading === server.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Unsuspend Server"
                        >
                          {actionLoading === server.id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <PlayIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Other Actions */}
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => {
                          setSelectedServer(server);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <InformationCircleIcon className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      
                      {server.control_panel_url && (
                        <a
                          href={server.control_panel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Control Panel
                        </a>
                      )}

                      {(server.status === 'active' || server.status === 'provisioning') && (
                        <button
                          onClick={() => handleCancelClick(server)}
                          disabled={cancellingId === server.id}
                          className="inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === server.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Cancel Service
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {servers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No servers</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any servers yet. Browse our server plans to get started.
          </p>
          <div className="mt-6">
            <a
              href="/customer/services?category=server"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-2" />
              Browse Server Plans
            </a>
          </div>
        </div>
      )}

      {/* Server Details Modal */}
      {showDetailsModal && selectedServer && (
        <ServerDetailsModal
          server={selectedServer}
          product={products[selectedServer.product_id]}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedServer(null);
          }}
          onAction={handleServerAction}
          actionLoading={actionLoading === selectedServer.id}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && serverToCancel && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCancelModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Cancel Server
                  </h3>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to cancel this server? To proceed with cancellation, please contact our support team.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Server cancellation requires manual processing. Please contact support to cancel your server service. All data will be permanently deleted upon cancellation.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                  <a
                    href="/customer/support"
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ServerDetailsModal({
  server,
  product,
  onClose,
  onAction,
  actionLoading,
}: {
  server: ServerInstance;
  product?: ServerProduct;
  onClose: () => void;
  onAction: (serverId: number, action: 'reboot' | 'suspend' | 'unsuspend' | 'start' | 'stop' | 'restart', bootType?: string) => void;
  actionLoading: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showSSHCommand, setShowSSHCommand] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const sshCommand = server.ip_address && server.root_password
    ? `ssh root@${server.ip_address} -p ${server.ssh_port || 22}`
    : null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Server Details - {product?.name || `Server #${server.id}`}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Server Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Server Information</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{server.status.replace('_', ' ')}</dd>
                  </div>
                  {server.hostname && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Hostname</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{server.hostname}</dd>
                    </div>
                  )}
                  {server.ip_address && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono flex items-center">
                        {server.ip_address}
                        <button
                          onClick={() => copyToClipboard(server.ip_address!, 'IP Address')}
                          className="ml-2 text-indigo-600 hover:text-indigo-500"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </dd>
                    </div>
                  )}
                  {server.operating_system && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Operating System</dt>
                      <dd className="mt-1 text-sm text-gray-900">{server.operating_system}</dd>
                    </div>
                  )}
                  {server.datacenter_location && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">{server.datacenter_location}</dd>
                    </div>
                  )}
                  {server.provider && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Provider</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{server.provider}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* SSH Access */}
              {server.ip_address && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CommandLineIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    SSH Access
                  </h4>
                  <div className="space-y-3">
                    {server.root_password && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <dt className="text-sm font-medium text-gray-500">Root Password</dt>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-xs text-indigo-600 hover:text-indigo-500"
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                            <button
                              onClick={() => copyToClipboard(server.root_password!, 'Root Password')}
                              className="text-indigo-600 hover:text-indigo-500"
                              title="Copy Password"
                            >
                              <ClipboardDocumentIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                          {showPassword ? server.root_password : '••••••••••••'}
                        </dd>
                      </div>
                    )}
                    {sshCommand && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <dt className="text-sm font-medium text-gray-500">SSH Command</dt>
                          <button
                            onClick={() => copyToClipboard(sshCommand, 'SSH Command')}
                            className="text-indigo-600 hover:text-indigo-500"
                            title="Copy SSH Command"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                          {sshCommand}
                        </dd>
                        <p className="mt-1 text-xs text-gray-500">
                          Use this command to connect via SSH. Password will be prompted.
                        </p>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">SSH Port</dt>
                      <dd className="mt-1 text-sm text-gray-900">{server.ssh_port || 22}</dd>
                    </div>
                  </div>
                </div>
              )}

              {/* Control Panel */}
              {server.control_panel_url && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Control Panel</h4>
                  <div className="flex items-center space-x-2">
                    <a
                      href={server.control_panel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 text-sm"
                    >
                      {server.control_panel_url}
                    </a>
                    <button
                      onClick={() => copyToClipboard(server.control_panel_url!, 'Control Panel URL')}
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {server.control_panel_type && (
                    <p className="mt-1 text-xs text-gray-500">
                      Type: {server.control_panel_type}
                    </p>
                  )}
                </div>
              )}

              {/* Server Actions */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Server Actions</h4>
                <div className="space-y-3">
                  {server.status === 'active' && (
                    <>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Power Controls</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => onAction(server.id, 'start')}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <PlayIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => onAction(server.id, 'stop')}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                          >
                            {actionLoading ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <StopIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => onAction(server.id, 'restart')}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            {actionLoading ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowPathIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex justify-between">
                          <span>Start</span>
                          <span>Stop</span>
                          <span>Restart</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-gray-500 mb-2">Management</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAction(server.id, 'reboot', 'soft')}
                            disabled={actionLoading}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                          >
                            Reboot
                          </button>
                          <button
                            onClick={() => onAction(server.id, 'suspend')}
                            disabled={actionLoading}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-yellow-300 shadow-sm text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {server.status === 'suspended' && (
                    <button
                      onClick={() => onAction(server.id, 'unsuspend')}
                      disabled={actionLoading}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlayIcon className="h-4 w-4 mr-2" />
                      )}
                      Unsuspend
                    </button>
                  )}
                  {server.status !== 'active' && server.status !== 'suspended' && server.status !== 'provisioning' && (
                    <button
                      onClick={() => onAction(server.id, 'start')}
                      disabled={actionLoading}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlayIcon className="h-4 w-4 mr-2" />
                      )}
                      Start Server
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
