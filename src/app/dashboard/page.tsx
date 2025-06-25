'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/PermissionGuard';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const moduleInfo = {
  'dashboard': {
    title: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    description: 'Overview of your workspace'
  },
  'transporter': {
    title: 'Truck Scheduling',
    path: '/transporter',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: 'Schedule and manage deliveries'
  },
  'gate-guard': {
    title: 'Gate Guard',
    path: '/gate-guard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    description: 'Verify and process trucks at the gate'
  },
  'weighbridge': {
    title: 'Weighbridge',
    path: '/weighbridge',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    description: 'Manage truck weighing operations'
  },
  'dock-operations': {
    title: 'Dock Operations',
    path: '/dock-operations',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
    description: 'Manage loading/unloading operations'
  },
  'led-screen': {
    title: 'LED Screen',
    path: '/led-screen',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    description: 'View LED screen display'
  },
  'register': {
    title: 'Registers',
    path: '/register',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    description: 'Access and manage registers'
  },
  'admin-shift-handover': {
    title: 'Shift Handover',
    path: '/admin/shift-handover',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    description: 'Manage shift handovers'
  }
};

interface RegisterTemplate {
  id: string;
  name: string;
  path: string;
  description: string;
}

export default function Dashboard() {
  const { user, userRole, hasPermission } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [registerTemplates, setRegisterTemplates] = useState<RegisterTemplate[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch register templates
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
              path: `/register/${doc.data().slug}`,
              description: `Access ${doc.data().name} register`
            }));
          
          setRegisterTemplates(templates);
        }
      } catch (error) {
        console.error("Error fetching register templates:", error);
      }
    }
    
    if (hasPermission('register')) {
      fetchRegisterTemplates();
    }
  }, [hasPermission]);

  // Filter accessible modules based on user permissions
  const accessibleModules = userRole?.permissions
    ? Object.entries(moduleInfo).filter(([moduleId]) => {
        return hasPermission(moduleId);
      })
    : [];

  // Filter accessible register templates
  const accessibleRegisters = registerTemplates.filter(template => 
    hasPermission(template.id) || hasPermission('register')
  );

  return (
    <PermissionGuard pageId="dashboard">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* User Info Section */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2">
              {greeting}, {user?.displayName || user?.email}
            </h2>
            {userRole && (
              <p className="text-gray-600 dark:text-gray-300">
                Role: <span className="font-medium">{userRole.name}</span>
              </p>
            )}
          </div>

          {/* Accessible Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleModules.map(([moduleId, module]) => (
              <Link key={moduleId} href={module.path}>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="flex items-center mb-3">
                    <span className="text-primary dark:text-primary-dark">
                      {module.icon}
                    </span>
                    <h3 className="font-medium text-lg ml-2">{module.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {module.description}
                  </p>
                </div>
              </Link>
            ))}

            {/* Show accessible register templates if user has register access */}
            {accessibleRegisters.length > 0 && (
              <div className="col-span-full">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Accessible Registers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleRegisters.map((register) => (
                    <Link key={register.id} href={register.path}>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <div className="flex items-center">
                          <span className="text-primary dark:text-primary-dark">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </span>
                          <h4 className="font-medium ml-2">{register.name}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {accessibleModules.length === 0 && accessibleRegisters.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
              No modules are currently accessible. Please contact your administrator.
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}