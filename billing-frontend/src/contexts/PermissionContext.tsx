'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { staffAPI } from '@/lib/api';

interface PermissionContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await staffAPI.getMyPermissions();
      setPermissions(response.data || []);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPermissions();
    } else {
      setPermissions([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const hasPermission = (permission: string): boolean => {
    // Super admins have all permissions
    if (user?.is_admin) {
      return true;
    }
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (user?.is_admin) {
      return true;
    }
    return perms.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    if (user?.is_admin) {
      return true;
    }
    return perms.every(perm => permissions.includes(perm));
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isLoading,
        refreshPermissions: loadPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}


