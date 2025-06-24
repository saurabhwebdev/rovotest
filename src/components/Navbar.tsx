'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout, hasPermission, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define all available pages with their IDs and paths
  const mainPages = [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'transporter', name: 'Truck Scheduling', path: '/transporter' },
    { id: 'gate-guard', name: 'Gate Guard', path: '/gate-guard' },
    { id: 'weighbridge', name: 'Weighbridge', path: '/weighbridge' },
    { id: 'dock-operations', name: 'Dock Operations', path: '/dock-operations' },
    { id: 'led-screen', name: 'LED Screen', path: '/led-screen' },
  ];

  const adminPages = [
    { id: 'gate-guard-plant-tracking', name: 'Plant Tracking', path: '/gate-guard/plant-tracking' },
    { id: 'dashboard-approvals', name: 'Approvals', path: '/dashboard/approvals' },
    { id: 'admin-weighbridge-management', name: 'Weighbridge Management', path: '/admin/weighbridge-management' },
    { id: 'admin-master-data', name: 'Master Data Management', path: '/admin/master-data' },
    { id: 'admin-dock-management', name: 'Dock Management', path: '/admin/dock-management' },
    { id: 'admin-led-settings', name: 'LED Screen Settings', path: '/admin/led-settings' },
    { id: 'admin-shift-handover', name: 'Shift Handover', path: '/admin/shift-handover' },
    { id: 'admin-shift-handover-approval', name: 'Shift Handover Approval', path: '/admin/shift-handover-approval' },
    { id: 'admin-role-management', name: 'Role Management', path: '/admin/role-management' },
    { id: 'admin-user-management', name: 'User Management', path: '/admin/user-management' },
  ];

  const auditPages = [
    { id: 'admin-weighbridge-audit', name: 'Weighbridge Audit', path: '/admin/weighbridge-audit' },
    { id: 'admin-gate-guard-audit', name: 'Gate Guard Audit', path: '/admin/gate-guard-audit' },
    { id: 'admin-truck-scheduling-audit', name: 'Truck Scheduling Audit', path: '/admin/truck-scheduling-audit' },
    { id: 'admin-shift-handover-audit', name: 'Shift Handover Audit', path: '/admin/shift-handover-audit' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      // Force a hard redirect to the home page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  // Check if user has access to any admin pages
  const hasAdminAccess = adminPages.some(page => hasPermission(page.id)) || 
                         auditPages.some(page => hasPermission(page.id));

  // Check if user has access to any audit pages
  const hasAuditAccess = auditPages.some(page => hasPermission(page.id));

  // Filter admin pages based on permissions
  const accessibleAdminPages = adminPages.filter(page => hasPermission(page.id));
  
  // Filter audit pages based on permissions
  const accessibleAuditPages = auditPages.filter(page => hasPermission(page.id));
  
  // Filter main pages based on permissions
  const accessibleMainPages = mainPages.filter(page => hasPermission(page.id));

  // Special case for admin users
  const isAdminUser = userRole?.permissions?.includes('*');

  // Determine if we should show the admin dropdown based on actual accessible admin pages
  // Only show if there are ACTUAL pages the user can access
  const filteredAdminPages = accessibleAdminPages.filter(page => page.id !== 'admin-shift-handover');
  const showAdminDropdown = (filteredAdminPages.length > 0 || accessibleAuditPages.length > 0);
  
  // Debug information
  console.log('Navbar Debug:', {
    isAdminUser,
    userRole: userRole?.name,
    accessibleAdminPages: accessibleAdminPages.map(p => p.id),
    filteredAdminPages: filteredAdminPages.map(p => p.id),
    accessibleAuditPages: accessibleAuditPages.map(p => p.id),
    showAdminDropdown
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">LPMS</span>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-indigo-500 dark:hover:text-indigo-400 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop menu */}
          <nav className="hidden md:flex md:flex-1 md:items-center md:justify-center">
            {user && (
              <div className="flex space-x-1">
                {/* Main navigation links - only show if user has permission */}
                {accessibleMainPages.map(page => (
                  <Link 
                    key={page.id}
                    href={page.path} 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive(page.path) 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page.name}
                  </Link>
                ))}

                {/* Shift Handover in main menu */}
                {hasPermission('admin-shift-handover') && (
                  <Link 
                    href="/admin/shift-handover" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/admin/shift-handover') 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Shift Handover
                  </Link>
                )}

                {/* Admin dropdown - only show if user has permission to any admin pages */}
                {showAdminDropdown && (
                  <div className="relative">
                    <button
                      onClick={() => setIsAdminOpen(!isAdminOpen)}
                      onBlur={() => setTimeout(() => setIsAdminOpen(false), 200)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                        isActive('/admin') 
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      Admin
                      <svg
                        className={`ml-1 w-4 h-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isAdminOpen && (
                      <div className="absolute top-full right-0 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {/* Filter admin menu items based on permissions */}
                          {filteredAdminPages.map(page => (
                            <Link
                              key={page.id}
                              href={page.path}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              role="menuitem"
                            >
                              {page.name}
                            </Link>
                          ))}

                          {/* Audit submenu - only show if user has permission to any audit pages */}
                          {(accessibleAuditPages.length > 0 || isAdminUser) && (
                            <div className="relative">
                              <div 
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsAuditOpen(!isAuditOpen);
                                }}
                              >
                                Audit
                                <svg
                                  className={`w-4 h-4 transition-transform ${isAuditOpen ? 'rotate-90' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                              {isAuditOpen && (
                                <div className="absolute left-full top-0 ml-1 py-1 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 w-56">
                                  {/* Filter audit menu items based on permissions */}
                                  {accessibleAuditPages.map(page => (
                                    <Link
                                      key={page.id}
                                      href={page.path}
                                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                      role="menuitem"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {page.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
          
          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Login
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Filter mobile menu items based on permissions */}
            {user ? (
              <>
                {accessibleMainPages.map(page => (
                  <Link
                    key={page.id}
                    href={page.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(page.path)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page.name}
                  </Link>
                ))}

                {/* Show admin section header if user has admin access */}
                {showAdminDropdown && (
                  <div className="pt-4 pb-2">
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-3">
                      ADMIN
                    </div>
                  </div>
                )}

                {/* Show admin pages the user has access to */}
                {filteredAdminPages.map(page => (
                  <Link
                    key={page.id}
                    href={page.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(page.path)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page.name}
                  </Link>
                ))}

                {/* Show audit section header if user has audit access */}
                {(accessibleAuditPages.length > 0 || isAdminUser) && (
                  <div className="pt-4 pb-2">
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-3">
                      AUDIT
                    </div>
                  </div>
                )}

                {/* Show audit pages the user has access to */}
                {accessibleAuditPages.map(page => (
                  <Link
                    key={page.id}
                    href={page.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(page.path)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page.name}
                  </Link>
                ))}
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}