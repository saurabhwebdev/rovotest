'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

export default function Navbar() {
  const { user, logout, hasPermission, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define all available pages with their IDs and paths
  const mainPages = [
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'transporter', name: 'Truck Scheduling', path: '/transporter' },
    { id: 'gate-guard', name: 'Gate Guard', path: '/gate-guard' },
    { id: 'weighbridge', name: 'Weighbridge', path: '/weighbridge' },
    { id: 'dock-operations', name: 'Dock Operations', path: '/dock-operations' },
    { id: 'led-screen', name: 'LED Screen', path: '/led-screen' }
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
    { id: 'admin-register-management', name: 'Register Management', path: '/admin/register-management' },
    { id: 'admin-role-management', name: 'Role Management', path: '/admin/role-management' },
    { id: 'admin-user-management', name: 'User Management', path: '/admin/user-management' },
    { id: 'admin-reports', name: 'Reports', path: '/admin/reports' },
  ];

  const auditPages = [
    { id: 'admin-weighbridge-audit', name: 'Weighbridge Audit', path: '/admin/weighbridge-audit' },
    { id: 'admin-gate-guard-audit', name: 'Gate Guard Audit', path: '/admin/gate-guard-audit' },
    { id: 'admin-truck-scheduling-audit', name: 'Truck Scheduling Audit', path: '/admin/truck-scheduling-audit' },
    { id: 'admin-shift-handover-audit', name: 'Shift Handover Audit', path: '/admin/shift-handover-audit' },
  ];

  // Empty array for predefined register pages - we'll only use dynamic ones
  const staticRegisterPages: NavPage[] = [];
  
  // Define interfaces for page types
  interface NavPage {
    id: string;
    name: string;
    path: string;
  }
  
  // State for register pages loaded from Firestore
  const [registerPages, setRegisterPages] = useState<NavPage[]>([]);
  
  // Fetch dynamic register templates from Firestore
  useEffect(() => {
    async function fetchRegisterTemplates() {
      try {
        const registersCollection = collection(db, 'registerTemplates');
        const registersSnapshot = await getDocs(registersCollection);
        
        if (!registersSnapshot.empty) {
          const templates = registersSnapshot.docs
            .filter((doc) => doc.data().isActive)
            .map((doc) => ({
              id: `register-template-${doc.data().slug}`,
              name: doc.data().name,
              path: `/register/${doc.data().slug}`
            })) as NavPage[];
          
          // Set register pages directly from templates (no static pages)
          setRegisterPages(templates);
        }
      } catch (error) {
        console.error("Error fetching register templates:", error);
      }
    }
    
    fetchRegisterTemplates();
  }, []);

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

  // Check if user has access to any register pages
  const hasRegisterAccess = hasPermission('register') || registerPages.some(page => hasPermission(page.id));

  // Filter admin pages based on permissions
  const accessibleAdminPages = adminPages.filter(page => hasPermission(page.id));
  
  // Filter audit pages based on permissions
  const accessibleAuditPages = auditPages.filter(page => hasPermission(page.id));
  
  // Filter register pages based on permissions
  // A user can access a specific register if they have the general 'register' permission or the specific register permission
  const accessibleRegisterPages = registerPages.filter(page => hasPermission(page.id) || hasPermission('register'));
  
  // Filter main pages based on permissions
  const accessibleMainPages = mainPages.filter(page => hasPermission(page.id));

  // Special case for admin users
  const isAdminUser = userRole?.permissions?.includes('*');

  // Determine if we should show the admin dropdown based on actual accessible admin pages
  // Only show if there are ACTUAL pages the user can access
  const filteredAdminPages = accessibleAdminPages.filter(page => page.id !== 'admin-shift-handover');
  const showAdminDropdown = (filteredAdminPages.length > 0 || accessibleAuditPages.length > 0);
  
  // Determine if we should show the register dropdown
  const showRegisterDropdown = hasPermission('register') || accessibleRegisterPages.length > 0 || isAdminUser;
  
  // Debug information
  console.log('Navbar Debug:', {
    isAdminUser,
    userRole: userRole?.name,
    accessibleAdminPages: accessibleAdminPages.map(p => p.id),
    filteredAdminPages: filteredAdminPages.map(p => p.id),
    accessibleAuditPages: accessibleAuditPages.map(p => p.id),
    accessibleRegisterPages: accessibleRegisterPages.map(p => p.id),
    showAdminDropdown,
    showRegisterDropdown
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 relative">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="w-full h-full transition-colors"
                >
                  <path 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M8 3C6.89543 3 6 3.89543 6 5V7.35418C6.73294 6.52375 7.80531 6 9 6H15C16.1947 6 17.2671 6.52375 18 7.35418V5C18 3.89543 17.1046 3 16 3H8ZM18 13H6C5.44772 13 5 13.4477 5 14V17C5 17.5523 5.44772 18 6 18H18C18.5523 18 19 17.5523 19 17V14C19 13.4477 18.5523 13 18 13ZM17 11V10C17 8.89543 16.1046 8 15 8H9C7.89543 8 7 8.89543 7 10V11H17ZM4 5V11.7639L3.9768 11.7849C3.87839 11.336 3.47843 11 3 11H2C1.44772 11 1 11.4477 1 12C1 12.5523 1.44772 13 2 13H3C3.06013 13 3.11902 12.9947 3.17623 12.9845C3.06216 13.3017 3 13.6436 3 14V17C3 17.8885 3.38625 18.6868 4 19.2361V22C4 22.5523 4.44772 23 5 23H6C6.55228 23 7 22.5523 7 22V20H17V22C17 22.5523 17.4477 23 18 23H19C19.5523 23 20 22.5523 20 22V19.2361C20.6137 18.6868 21 17.8885 21 17V14C21 13.6436 20.9378 13.3017 20.8238 12.9845C20.881 12.9947 20.9399 13 21 13H22C22.5523 13 23 12.5523 23 12C23 11.4477 22.5523 11 22 11H21C20.5216 11 20.1216 11.336 20.0232 11.7849C20.0155 11.7778 20.0078 11.7708 20 11.7639V5C20 2.79086 18.2091 1 16 1H8C5.79086 1 4 2.79086 4 5ZM6 15.5C6 14.6716 6.67157 14 7.5 14C8.32843 14 9 14.6716 9 15.5C9 16.3284 8.32843 17 7.5 17C6.67157 17 6 16.3284 6 15.5ZM16.5 14C15.6716 14 15 14.6716 15 15.5C15 16.3284 15.6716 17 16.5 17C17.3284 17 18 16.3284 18 15.5C18 14.6716 17.3284 14 16.5 14Z" 
                    className="fill-[#502172] dark:fill-[#D01414]"
                  />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-bold text-[#502172] dark:text-[#D01414]">LPMS</span>
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

                {/* Register dropdown - only show if user has permission to any register pages */}
                {showRegisterDropdown && (
                  <div className="relative">
                    <button
                      onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                      onBlur={() => setTimeout(() => setIsRegisterOpen(false), 200)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                        isActive('/register') || pathname?.startsWith('/register/')
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      Registers
                      <svg
                        className={`ml-1 w-4 h-4 transition-transform ${isRegisterOpen ? 'rotate-180' : ''}`}
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
                    {isRegisterOpen && (
                      <div className="absolute top-full right-0 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {/* Filter register menu items based on permissions */}
                          {accessibleRegisterPages.map(page => (
                            <Link
                              key={page.id}
                              href={page.path}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              role="menuitem"
                            >
                              {page.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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

                {/* Show register section header if user has register access */}
                {showRegisterDropdown && (
                  <div className="pt-4 pb-2">
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-3">
                      REGISTERS
                    </div>
                  </div>
                )}

                {/* Show register pages the user has access to */}
                {accessibleRegisterPages.map(page => (
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