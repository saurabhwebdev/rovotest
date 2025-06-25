'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import RoleModal from '@/components/role-management/RoleModal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    { id: 'register', name: 'Registers', path: '/register' },
    { id: 'register-gate', name: 'Gate Register', path: '/register/gate' },
    { id: 'register-detail', name: 'Register Details', path: '/register/[slug]' },
    { id: 'admin-weighbridge-management', name: 'Weighbridge Management', path: '/admin/weighbridge-management' },
    { id: 'admin-master-data', name: 'Master Data Management', path: '/admin/master-data' },
    { id: 'admin-dock-management', name: 'Dock Management', path: '/admin/dock-management' },
    { id: 'admin-led-settings', name: 'LED Screen Settings', path: '/admin/led-settings' },
    { id: 'admin-register-management', name: 'Register Management', path: '/admin/register-management' },
    { id: 'admin-register-create', name: 'Create Register', path: '/admin/register-management/create' },
    { id: 'admin-register-edit', name: 'Edit Register', path: '/admin/register-management/edit' },
    { id: 'admin-shift-handover', name: 'Shift Handover', path: '/admin/shift-handover' },
    { id: 'admin-shift-handover-approval', name: 'Shift Handover Approval', path: '/admin/shift-handover-approval' },
    { id: 'admin-weighbridge-audit', name: 'Weighbridge Audit', path: '/admin/weighbridge-audit' },
    { id: 'admin-gate-guard-audit', name: 'Gate Guard Audit', path: '/admin/gate-guard-audit' },
    { id: 'admin-truck-scheduling-audit', name: 'Truck Scheduling Audit', path: '/admin/truck-scheduling-audit' },
    { id: 'admin-shift-handover-audit', name: 'Shift Handover Audit', path: '/admin/shift-handover-audit' },
    { id: 'admin-role-management', name: 'Role Management', path: '/admin/role-management' },
    { id: 'admin-reports', name: 'Reports', path: '/admin/reports' },
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
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setCurrentRole(null);
    setIsModalOpen(false);
    setIsEditingRole(false);
  };

  const handleSubmit = async () => {
    if (isEditingRole) {
      await handleUpdateRole();
    } else {
      await handleAddRole();
    }
  };

  const getPermissionNames = (permissionIds: string[]) => {
    return permissionIds.map(id => {
      const page = availablePages.find(p => p.id === id);
      return page?.name || id;
    });
  };

  return (
    <PagePermissionWrapper pageId="admin-role-management">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Role Management</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Add New Role
          </button>
        </div>

        <RoleModal
          isOpen={isModalOpen}
          onClose={resetForm}
          onSubmit={handleSubmit}
          roleName={roleName}
          setRoleName={setRoleName}
          roleDescription={roleDescription}
          setRoleDescription={setRoleDescription}
          selectedPermissions={selectedPermissions}
          setSelectedPermissions={setSelectedPermissions}
          pages={pages}
          isEditing={isEditingRole}
        />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role Name
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                    Count
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {role.name}
                    </td>
                    <td className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                      {role.description || '-'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      {role.permissions?.length || 0}
                    </td>
                    <td className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {getPermissionNames(role.permissions || []).map((name, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => editRole(role)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit Role"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Role"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PagePermissionWrapper>
  );
} 