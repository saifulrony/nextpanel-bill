'use client';

import { useState, useEffect } from 'react';
import { staffAPI, adminAPI } from '@/lib/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface StaffRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface StaffPermission {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  created_at: string;
  updated_at?: string;
}

interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  is_active: boolean;
  is_admin: boolean;
  roles: Array<{
    id: string;
    name: string;
    display_name: string;
    assigned_at?: string;
  }>;
  performance?: {
    total_chats: number;
    chats_ended: number;
    total_tickets_assigned: number;
    tickets_resolved: number;
    average_rating: number | null;
    ratings_count: number;
  };
}

export default function StuffsPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('users');
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState<string>('');
  const [initializing, setInitializing] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPerformance, setFilterPerformance] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Additional modals
  const [showCloneRoleModal, setShowCloneRoleModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [cloneFormData, setCloneFormData] = useState({ new_name: '', new_display_name: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    is_active: true,
  });
  
  // User edit form state
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    is_active: true,
    is_admin: false,
  });
  
  // Password change form state
  const [passwordFormData, setPasswordFormData] = useState({
    new_password: '',
    confirm_password: '',
  });
  
  // User create form state
  const [createUserFormData, setCreateUserFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    company_name: '',
    is_active: true,
    is_admin: false,
    role_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes, usersRes] = await Promise.all([
        staffAPI.listRoles(),
        staffAPI.listPermissions(),
        staffAPI.listStaffUsers().catch(() => ({ data: [] })), // Handle if endpoint doesn't exist yet
      ]);
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);
      setStaffUsers(usersRes.data || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      alert('Failed to load staff data: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!formData.name || !formData.display_name) {
        alert('Please fill in all required fields');
        return;
      }
      
      await staffAPI.createRole(formData);
      alert('Role created successfully!');
      setShowCreateRoleModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Failed to create role:', error);
      alert('Failed to create role: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      await staffAPI.updateRole(selectedRole.id, {
        display_name: formData.display_name,
        description: formData.description,
        is_active: formData.is_active,
      });
      alert('Role updated successfully!');
      setShowEditRoleModal(false);
      resetForm();
      setSelectedRole(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert('Failed to update role: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await staffAPI.deleteRole(roleId);
      alert('Role deleted successfully!');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      alert('Failed to delete role: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditRole = (role: StaffRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      is_active: role.is_active,
    });
    setShowEditRoleModal(true);
  };

  const handleManagePermissions = async (role: StaffRole) => {
    setSelectedRole(role);
    try {
      const response = await staffAPI.getRolePermissions(role.id);
      setSelectedRolePermissions(response.data.map((p: StaffPermission) => p.id));
      setShowPermissionsModal(true);
    } catch (error: any) {
      console.error('Failed to load role permissions:', error);
      alert('Failed to load permissions: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      await staffAPI.assignPermissionsToRole(selectedRole.id, selectedRolePermissions);
      alert('Permissions updated successfully!');
      setShowPermissionsModal(false);
      setSelectedRole(null);
      setSelectedRolePermissions([]);
      loadData();
    } catch (error: any) {
      console.error('Failed to update permissions:', error);
      alert('Failed to update permissions: ' + (error.response?.data?.detail || error.message));
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedRolePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      is_active: true,
    });
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('This will create default permissions and roles. Continue?')) return;
    
    try {
      setInitializing(true);
      await staffAPI.initializeDefaults();
      alert('Default permissions and roles initialized successfully!');
      loadData();
    } catch (error: any) {
      console.error('Failed to initialize defaults:', error);
      alert('Failed to initialize defaults: ' + (error.response?.data?.detail || error.message));
    } finally {
      setInitializing(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleForAssign) {
      return;
    }
    
    try {
      await staffAPI.assignRoleToUser(selectedUser.id, selectedRoleForAssign);
      setShowAssignRoleModal(false);
      setSelectedUser(null);
      setSelectedRoleForAssign('');
      loadData();
    } catch (error: any) {
      console.error('Failed to assign role:', error);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!confirm('Are you sure you want to remove this role from the user?')) return;
    
    try {
      await staffAPI.removeRoleFromUser(userId, roleId);
      loadData();
    } catch (error: any) {
      console.error('Failed to remove role:', error);
    }
  };

  const handleEditUser = (user: StaffUser) => {
    setSelectedUser(user);
    setUserFormData({
      full_name: user.full_name,
      email: user.email,
      company_name: user.company_name || '',
      is_active: user.is_active,
      is_admin: user.is_admin,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await adminAPI.users.update(selectedUser.id, {
        full_name: userFormData.full_name,
        company_name: userFormData.company_name,
        is_active: userFormData.is_active,
        is_admin: userFormData.is_admin,
      });
      setShowEditUserModal(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will deactivate their account.')) return;
    
    try {
      await adminAPI.users.delete(userId);
      loadData();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleChangePassword = (user: StaffUser) => {
    setSelectedUser(user);
    setPasswordFormData({
      new_password: '',
      confirm_password: '',
    });
    setShowChangePasswordModal(true);
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser) return;
    
    if (!passwordFormData.new_password || !passwordFormData.confirm_password) {
      alert('Please fill in all password fields');
      return;
    }
    
    if (passwordFormData.new_password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      alert('New password and confirm password do not match');
      return;
    }
    
    try {
      await adminAPI.users.update(selectedUser.id, {
        password: passwordFormData.new_password,
      });
      alert('Password updated successfully!');
      setShowChangePasswordModal(false);
      setSelectedUser(null);
      setPasswordFormData({
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('Failed to update password:', error);
      alert('Failed to update password: ' + (error.response?.data?.detail || error.message));
    }
  };

  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // Ensure at least one of each required type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setCreateUserFormData({ ...createUserFormData, password, confirm_password: password });
  };

  const copyPassword = async () => {
    if (!createUserFormData.password) return;
    
    // Check if clipboard API is available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(createUserFormData.password);
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
        return;
      } catch (error) {
        console.error('Clipboard API failed:', error);
        // Fall through to fallback method
      }
    }
    
    // Fallback for browsers without clipboard API or when API fails
    try {
      const textArea = document.createElement('textarea');
      textArea.value = createUserFormData.password;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      } else {
        alert('Failed to copy password. Please copy manually.');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('Failed to copy password. Please copy manually.');
    }
  };

  const handleCreateUser = async () => {
    if (!createUserFormData.email || !createUserFormData.password || !createUserFormData.full_name) {
      alert('Please fill in all required fields (email, password, full name)');
      return;
    }

    if (createUserFormData.password !== createUserFormData.confirm_password) {
      alert('Password and confirm password do not match');
      return;
    }

    if (createUserFormData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      // Create user without role_id (backend doesn't accept it in create)
      const { confirm_password, role_id, ...userData } = createUserFormData;
      const newUserResponse = await adminAPI.users.create(userData);
      const newUser = newUserResponse.data || newUserResponse;
      
      // If role is selected, assign it after user creation
      if (role_id) {
        try {
          await staffAPI.assignRoleToUser(newUser.id, role_id);
        } catch (roleError: any) {
          console.error('Failed to assign role:', roleError);
          alert('User created but failed to assign role: ' + (roleError.response?.data?.detail || roleError.message));
        }
      }
      
      setShowCreateUserModal(false);
      setCreateUserFormData({
        email: '',
        password: '',
        confirm_password: '',
        full_name: '',
        company_name: '',
        is_active: true,
        is_admin: false,
        role_id: '',
      });
      loadData();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert('Failed to create user: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Bulk actions handlers
  const [bulkActionType, setBulkActionType] = useState<'assign_role' | 'activate' | 'deactivate'>('assign_role');
  const [bulkSelectedRole, setBulkSelectedRole] = useState<string>('');

  const handleBulkAssignRole = async () => {
    if (!bulkSelectedRole) {
      alert('Please select a role to assign');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    try {
      await staffAPI.bulkAssignRole(selectedUsers, bulkSelectedRole);
      alert(`Role assigned to ${selectedUsers.length} user(s) successfully!`);
      setShowBulkActionsModal(false);
      setSelectedUsers([]);
      setBulkSelectedRole('');
      loadData();
    } catch (error: any) {
      console.error('Failed to bulk assign role:', error);
      alert('Failed to assign role: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleBulkUpdateStatus = async (isActive: boolean) => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    if (!confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      await staffAPI.bulkUpdateUserStatus(selectedUsers, isActive);
      alert(`${selectedUsers.length} user(s) ${isActive ? 'activated' : 'deactivated'} successfully!`);
      setShowBulkActionsModal(false);
      setSelectedUsers([]);
      loadData();
    } catch (error: any) {
      console.error('Failed to bulk update status:', error);
      alert('Failed to update status: ' + (error.response?.data?.detail || error.message));
    }
  };

  const permissionsByCategory = permissions.length > 0 
    ? permissions.reduce((acc, perm) => {
        const category = perm.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(perm);
        return acc;
      }, {} as Record<string, StaffPermission[]>)
    : {};

  // Sort categories: Pages first, then Actions, then Others
  const sortedCategories = Object.keys(permissionsByCategory).sort((a, b) => {
    const order = ['Pages', 'Actions', 'Support', 'Management', 'Billing', 'Administration'];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Roles & Permissions</h1>
        <div className="flex items-center gap-2">
          {permissions.length === 0 && (
            <button
              onClick={handleInitializeDefaults}
              disabled={initializing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initializing ? 'Initializing...' : 'Initialize Defaults'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Staff Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Roles & Permissions
          </button>
        </nav>
      </div>

      {/* Staff Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Staff Users</h2>
            <div className="flex items-center gap-2">
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setShowBulkActionsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Bulk Actions ({selectedUsers.length})
                </button>
              )}
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <PlusIcon className="h-5 w-5" />
                Create User
              </button>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-4 flex flex-col md:flex-row gap-4 flex-wrap">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            {/* Filter Selects */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.display_name}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="admin">Admin Only</option>
            </select>
            
            <select
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
            >
              <option value="">All Performance</option>
              <option value="high_chats">High Chat Activity (50+ chats)</option>
              <option value="high_tickets">High Ticket Activity (20+ tickets)</option>
              <option value="excellent">Excellent (4.5+ rating)</option>
              <option value="good">Good (4.0+ rating)</option>
              <option value="needs_improvement">Needs Improvement (&lt;3.5 rating)</option>
              <option value="no_activity">No Activity</option>
            </select>
            
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[130px]"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
              <option value="no_rating">No Ratings</option>
            </select>
            
            {(searchTerm || filterRole || filterStatus || filterPerformance || filterRating) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('');
                  setFilterStatus('');
                  setFilterPerformance('');
                  setFilterRating('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={(() => {
                      const filtered = staffUsers.filter(user => {
                        const matchesSearch = !searchTerm || 
                          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesRole = !filterRole || user.roles.some(r => r.id === filterRole);
                        const matchesStatus = !filterStatus || 
                          (filterStatus === 'active' && user.is_active) ||
                          (filterStatus === 'inactive' && !user.is_active) ||
                          (filterStatus === 'admin' && user.is_admin);
                        const perf = user.performance || {
                          total_chats: 0,
                          chats_ended: 0,
                          total_tickets_assigned: 0,
                          tickets_resolved: 0,
                          average_rating: null,
                          ratings_count: 0
                        };
                        let matchesPerformance = true;
                        if (filterPerformance) {
                          switch (filterPerformance) {
                            case 'high_chats': matchesPerformance = perf.total_chats >= 50; break;
                            case 'high_tickets': matchesPerformance = perf.total_tickets_assigned >= 20; break;
                            case 'excellent': matchesPerformance = perf.average_rating !== null && perf.average_rating >= 4.5; break;
                            case 'good': matchesPerformance = perf.average_rating !== null && perf.average_rating >= 4.0; break;
                            case 'needs_improvement': matchesPerformance = perf.average_rating !== null && perf.average_rating < 3.5; break;
                            case 'no_activity': matchesPerformance = perf.total_chats === 0 && perf.total_tickets_assigned === 0; break;
                          }
                        }
                        let matchesRating = true;
                        if (filterRating) {
                          if (filterRating === 'no_rating') {
                            matchesRating = perf.ratings_count === 0 || perf.average_rating === null;
                          } else {
                            const minRating = parseFloat(filterRating);
                            matchesRating = perf.average_rating !== null && perf.average_rating >= minRating;
                          }
                        }
                        return matchesSearch && matchesRole && matchesStatus && matchesPerformance && matchesRating;
                      });
                      return selectedUsers.length === filtered.length && filtered.length > 0;
                    })()}
                    onChange={(e) => {
                      const filtered = staffUsers.filter(user => {
                        const matchesSearch = !searchTerm || 
                          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesRole = !filterRole || user.roles.some(r => r.id === filterRole);
                        const matchesStatus = !filterStatus || 
                          (filterStatus === 'active' && user.is_active) ||
                          (filterStatus === 'inactive' && !user.is_active) ||
                          (filterStatus === 'admin' && user.is_admin);
                        const perf = user.performance || {
                          total_chats: 0,
                          chats_ended: 0,
                          total_tickets_assigned: 0,
                          tickets_resolved: 0,
                          average_rating: null,
                          ratings_count: 0
                        };
                        let matchesPerformance = true;
                        if (filterPerformance) {
                          switch (filterPerformance) {
                            case 'high_chats': matchesPerformance = perf.total_chats >= 50; break;
                            case 'high_tickets': matchesPerformance = perf.total_tickets_assigned >= 20; break;
                            case 'excellent': matchesPerformance = perf.average_rating !== null && perf.average_rating >= 4.5; break;
                            case 'good': matchesPerformance = perf.average_rating !== null && perf.average_rating >= 4.0; break;
                            case 'needs_improvement': matchesPerformance = perf.average_rating !== null && perf.average_rating < 3.5; break;
                            case 'no_activity': matchesPerformance = perf.total_chats === 0 && perf.total_tickets_assigned === 0; break;
                          }
                        }
                        let matchesRating = true;
                        if (filterRating) {
                          if (filterRating === 'no_rating') {
                            matchesRating = perf.ratings_count === 0 || perf.average_rating === null;
                          } else {
                            const minRating = parseFloat(filterRating);
                            matchesRating = perf.average_rating !== null && perf.average_rating >= minRating;
                          }
                        }
                        return matchesSearch && matchesRole && matchesStatus && matchesPerformance && matchesRating;
                      });
                      if (e.target.checked) {
                        setSelectedUsers(filtered.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                // Filter users
                const filteredUsers = staffUsers.filter(user => {
                  // Search filter
                  const matchesSearch = !searchTerm || 
                    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  // Role filter
                  const matchesRole = !filterRole || user.roles.some(r => r.id === filterRole);
                  
                  // Status filter
                  const matchesStatus = !filterStatus || 
                    (filterStatus === 'active' && user.is_active) ||
                    (filterStatus === 'inactive' && !user.is_active) ||
                    (filterStatus === 'admin' && user.is_admin);
                  
                  // Performance filter
                  const perf = user.performance || {
                    total_chats: 0,
                    chats_ended: 0,
                    total_tickets_assigned: 0,
                    tickets_resolved: 0,
                    average_rating: null,
                    ratings_count: 0
                  };
                  
                  let matchesPerformance = true;
                  if (filterPerformance) {
                    switch (filterPerformance) {
                      case 'high_chats':
                        matchesPerformance = perf.total_chats >= 50;
                        break;
                      case 'high_tickets':
                        matchesPerformance = perf.total_tickets_assigned >= 20;
                        break;
                      case 'excellent':
                        matchesPerformance = perf.average_rating !== null && perf.average_rating >= 4.5;
                        break;
                      case 'good':
                        matchesPerformance = perf.average_rating !== null && perf.average_rating >= 4.0;
                        break;
                      case 'needs_improvement':
                        matchesPerformance = perf.average_rating !== null && perf.average_rating < 3.5;
                        break;
                      case 'no_activity':
                        matchesPerformance = perf.total_chats === 0 && perf.total_tickets_assigned === 0;
                        break;
                    }
                  }
                  
                  // Rating filter
                  let matchesRating = true;
                  if (filterRating) {
                    if (filterRating === 'no_rating') {
                      matchesRating = perf.ratings_count === 0 || perf.average_rating === null;
                    } else {
                      const minRating = parseFloat(filterRating);
                      matchesRating = perf.average_rating !== null && perf.average_rating >= minRating;
                    }
                  }
                  
                  return matchesSearch && matchesRole && matchesStatus && matchesPerformance && matchesRating;
                });
                
                if (filteredUsers.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No users found. {(searchTerm || filterRole || filterStatus || filterPerformance || filterRating) ? 'Try adjusting your filters.' : 'Create users first, then assign roles to make them staff members.'}
                      </td>
                    </tr>
                  );
                }
                
                return filteredUsers.map((user) => {
                  const perf = user.performance || {
                    total_chats: 0,
                    chats_ended: 0,
                    total_tickets_assigned: 0,
                    tickets_resolved: 0,
                    average_rating: null,
                    ratings_count: 0
                  };
                  
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        {user.company_name && (
                          <div className="text-sm text-gray-500">{user.company_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.roles.length === 0 ? (
                            <span className="text-sm text-gray-400 italic">No roles - Click "Assign Role" to add</span>
                          ) : (
                            user.roles.map((role) => (
                              <span
                                key={role.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {role.display_name}
                                <button
                                  onClick={() => handleRemoveRole(user.id, role.id)}
                                  className="hover:text-red-600"
                                  title="Remove role"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.roles.length > 0 ? (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Chats:</span>
                              <span className="font-medium text-gray-900">
                                {perf.chats_ended}/{perf.total_chats}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Tickets:</span>
                              <span className="font-medium text-gray-900">
                                {perf.tickets_resolved}/{perf.total_tickets_assigned}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Assign role to track</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.roles.length > 0 ? (
                          perf.average_rating !== null && perf.ratings_count > 0 ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= Math.round(perf.average_rating!)
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {perf.average_rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {perf.ratings_count} customer rating{perf.ratings_count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No customer ratings</span>
                          )
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.is_admin && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowAssignRoleModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Assign Role"
                          >
                            Assign Role
                          </button>
                          <button
                            onClick={() => handleChangePassword(user)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Change Password"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Roles Table */}
      {activeTab === 'roles' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Roles & Permissions</h2>
            <button
              onClick={() => {
                resetForm();
                setShowCreateRoleModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5" />
              Create Role
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No roles found. Create your first role to get started.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {role.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {role.display_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {role.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        role.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {role.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleManagePermissions(role)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Manage Permissions"
                      >
                        Permissions
                      </button>
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Role"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Role"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Role</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name (e.g., manager, support, editor)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="support"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Support Staff"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Description of this role..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateRoleModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Role</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Role name cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditRoleModal(false);
                  resetForm();
                  setSelectedRole(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Manage Permissions for: {selectedRole.display_name}
            </h2>
            {permissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No permissions found. Please initialize default permissions first.</p>
                <button
                  onClick={async () => {
                    setShowPermissionsModal(false);
                    await handleInitializeDefaults();
                    if (selectedRole) {
                      setTimeout(() => {
                        handleManagePermissions(selectedRole);
                      }, 500);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Initialize Defaults
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {sortedCategories.map((category) => {
                  const categoryPermissions = permissionsByCategory[category];
                  const isPagesCategory = category === 'Pages';
                  
                  return (
                    <div key={category} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                        {isPagesCategory && (
                          <span className="text-xs text-gray-500">
                            {categoryPermissions.length} page{categoryPermissions.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => {
                          const isPagePermission = permission.name.startsWith('page_');
                          const isChecked = selectedRolePermissions.includes(permission.id);
                          
                          return (
                            <label
                              key={permission.id}
                              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                                isChecked
                                  ? 'border-indigo-300 bg-indigo-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(permission.id)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {permission.display_name}
                                  </span>
                                  {isPagePermission && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                      Page
                                    </span>
                                  )}
                                  {!isPagePermission && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                      Action
                                    </span>
                                  )}
                                </div>
                                {permission.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {permission.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedRole(null);
                  setSelectedRolePermissions([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Assign Role to: {selectedUser.full_name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Role
                </label>
                <select
                  value={selectedRoleForAssign}
                  onChange={(e) => setSelectedRoleForAssign(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select a role --</option>
                  {roles
                    .filter(role => role.is_active)
                    .filter(role => !selectedUser.roles.some(ur => ur.id === role.id))
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.display_name}
                      </option>
                    ))}
                </select>
                {selectedUser.roles.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Current roles: {selectedUser.roles.map(r => r.display_name).join(', ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAssignRoleModal(false);
                  setSelectedUser(null);
                  setSelectedRoleForAssign('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRole}
                disabled={!selectedRoleForAssign}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={createUserFormData.email}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={createUserFormData.full_name}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={createUserFormData.password}
                    onChange={(e) => setCreateUserFormData({ ...createUserFormData, password: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 flex items-center gap-1"
                    title="Generate secure password"
                  >
                    <KeyIcon className="h-5 w-5" />
                    <span className="text-sm">Generate</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyPassword}
                    disabled={!createUserFormData.password}
                    className={`px-3 py-2 border border-gray-300 rounded-md flex items-center gap-1 ${
                      passwordCopied
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={passwordCopied ? 'Copied!' : 'Copy password to clipboard'}
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                    {passwordCopied ? (
                      <span className="text-sm text-green-700">Copied!</span>
                    ) : (
                      <span className="text-sm">Copy</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={createUserFormData.confirm_password}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, confirm_password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    createUserFormData.password && createUserFormData.confirm_password && 
                    createUserFormData.password !== createUserFormData.confirm_password
                      ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  minLength={8}
                />
                {createUserFormData.password && createUserFormData.confirm_password && 
                 createUserFormData.password !== createUserFormData.confirm_password && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={createUserFormData.company_name}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={createUserFormData.role_id}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- No role (assign later) --</option>
                  {roles
                    .filter(role => role.is_active)
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.display_name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select a role to assign to this user</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create_user_is_active"
                  checked={createUserFormData.is_active}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="create_user_is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create_user_is_admin"
                  checked={createUserFormData.is_admin}
                  onChange={(e) => setCreateUserFormData({ ...createUserFormData, is_admin: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="create_user_is_admin" className="ml-2 block text-sm text-gray-900">
                  Admin
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setCreateUserFormData({
                    email: '',
                    password: '',
                    confirm_password: '',
                    full_name: '',
                    company_name: '',
                    is_active: true,
                    is_admin: false,
                    role_id: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={
                  !createUserFormData.email || 
                  !createUserFormData.password || 
                  !createUserFormData.full_name ||
                  (createUserFormData.password !== createUserFormData.confirm_password)
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Bulk Actions ({selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''})
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Action
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bulkAction"
                      value="assign_role"
                      checked={bulkActionType === 'assign_role'}
                      onChange={(e) => setBulkActionType(e.target.value as 'assign_role')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Assign Role</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bulkAction"
                      value="activate"
                      checked={bulkActionType === 'activate'}
                      onChange={(e) => setBulkActionType(e.target.value as 'activate')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Activate Users</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bulkAction"
                      value="deactivate"
                      checked={bulkActionType === 'deactivate'}
                      onChange={(e) => setBulkActionType(e.target.value as 'deactivate')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Deactivate Users</span>
                  </label>
                </div>
              </div>

              {bulkActionType === 'assign_role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Role to Assign
                  </label>
                  <select
                    value={bulkSelectedRole}
                    onChange={(e) => setBulkSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select a role --</option>
                    {roles
                      .filter(role => role.is_active)
                      .map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.display_name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This action will be applied to <strong>{selectedUsers.length}</strong> selected user{selectedUsers.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowBulkActionsModal(false);
                  setBulkActionType('assign_role');
                  setBulkSelectedRole('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (bulkActionType === 'assign_role') {
                    handleBulkAssignRole();
                  } else if (bulkActionType === 'activate') {
                    handleBulkUpdateStatus(true);
                  } else if (bulkActionType === 'deactivate') {
                    handleBulkUpdateStatus(false);
                  }
                }}
                disabled={bulkActionType === 'assign_role' && !bulkSelectedRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkActionType === 'assign_role' && 'Assign Role'}
                {bulkActionType === 'activate' && 'Activate Users'}
                {bulkActionType === 'deactivate' && 'Deactivate Users'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={userFormData.company_name}
                  onChange={(e) => setUserFormData({ ...userFormData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="user_is_active"
                  checked={userFormData.is_active}
                  onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="user_is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="user_is_admin"
                  checked={userFormData.is_admin}
                  onChange={(e) => setUserFormData({ ...userFormData, is_admin: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="user_is_admin" className="ml-2 block text-sm text-gray-900">
                  Admin
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Change Password for {selectedUser.full_name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordFormData.new_password}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, new_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={passwordFormData.confirm_password}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setSelectedUser(null);
                  setPasswordFormData({
                    new_password: '',
                    confirm_password: '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

