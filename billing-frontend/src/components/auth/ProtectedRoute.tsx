'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isCurrentlyRedirecting, setRedirecting } from '@/lib/redirectLock';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !isCurrentlyRedirecting()) {
      if (isAuthenticated) {
        setShouldRender(true);
        hasRedirected.current = false;
      } else if (!hasRedirected.current) {
        // Check localStorage one more time before redirecting
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        
        if (!token) {
          hasRedirected.current = true;
          setRedirecting(true);
          // Redirect to customer login for customer routes, general login for others
          const isCustomerRoute = window.location.pathname.startsWith('/customer');
          router.replace(isCustomerRoute ? '/customer/login' : '/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Always show loading while checking auth
  if (isLoading || !shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
