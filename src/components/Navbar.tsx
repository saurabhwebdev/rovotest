'use client';

import { useState, useEffect, ReactNode } from 'react';
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
  const [isCompactMode, setIsCompactMode] = useState(true);

  // Load display mode preference from localStorage on component mount
  useEffect(() => {
    const savedMode = localStorage.getItem('navDisplayMode');
    if (savedMode !== null) {
      setIsCompactMode(savedMode === 'compact');
    }
  }, []);

  // Icon mapping for menu items
  const menuIcons: Record<string, ReactNode> = {
    'dashboard': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    'transporter': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    'gate-guard': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    'weighbridge': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    'dock-operations': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    'led-screen': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    'register': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    'admin': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    'admin-shift-handover': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    'audit': (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  };

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

  // Toggle between compact (icon) and verbose (text) modes
  const toggleDisplayMode = () => {
    const newMode = !isCompactMode;
    setIsCompactMode(newMode);
    localStorage.setItem('navDisplayMode', newMode ? 'compact' : 'verbose');
  };

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
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isCompactMode ? 'tooltip-wrapper' : ''} ${
                      isActive(page.path) 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isCompactMode ? (
                      <>
                        {menuIcons[page.id]}
                        <span className="tooltip">{page.name}</span>
                      </>
                    ) : (
                      <>{page.name}</>
                    )}
                  </Link>
                ))}

                {/* Shift Handover in main menu */}
                {hasPermission('admin-shift-handover') && (
                  <Link 
                    href="/admin/shift-handover" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isCompactMode ? 'tooltip-wrapper' : ''} ${
                      isActive('/admin/shift-handover') 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isCompactMode ? (
                      <>
                        {menuIcons['admin-shift-handover']}
                        <span className="tooltip">Shift Handover</span>
                      </>
                    ) : (
                      <>Shift Handover</>
                    )}
                  </Link>
                )}

                {/* Register dropdown - only show if user has permission to any register pages */}
                {showRegisterDropdown && (
                  <div className="relative">
                    <button
                      onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                      onBlur={() => setTimeout(() => setIsRegisterOpen(false), 200)}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isCompactMode ? 'tooltip-wrapper' : ''} ${
                        isActive('/register') || pathname?.startsWith('/register/')
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {isCompactMode ? (
                        <>
                          {menuIcons['register']}
                          <span className="tooltip">Registers</span>
                        </>
                      ) : (
                        <>Registers</>
                      )}
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
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${isCompactMode ? 'tooltip-wrapper' : ''} ${
                        isActive('/admin') 
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {isCompactMode ? (
                        <>
                          {menuIcons['admin']}
                          <span className="tooltip">Admin</span>
                        </>
                      ) : (
                        <>Admin</>
                      )}
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
                                  className={`ml-1 w-4 h-4 transition-transform ${isAuditOpen ? 'rotate-90' : ''}`}
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
                className={`px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompactMode ? 'tooltip-wrapper' : ''}`}
              >
                {isCompactMode ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="tooltip">Logout</span>
                  </>
                ) : (
                  <>Logout</>
                )}
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className={`px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompactMode ? 'tooltip-wrapper' : ''}`}
              >
                {isCompactMode ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="tooltip">Login</span>
                  </>
                ) : (
                  <>Login</>
                )}
              </Link>
            )}
            
            {/* Display mode toggle */}
            <button
              onClick={toggleDisplayMode}
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 tooltip-wrapper"
              aria-label="Toggle display mode"
            >
              {isCompactMode ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h6m4 0h6m-10 4h4" />
                  </svg>
                  <span className="tooltip">Switch to Text Mode</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <span className="tooltip">Switch to Icon Mode</span>
                </>
              )}
            </button>
            
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
                    className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                      isActive(page.path)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">{menuIcons[page.id]}</span>
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
                    className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                      isActive(page.path)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">{menuIcons['register']}</span>
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
                    className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                      isActive(page.path)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">{menuIcons['admin']}</span>
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
                    className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                      isActive(page.path)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="mr-2">{menuIcons['audit']}</span>
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