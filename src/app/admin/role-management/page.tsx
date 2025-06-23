'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface Page {
  id: string;
  name: string;
  path: string;
}

export default function RoleManagement() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Available pages in the application
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
    { id: 'admin-weighbridge-audit', name: 'Weighbridge Audit', path: '/admin/weighbridge-audit' },
    { id: 'admin-gate-guard-audit', name: 'Gate Guard Audit', path: '/admin/gate-guard-audit' },
    { id: 'admin-truck-scheduling-audit', name: 'Truck Scheduling Audit', path: '/admin/truck-scheduling-audit' },
    { id: 'admin-role-management', name: 'Role Management', path: '/admin/role-management' },
  ];

  useEffect(() => {
    if (user) {
      fetchRoles();
      setPages(availablePages);
    }
  }, [user]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const rolesCollection = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesCollection);
      const rolesList = rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Role));
      setRoles(rolesList);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!roleName.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      const roleData = {
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'roles'), roleData);
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('Error adding role:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!currentRole || !roleName.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      const roleRef = doc(db, 'roles', currentRole.id);
      await updateDoc(roleRef, {
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
        updatedAt: new Date()
      });
      resetForm();
      fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteDoc(doc(db, 'roles', roleId));
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const editRole = (role: Role) => {
    setCurrentRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setIsEditingRole(true);
    setIsAddingRole(true);
  };

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setCurrentRole(null);
    setIsAddingRole(false);
    setIsEditingRole(false);
  };

  const togglePermission = (pageId: string) => {
    if (selectedPermissions.includes(pageId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== pageId));
    } else {
      setSelectedPermissions([...selectedPermissions, pageId]);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Role Management</h1>
      
      {!isAddingRole ? (
        <div className="mb-6">
          <button
            onClick={() => setIsAddingRole(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Add New Role
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditingRole ? 'Edit Role' : 'Create New Role'}
          </h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions (Select pages this role can access)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pages.map((page) => (
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
            <div className="flex space-x-3">
              <button
                onClick={isEditingRole ? handleUpdateRole : handleAddRole}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                {isEditingRole ? 'Update Role' : 'Create Role'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
            Existing Roles
          </h3>
        </div>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            No roles found. Create your first role.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {role.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {role.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.map(permId => {
                          const page = pages.find(p => p.id === permId);
                          return page ? (
                            <span 
                              key={permId}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                            >
                              {page.name}
                            </span>
                          ) : null;
                        })}
                        {!role.permissions?.length && 'No permissions'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => editRole(role)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 