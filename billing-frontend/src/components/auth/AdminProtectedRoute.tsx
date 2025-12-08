'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { staffAPI } from '@/lib/api';
import { isCurrentlyRedirecting, setRedirecting } from '@/lib/redirectLock';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { permissions, isLoading: permissionsLoading } = usePermissions();
  const [shouldRender, setShouldRender] = useState(false);
  const [checkingRoles, setCheckingRoles] = useState(false);
  const [rolesChecked, setRolesChecked] = useState(false);
  const hasRedirected = useRef(false);

  // Reset rolesChecked when user changes
  useEffect(() => {
    setRolesChecked(false);
    setShouldRender(false);
    hasRedirected.current = false;
  }, [user?.id]);

  useEffect(() => {
    const checkStaffAccess = async () => {
      // Don't do anything if we're already redirecting or still loading auth
      if (isCurrentlyRedirecting() || isLoading) {
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setRedirecting(true);
          router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
        }
        return;
      }

      // If no user object, wait
      if (!user) {
        return;
      }

      // Check if user is admin - allow immediately
      const isAdmin = (user as any)?.is_admin === true;
      if (isAdmin) {
        console.log('User is admin, allowing access');
        setShouldRender(true);
        hasRedirected.current = false;
        setRedirecting(false);
        return;
      }

      // For non-admin users, check if they have staff access
      // First wait for permissions to load
      if (permissionsLoading) {
        console.log('Waiting for permissions to load...');
        return;
      }

      // Check permissions
      const hasPermissions = permissions && permissions.length > 0;
      
      console.log('AdminProtectedRoute - Checking staff access:', {
        userId: user.id,
        email: user.email,
        isAdmin,
        permissionsCount: permissions?.length || 0,
        hasPermissions,
        permissionsLoading,
        checkingRoles
      });
      
      // If user has permissions, they're staff
      if (hasPermissions) {
        console.log('User has permissions, allowing access');
        setShouldRender(true);
        hasRedirected.current = false;
        setRedirecting(false);
        return;
      }
      
      // If no permissions, check if they have roles assigned
      // Only check once, not while already checking or already checked
      if (!checkingRoles && !rolesChecked) {
        setCheckingRoles(true);
        try {
          console.log('Checking if user has roles assigned...');
          const myRolesResponse = await staffAPI.getMyRoles();
          const myRoles = myRolesResponse.data || [];
          const hasRoles = myRoles.length > 0;
          
          console.log('Roles check result:', {
            userId: user.id,
            rolesCount: myRoles.length,
            hasRoles,
            roles: myRoles.map((r: any) => ({
              id: r.role?.id || r.id,
              name: r.role?.display_name || r.role?.name || r.display_name || r.name
            }))
          });
          
          setRolesChecked(true);
          
          if (hasRoles) {
            // User has roles - allow access
            console.log('User has roles, allowing access to admin panel');
            setShouldRender(true);
            hasRedirected.current = false;
            setRedirecting(false);
            setCheckingRoles(false);
            return;
          }
          
          // No roles found - user is not staff
          console.log('User has no roles and no permissions - not staff');
        } catch (error: any) {
          console.error('Error checking user roles:', error);
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            url: error.config?.url
          });
          
          setRolesChecked(true);
          
          // If we get a 403/401, the endpoint might require admin
          // But if user is authenticated, they should be able to check their own roles
          // If it's a 404, user might not exist or endpoint doesn't exist
          // For network errors, don't redirect - might be temporary
          if (error.response?.status === 404) {
            console.log('404 - Roles endpoint not found or user not found');
          } else if (error.response?.status === 403 || error.response?.status === 401) {
            // This shouldn't happen for /staff/users/me/roles if user is authenticated
            // But if it does, user likely doesn't have access
            console.log('403/401 - User cannot access roles endpoint');
          } else {
            // Network or other error - don't redirect yet, might be temporary
            console.log('Network/other error - will not redirect yet');
            setCheckingRoles(false);
            setRolesChecked(false); // Reset so we can retry
            return;
          }
        } finally {
          setCheckingRoles(false);
        }
      }

      // Only redirect if we've completed all checks and user has no staff access
      // Make sure we're not in the middle of checking and roles have been checked
      if (!checkingRoles && !permissionsLoading && rolesChecked && !shouldRender && !hasRedirected.current) {
        hasRedirected.current = true;
        setRedirecting(true);
        console.log('User is not admin and has no staff access - redirecting to customer dashboard');
        console.log('Final user state:', {
          id: user.id,
          email: user.email,
          is_admin: (user as any)?.is_admin,
          permissionsCount: permissions?.length || 0,
          rolesChecked
        });
        router.replace('/customer/dashboard');
      }
    };

    checkStaffAccess();
  }, [isAuthenticated, isLoading, permissionsLoading, user, permissions, router, checkingRoles]);

  // Show loading while checking auth, permissions, or roles
  if (isLoading || permissionsLoading || checkingRoles || !shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }


  return <>{children}</>;
}

