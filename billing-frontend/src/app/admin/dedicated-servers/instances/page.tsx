'use client';

import { useState, useEffect } from 'react';
import { dedicatedServersAPI } from '@/lib/api';
import {
  ServerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
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
  created_at: string;
  customer?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export default function DedicatedServersInstancesPage() {
  const [instances, setInstances] = useState<ServerInstance[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<ServerInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadInstances();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [instances, searchTerm, statusFilter]);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const response = await dedicatedServersAPI.listInstances();
      const instancesList = Array.isArray(response.data) ? response.data : [];
      setInstances(instancesList);
    } catch (error: any) {
      console.error('Failed to load server instances:', error);
      alert(`Failed to load server instances: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...instances];

    if (searchTerm) {
      filtered = filtered.filter(instance =>
        instance.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(instance => instance.status === statusFilter);
    }

    setFilteredInstances(filtered);
  };

  const handleServerAction = async (serverId: number, action: 'start' | 'stop' | 'restart' | 'reboot' | 'suspend' | 'unsuspend') => {
    const actionLabels: Record<string, string> = {
      'start': 'start',
      'stop': 'stop',
      'restart': 'restart',
      'reboot': 'reboot',
      'suspend': 'suspend',
      'unsuspend': 'unsuspend',
    };
    
    if (!confirm(`Are you sure you want to ${actionLabels[action]} this server?`)) {
      return;
    }

    setActionLoading(serverId);
    try {
      if (action === 'start') {
        await dedicatedServersAPI.startInstance(serverId);
      } else if (action === 'stop') {
        await dedicatedServersAPI.stopInstance(serverId);
      } else if (action === 'restart') {
        await dedicatedServersAPI.restartInstance(serverId);
      } else if (action === 'reboot') {
        await dedicatedServersAPI.rebootInstance(serverId);
      } else if (action === 'suspend') {
        await dedicatedServersAPI.suspendInstance(serverId, 'Admin requested');
      } else if (action === 'unsuspend') {
        await dedicatedServersAPI.unsuspendInstance(serverId);
      }

      alert(`Server ${actionLabels[action]}ed successfully!`);
      await loadInstances();
    } catch (err: any) {
      console.error(`Failed to ${action} server:`, err);
      const errorMessage = err.response?.data?.detail || err.message || `Failed to ${action} server`;
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
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

  const stats = {
    total: instances.length,
    active: instances.filter(i => i.status === 'active').length,
    suspended: instances.filter(i => i.status === 'suspended').length,
    provisioning: instances.filter(i => i.status === 'provisioning' || i.status === 'pending_provisioning').length,
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dedicated Server & VPS Instances</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all customer server instances - Start, Stop, Restart, and more
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Instances</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <StopIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Provisioning</p>
              <p className="text-2xl font-bold text-gray-900">{stats.provisioning}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by IP, hostname, customer email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="provisioning">Provisioning</option>
              <option value="pending_provisioning">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instances Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hostname</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInstances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No server instances found
                  </td>
                </tr>
              ) : (
                filteredInstances.map((instance) => (
                  <tr key={instance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{instance.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{instance.customer?.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{instance.customer?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {instance.ip_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {instance.hostname || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instance.cpu_cores} CPU / {instance.ram_gb} GB RAM / {instance.storage_gb} GB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                        {getStatusIcon(instance.status)}
                        <span className="ml-1 capitalize">{instance.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {instance.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleServerAction(instance.id, 'start')}
                              disabled={actionLoading === instance.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Start"
                            >
                              <PlayIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleServerAction(instance.id, 'stop')}
                              disabled={actionLoading === instance.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Stop"
                            >
                              <StopIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleServerAction(instance.id, 'restart')}
                              disabled={actionLoading === instance.id}
                              className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                              title="Restart"
                            >
                              <ArrowPathIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {(instance.status === 'suspended' || instance.status !== 'active') && instance.status !== 'provisioning' && (
                          <button
                            onClick={() => handleServerAction(instance.id, 'start')}
                            disabled={actionLoading === instance.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Start"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

