'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Page {
  id: string;
  name: string;
  path: string;
}

interface RegisterTemplate {
  id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  roleName: string;
  setRoleName: (name: string) => void;
  roleDescription: string;
  setRoleDescription: (description: string) => void;
  selectedPermissions: string[];
  setSelectedPermissions: (permissions: string[]) => void;
  pages: Page[];
  isEditing: boolean;
}

export default function RoleModal({
  isOpen,
  onClose,
  onSubmit,
  roleName,
  setRoleName,
  roleDescription,
  setRoleDescription,
  selectedPermissions,
  setSelectedPermissions,
  pages,
  isEditing
}: RoleModalProps) {
  const [dynamicRegisters, setDynamicRegisters] = useState<RegisterTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch dynamic registers from Firestore
  useEffect(() => {
    if (isOpen) {
      fetchDynamicRegisters();
    }
  }, [isOpen]);

  const fetchDynamicRegisters = async () => {
    setLoading(true);
    try {
      const registersCollection = collection(db, 'registerTemplates');
      const registersSnapshot = await getDocs(registersCollection);
      const registersList = registersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RegisterTemplate[];
      
      setDynamicRegisters(registersList);
    } catch (error) {
      console.error("Error fetching register templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (pageId: string) => {
    if (selectedPermissions.includes(pageId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== pageId));
    } else {
      setSelectedPermissions([...selectedPermissions, pageId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  // Group pages by category
  const mainPages = pages.filter(page => 
    !page.id.startsWith('admin-') && 
    !page.id.startsWith('register-') && 
    page.id !== 'register'
  );
  const adminPages = pages.filter(page => page.id.startsWith('admin-'));
  const registerPages = pages.filter(page => 
    page.id === 'register' || 
    page.id.startsWith('register-')
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[650px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              
              {/* Main Modules Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Main Modules
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-4 max-h-[25vh] overflow-y-auto">
                  {mainPages.map((page) => (
                    <div key={page.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`page-${page.id}`}
                        checked={selectedPermissions.includes(page.id)}
                        onChange={() => togglePermission(page.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`page-${page.id}`}
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        {page.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Register Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Register Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-4 max-h-[25vh] overflow-y-auto">
                  {/* Built-in Register Permissions */}
                  {registerPages.map((page) => (
                    <div key={page.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`page-${page.id}`}
                        checked={selectedPermissions.includes(page.id)}
                        onChange={() => togglePermission(page.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`page-${page.id}`}
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        {page.name}
                      </label>
                    </div>
                  ))}
                  
                  {/* Dynamic Register Permissions */}
                  {loading ? (
                    <div className="col-span-2 flex justify-center py-2">
                      <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : (
                    dynamicRegisters.map((register) => (
                      <div key={`dynamic-register-${register.slug}`} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`register-template-${register.slug}`}
                          checked={selectedPermissions.includes(`register-template-${register.slug}`)}
                          onChange={() => togglePermission(`register-template-${register.slug}`)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`register-template-${register.slug}`}
                          className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                        >
                          {register.name} {!register.isActive && <span className="text-gray-400">(Inactive)</span>}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Admin Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-4 max-h-[25vh] overflow-y-auto">
                  {adminPages.map((page) => (
                    <div key={page.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`page-${page.id}`}
                        checked={selectedPermissions.includes(page.id)}
                        onChange={() => togglePermission(page.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`page-${page.id}`}
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        {page.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              {isEditing ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 