'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the Register Template interface
interface RegisterField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: any;
}

interface RegisterTemplate {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  fields: RegisterField[];
}

export default function RegistersPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registers, setRegisters] = useState<RegisterTemplate[]>([]);

  // Fetch all register templates from Firestore
  useEffect(() => {
    const fetchRegisters = async () => {
      setLoading(true);
      try {
        const registersCollection = collection(db, 'registerTemplates');
        const registersSnapshot = await getDocs(registersCollection);
        const registersList = registersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as RegisterTemplate[];
        
        // Filter registers based on permissions:
        // 1. If user has 'register' permission, show all active registers
        // 2. If user has specific register permissions, show those registers
        // 3. If user is an admin, show all registers including inactive ones
        let filteredRegisters: RegisterTemplate[] = [];
        
        if (hasPermission('admin-register-management')) {
          // Admin sees all registers including inactive ones
          filteredRegisters = registersList;
        } else if (hasPermission('register')) {
          // User with general register permission sees all active registers
          filteredRegisters = registersList.filter(register => register.isActive);
        } else {
          // User with specific register permissions only sees those registers
          filteredRegisters = registersList.filter(register => 
            register.isActive && 
            hasPermission(`register-template-${register.slug}`)
          );
        }
        
        setRegisters(filteredRegisters);
      } catch (error) {
        console.error("Error fetching register templates:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRegisters();
  }, [hasPermission]);

  // Convert register templates to display format
  const allRegisters = registers.map(register => ({
    id: `register-${register.slug}`,
    name: register.name,
    description: register.description,
    path: `/register/${register.slug}`,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={register.icon || "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"} />
      </svg>
    )
  }));

  return (
    <PagePermissionWrapper pageId="register">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Registers</h1>
          {hasPermission('admin-register-management') && (
            <Link
              href="/admin/register-management"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage Registers
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading registers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allRegisters.map((register) => (
              <Link href={register.path} key={register.id} className="block">
                <Card className="p-6 h-full transition-all duration-200 hover:shadow-lg hover:border-indigo-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                      {register.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{register.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{register.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PagePermissionWrapper>
  );
} 