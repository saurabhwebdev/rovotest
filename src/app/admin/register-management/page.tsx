'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

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

export default function RegisterManagementPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registers, setRegisters] = useState<RegisterTemplate[]>([]);

  useEffect(() => {
    async function fetchRegisters() {
      setLoading(true);
      try {
        const registersCollection = collection(db, 'registerTemplates');
        const registersSnapshot = await getDocs(registersCollection);
        const registersList = registersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RegisterTemplate[];
        setRegisters(registersList);
      } catch (error) {
        console.error("Error fetching register templates:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegisters();
  }, []);

  const handleDeleteRegister = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this register template?')) {
      try {
        await deleteDoc(doc(db, 'registerTemplates', id));
        setRegisters(registers.filter(register => register.id !== id));
      } catch (error) {
        console.error("Error deleting register template:", error);
      }
    }
  };

  return (
    <PagePermissionWrapper pageId="admin-register-management">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Register Management</h1>
          <Link
            href="/admin/register-management/create"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Register Template
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading register templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registers.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No register templates found. Create your first register template!</p>
              </div>
            ) : (
              registers.map((register) => (
                <Card key={register.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{register.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{register.description}</p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {register.fields?.length || 0} Fields
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {register.slug}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-10 w-10 ${register.isActive ? 'text-green-500' : 'text-gray-400'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={register.icon || "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"} />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div className="flex space-x-2">
                        <Link 
                          href={`/admin/register-management/edit/${register.id}`}
                          className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDeleteRegister(register.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      <Link 
                        href={`/register/${register.slug}`}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </PagePermissionWrapper>
  );
} 