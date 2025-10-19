'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isCurrentlyRedirecting, setRedirecting } from '@/lib/redirectLock';

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && !isCurrentlyRedirecting()) {
      if (!isAuthenticated) {
        setShouldRender(true);
        hasRedirected.current = false;
      } else if (!hasRedirected.current) {
        hasRedirected.current = true;
        setRedirecting(true);
        router.replace('/admin/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Always show loading while checking auth or redirecting
  if (isLoading || !shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
