'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isCurrentlyRedirecting, setRedirecting } from '@/lib/redirectLock';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !isCurrentlyRedirecting()) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setRedirecting(true);
          router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
        }
        return;
      }

      // Check if user is admin
      const isAdmin = (user as any)?.is_admin === true;
      
      console.log('AdminProtectedRoute - User check:', {
        isAuthenticated,
        isLoading,
        user: user ? { id: user.id, email: user.email, is_admin: (user as any)?.is_admin } : null,
        isAdmin
      });
      
      if (isAdmin) {
        setShouldRender(true);
        hasRedirected.current = false;
        setRedirecting(false);
      } else if (!hasRedirected.current && user) {
        // User is authenticated but not admin - redirect to customer dashboard
        hasRedirected.current = true;
        setRedirecting(true);
        console.log('User is not admin, redirecting to customer dashboard. User object:', user);
        router.replace('/customer/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while checking auth
  if (isLoading || !shouldRender) {
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

