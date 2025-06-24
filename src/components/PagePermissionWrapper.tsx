'use client';

import { ReactNode } from 'react';
import PermissionGuard from './PermissionGuard';

interface PagePermissionWrapperProps {
  pageId: string;
  children: ReactNode;
}

/**
 * A wrapper component that ensures all pages are properly protected by the PermissionGuard.
 * This should be used in all page components to enforce role-based access control.
 * 
 * @example
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <PagePermissionWrapper pageId="my-page-id">
 *       <div>My protected page content</div>
 *     </PagePermissionWrapper>
 *   );
 * }
 * ```
 */
export default function PagePermissionWrapper({ pageId, children }: PagePermissionWrapperProps) {
  // Ensure the pageId doesn't have any leading or trailing whitespace
  const normalizedPageId = pageId.trim();
  
  console.log(`PagePermissionWrapper: Wrapping page with ID "${normalizedPageId}"`);
  
  return (
    <PermissionGuard pageId={normalizedPageId}>
      {children}
    </PermissionGuard>
  );
} 