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

      // For non-admin users, check immediately if they have permissions (synchronous check)
      // If permissions are already loaded and empty, redirect immediately
      if (!permissionsLoading && permissions && permissions.length === 0) {
        // No permissions and not loading - definitely a customer, redirect immediately
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setRedirecting(true);
          console.log('User has no permissions - redirecting customer immediately');
          router.replace('/customer/dashboard');
        }
        return;
      }

      // For non-admin users, check if they have staff access
      // If permissions are loading, redirect immediately (don't wait - customers shouldn't see admin panel)
      if (permissionsLoading) {
        // Redirect customers immediately without waiting
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setRedirecting(true);
          console.log('Permissions loading - redirecting customer immediately (no wait)');
          router.replace('/customer/dashboard');
        }
        return;
      }

      // Check permissions
      const hasPermissions = permissions && permissions.length > 0;
      
      // If no permissions and not admin, redirect immediately (don't check roles - customer)
      if (!isAdmin && !hasPermissions) {
        // Customer - redirect immediately without checking roles
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setRedirecting(true);
          console.log('User is not admin and has no permissions - redirecting customer immediately');
          router.replace('/customer/dashboard');
        }
        return;
      }
      
      console.log('AdminProtectedRoute - Checking staff access:', {
        userId: user.id,
        email: user.email,
        isAdmin,
        permissionsCount: permissions?.length || 0,
        hasPermissions,
        permissionsLoading,
        checkingRoles,
        rolesChecked
      });
      
      // If user has permissions, they're staff - allow access
      if (hasPermissions) {
        console.log('User has permissions (staff), allowing access');
        setShouldRender(true);
        hasRedirected.current = false;
        setRedirecting(false);
        return;
      }

      // This section should not be reached as we redirect customers above
      // But keep as final safety check
      if (!isAdmin && !hasPermissions && !shouldRender && !hasRedirected.current) {
        hasRedirected.current = true;
        setRedirecting(true);
        console.log('Final check: User is not admin/staff - redirecting to customer dashboard');
        router.replace('/customer/dashboard');
        return;
      }

    };

    checkStaffAccess();
  }, [isAuthenticated, isLoading, permissionsLoading, user, permissions, router, checkingRoles]);

  // CRITICAL: Don't render anything until we know the user is authorized
  // This prevents the admin page from flashing before redirect

  // If we're redirecting, show nothing (redirect is in progress)
  if (hasRedirected.current || isCurrentlyRedirecting()) {
    return null; // Don't show anything, just redirect
  }

  // Show loading only while checking auth (initial load)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: If user is authenticated but not verified as admin/staff, don't render
  // This prevents the admin page from appearing before redirect
  if (isAuthenticated && user) {
    const isAdmin = (user as any)?.is_admin === true;
    const hasPermissions = permissions && permissions.length > 0;
    
    // If user is not admin and has no permissions, don't render (customer - redirect should happen)
    if (!isAdmin && !hasPermissions && !shouldRender) {
      // Don't render anything - redirect is happening
      return null;
    }

    // If permissions are still loading and user is not admin, don't render
    if (permissionsLoading && !isAdmin && !shouldRender) {
      return null; // Don't render while checking, redirect will happen
    }
  }

  // CRITICAL: Only render children if we've explicitly verified the user is admin/staff
  // shouldRender is only set to true after verification
  if (!shouldRender) {
    return null; // Don't render until authorized - prevents page flash
  }

  return <>{children}</>;
}

