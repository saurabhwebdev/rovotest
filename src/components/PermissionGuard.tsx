'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
  pageId: string;
  children: ReactNode;
}

export default function PermissionGuard({ pageId, children }: PermissionGuardProps) {
  const { user, loading, hasPermission, userRole } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Don't do anything until auth is loaded
    if (loading) {
      console.log(`PermissionGuard: Still loading auth state for ${pageId}`);
      return;
    }

    console.log(`PermissionGuard: Auth loaded for ${pageId}. User:`, user?.email);
    console.log(`PermissionGuard: User role:`, userRole);

    // Set a small delay to prevent immediate redirects that might cause refresh loops
    const timer = setTimeout(() => {
      // Check if user is logged in
      if (!user) {
        console.log('PermissionGuard: No user found, redirecting to signin');
        router.push('/auth/signin');
        return;
      }

      // Check if user has permission for this page
      const authorized = hasPermission(pageId);
      console.log(`PermissionGuard: Permission check for ${pageId}: ${authorized ? 'Granted' : 'Denied'}`);
      setIsAuthorized(authorized);

      // Redirect to dashboard if not authorized
      if (!authorized) {
        console.log('PermissionGuard: User not authorized for this page, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log(`PermissionGuard: User authorized for ${pageId}`);
      }
      
      setIsChecking(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [loading, user, pageId, hasPermission, router, userRole]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Checking permissions for {pageId}...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 