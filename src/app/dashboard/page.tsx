'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/PermissionGuard';
import Link from 'next/link';

export default function Dashboard() {
  const { user, userRole } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  console.log("Dashboard rendering with user:", user?.email);
  console.log("User role:", userRole);

  return (
    <PermissionGuard pageId="dashboard">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {greeting}, {user?.email}
            </h2>
            {userRole && (
              <p className="text-gray-600 dark:text-gray-300">
                Your role: <span className="font-medium">{userRole.name}</span>
              </p>
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium mb-3">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">12</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled Trucks</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-300">8</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed Deliveries</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">3</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Your Accessible Pages</h3>
            {userRole?.permissions && userRole.permissions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userRole.permissions.map((pageId) => (
                  <span 
                    key={pageId}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                  >
                    {pageId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No specific permissions assigned.</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Link href="/gate-guard" className="block">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  <h3 className="font-medium text-lg">Gate Guard Portal</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Verify and process trucks arriving at the plant gate.</p>
              </div>
            </Link>
            
            <Link href="/dashboard/approvals" className="block">
              <div className="bg-orange-50 dark:bg-orange-900/30 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <h3 className="font-medium text-lg">Truck Approvals</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Review and approve trucks that have verification issues.</p>
              </div>
            </Link>
            
            <Link href="/transporter" className="block">
              <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <h3 className="font-medium text-lg">Transporter Portal</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">Schedule and manage truck deliveries and shipments.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}