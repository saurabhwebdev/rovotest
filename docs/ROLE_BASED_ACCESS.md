# Role-Based Access Control Implementation Guide

## Overview

We've identified an issue with the role-based access control in the application. While the permission system is well-designed, many pages are not properly protected by the `PermissionGuard` component, which means users can access pages they shouldn't have permission for.

## Solution

We've created a new `PagePermissionWrapper` component to make it easier to protect all pages with the proper permissions. Here's how to implement it:

### 1. Update Each Page Component

For each page in your application, follow these steps:

1. Import the `PagePermissionWrapper` component:
   ```tsx
   import PagePermissionWrapper from '@/components/PagePermissionWrapper';
   ```

2. Wrap your page content with the `PagePermissionWrapper`, using the correct page ID:
   ```tsx
   export default function MyPage() {
     return (
       <PagePermissionWrapper pageId="page-id-from-role-management">
         {/* Your page content */}
       </PagePermissionWrapper>
     );
   }
   ```

3. Remove any manual authentication checks like:
   ```tsx
   useEffect(() => {
     if (!authLoading && !user) {
       window.location.href = '/auth/signin';
     }
   }, [user, authLoading]);
   ```

   These are now handled by the `PermissionGuard` component.

### 2. Page IDs Reference

Use the same page IDs as defined in the role management page:

```tsx
const availablePages = [
  { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
  { id: 'transporter', name: 'Truck Scheduling', path: '/transporter' },
  { id: 'gate-guard', name: 'Gate Guard', path: '/gate-guard' },
  { id: 'weighbridge', name: 'Weighbridge', path: '/weighbridge' },
  { id: 'dock-operations', name: 'Dock Operations', path: '/dock-operations' },
  { id: 'led-screen', name: 'LED Screen', path: '/led-screen' },
  { id: 'admin-weighbridge-management', name: 'Weighbridge Management', path: '/admin/weighbridge-management' },
  { id: 'admin-master-data', name: 'Master Data Management', path: '/admin/master-data' },
  { id: 'admin-dock-management', name: 'Dock Management', path: '/admin/dock-management' },
  { id: 'admin-led-settings', name: 'LED Screen Settings', path: '/admin/led-settings' },
  { id: 'admin-shift-handover', name: 'Shift Handover', path: '/admin/shift-handover' },
  { id: 'admin-weighbridge-audit', name: 'Weighbridge Audit', path: '/admin/weighbridge-audit' },
  { id: 'admin-gate-guard-audit', name: 'Gate Guard Audit', path: '/admin/gate-guard-audit' },
  { id: 'admin-truck-scheduling-audit', name: 'Truck Scheduling Audit', path: '/admin/truck-scheduling-audit' },
  { id: 'admin-shift-handover-audit', name: 'Shift Handover Audit', path: '/admin/shift-handover-audit' },
  { id: 'admin-role-management', name: 'Role Management', path: '/admin/role-management' },
]
```

### 3. Files to Update

Here's a list of all page components that need to be updated:

- `src/app/dashboard/page.tsx` (already using PermissionGuard)
- `src/app/transporter/page.tsx` (updated as example)
- `src/app/transporter/schedule/page.tsx` 
- `src/app/gate-guard/page.tsx`
- `src/app/gate-guard/plant-tracking/page.tsx`
- `src/app/weighbridge/page.tsx`
- `src/app/dock-operations/page.tsx`
- `src/app/led-screen/page.tsx`
- `src/app/dashboard/approvals/page.tsx`
- `src/app/admin/weighbridge-management/page.tsx`
- `src/app/admin/master-data/page.tsx`
- `src/app/admin/dock-management/page.tsx`
- `src/app/admin/led-settings/page.tsx`
- `src/app/admin/shift-handover/page.tsx`
- `src/app/admin/weighbridge-audit/page.tsx`
- `src/app/admin/gate-guard-audit/page.tsx`
- `src/app/admin/truck-scheduling-audit/page.tsx` (updated as example)
- `src/app/admin/shift-handover-audit/page.tsx`
- `src/app/admin/role-management/page.tsx`
- `src/app/admin/user-management/page.tsx`

### 4. Testing

After updating all pages, test the application with different user roles to ensure:

1. Users can only access pages they have permission for
2. Users are redirected to the dashboard when trying to access unauthorized pages
3. The dashboard displays the correct list of accessible pages for each user

## Additional Improvements

The `hasPermission` function in `AuthContext.tsx` has been updated to provide better logging and error handling. It now:

1. Checks permissions more explicitly
2. Provides more detailed logs about permission decisions
3. Lists all user permissions when access is denied

## Troubleshooting

If users are still able to access pages they shouldn't:

1. Check the browser console for permission-related logs
2. Verify that the correct page ID is being used in the `PagePermissionWrapper`
3. Check that the user's role has the correct permissions in Firestore
4. Make sure all page components are using the `PagePermissionWrapper` 