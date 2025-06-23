'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            {user ? (
              <div className="flex space-x-1">
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/transporter" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/transporter') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Truck Scheduling
                </Link>
                <Link 
                  href="/gate-guard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/gate-guard') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Gate Guard
                </Link>
                <Link 
                  href="/weighbridge" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/weighbridge') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Weighbridge
                </Link>
                <Link 
                  href="/dock-operations" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dock-operations') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Dock Operations
                </Link>
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
                        <Link
                          href="/gate-guard/plant-tracking"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          Plant Tracking
                        </Link>
                        <Link
                          href="/dashboard/approvals"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          Approvals
                        </Link>
                        <Link
                          href="/admin/weighbridge-management"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          Weighbridge Management
                        </Link>
                        <Link
                          href="/admin/master-data"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          Master Data Management
                        </Link>
                        <Link
                          href="/admin/dock-management"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          Dock Management
                        </Link>
                        <Link
                          href="/admin/led-settings"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                        >
                          LED Screen Settings
                        </Link>
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
                              className={`w-4 h-4 transition-transform ${isAuditOpen ? 'rotate-180' : ''}`}
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
                            <div className="absolute right-0 top-full mt-1 py-1 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 flex">
                              <Link
                                href="/admin/weighbridge-audit"
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                                role="menuitem"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Weighbridge Audit
                              </Link>
                              <Link
                                href="/admin/gate-guard-audit"
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap border-l border-gray-200 dark:border-gray-700"
                                role="menuitem"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Gate Guard Audit
                              </Link>
                              <Link
                                href="/admin/truck-scheduling-audit"
                                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap border-l border-gray-200 dark:border-gray-700"
                                role="menuitem"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Truck Scheduling Audit
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Link 
                  href="/led-screen" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/led-screen') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  LED Screen
                </Link>
              </div>
            ) : (
              <div className="flex space-x-1">
                <Link 
                  href="/" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="#features" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Features
                </Link>
                <Link 
                  href="#testimonials" 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Testimonials
                </Link>
              </div>
            )}
          </nav>
          
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.email}
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/auth/signin"
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/dashboard') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/transporter" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/transporter') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Truck Scheduling
                </Link>
                <Link 
                  href="/gate-guard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/gate-guard') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Gate Guard
                </Link>
                <Link 
                  href="/weighbridge" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/weighbridge') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Weighbridge
                </Link>
                <Link 
                  href="/dock-operations" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/dock-operations') 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dock Operations
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <div className="px-3 py-2 text-base font-medium text-gray-800 dark:text-gray-200">
                    Admin
                  </div>
                  <Link
                    href="/gate-guard/plant-tracking"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 pl-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Plant Tracking
                  </Link>
                  <Link
                    href="/dashboard/approvals"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 pl-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Approvals
                  </Link>
                  <Link
                    href="/admin/weighbridge-management"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 pl-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Weighbridge Management
                  </Link>
                  <Link
                    href="/admin/master-data"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 pl-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Master Data Management
                  </Link>
                  <Link
                    href="/admin/dock-management"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 pl-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dock Management
                  </Link>
                  <Link
                    href="/admin/led-settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 pl-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    LED Screen Settings
                  </Link>
                  <div className="px-3 py-2 text-base font-medium text-gray-800 dark:text-gray-200 pl-6">
                    Audit
                  </div>
                  <div className="flex flex-wrap pl-6">
                    <Link
                      href="/admin/weighbridge-audit"
                      className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Weighbridge
                    </Link>
                    <Link
                      href="/admin/gate-guard-audit"
                      className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Gate Guard
                    </Link>
                    <Link
                      href="/admin/truck-scheduling-audit"
                      className="px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Truck Scheduling
                    </Link>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                      {user.email}
                    </div>
                    <ThemeToggle />
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="mt-2 w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none"
                  >
                    Logout
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <Link 
                    href="/led-screen" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/led-screen') 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    LED Screen
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="#features" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#testimonials" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Testimonials
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                      Theme
                    </div>
                    <ThemeToggle />
                  </div>
                  <Link 
                    href="/auth/signin"
                    className="mt-2 block w-full px-4 py-2 text-base font-medium text-center text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <Link 
                    href="/led-screen" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/led-screen') 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    LED Screen
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}