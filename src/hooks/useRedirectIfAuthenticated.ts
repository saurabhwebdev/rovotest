'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Force a hard redirect to ensure the page is fully reloaded
      window.location.href = redirectTo;
    }
  }, [user, loading, redirectTo]);

  return { user, loading };
}