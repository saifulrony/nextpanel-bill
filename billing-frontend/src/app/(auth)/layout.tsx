'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect if fully loaded and authenticated
    if (!isLoading && isAuthenticated) {
      // Use hard redirect to completely break any potential loop
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If authenticated, show loading (redirect will happen)
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}

