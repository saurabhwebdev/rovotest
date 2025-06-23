'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function useRedirectIfAuthenticated() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth to be loaded and only redirect if not already redirecting
    if (!loading && user && !isRedirecting) {
      setIsRedirecting(true);
      
      // Add a small delay to prevent rapid redirects
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, router, isRedirecting]);

  return { loading: loading || isRedirecting };
}